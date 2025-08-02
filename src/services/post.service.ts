import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { PaginationResponseDto } from '../dtos/pagination-response.dto';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
import { Post } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { PostHateService } from './post-hate.service';
import { PostLikeService } from './post-like.service';

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
        private readonly postLikeService: PostLikeService,
        private readonly postHateService: PostHateService,
    ) { }

    async findAll(query?: PostQueryDto): Promise<PaginationResponseDto<Post>> {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.sportCategory', 'sportCategory')
            .leftJoinAndSelect('post.comments', 'comments');

        // 스포츠 카테고리 필터링
        if (query?.sport) {
            queryBuilder.andWhere('post.sportCategory.id = :sportId', { sportId: query.sport });
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
        return this.postRepository.findOne({ where: { id }, relations: ['author', 'sportCategory', 'comments'] });
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
            relations: ['author', 'sportCategory', 'comments'],
            order: { createdAt: 'DESC' }
        });
    }

    async create(createPostDto: CreatePostDto, user: JwtUser): Promise<Post> {

        const { sportCategoryId, ...rest } = createPostDto;
        let sportCategoryEntity: SportCategory | undefined = undefined;

        if (typeof sportCategoryId === "number") {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategoryId } });
            sportCategoryEntity = found ?? undefined;
        }

        const author = await this.userRepository.findOne({ where: { id: user.id } });
        if (!author) throw new Error('Author not found');

        const post = this.postRepository.create({
            ...rest,
            sportCategory: sportCategoryEntity,
            author,
        });
        return this.postRepository.save(post);
    }

    async update(id: number, updatePostDto: UpdatePostDto): Promise<Post | null> {
        const { sportCategoryId, ...rest } = updatePostDto;
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

        await this.postRepository.update(id, { ...rest, sportCategory: sportCategoryEntity });
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
        try {
            return await this.postHateService.getHateCount(postId);
        } catch (error) {
            return 0;
        }
    }
} 