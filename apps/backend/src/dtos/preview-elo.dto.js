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
exports.PreviewEloDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class PreviewEloDto {
    sportCategoryId;
    aId;
    bId;
    result;
    isHandicap;
}
exports.PreviewEloDto = PreviewEloDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Sport category ID',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PreviewEloDto.prototype, "sportCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Player A ID (reporter)',
        example: 10,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PreviewEloDto.prototype, "aId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Player B ID (opponent)',
        example: 22,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PreviewEloDto.prototype, "bId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Match result from A\'s perspective',
        enum: ['win', 'lose', 'draw'],
        example: 'lose',
    }),
    (0, class_validator_1.IsEnum)(['win', 'lose', 'draw']),
    __metadata("design:type", String)
], PreviewEloDto.prototype, "result", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Whether the match has handicap',
        default: false,
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PreviewEloDto.prototype, "isHandicap", void 0);
//# sourceMappingURL=preview-elo.dto.js.map