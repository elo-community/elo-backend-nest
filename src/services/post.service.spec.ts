import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { Post } from '../entities/post.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { PostService } from './post.service';

describe('PostService', () => {
    let service: PostService;
    let postRepository: Repository<Post>;
    let userRepository: Repository<User>;
    let sportCategoryRepository: Repository<SportCategory>;

    const mockPostRepository = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            leftJoinAndSelect: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getOne: jest.fn(),
        })),
    };

    const mockUserRepository = {
        findOne: jest.fn(),
    };

    const mockSportCategoryRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PostService,
                {
                    provide: getRepositoryToken(Post),
                    useValue: mockPostRepository,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: getRepositoryToken(SportCategory),
                    useValue: mockSportCategoryRepository,
                },
            ],
        }).compile();

        service = module.get<PostService>(PostService);
        postRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        sportCategoryRepository = module.get<Repository<SportCategory>>(getRepositoryToken(SportCategory));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all posts with relations', async () => {
            const mockPosts = [
                {
                    id: 1,
                    title: 'Test Post 1',
                    content: 'Test content 1',
                    author: { id: 1, nickname: 'User1' },
                    sportCategory: { id: 1, name: 'Football' },
                },
                {
                    id: 2,
                    title: 'Test Post 2',
                    content: 'Test content 2',
                    author: { id: 2, nickname: 'User2' },
                    sportCategory: { id: 2, name: 'Basketball' },
                },
            ];

            jest.spyOn(postRepository, 'find').mockResolvedValue(mockPosts as Post[]);

            const result = await service.findAll();

            expect(postRepository.find).toHaveBeenCalledWith({
                relations: ['author', 'sportCategory'],
            });
            expect(result).toEqual(mockPosts);
        });
    });

    describe('findOne', () => {
        it('should return a post by id', async () => {
            const mockPost = {
                id: 1,
                title: 'Test Post',
                content: 'Test content',
                author: { id: 1, nickname: 'User1' },
                sportCategory: { id: 1, name: 'Football' },
            };

            jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost as Post);

            const result = await service.findOne(1);

            expect(postRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['author', 'sportCategory'],
            });
            expect(result).toEqual(mockPost);
        });

        it('should return null when post not found', async () => {
            jest.spyOn(postRepository, 'findOne').mockResolvedValue(null);

            const result = await service.findOne(999);

            expect(result).toBeNull();
        });
    });

    describe('findOneWithDetails', () => {
        it('should return a post with all details including comments and replies', async () => {
            const mockPost = {
                id: 1,
                title: 'Test Post',
                content: 'Test content',
                author: { id: 1, nickname: 'User1' },
                sportCategory: { id: 1, name: 'Football' },
                comments: [
                    {
                        id: 1,
                        content: 'Test comment',
                        user: { id: 2, nickname: 'User2' },
                        replies: [
                            {
                                id: 1,
                                content: 'Test reply',
                                user: { id: 3, nickname: 'User3' },
                            },
                        ],
                    },
                ],
            };

            jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost as Post);

            const result = await service.findOneWithDetails(1);

            expect(postRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: [
                    'author',
                    'sportCategory',
                    'comments',
                    'comments.user',
                    'comments.replies',
                    'comments.replies.user',
                ],
                order: {
                    comments: {
                        createdAt: 'ASC',
                        replies: {
                            createdAt: 'ASC',
                        },
                    },
                },
            });
            expect(result).toEqual(mockPost);
        });
    });

    describe('create', () => {
        it('should create a new post', async () => {
            const createPostDto = {
                title: 'New Post',
                content: 'New content',
                type: 'post',
                isHidden: false,
                sportCategory: 1,
            };

            const mockUser: User = {
                id: 1,
                walletUserId: 'user123',
                walletAddress: '0x123',
                nickname: 'TestUser',
                email: 'test@example.com',
                createdAt: new Date(),
                tokenAmount: 1000,
                availableToken: 500,
            } as User;

            const mockSportCategory: SportCategory = {
                id: 1,
                name: 'Football',
                sortOrder: 1,
            } as SportCategory;

            const mockPost = {
                id: 1,
                title: 'New Post',
                content: 'New content',
                author: mockUser,
                sportCategory: mockSportCategory,
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date()
            };

            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
            jest.spyOn(sportCategoryRepository, 'findOne').mockResolvedValue(mockSportCategory);
            jest.spyOn(postRepository, 'create').mockReturnValue(mockPost as Post);
            jest.spyOn(postRepository, 'save').mockResolvedValue(mockPost as Post);

            const result = await service.create(createPostDto, jwtUser);

            expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(sportCategoryRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(postRepository.create).toHaveBeenCalledWith({
                title: 'New Post',
                content: 'New content',
                type: 'post',
                isHidden: false,
                sportCategory: mockSportCategory,
                author: mockUser,
            });
            expect(postRepository.save).toHaveBeenCalledWith(mockPost);
            expect(result).toEqual(mockPost);
        });

        it('should create post without sport category', async () => {
            const createPostDto = {
                title: 'New Post',
                content: 'New content',
                type: 'post',
                isHidden: false,
            };

            const mockUser: User = {
                id: 1,
                walletUserId: 'user123',
                walletAddress: '0x123',
                nickname: 'TestUser',
                email: 'test@example.com',
                createdAt: new Date(),
                tokenAmount: 1000,
                availableToken: 500,
            } as User;

            const mockPost = {
                id: 1,
                title: 'New Post',
                content: 'New content',
                author: mockUser,
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date()
            };

            jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser);
            jest.spyOn(postRepository, 'create').mockReturnValue(mockPost as Post);
            jest.spyOn(postRepository, 'save').mockResolvedValue(mockPost as Post);

            const result = await service.create(createPostDto, jwtUser);

            expect(postRepository.create).toHaveBeenCalledWith({
                title: 'New Post',
                content: 'New content',
                type: 'post',
                isHidden: false,
                sportCategory: undefined,
                author: mockUser,
            });
            expect(result).toEqual(mockPost);
        });
    });

    describe('update', () => {
        it('should update a post', async () => {
            const updatePostDto = {
                title: 'Updated Post',
                content: 'Updated content',
            };

            const mockPost = {
                id: 1,
                title: 'Updated Post',
                content: 'Updated content',
                author: { id: 1, nickname: 'User1' },
            };

            jest.spyOn(postRepository, 'update').mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(postRepository, 'findOne').mockResolvedValue(mockPost as Post);

            const result = await service.update(1, updatePostDto);

            expect(postRepository.update).toHaveBeenCalledWith(1, updatePostDto);
            expect(postRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['author', 'sportCategory'],
            });
            expect(result).toEqual(mockPost);
        });

        it('should return null when post not found for update', async () => {
            const updatePostDto = {
                title: 'Updated Post',
                content: 'Updated content',
            };

            jest.spyOn(postRepository, 'update').mockResolvedValue({ affected: 0 } as any);
            jest.spyOn(postRepository, 'findOne').mockResolvedValue(null);

            const result = await service.update(999, updatePostDto);

            expect(result).toBeNull();
        });
    });

    describe('remove', () => {
        it('should delete a post', async () => {
            jest.spyOn(postRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

            const result = await service.remove(1);

            expect(postRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toEqual({ affected: 1 });
        });
    });
}); 