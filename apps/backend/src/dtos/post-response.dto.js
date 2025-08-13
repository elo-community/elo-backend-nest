"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostResponseDto = void 0;
const user_response_dto_1 = require("./user-response.dto");
class PostResponseDto {
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
    isLiked;
    isHated;
    likeCount;
    hateCount;
    imageUrls;
    constructor(post, isLiked, isHated, likeCount, hateCount) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.type = post.type;
        this.isHidden = post.isHidden;
        this.viewCount = post.viewCount;
        this.commentCount = post.comments?.length || 0;
        this.createdAt = post.createdAt;
        this.updatedAt = post.updatedAt;
        this.author = post.author ? new user_response_dto_1.UserSimpleResponseDto(post.author) : undefined;
        this.sportCategoryId = post.sportCategory?.id;
        this.sportCategoryName = post.sportCategory?.name;
        this.isLiked = isLiked;
        this.isHated = isHated;
        this.likeCount = likeCount || post.likes?.filter(like => like.isLiked === true).length || 0;
        this.hateCount = hateCount || post.hates?.filter(hate => hate.isHated === true).length || 0;
        this.imageUrls = post.imageUrls;
    }
}
exports.PostResponseDto = PostResponseDto;
//# sourceMappingURL=post-response.dto.js.map