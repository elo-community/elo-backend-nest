"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentResponseDto = void 0;
const reply_response_dto_1 = require("./reply-response.dto");
const user_response_dto_1 = require("./user-response.dto");
class CommentResponseDto {
    id;
    content;
    createdAt;
    updatedAt;
    user;
    postId;
    replies;
    likeCount;
    isLiked;
    constructor(comment, userId) {
        this.id = comment.id;
        this.content = comment.content;
        this.createdAt = comment.createdAt;
        this.updatedAt = comment.updatedAt;
        this.user = comment.user ? new user_response_dto_1.UserSimpleResponseDto(comment.user) : undefined;
        this.postId = comment.post?.id;
        this.likeCount = comment.likes?.length || 0;
        if (userId && comment.likes) {
            this.isLiked = comment.likes.some(like => like.user?.id === userId && like.isLiked === true);
        }
        else {
            this.isLiked = false;
        }
        if (comment.replies && comment.replies.length > 0) {
            this.replies = comment.replies.map(reply => new reply_response_dto_1.ReplyResponseDto(reply));
        }
        else {
            this.replies = [];
        }
    }
}
exports.CommentResponseDto = CommentResponseDto;
//# sourceMappingURL=comment-response.dto.js.map