import { JwtUser } from '../auth/jwt-user.interface';
import { ReplyResponseDto } from '../dtos/reply-response.dto';
import { CreateReplyDto, ReplyQueryDto, UpdateReplyDto } from '../dtos/reply.dto';
import { ReplyService } from '../services/reply.service';
export declare class RepliesController {
    private readonly replyService;
    constructor(replyService: ReplyService);
    findAll(query: ReplyQueryDto): Promise<{
        success: boolean;
        data: ReplyResponseDto[];
        message: string;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        data: ReplyResponseDto;
        message: string;
    }>;
    create(createReplyDto: CreateReplyDto, user: JwtUser): Promise<{
        success: boolean;
        data: ReplyResponseDto;
        message: string;
    }>;
    update(id: number, updateReplyDto: UpdateReplyDto, user: JwtUser): Promise<{
        success: boolean;
        data: ReplyResponseDto;
        message: string;
    }>;
    remove(id: number, user: JwtUser): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
        message: string;
    }>;
    findByCommentId(commentId: number): Promise<{
        success: boolean;
        data: ReplyResponseDto[];
        message: string;
    }>;
}
