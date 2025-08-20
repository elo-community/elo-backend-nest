import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { PaginationResponseDto } from '../dtos/pagination-response.dto';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
import { HotPost } from '../entities/hot-post.entity';
import { Post, PostType } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { PostHateService } from './post-hate.service';
import { PostLikeService } from './post-like.service';
import { TempImageService } from './temp-image.service';

@Injectable()
export class PostService {
    // 조회 기록을 저장할 Map (IP_PostId -> timestamp)
    private viewedPosts = new Map<string, number>();

    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(HotPost)
        private readonly hotPostRepository: Repository<HotPost>,
        private readonly postLikeService: PostLikeService,
        private readonly postHateService: PostHateService,
        private readonly tempImageService: TempImageService,
    ) { }

    async findAll(query?: PostQueryDto): Promise<PaginationResponseDto<Post>> {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.sportCategory', 'sportCategory')
            .leftJoinAndSelect('post.comments', 'comments')
            .leftJoinAndSelect('post.likes', 'likes')
            .leftJoinAndSelect('post.hates', 'hates');

        // 스포츠 카테고리 필터링
        if (query?.sport) {
            queryBuilder.andWhere('post.sportCategory.id = :sportId', { sportId: query.sport });
        }

        // 글 타입 필터링
        if (query?.type) {
            queryBuilder.andWhere('post.type = :type', { type: query.type });
        }

        queryBuilder.orderBy('post.createdAt', 'DESC');

        // 페이지네이션 파라미터 설정
        const page = query?.page || 1;
        const limit = query?.limit || 10;
        const offset = (page - 1) * limit;

        // 전체 개수 조회
        const total = await queryBuilder.getCount();

        // 페이지네이션 적용
        queryBuilder.skip(offset).take(limit);

        // 데이터 조회
        const posts = await queryBuilder.getMany();

        return new PaginationResponseDto(posts, page, limit, total);
    }

    async findOne(id: number): Promise<Post | null> {
        return this.postRepository.findOne({ where: { id }, relations: ['author', 'sportCategory'] });
    }

    async findOneWithDetails(id: number): Promise<Post | null> {
        return this.postRepository.findOne({
            where: { id },
            relations: [
                'author',
                'sportCategory',
                'comments',
                'comments.user',
                'comments.replies',
                'comments.replies.user',
                'comments.likes',
                'comments.likes.user'
            ],
            order: {
                comments: {
                    createdAt: 'ASC',
                    replies: {
                        createdAt: 'ASC'
                    }
                }
            }
        });
    }

    async findByUserId(userId: number): Promise<Post[]> {
        return this.postRepository.find({
            where: { author: { id: userId } },
            relations: ['author', 'sportCategory', 'comments', 'likes', 'hates'],
            order: { createdAt: 'DESC' }
        });
    }

    async create(createPostDto: CreatePostDto, user: JwtUser): Promise<Post> {
        const { sportCategoryId, content, ...rest } = createPostDto;
        let sportCategoryEntity: SportCategory | undefined = undefined;

        if (typeof sportCategoryId === "number") {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId } });
            sportCategoryEntity = found ?? undefined;
        }

        const author = await this.userRepository.findOne({ where: { id: user.id } });
        if (!author) throw new Error('Author not found');

        // content에서 실제 사용된 이미지 URL 추출
        const usedImageUrls = this.extractImageUrlsFromContent(content || '');

        const post = this.postRepository.create({
            ...rest,
            content,
            sportCategory: sportCategoryEntity,
            author,
            imageUrls: usedImageUrls,
            type: PostType.GENERAL, // 일반글으로 설정
        });

        const savedPost = await this.postRepository.save(post);

        // 사용된 이미지들을 임시 이미지에서 제거
        for (const imageUrl of usedImageUrls) {
            await this.tempImageService.markImageAsUsed(imageUrl, user.id);
        }

        // 사용되지 않은 임시 이미지들 정리
        await this.tempImageService.cleanupUnusedImages(usedImageUrls, user.id);

        return savedPost;
    }

    async update(id: number, updatePostDto: UpdatePostDto): Promise<Post | null> {
        const { sportCategoryId, content, type, ...rest } = updatePostDto;
        let sportCategoryEntity: SportCategory | undefined = undefined;

        // 스포츠 카테고리가 지정된 경우
        if (typeof sportCategoryId === 'number') {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId } });
            sportCategoryEntity = found ?? undefined;
        } else if (sportCategoryId && typeof sportCategoryId === 'object' && sportCategoryId.id) {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId.id } });
            sportCategoryEntity = found ?? undefined;
        }

        // 스포츠 카테고리가 없으면 자유글로 설정
        if (!sportCategoryEntity) {
            const freeCategory = await this.sportCategoryRepository.findOne({ where: { name: '자유글' } });
            sportCategoryEntity = freeCategory ?? undefined;
        }

        // content에서 실제 사용된 이미지 URL 추출
        const usedImageUrls = this.extractImageUrlsFromContent(content || '');

        await this.postRepository.update(id, {
            ...rest,
            content,
            sportCategory: sportCategoryEntity,
            imageUrls: usedImageUrls
        });

        // 사용된 이미지들을 임시 이미지에서 제거
        const post = await this.findOne(id);
        if (post) {
            for (const imageUrl of usedImageUrls) {
                await this.tempImageService.markImageAsUsed(imageUrl, post.author.id);
            }
            // 사용되지 않은 임시 이미지들 정리
            await this.tempImageService.cleanupUnusedImages(usedImageUrls, post.author.id);
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        return this.postRepository.delete(id);
    }

    async incrementViewCount(id: number): Promise<void> {
        await this.postRepository.increment({ id }, 'viewCount', 1);
    }

    // 중복 조회를 방지하면서 조회수 증가하는 메서드
    async incrementViewCountIfNotViewed(id: number, ip: string): Promise<boolean> {
        const key = `${ip}_${id}`;
        const now = Date.now();
        const lastViewed = this.viewedPosts.get(key);

        // 1시간(3600000ms) 내에 조회하지 않았으면 증가
        if (!lastViewed || (now - lastViewed) > 60 * 60 * 1000) {
            await this.incrementViewCount(id);
            this.viewedPosts.set(key, now);

            // 메모리 관리를 위해 오래된 기록 정리
            this.cleanupOldRecords();

            return true; // 조회수 증가됨
        }

        return false; // 조회수 증가하지 않음 (중복 조회)
    }

    // 오래된 조회 기록 정리 (메모리 관리)
    private cleanupOldRecords(): void {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        for (const [key, timestamp] of this.viewedPosts.entries()) {
            if (now - timestamp > oneHour) {
                this.viewedPosts.delete(key);
            }
        }
    }

    async checkUserLikeStatus(postId: number, userId?: number): Promise<boolean> {
        if (!userId) return false;

        try {
            const like = await this.postLikeService.findOne(postId, userId);
            return like?.isLiked || false;
        } catch (error) {
            return false;
        }
    }

    async checkUserHateStatus(postId: number, userId?: number): Promise<boolean> {
        if (!userId) return false;

        try {
            const hate = await this.postHateService.findOne(postId, userId);
            return hate?.isHated || false;
        } catch (error) {
            return false;
        }
    }

    async getPostLikeCount(postId: number): Promise<number> {
        try {
            return await this.postLikeService.getLikeCount(postId);
        } catch (error) {
            return 0;
        }
    }

    async getPostHateCount(postId: number): Promise<number> {
        return this.postRepository
            .createQueryBuilder('post')
            .leftJoin('post.hates', 'hate')
            .where('post.id = :postId', { postId })
            .andWhere('hate.isHated = :isHated', { isHated: true })
            .getCount();
    }

    /**
     * 전체 인기글 조회 (최근 24시간 반응 기준)
     */
    async getHotPosts(): Promise<any[]> {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        try {
            // 1. 모든 게시글을 기본 정보와 함께 조회 (숨겨지지 않은 것만)
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });

            // 2. 각 게시글에 대해 인기점수 계산
            const postsWithScore: any[] = [];

            for (const post of allPosts) {
                if (!post.sportCategory) continue;

                // 좋아요 수 조회
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();

                // 댓글 수 조회
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();

                // 싫어요 수 조회
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :oneDayAgo', { oneDayAgo })
                    .getCount();

                // 인기점수 계산
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);

                postsWithScore.push({
                    ...post,
                    popularityScore
                });
            }

            // 3. 전체 게시글을 인기점수 순으로 정렬하고 상위 3개만 유지
            postsWithScore.sort((a, b) => b.popularityScore - a.popularityScore);
            const topPosts = postsWithScore.slice(0, 3);

            // 4. 결과를 배열로 변환
            const result: any[] = [];
            for (const post of topPosts) {
                const category = post.sportCategory;
                if (category) {
                    result.push({
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        author: {
                            id: post.author.id,
                            nickname: post.author.nickname
                        },
                        sportCategory: {
                            id: category.id,
                            name: category.name
                        },
                        popularityScore: post.popularityScore,
                        createdAt: post.createdAt,
                        viewCount: post.viewCount
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('Error in getHotPosts:', error);
            return [];
        }
    }

    /**
     * 카테고리별 실시간 인기글 조회 (최근 1시간 반응 기준)
     */
    async getRealTimeHotPosts(): Promise<any[]> {
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        try {
            // 1. 모든 게시글을 기본 정보와 함께 조회 (숨겨지지 않은 것만)
            const allPosts = await this.postRepository.find({
                where: { isHidden: false },
                relations: ['author', 'sportCategory']
            });

            // 2. 각 게시글에 대해 인기점수 계산
            const postsWithScore: any[] = [];

            for (const post of allPosts) {
                if (!post.sportCategory) continue;

                // 좋아요 수 조회 (최근 1시간)
                const likeCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.likes', 'like')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('like.isLiked = :isLiked', { isLiked: true })
                    .andWhere('like.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();

                // 댓글 수 조회 (최근 1시간)
                const commentCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.comments', 'comment')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('comment.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();

                // 싫어요 수 조회 (최근 1시간)
                const hateCount = await this.postRepository
                    .createQueryBuilder('post')
                    .leftJoin('post.hates', 'hate')
                    .where('post.id = :postId', { postId: post.id })
                    .andWhere('hate.isHated = :isHated', { isHated: true })
                    .andWhere('hate.created_at >= :oneHourAgo', { oneHourAgo })
                    .getCount();

                // 인기점수 계산
                const popularityScore = (likeCount * 2) + (commentCount * 1) - (hateCount * 0.5);

                postsWithScore.push({
                    ...post,
                    popularityScore
                });
            }

            // 3. 카테고리별로 그룹화
            const groupedPosts = new Map<number, any[]>();

            postsWithScore.forEach(post => {
                const categoryId = post.sportCategory.id;
                if (!groupedPosts.has(categoryId)) {
                    groupedPosts.set(categoryId, []);
                }
                groupedPosts.get(categoryId)!.push(post);
            });

            // 4. 각 카테고리 내에서 인기점수 순으로 정렬하고 상위 3개만 유지
            for (const [categoryId, posts] of groupedPosts) {
                posts.sort((a, b) => b.popularityScore - a.popularityScore);
                groupedPosts.set(categoryId, posts.slice(0, 3));
            }

            // 5. 결과를 배열로 변환
            const result: any[] = [];
            for (const [categoryId, posts] of groupedPosts) {
                const category = posts[0]?.sportCategory;
                if (category) {
                    result.push({
                        categoryId,
                        categoryName: category.name || 'Unknown',
                        posts: posts.map(post => ({
                            id: post.id,
                            title: post.title,
                            content: post.content,
                            author: {
                                id: post.author.id,
                                nickname: post.author.nickname
                            },
                            sportCategory: {
                                id: post.sportCategory.id,
                                name: post.sportCategory.name
                            },
                            popularityScore: post.popularityScore,
                            createdAt: post.createdAt,
                            viewCount: post.viewCount
                        }))
                    });
                }
            }

            return result;
        } catch (error) {
            console.error('Error in getRealTimeHotPosts:', error);
            return [];
        }
    }

    /**
     * 저장된 인기글 조회 (24시간마다 선정된 것)
     */
    async getStoredHotPosts(date?: Date): Promise<any[]> {
        try {
            const targetDate = date || new Date();
            targetDate.setHours(0, 0, 0, 0);

            const hotPosts = await this.hotPostRepository.find({
                where: { selectionDate: targetDate },
                relations: ['post', 'post.author', 'post.sportCategory'],
                order: { rank: 'ASC' }
            });

            return hotPosts.map(hotPost => ({
                id: hotPost.post.id,
                title: hotPost.post.title,
                content: hotPost.post.content,
                author: {
                    id: hotPost.post.author.id,
                    nickname: hotPost.post.author.nickname
                },
                sportCategory: hotPost.post.sportCategory ? {
                    id: hotPost.post.sportCategory.id,
                    name: hotPost.post.sportCategory.name
                } : null,
                popularityScore: hotPost.popularityScore,
                rank: hotPost.rank,
                selectionDate: hotPost.selectionDate,
                createdAt: hotPost.post.createdAt,
                viewCount: hotPost.post.viewCount,
                isRewarded: hotPost.isRewarded
            }));
        } catch (error) {
            console.error('Error in getStoredHotPosts:', error);
            return [];
        }
    }

    /**
     * 게시글 작성자 업데이트
     */
    async updateAuthor(postId: number, newAuthorId: number): Promise<Post | null> {
        try {
            const post = await this.postRepository.findOne({
                where: { id: postId },
                relations: ['author']
            });

            if (!post) {
                throw new Error(`Post with ID ${postId} not found`);
            }

            const newAuthor = await this.userRepository.findOne({
                where: { id: newAuthorId }
            });

            if (!newAuthor) {
                throw new Error(`User with ID ${newAuthorId} not found`);
            }

            post.author = newAuthor;
            const updatedPost = await this.postRepository.save(post);

            console.log(`Post ${postId} author updated from ${post.author.id} to ${newAuthorId}`);
            return updatedPost;
        } catch (error) {
            console.error(`Failed to update post author: ${error.message}`);
            throw error;
        }
    }

    // content에서 이미지 URL 추출
    private extractImageUrlsFromContent(content: string): string[] {
        const imageUrlRegex = /https:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp)/gi;
        const matches = content.match(imageUrlRegex);
        return matches ? [...new Set(matches)] : []; // 중복 제거
    }
} 