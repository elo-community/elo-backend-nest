import { Repository } from 'typeorm';
import { CommentLike } from '../entities/comment-like.entity';
import { Comment } from '../entities/comment.entity';
export declare class CommentLikeService {
    private commentLikeRepository;
    private commentRepository;
    constructor(commentLikeRepository: Repository<CommentLike>, commentRepository: Repository<Comment>);
    createLike(commentId: number, userId: number): Promise<CommentLike>;
    getLikeCount(commentId: number): Promise<number>;
    findOne(commentId: number, userId: number): Promise<CommentLike | null>;
    updateLike(commentLike: CommentLike): Promise<CommentLike>;
    debugCommentLikes(commentId: number): Promise<CommentLike[]>;
}
