import { Test, TestingModule } from '@nestjs/testing';
import { JwtUser } from '../auth/jwt-user.interface';
import { CommentService } from '../services/comment.service';
import { PostService } from '../services/post.service';
import { PostsController } from './posts.controller';

describe('PostsController', () => {
    let controller: PostsController;
    let postService: PostService;
    let commentService: CommentService;

    const mockPostService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findOneWithDetails: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
    };

    const mockCommentService = {
        findByPostId: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PostsController],
            providers: [
                {
                    provide: PostService,
                    useValue: mockPostService,
                },
                {
                    provide: CommentService,
                    useValue: mockCommentService,
                },
            ],
        }).compile();

        controller = module.get<PostsController>(PostsController);
        postService = module.get<PostService>(PostService);
        commentService = module.get<CommentService>(CommentService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all posts', async () => {
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

            jest.spyOn(postService, 'findAll').mockResolvedValue(mockPosts as any);

            const result = await controller.findAll();

            expect(postService.findAll).toHaveBeenCalled();
            expect(result).toEqual({
                success: true,
                data: expect.any(Array),
                message: 'Posts retrieved successfully'
            });
        });
    });

    describe('findOneWithDetails', () => {
        it('should return a post with details', async () => {
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

            jest.spyOn(postService, 'findOneWithDetails').mockResolvedValue(mockPost as any);

            const result = await controller.findOneWithDetails(1);

            expect(postService.findOneWithDetails).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Post with details retrieved successfully'
            });
        });

        it('should return null when post not found', async () => {
            jest.spyOn(postService, 'findOneWithDetails').mockResolvedValue(null);

            const result = await controller.findOneWithDetails(999);

            expect(postService.findOneWithDetails).toHaveBeenCalledWith(999);
            expect(result).toEqual({
                success: false,
                message: 'Post not found'
            });
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

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            const mockPost = {
                id: 1,
                title: 'New Post',
                content: 'New content',
                author: { id: 1, nickname: 'User1' },
                sportCategory: { id: 1, name: 'Football' },
            };

            jest.spyOn(postService, 'create').mockResolvedValue(mockPost as any);

            const result = await controller.create(createPostDto, jwtUser);

            expect(postService.create).toHaveBeenCalledWith(createPostDto, jwtUser);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Post created successfully'
            });
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

            jest.spyOn(postService, 'update').mockResolvedValue(mockPost as any);

            const result = await controller.update(1, updatePostDto);

            expect(postService.update).toHaveBeenCalledWith(1, updatePostDto);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Post updated successfully'
            });
        });

        it('should return null when post not found for update', async () => {
            const updatePostDto = {
                title: 'Updated Post',
                content: 'Updated content',
            };

            jest.spyOn(postService, 'update').mockResolvedValue(null);

            const result = await controller.update(999, updatePostDto);

            expect(postService.update).toHaveBeenCalledWith(999, updatePostDto);
            expect(result).toEqual({
                success: false,
                message: 'Post not found'
            });
        });
    });

    describe('remove', () => {
        it('should delete a post', async () => {
            const mockResult = { affected: 1 };

            jest.spyOn(postService, 'remove').mockResolvedValue(mockResult as any);

            const result = await controller.remove(1);

            expect(postService.remove).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                success: true,
                data: { deleted: true },
                message: 'Post deleted successfully'
            });
        });
    });
}); 