import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostHate } from '../entities/post-hate.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class PostHateService {
  constructor(
    @InjectRepository(PostHate)
    private postHateRepository: Repository<PostHate>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createHate(postId: number, userId: number): Promise<PostHate> {
    // 게시글이 존재하는지 확인
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // 이미 싫어요를 눌렀는지 확인
    const existingHate = await this.postHateRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });

    if (existingHate) {
      // 이미 싫어요를 누른 경우 토글로 변경
      existingHate.isHated = !existingHate.isHated;
      return await this.postHateRepository.save(existingHate);
    }

    // 새로운 싫어요 생성
    const postHate = this.postHateRepository.create({
      post: { id: postId },
      isHated: true,
      user: { id: userId },
    });

    return await this.postHateRepository.save(postHate);
  }

  async getHateCount(postId: number): Promise<number> {
    // 게시글이 존재하는지 확인
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // 해당 게시글의 싫어요 개수 조회
    return await this.postHateRepository.count({
      where: { post: { id: postId }, isHated: true },
    });
  }

  async findOne(postId: number, userId: number): Promise<PostHate | null> {
    return await this.postHateRepository.findOne({
      where: { post: { id: postId }, user: { id: userId } },
    });
  }

  async updateHate(postHate: PostHate): Promise<PostHate> {
    return await this.postHateRepository.save(postHate);
  }
}
