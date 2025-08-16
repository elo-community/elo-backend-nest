import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';
import { TransactionType } from '../entities/token-transaction.entity';
import { User } from '../entities/user.entity';
import { CreateTransactionDto, TokenTransactionService } from './token-transaction.service';

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
     */
    async processLikeTokenDeduction(
        userId: number,
        postId: number,
        transactionHash: string,
        amount: number
    ): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const balanceBefore = user.availableToken;

        // 사용 가능한 토큰에서 차감
        user.availableToken = Math.max(0, user.availableToken - amount);
        await this.userRepository.save(user);

        // 토큰 거래 내역 기록
        const transactionDto: CreateTransactionDto = {
            userId: user.id,
            transactionType: TransactionType.LIKE_DEDUCT,
            amount: -amount, // 차감이므로 음수
            balanceBefore,
            balanceAfter: user.availableToken,
            transactionHash,
            description: `Post like deduction for post ID: ${postId}`,
            metadata: {
                postId,
                action: 'like_deduct',
                tokenAmount: amount,
            },
            referenceId: postId.toString(),
            referenceType: 'post_like',
        };

        await this.tokenTransactionService.createTransaction(transactionDto);

        // PostLike 엔티티 생성 또는 업데이트
        let postLike = await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });

        if (!postLike) {
            // 새로운 좋아요 생성
            postLike = this.postLikeRepository.create({
                post: { id: postId },
                user: { id: userId },
                isLiked: true,
                transactionHash,
                tokenDeducted: true,
                tokenDeductedAt: new Date(),
            });
        } else {
            // 기존 좋아요 업데이트
            postLike.isLiked = true;
            postLike.transactionHash = transactionHash;
            postLike.tokenDeducted = true;
            postLike.tokenDeductedAt = new Date();
        }

        await this.postLikeRepository.save(postLike);
    }

    /**
     * 블록체인 이벤트로부터 좋아요 토큰 반환 처리
     */
    async processLikeTokenRefund(
        userId: number,
        postId: number,
        transactionHash: string,
        amount: number
    ): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }

        const balanceBefore = user.availableToken;

        // 토큰 반환
        user.availableToken = user.availableToken + amount;
        await this.userRepository.save(user);

        // 토큰 거래 내역 기록
        const transactionDto: CreateTransactionDto = {
            userId: user.id,
            transactionType: TransactionType.LIKE_REFUND,
            amount: amount, // 반환이므로 양수
            balanceBefore,
            balanceAfter: user.availableToken,
            transactionHash,
            description: `Post like refund for post ID: ${postId}`,
            metadata: {
                postId,
                action: 'like_refund',
                tokenAmount: amount,
            },
            referenceId: postId.toString(),
            referenceType: 'post_like',
        };

        await this.tokenTransactionService.createTransaction(transactionDto);

        // PostLike 엔티티 업데이트
        const postLike = await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });

        if (postLike) {
            postLike.isLiked = false;
            postLike.transactionHash = transactionHash;
            await this.postLikeRepository.save(postLike);
        }
    }

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
} 