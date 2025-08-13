import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { Comment } from '../entities/comment.entity';
import { CommentLikeService } from './comment-like.service';
export declare class CommentService {
    private readonly commentRepository;
    private readonly commentLikeService;
    constructor(commentRepository: Repository<Comment>, commentLikeService: CommentLikeService);
    findAll(query?: CommentQueryDto): Promise<Comment[]>;
    findOne(id: number): Promise<{
        comment: Comment;
    }>;
    create(createCommentDto: CreateCommentDto, user: JwtUser): Promise<{
        comment: Comment;
    }>;
    update(id: number, updateCommentDto: UpdateCommentDto, user: JwtUser): Promise<{
        comment: Comment;
    }>;
    remove(id: number, user: JwtUser): Promise<import("typeorm").DeleteResult | {
        affected: number;
    }>;
    findByPostId(postId: string | number): Promise<Comment[]>;
    getCommentTree(postId: number): Promise<Comment[]>;
}
