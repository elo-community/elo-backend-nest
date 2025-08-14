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
var TempImageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempImageService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const temp_image_entity_1 = require("../entities/temp-image.entity");
const s3_service_1 = require("./s3.service");
let TempImageService = TempImageService_1 = class TempImageService {
    tempImageRepository;
    s3Service;
    logger = new common_1.Logger(TempImageService_1.name);
    constructor(tempImageRepository, s3Service) {
        this.tempImageRepository = tempImageRepository;
        this.s3Service = s3Service;
    }
    async createTempImage(imageUrl, userId) {
        const tempImage = this.tempImageRepository.create({
            imageUrl,
            userId,
            createdAt: new Date(),
        });
        return this.tempImageRepository.save(tempImage);
    }
    async getTempImagesByUserId(userId) {
        return this.tempImageRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
    async deleteTempImage(id) {
        const tempImage = await this.tempImageRepository.findOne({ where: { id } });
        if (tempImage) {
            try {
                await this.s3Service.deleteImage(tempImage.imageUrl);
                await this.tempImageRepository.remove(tempImage);
                this.logger.log(`Temp image deleted: ${tempImage.imageUrl}`);
            }
            catch (error) {
                this.logger.error(`Failed to delete temp image: ${tempImage.imageUrl}`, error);
            }
        }
    }
    async deleteTempImagesByUserId(userId) {
        const tempImages = await this.getTempImagesByUserId(userId);
        for (const tempImage of tempImages) {
            await this.deleteTempImage(tempImage.id);
        }
    }
    async cleanupUnusedImages(usedImageUrls, userId) {
        const userTempImages = await this.getTempImagesByUserId(userId);
        for (const tempImage of userTempImages) {
            if (!usedImageUrls.includes(tempImage.imageUrl)) {
                await this.deleteTempImage(tempImage.id);
            }
        }
    }
    async markImageAsUsed(imageUrl, userId) {
        const tempImage = await this.tempImageRepository.findOne({
            where: { imageUrl, userId },
        });
        if (tempImage) {
            await this.tempImageRepository.remove(tempImage);
        }
    }
};
exports.TempImageService = TempImageService;
exports.TempImageService = TempImageService = TempImageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(temp_image_entity_1.TempImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], TempImageService);
//# sourceMappingURL=temp-image.service.js.map