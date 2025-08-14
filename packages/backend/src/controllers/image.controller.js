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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const s3_service_1 = require("../services/s3.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const temp_image_service_1 = require("../services/temp-image.service");
let ImageController = class ImageController {
    s3Service;
    tempImageService;
    constructor(s3Service, tempImageService) {
        this.s3Service = s3Service;
        this.tempImageService = tempImageService;
    }
    async uploadImage(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('No image file provided');
        }
        if (!file.mimetype.startsWith('image/')) {
            throw new common_1.BadRequestException('File must be an image');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new common_1.BadRequestException('File size must be less than 5MB');
        }
        try {
            const imageUrl = await this.s3Service.uploadImage(file);
            const tempImage = await this.tempImageService.createTempImage(imageUrl, req.user.id);
            return {
                success: true,
                imageUrl,
                tempImageId: tempImage.id,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Failed to upload image');
        }
    }
};
exports.ImageController = ImageController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ImageController.prototype, "uploadImage", null);
exports.ImageController = ImageController = __decorate([
    (0, common_1.Controller)('images'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [s3_service_1.S3Service,
        temp_image_service_1.TempImageService])
], ImageController);
//# sourceMappingURL=image.controller.js.map