"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplyResponseDto = void 0;
const user_response_dto_1 = require("./user-response.dto");
class ReplyResponseDto {
    id;
    content;
    createdAt;
    updatedAt;
    user;
    commentId;
    constructor(reply) {
        this.id = reply.id;
        this.content = reply.content;
        this.createdAt = reply.createdAt;
        this.updatedAt = reply.updatedAt;
        this.user = reply.user ? new user_response_dto_1.UserSimpleResponseDto(reply.user) : undefined;
        this.commentId = reply.comment?.id;
    }
}
exports.ReplyResponseDto = ReplyResponseDto;
//# sourceMappingURL=reply-response.dto.js.map