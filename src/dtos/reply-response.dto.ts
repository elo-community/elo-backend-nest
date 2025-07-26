import { Reply } from '../entities/reply.entity';
import { UserResponseDto } from './user-response.dto';

export class ReplyResponseDto {
    id!: number;
    content!: string;
    createdAt!: Date;
    updatedAt!: Date;
    user!: UserResponseDto;
    commentId!: number;

    constructor(reply: Reply) {
        this.id = reply.id;
        this.content = reply.content;
        this.createdAt = reply.createdAt;
        this.updatedAt = reply.updatedAt;
        this.user = new UserResponseDto(reply.user);
        this.commentId = reply.comment?.id;
    }
} 