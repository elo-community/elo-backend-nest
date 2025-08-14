import { Reply } from '../entities/reply.entity';
import { UserSimpleResponseDto } from './user-response.dto';
export declare class ReplyResponseDto {
    id: number;
    content?: string;
    createdAt: Date;
    updatedAt: Date;
    user?: UserSimpleResponseDto;
    commentId: number;
    constructor(reply: Reply);
}
