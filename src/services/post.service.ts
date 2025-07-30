import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreatePostDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
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

    async findAll(query?: PostQueryDto): Promise<Post[]> {
        const queryBuilder = this.postRepository.createQueryBuilder('post')
            .leftJoinAndSelect('post.author', 'author')
            .leftJoinAndSelect('post.sportCategory', 'sportCategory');

        // 스포츠 카테고리 필터링
        if (query?.sport) {
            queryBuilder.andWhere('post.sportCategory.id = :sportId', { sportId: query.sport });
        }

        queryBuilder.orderBy('post.createdAt', 'DESC');

        return queryBuilder.getMany();
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

    async findByUserId(userId: number): Promise<Post[]> {
        return this.postRepository.find({
            where: { author: { id: userId } },
            relations: ['author', 'sportCategory'],
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
} 