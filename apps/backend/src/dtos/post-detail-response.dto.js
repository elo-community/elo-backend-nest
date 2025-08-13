"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostDetailResponseDto = void 0;
const comment_response_dto_1 = require("./comment-response.dto");
const user_response_dto_1 = require("./user-response.dto");
class PostDetailResponseDto {
    id;
    title;
    content;
    type;
    isHidden;
    viewCount;
    commentCount;
    createdAt;
    updatedAt;
    author;
    sportCategoryId;
    sportCategoryName;
    comments;
    isLiked;
    isHated;
    likeCount;
    hateCount;
    imageUrls;
    constructor(post, isLiked, isHated, likeCount, hateCount, userId) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.type = post.type;
        this.isHidden = post.isHidden;
        this.viewCount = post.viewCount;
        this.commentCount = post.comments?.length || 0;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;
        this.author = new user_response_dto_1.UserSimpleResponseDto(post.author);
        this.sportCategoryId = post.sportCategory?.id;
        this.sportCategoryName = post.sportCategory?.name;
        this.isLiked = isLiked;
        this.isHated = isHated;
        this.likeCount = likeCount || 0;
        this.hateCount = hateCount || 0;
        this.imageUrls = post.imageUrls;
        if (post.comments && post.comments.length > 0) {
            this.comments = post.comments.map(comment => new comment_response_dto_1.CommentResponseDto(comment, userId));
        }
        else {
            this.comments = [];
        }
    }
}
exports.PostDetailResponseDto = PostDetailResponseDto;
//# sourceMappingURL=post-detail-response.dto.js.map