import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostLikeService {
    constructor(
        @InjectRepository(PostLike)
        private postLikeRepository: Repository<PostLike>,
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
    ) { }

    async createLike(postId: number, userId: number): Promise<PostLike> {
        // 게시글이 존재하는지 확인
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        // 이미 좋아요를 눌렀는지 확인
        const existingLike = await this.postLikeRepository.findOne({
            where: { post: { id: postId }, user: { id: userId } },
        });

        if (existingLike) {
            // 이미 좋아요를 누른 경우 토글로 변경
            existingLike.isLiked = !existingLike.isLiked;
            return await this.postLikeRepository.save(existingLike);
        }

        // 새로운 좋아요 생성
        const postLike = this.postLikeRepository.create({
            post: { id: postId },
            isLiked: true,
            user: { id: userId },
        });

        return await this.postLikeRepository.save(postLike);
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