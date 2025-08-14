"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotPostsByCategoryDto = exports.HotPostResponseDto = exports.PostQueryDto = exports.UpdatePostDto = exports.CreatePostDto = void 0;
class CreatePostDto {
    title;
    content;
    author;
    sportCategoryId;
    type;
    isHidden;
}
exports.CreatePostDto = CreatePostDto;
class UpdatePostDto {
    title;
    content;
    type;
    isHidden;
    sportCategoryId;
}
exports.UpdatePostDto = UpdatePostDto;
class PostQueryDto {
    sport;
    page;
    limit;
}
exports.PostQueryDto = PostQueryDto;
class HotPostResponseDto {
    id;
    title;
    content;
    author;
    sportCategory;
    popularityScore;
    createdAt;
    viewCount;
    rank;
    selectionDate;
    isRewarded;
    constructor(post) {
        this.id = post.id;
        this.title = post.title;
        this.content = post.content;
        this.author = post.author;
        this.sportCategory = post.sportCategory;
        this.popularityScore = post.popularityScore;
        this.createdAt = post.createdAt;
        this.viewCount = post.viewCount;
        this.rank = post.rank;
        this.selectionDate = post.selectionDate;
        this.isRewarded = post.isRewarded;
    }
}
exports.HotPostResponseDto = HotPostResponseDto;
class HotPostsByCategoryDto {
    categoryId;
    categoryName;
    posts;
    constructor(categoryId, categoryName, posts) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.posts = posts.map(post => new HotPostResponseDto(post));
    }
}
exports.HotPostsByCategoryDto = HotPostsByCategoryDto;
//# sourceMappingURL=post.dto.js.map