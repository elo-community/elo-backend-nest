import { Test, TestingModule } from '@nestjs/testing';
import { JwtUser } from '../auth/jwt-user.interface';
import { CommentService } from '../services/comment.service';
import { CommentsController } from './comments.controller';

describe('CommentsController', () => {
    let controller: CommentsController;
    let commentService: CommentService;

    const mockCommentService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        findByPostId: jest.fn(),
        getCommentTree: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentsController],
            providers: [
                {
                    provide: CommentService,
                    useValue: mockCommentService,
                },
            ],
        }).compile();

        controller = module.get<CommentsController>(CommentsController);
        commentService = module.get<CommentService>(CommentService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all comments', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment 1',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 2, title: 'Post 2' },
                    replies: [],
                },
            ];

            jest.spyOn(commentService, 'findAll').mockResolvedValue(mockComments as any);

            const result = await controller.findAll({});

            expect(commentService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual({
                success: true,
                data: expect.any(Array),
                message: 'Comments retrieved successfully'
            });
        });

        it('should filter comments by postId', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                },
            ];

            jest.spyOn(commentService, 'findAll').mockResolvedValue(mockComments as any);

            const result = await controller.findAll({ postId: 1 });

            expect(commentService.findAll).toHaveBeenCalledWith({ postId: 1 });
            expect(result).toEqual({
                success: true,
                data: expect.any(Array),
                message: 'Comments retrieved successfully'
            });
        });
    });

    describe('findOne', () => {
        it('should return a comment by id', async () => {
            const mockComment = {
                id: 1,
                content: 'Test comment',
                user: { id: 1, nickname: 'User1' },
                post: { id: 1, title: 'Post 1' },
                replies: [
                    {
                        id: 1,
                        content: 'Test reply',
                        user: { id: 2, nickname: 'User2' },
                    },
                ],
            };

            jest.spyOn(commentService, 'findOne').mockResolvedValue(mockComment as any);

            const result = await controller.findOne(1);

            expect(commentService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Comment retrieved successfully'
            });
        });
    });

    describe('create', () => {
        it('should create a new comment', async () => {
            const createCommentDto = {
                content: 'New comment',
                postId: 1,
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            const mockComment = {
                id: 1,
                content: 'New comment',
                user: { id: 1, nickname: 'User1' },
                post: { id: 1, title: 'Post 1' },
            };

            jest.spyOn(commentService, 'create').mockResolvedValue(mockComment as any);

            const result = await controller.create(createCommentDto, jwtUser);

            expect(commentService.create).toHaveBeenCalledWith(createCommentDto, jwtUser);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Comment created successfully'
            });
        });
    });

    describe('update', () => {
        it('should update a comment', async () => {
            const updateCommentDto = {
                content: 'Updated comment',
            };

            const mockComment = {
                id: 1,
                content: 'Updated comment',
                user: { id: 1, nickname: 'User1' },
                post: { id: 1, title: 'Post 1' },
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(commentService, 'update').mockResolvedValue(mockComment as any);

            const result = await controller.update(1, updateCommentDto, jwtUser);

            expect(commentService.update).toHaveBeenCalledWith(1, updateCommentDto, jwtUser);
            expect(result).toEqual({
                success: true,
                data: expect.any(Object),
                message: 'Comment updated successfully'
            });
        });
    });

    describe('remove', () => {
        it('should delete a comment', async () => {
            const mockResult = { affected: 1 };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(commentService, 'remove').mockResolvedValue(mockResult as any);

            const result = await controller.remove(1, jwtUser);

            expect(commentService.remove).toHaveBeenCalledWith(1, jwtUser);
            expect(result).toEqual({
                success: true,
                data: { deleted: true },
                message: 'Comment deleted successfully'
            });
        });
    });

    describe('getCommentsByPost', () => {
        it('should return comments by post id', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment 1',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                },
            ];

            jest.spyOn(commentService, 'findByPostId').mockResolvedValue(mockComments as any);

            const result = await controller.getCommentsByPost('1');

            expect(commentService.findByPostId).toHaveBeenCalledWith('1');
            expect(result).toEqual({
                success: true,
                data: expect.any(Array),
                message: 'Comments retrieved successfully'
            });
        });
    });

    describe('getCommentTree', () => {
        it('should return comment tree for a post', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment 1',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [
                        {
                            id: 1,
                            content: 'Test reply 1',
                            user: { id: 2, nickname: 'User2' },
                        },
                    ],
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                },
            ];

            jest.spyOn(commentService, 'getCommentTree').mockResolvedValue(mockComments as any);

            const result = await controller.getCommentTree('1');

            expect(commentService.getCommentTree).toHaveBeenCalledWith(1);
            expect(result).toEqual({
                success: true,
                data: expect.any(Array),
                message: 'Comment tree retrieved successfully'
            });
        });
    });
}); 