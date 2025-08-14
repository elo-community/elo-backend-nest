"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMatchResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateMatchResultDto {
    sportCategoryId;
    partnerNickname;
    senderResult;
    isHandicap;
    playedAt;
}
exports.CreateMatchResultDto = CreateMatchResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sport category ID',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMatchResultDto.prototype, "sportCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Partner nickname (opponent)',
        example: 'tennis_pro',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMatchResultDto.prototype, "partnerNickname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Match result from sender\'s perspective',
        enum: ['win', 'lose', 'draw'],
        example: 'win',
    }),
    (0, class_validator_1.IsEnum)(['win', 'lose', 'draw']),
    __metadata("design:type", String)
], CreateMatchResultDto.prototype, "senderResult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the match has handicap',
        default: false,
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMatchResultDto.prototype, "isHandicap", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'When the match was played (ISO date string). If not provided, current time will be used.',
        example: '2025-08-10T14:00:00Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], CreateMatchResultDto.prototype, "playedAt", void 0);
//# sourceMappingURL=create-match-result.dto.js.map