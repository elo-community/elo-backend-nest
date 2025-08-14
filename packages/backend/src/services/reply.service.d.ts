import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateReplyDto, ReplyQueryDto, UpdateReplyDto } from '../dtos/reply.dto';
import { Comment } from '../entities/comment.entity';
import { Reply } from '../entities/reply.entity';
export declare class ReplyService {
    private readonly replyRepository;
    private readonly commentRepository;
    constructor(replyRepository: Repository<Reply>, commentRepository: Repository<Comment>);
    findAll(query?: ReplyQueryDto): Promise<Reply[]>;
    findOne(id: number): Promise<Reply>;
    create(createReplyDto: CreateReplyDto, user: JwtUser): Promise<Reply>;
    update(id: number, updateReplyDto: UpdateReplyDto, user: JwtUser): Promise<Reply>;
    remove(id: number, user: JwtUser): Promise<import("typeorm").DeleteResult>;
    findByCommentId(commentId: number): Promise<Reply[]>;
}
