import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { Comment } from '../entities/comment.entity';
import { Reply } from '../entities/reply.entity';
import { ReplyService } from './reply.service';

describe('ReplyService', () => {
    let service: ReplyService;
    let replyRepository: Repository<Reply>;
    let commentRepository: Repository<Comment>;

    const mockReplyRepository = {
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
            getMany: jest.fn(),
            getOne: jest.fn(),
        })),
    };

    const mockCommentRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReplyService,
                {
                    provide: getRepositoryToken(Reply),
                    useValue: mockReplyRepository,
                },
                {
                    provide: getRepositoryToken(Comment),
                    useValue: mockCommentRepository,
                },
            ],
        }).compile();

        service = module.get<ReplyService>(ReplyService);
        replyRepository = module.get<Repository<Reply>>(getRepositoryToken(Reply));
        commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all replies with relations', async () => {
            const mockReplies = [
                {
                    id: 1,
                    content: 'Test reply 1',
                    user: { id: 1, nickname: 'User1' },
                    comment: { id: 1, content: 'Comment 1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    content: 'Test reply 2',
                    user: { id: 2, nickname: 'User2' },
                    comment: { id: 2, content: 'Comment 2' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(replyRepository, 'createQueryBuilder').mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockReplies),
            } as any);

            const result = await service.findAll();

            expect(replyRepository.createQueryBuilder).toHaveBeenCalledWith('reply');
            expect(result).toEqual(mockReplies);
        });

        it('should filter replies by commentId', async () => {
            const mockReplies = [
                {
                    id: 1,
                    content: 'Test reply',
                    user: { id: 1, nickname: 'User1' },
                    comment: { id: 1, content: 'Comment 1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(replyRepository, 'createQueryBuilder').mockReturnValue({
                leftJoinAndSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockReplies),
            } as any);

            const result = await service.findAll({ commentId: 1 });

            expect(result).toEqual(mockReplies);
        });
    });

    describe('findOne', () => {
        it('should return a reply by id', async () => {
            const mockReply = {
                id: 1,
                content: 'Test reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Comment 1' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(replyRepository, 'findOne').mockResolvedValue(mockReply as unknown as Reply);

            const result = await service.findOne(1);

            expect(replyRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
                relations: ['user', 'comment'],
            });
            expect(result).toEqual(mockReply);
        });

        it('should throw NotFoundException when reply not found', async () => {
            jest.spyOn(replyRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow('Reply with ID 999 not found');
        });
    });

    describe('create', () => {
        it('should create a new reply', async () => {
            const createReplyDto = {
                content: 'New reply',
                commentId: 1,
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
                content: 'Test comment',
                user: { id: 2, nickname: 'User2' },
                post: { id: 1, title: 'Post 1' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const mockReply = {
                id: 1,
                content: 'New reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Test comment' },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(commentRepository, 'findOne').mockResolvedValue(mockComment as unknown as Comment);
            jest.spyOn(replyRepository, 'create').mockReturnValue(mockReply as unknown as Reply);
            jest.spyOn(replyRepository, 'save').mockResolvedValue(mockReply as unknown as Reply);
            jest.spyOn(service, 'findOne').mockResolvedValue(mockReply as unknown as Reply);

            const result = await service.create(createReplyDto, jwtUser);

            expect(commentRepository.findOne).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(replyRepository.create).toHaveBeenCalledWith({
                content: 'New reply',
                comment: { id: 1 },
                user: { id: 1 },
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
            expect(replyRepository.save).toHaveBeenCalledWith(mockReply);
            expect(result).toEqual(mockReply);
        });

        it('should throw NotFoundException when comment not found', async () => {
            const createReplyDto = {
                content: 'New reply',
                commentId: 999,
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(commentRepository, 'findOne').mockResolvedValue(null);

            await expect(service.create(createReplyDto, jwtUser)).rejects.toThrow(
                'Comment with ID 999 not found'
            );
        });
    });

    describe('update', () => {
        it('should update a reply', async () => {
            const updateReplyDto = {
                content: 'Updated reply',
            };

            const mockReply = {
                id: 1,
                content: 'Original reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Comment 1' },
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

            jest.spyOn(service, 'findOne').mockResolvedValue(mockReply as unknown as Reply);
            jest.spyOn(replyRepository, 'update').mockResolvedValue({ affected: 1 } as any);
            jest.spyOn(service, 'findOne').mockResolvedValue({
                ...mockReply,
                content: 'Updated reply',
            } as unknown as Reply);

            const result = await service.update(1, updateReplyDto, jwtUser);

            expect(replyRepository.update).toHaveBeenCalledWith(1, {
                content: 'Updated reply',
                updatedAt: expect.any(Date),
            });
            expect(result.content).toBe('Updated reply');
        });

        it('should throw BadRequestException when user is not the author', async () => {
            const updateReplyDto = {
                content: 'Updated reply',
            };

            const mockReply = {
                id: 1,
                content: 'Original reply',
                user: { id: 2, nickname: 'User2' }, // 다른 사용자
                comment: { id: 1, content: 'Comment 1' },
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

            jest.spyOn(service, 'findOne').mockResolvedValue(mockReply as unknown as Reply);

            await expect(service.update(1, updateReplyDto, jwtUser)).rejects.toThrow(
                'Only the reply author can update this reply'
            );
        });
    });

    describe('remove', () => {
        it('should delete a reply', async () => {
            const mockReply = {
                id: 1,
                content: 'Test reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Comment 1' },
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

            jest.spyOn(service, 'findOne').mockResolvedValue(mockReply as unknown as Reply);
            jest.spyOn(replyRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

            const result = await service.remove(1, jwtUser);

            expect(replyRepository.delete).toHaveBeenCalledWith(1);
            expect(result).toEqual({ affected: 1 });
        });

        it('should throw BadRequestException when user is not the author', async () => {
            const mockReply = {
                id: 1,
                content: 'Test reply',
                user: { id: 2, nickname: 'User2' }, // 다른 사용자
                comment: { id: 1, content: 'Comment 1' },
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

            jest.spyOn(service, 'findOne').mockResolvedValue(mockReply as unknown as Reply);

            await expect(service.remove(1, jwtUser)).rejects.toThrow(
                'Only the reply author can delete this reply'
            );
        });
    });

    describe('findByCommentId', () => {
        it('should return replies by comment id', async () => {
            const mockReplies = [
                {
                    id: 1,
                    content: 'Test reply 1',
                    user: { id: 1, nickname: 'User1' },
                    comment: { id: 1, content: 'Comment 1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: 2,
                    content: 'Test reply 2',
                    user: { id: 2, nickname: 'User2' },
                    comment: { id: 1, content: 'Comment 1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];

            jest.spyOn(replyRepository, 'find').mockResolvedValue(mockReplies as unknown as Reply[]);

            const result = await service.findByCommentId(1);

            expect(replyRepository.find).toHaveBeenCalledWith({
                where: { comment: { id: 1 } },
                relations: ['user'],
                order: { createdAt: 'ASC' },
            });
            expect(result).toEqual(mockReplies);
        });
    });
}); 