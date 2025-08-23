import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { TokenTransactionService } from './token-transaction.service';

@Injectable()
export class PostLikeService {
    constructor(
        @InjectRepository(PostLike)
        private postLikeRepository: Repository<PostLike>,
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private trivusExpService: TrivusExpService,
        private tokenTransactionService: TokenTransactionService,
    ) { }

    /**
     * 블록체인 이벤트로부터 좋아요 토큰 차감 처리
     * (토큰 수정은 LikeEventService에서 처리, 여기서는 post_like 테이블만 업데이트)
     */
    async processLikeTokenDeduction(
        userId: number,
        postId: number,
        transactionHash: string,
        amount: number
    ): Promise<void> {
        // 기존 좋아요 레코드 확인
        const existingPostLike = await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });

        if (existingPostLike) {
            // 이미 좋아요를 누른 경우 에러 발생 (중복 좋아요 방지)
            throw new Error(`User ${userId} has already liked post ${postId}. Duplicate likes are not allowed.`);
        }

        // 새로운 좋아요 레코드 생성 (항상 insert)
        const postLike = this.postLikeRepository.create({
            post: { id: postId },
            user: { id: userId },
            isLiked: true,
            transactionHash,
            tokenDeducted: true,
            tokenDeductedAt: new Date(),
        });

        await this.postLikeRepository.save(postLike);
        console.log(`New like record created: user ${userId} -> post ${postId}`);
    }

    /**
     * 좋아요 취소 기능은 제거됨 (토큰이 걸려있어서 복잡함)
     * 필요시 주석 해제하여 사용
     */
    // async processLikeTokenRefund(
    //     userId: number,
    //     postId: number,
    //     transactionHash: string,
    //     amount: number
    // ): Promise<void> {
    //     // PostLike 엔티티 업데이트
    //     const postLike = await this.postLikeRepository.findOne({
    //         where: { post: { id: postId }, user: { id: userId } },
    //     });

    //     if (postLike) {
    //         postLike.isLiked = false;
    //         postLike.transactionHash = transactionHash;
    //         await this.postLikeRepository.save(postLike);
    //     }
    // }

    async updateLikeTransactionHash(likeId: number, transactionHash: string): Promise<PostLike> {
        const postLike = await this.postLikeRepository.findOne({ where: { id: likeId } });
        if (!postLike) {
            throw new NotFoundException(`PostLike with ID ${likeId} not found`);
        }

        postLike.transactionHash = transactionHash;
        postLike.tokenDeducted = true;
        postLike.tokenDeductedAt = new Date();

        return await this.postLikeRepository.save(postLike);
    }

    async getLikeWithTransactionInfo(postId: number, userId: number): Promise<PostLike | null> {
        return await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });
    }

    async getLikeCount(postId: number): Promise<number> {
        // 게시글이 존재하는지 확인
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        // 해당 게시글의 좋아요 개수 조회
        return await this.postLikeRepository.count({
            where: { post: { id: postId }, isLiked: true },
        });
    }

    async findOne(postId: number, userId: number): Promise<PostLike | null> {
        return await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });
    }

    async updateLike(postLike: PostLike): Promise<PostLike> {
        return await this.postLikeRepository.save(postLike);
    }

    /**
     * 사용자가 특정 게시글에 이미 좋아요를 눌렀는지 확인
     * @param userId 사용자 ID
     * @param postId 게시글 ID
     * @returns 이미 좋아요를 눌렀으면 true, 아니면 false
     */
    async hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
        const existingLike = await this.postLikeRepository.findOne({
            where: {
                post: { id: postId },
                user: { id: userId },
                isLiked: true
            },
        });

        return !!existingLike;
    }
} 