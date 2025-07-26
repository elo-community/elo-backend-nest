import { Test, TestingModule } from '@nestjs/testing';
import { JwtUser } from '../auth/jwt-user.interface';
import { ReplyService } from '../services/reply.service';
import { RepliesController } from './replies.controller';

describe('RepliesController', () => {
    let controller: RepliesController;
    let replyService: ReplyService;

    const mockReplyService = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        findByCommentId: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RepliesController],
            providers: [
                {
                    provide: ReplyService,
                    useValue: mockReplyService,
                },
            ],
        }).compile();

        controller = module.get<RepliesController>(RepliesController);
        replyService = module.get<ReplyService>(ReplyService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all replies', async () => {
            const mockReplies = [
                {
                    id: 1,
                    content: 'Test reply 1',
                    user: { id: 1, nickname: 'User1' },
                    comment: { id: 1, content: 'Comment 1' },
                },
                {
                    id: 2,
                    content: 'Test reply 2',
                    user: { id: 2, nickname: 'User2' },
                    comment: { id: 2, content: 'Comment 2' },
                },
            ];

            jest.spyOn(replyService, 'findAll').mockResolvedValue(mockReplies as any);

            const result = await controller.findAll({});

            expect(replyService.findAll).toHaveBeenCalledWith({});
            expect(result).toEqual(mockReplies);
        });

        it('should filter replies by commentId', async () => {
            const mockReplies = [
                {
                    id: 1,
                    content: 'Test reply',
                    user: { id: 1, nickname: 'User1' },
                    comment: { id: 1, content: 'Comment 1' },
                },
            ];

            jest.spyOn(replyService, 'findAll').mockResolvedValue(mockReplies as any);

            const result = await controller.findAll({ commentId: 1 });

            expect(replyService.findAll).toHaveBeenCalledWith({ commentId: 1 });
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
            };

            jest.spyOn(replyService, 'findOne').mockResolvedValue(mockReply as any);

            const result = await controller.findOne(1);

            expect(replyService.findOne).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockReply);
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

            const mockReply = {
                id: 1,
                content: 'New reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Test comment' },
            };

            jest.spyOn(replyService, 'create').mockResolvedValue(mockReply as any);

            const result = await controller.create(createReplyDto, jwtUser);

            expect(replyService.create).toHaveBeenCalledWith(createReplyDto, jwtUser);
            expect(result).toEqual(mockReply);
        });
    });

    describe('update', () => {
        it('should update a reply', async () => {
            const updateReplyDto = {
                content: 'Updated reply',
            };

            const mockReply = {
                id: 1,
                content: 'Updated reply',
                user: { id: 1, nickname: 'User1' },
                comment: { id: 1, content: 'Comment 1' },
            };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(replyService, 'update').mockResolvedValue(mockReply as any);

            const result = await controller.update(1, updateReplyDto, jwtUser);

            expect(replyService.update).toHaveBeenCalledWith(1, updateReplyDto, jwtUser);
            expect(result).toEqual(mockReply);
        });
    });

    describe('remove', () => {
        it('should delete a reply', async () => {
            const mockResult = { affected: 1 };

            const jwtUser: JwtUser = {
                id: 1,
                email: 'test@example.com',
                walletUserId: 'user123',
                tokenAmount: 1000,
                availableToken: 500,
                createdAt: new Date(),
            };

            jest.spyOn(replyService, 'remove').mockResolvedValue(mockResult as any);

            const result = await controller.remove(1, jwtUser);

            expect(replyService.remove).toHaveBeenCalledWith(1, jwtUser);
            expect(result).toEqual(mockResult);
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
                },
                {
                    id: 2,
                    content: 'Test reply 2',
                    user: { id: 2, nickname: 'User2' },
                    comment: { id: 1, content: 'Comment 1' },
                },
            ];

            jest.spyOn(replyService, 'findByCommentId').mockResolvedValue(mockReplies as any);

            const result = await controller.findByCommentId(1);

            expect(replyService.findByCommentId).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockReplies);
        });
    });
}); 