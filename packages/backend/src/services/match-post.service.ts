import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { MatchPostResponse, groupMatchRequestsByStatus } from '../dtos/match-post-response.dto';
import { CreateMatchPostDto, MatchRequestDto, MatchResponseDto } from '../dtos/match-post.dto';
import { MatchRequest, MatchRequestStatus } from '../entities/match-request.entity';
import { Post, PostType } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { TempImageService } from './temp-image.service';

@Injectable()
export class MatchPostService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(MatchRequest)
        private readonly matchRequestRepository: Repository<MatchRequest>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        private readonly tempImageService: TempImageService,
    ) { }

    /**
     * 매치글 생성
     */
    async createMatchPost(createMatchPostDto: CreateMatchPostDto, user: JwtUser): Promise<Post> {
        const { sportCategoryId, imageUrls, ...rest } = createMatchPostDto;

        // 스포츠 카테고리 조회
        const sportCategory = await this.sportCategoryRepository.findOne({
            where: { id: sportCategoryId }
        });
        if (!sportCategory) {
            throw new NotFoundException('Sport category not found');
        }

        // 작성자 정보 조회
        const author = await this.userRepository.findOne({
            where: { id: user.id }
        });
        if (!author) {
            throw new NotFoundException('Author not found');
        }

        // content에서 실제 사용된 이미지 URL 추출
        const usedImageUrls = this.extractImageUrlsFromContent(rest.content || '');

        // 매치글 생성
        const post = this.postRepository.create({
            ...rest,
            type: PostType.MATCH,
            sportCategory,
            author,
            imageUrls: usedImageUrls,
            matchStatus: '대기중',
            // 기본 데드라인 설정 (2주 후)
            deadline: createMatchPostDto.deadline
                ? new Date(createMatchPostDto.deadline)
                : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            matchDate: createMatchPostDto.matchDate ? new Date(createMatchPostDto.matchDate) : undefined,
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

    /**
     * 매치글 상세 조회
     */
    async getMatchPostDetail(postId: number): Promise<MatchPostResponse> {
        const post = await this.postRepository.findOne({
            where: { id: postId, type: PostType.MATCH },
            relations: ['author', 'sportCategory']
        });

        if (!post) {
            throw new NotFoundException('Match post not found');
        }

        // 매치 신청 목록 조회
        const matchRequests = await this.matchRequestRepository.find({
            where: { post: { id: postId } },
            relations: ['user']
        });

        // 매치 정보 구성
        const matchInfo = {
            matchLocation: post.matchLocation!,
            myElo: post.myElo!,
            preferredElo: post.preferredElo!,
            participantCount: post.participantCount!,
            status: post.matchStatus!,
            deadline: post.deadline,
            matchDate: post.matchDate
        };

        // 참가자 정보 그룹화
        const participants = groupMatchRequestsByStatus(matchRequests);

        return {
            id: post.id,
            title: post.title!,
            content: post.content!,
            type: post.type!,
            sportCategoryId: post.sportCategory!.id,
            author: {
                id: post.author.id,
                nickname: post.author.nickname,
                profileImageUrl: post.author.profileImageUrl
            },
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            matchInfo,
            participants
        };
    }

    /**
     * 매치 신청
     */
    async requestMatch(matchRequestDto: MatchRequestDto, user: JwtUser): Promise<MatchRequest> {
        const { postId, message } = matchRequestDto;

        // 매치글 조회
        const post = await this.postRepository.findOne({
            where: { id: postId, type: PostType.MATCH },
            relations: ['author']
        });

        if (!post) {
            throw new NotFoundException('Match post not found');
        }

        // 자기 자신의 글에는 신청할 수 없음
        if (post.author.id === user.id) {
            throw new ForbiddenException('Cannot request match on your own post');
        }

        // 이미 신청한 경우 확인
        const existingRequest = await this.matchRequestRepository.findOne({
            where: { post: { id: postId }, user: { id: user.id } }
        });

        if (existingRequest) {
            throw new ForbiddenException('Already requested match on this post');
        }

        // 사용자 정보 조회 (Elo 포함)
        const userEntity = await this.userRepository.findOne({
            where: { id: user.id },
            relations: ['userElos', 'userElos.sportCategory']
        });

        if (!userEntity) {
            throw new NotFoundException('User not found');
        }

        // 해당 스포츠의 Elo 조회
        const userElo = userEntity.userElos?.find(elo => elo.sportCategory.id === post.sportCategory?.id)?.eloPoint;

        // 매치 신청 생성
        const matchRequest = this.matchRequestRepository.create({
            post,
            user: userEntity,
            message,
            userElo,
            status: MatchRequestStatus.PENDING
        });

        return await this.matchRequestRepository.save(matchRequest);
    }

    /**
     * 매치 신청 응답 (수락/거절)
     */
    async respondToMatchRequest(matchResponseDto: MatchResponseDto, user: JwtUser): Promise<MatchRequest> {
        const { postId, action, responseMessage } = matchResponseDto;

        // 매치글 조회
        const post = await this.postRepository.findOne({
            where: { id: postId, type: PostType.MATCH },
            relations: ['author']
        });

        if (!post) {
            throw new NotFoundException('Match post not found');
        }

        // 작성자만 응답할 수 있음
        if (post.author.id !== user.id) {
            throw new ForbiddenException('Only the author can respond to match requests');
        }

        // 매치 신청 조회
        const matchRequest = await this.matchRequestRepository.findOne({
            where: { post: { id: postId } },
            relations: ['user']
        });

        if (!matchRequest) {
            throw new NotFoundException('Match request not found');
        }

        // 상태 업데이트
        const newStatus = action === 'accept' ? MatchRequestStatus.ACCEPTED : MatchRequestStatus.REJECTED;

        matchRequest.status = newStatus;
        matchRequest.respondedAt = new Date();
        matchRequest.responseMessage = responseMessage;

        // 매치글 상태 업데이트 (모집 완료 체크)
        if (action === 'accept') {
            const acceptedCount = await this.matchRequestRepository.count({
                where: { post: { id: postId }, status: MatchRequestStatus.ACCEPTED }
            });

            if (acceptedCount >= post.participantCount! - 1) { // 작성자 제외
                post.matchStatus = '모집완료';
                await this.postRepository.save(post);
            }
        }

        return await this.matchRequestRepository.save(matchRequest);
    }

    /**
     * 매치글 목록 조회
     */
    async getMatchPosts(sportCategoryId?: number, page: number = 1, limit: number = 10) {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.sportCategory', 'sportCategory')
            .where('post.type = :type', { type: PostType.MATCH })
            .orderBy('post.createdAt', 'DESC');

        if (sportCategoryId) {
            queryBuilder.andWhere('post.sportCategory.id = :sportCategoryId', { sportCategoryId });
        }

        const total = await queryBuilder.getCount();
        const posts = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            posts,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * content에서 이미지 URL 추출
     */
    private extractImageUrlsFromContent(content: string): string[] {
        const imageUrlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
        const matches = content.match(imageUrlRegex);

        if (!matches) return [];

        return matches.map(match => {
            const urlMatch = match.match(/\((https?:\/\/[^\s)]+)\)/);
            return urlMatch ? urlMatch[1] : '';
        }).filter(url => url);
    }
}
