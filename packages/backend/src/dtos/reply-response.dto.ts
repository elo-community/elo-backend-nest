import { Reply } from '../entities/reply.entity';
import { UserSimpleResponseDto } from './user-response.dto';

export class ReplyResponseDto {
  id!: number;
  content?: string;
  createdAt!: Date;
  updatedAt!: Date;
  user?: UserSimpleResponseDto;
  commentId!: number;

  constructor(reply: Reply) {
    this.id = reply.id;
    this.content = reply.content;
    this.createdAt = reply.createdAt;
    this.updatedAt = reply.updatedAt;
    this.user = reply.user ? new UserSimpleResponseDto(reply.user) : undefined;
    this.commentId = reply.comment?.id;
  }
}
