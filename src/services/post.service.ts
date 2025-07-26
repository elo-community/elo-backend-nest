import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { Post } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PostService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async findAll(): Promise<Post[]> {
        return this.postRepository.find({ relations: ['author', 'sportCategory'] });
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
                'comments.replies.user'
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

    async create(createPostDto: CreatePostDto, user: JwtUser): Promise<Post> {

        const { sportCategory, ...rest } = createPostDto;
        let sportCategoryEntity: SportCategory | undefined = undefined;
        if (typeof sportCategory === 'number') {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategory } });
            sportCategoryEntity = found ?? undefined;
        } else if (sportCategory && typeof sportCategory === 'object' && sportCategory.id) {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategory.id } });
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
        const { sportCategory, ...rest } = updatePostDto;
        let sportCategoryEntity: SportCategory | undefined = undefined;
        if (typeof sportCategory === 'number') {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategory } });
            sportCategoryEntity = found ?? undefined;
        } else if (sportCategory && typeof sportCategory === 'object' && sportCategory.id) {
            const found = await this.sportCategoryRepository.findOne({ where: { id: sportCategory.id } });
            sportCategoryEntity = found ?? undefined;
        }
        await this.postRepository.update(id, { ...rest, sportCategory: sportCategoryEntity });
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.postRepository.delete(id);
    }
} 