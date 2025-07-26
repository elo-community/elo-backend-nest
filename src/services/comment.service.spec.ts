import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { Comment } from '../entities/comment.entity';
import { CommentService } from './comment.service';

describe('CommentService', () => {
    let service: CommentService;
    let commentRepository: Repository<Comment>;

    const mockCommentRepository = {
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

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CommentService,
                {
                    provide: getRepositoryToken(Comment),
                    useValue: mockCommentRepository,
                },
            ],
        }).compile();

        service = module.get<CommentService>(CommentService);
        commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all comments with relations', async () => {
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
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 2, title: 'Post 2' },
                    replies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(commentRepository, 'createQueryBuilder').mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockComments),
            } as any);

            const result = await service.findAll();

            expect(commentRepository.createQueryBuilder).toHaveBeenCalledWith('comment');
            expect(result).toEqual(mockComments);
        });

        it('should filter comments by postId', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(commentRepository, 'createQueryBuilder').mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockComments),
            } as any);

            const result = await service.findAll({ postId: 1 });

            expect(result).toEqual(mockComments);
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment as unknown as Comment);

            const result = await service.findOne(1);

            expect(commentRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['user', 'post', 'replies', 'replies.user'],
            });
            expect(result).toEqual(mockComment);
        });

        it('should throw NotFoundException when comment not found', async () => {
            jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow('Comment with ID 999 not found');
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(commentRepository, 'create').mockReturnValue(mockComment as unknown as Comment);
            jest.spyOn(commentRepository, 'save').mockResolvedValue(mockComment as unknown as Comment);
            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);

            const result = await service.create(createCommentDto, jwtUser);

            expect(commentRepository.create).toHaveBeenCalledWith({
                content: 'New comment',
                post: { id: 1 },
                user: { id: 1 },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
            expect(commentRepository.save).toHaveBeenCalledWith(mockComment);
            expect(result).toEqual(mockComment);
        });
    });

    describe('update', () => {
        it('should update a comment', async () => {
            const updateCommentDto = {
                content: 'Updated comment',
            };

            const mockComment = {
                id: 1,
                content: 'Original comment',
                user: { id: 1, nickname: 'User1' },
                post: { id: 1, title: 'Post 1' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);
            jest.spyOn(commentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'findOne').mockResolvedValue({
                ...mockComment,
                content: 'Updated comment',
            } as unknown as Comment);

            const result = await service.update(1, updateCommentDto, jwtUser);

            expect(commentRepository.update).toHaveBeenCalledWith(1, {
                content: 'Updated comment',
                updatedAt: expect.any(Date),
            });
            expect(result.content).toBe('Updated comment');
        });

        it('should throw BadRequestException when user is not the author', async () => {
            const updateCommentDto = {
                content: 'Updated comment',
            };

            const mockComment = {
                id: 1,
                content: 'Original comment',
                user: { id: 2, nickname: 'User2' }, // 다른 사용자
                post: { id: 1, title: 'Post 1' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const jwtUser: JwtUser = {
                id: 1, // 현재 사용자
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);

            await expect(service.update(1, updateCommentDto, jwtUser)).rejects.toThrow(
                'Only the comment author can update this comment'
            );
        });
    });

    describe('remove', () => {
        it('should delete a comment without replies', async () => {
            const mockComment = {
                id: 1,
                content: 'Test comment',
                user: { id: 1, nickname: 'User1' },
                post: { id: 1, title: 'Post 1' },
                replies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);
            jest.spyOn(commentRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

            const result = await service.remove(1, jwtUser);

            expect(commentRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toEqual({ affected: 1 });
        });

        it('should soft delete comment with replies', async () => {
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
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);
            jest.spyOn(commentRepository, 'update').mockResolvedValue({ affected: 1 } as any);

            const result = await service.remove(1, jwtUser);

            expect(commentRepository.update).toHaveBeenCalledWith(1, {
                content: '[삭제된 댓글입니다]',
                updatedAt: expect.any(Date),
            });
            expect(result).toEqual({ affected: 1 });
        });

        it('should throw BadRequestException when user is not the author', async () => {
            const mockComment = {
                id: 1,
                content: 'Test comment',
                user: { id: 2, nickname: 'User2' }, // 다른 사용자
                post: { id: 1, title: 'Post 1' },
                replies: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const jwtUser: JwtUser = {
                id: 1, // 현재 사용자
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(service, 'findOne').mockResolvedValue(mockComment as unknown as Comment);

            await expect(service.remove(1, jwtUser)).rejects.toThrow(
                'Only the comment author can delete this comment'
            );
        });
    });

    describe('findByPostId', () => {
        it('should return comments by post id', async () => {
            const mockComments = [
                {
                    id: 1,
                    content: 'Test comment 1',
                    user: { id: 1, nickname: 'User1' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(commentRepository, 'find').mockResolvedValue(mockComments as unknown as Comment[]);

            const result = await service.findByPostId(1);

            expect(commentRepository.find).toHaveBeenCalledWith({
                where: { post: { id: 1 } },
                relations: ['user', 'post', 'replies', 'replies.user'],
                order: {
                    createdAt: 'ASC',
                    replies: {
                        createdAt: 'ASC',
                    },
                },
            });
            expect(result).toEqual(mockComments);
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
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    content: 'Test comment 2',
                    user: { id: 2, nickname: 'User2' },
                    post: { id: 1, title: 'Post 1' },
                    replies: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(commentRepository, 'find').mockResolvedValue(mockComments as unknown as Comment[]);

            const result = await service.getCommentTree(1);

            expect(commentRepository.find).toHaveBeenCalledWith({
                where: { post: { id: 1 } },
                relations: ['user', 'replies', 'replies.user'],
                order: {
                    createdAt: 'ASC',
                    replies: {
                        createdAt: 'ASC',
                    },
                },
            });
            expect(result).toEqual(mockComments);
        });
    });
}); 