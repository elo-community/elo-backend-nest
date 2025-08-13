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
var TempImageCleanupScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TempImageCleanupScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const temp_image_entity_1 = require("../entities/temp-image.entity");
const s3_service_1 = require("../services/s3.service");
let TempImageCleanupScheduler = TempImageCleanupScheduler_1 = class TempImageCleanupScheduler {
    tempImageRepository;
    s3Service;
    logger = new common_1.Logger(TempImageCleanupScheduler_1.name);
    constructor(tempImageRepository, s3Service) {
        this.tempImageRepository = tempImageRepository;
        this.s3Service = s3Service;
    }
    async cleanupOldTempImages() {
        this.logger.log('Starting cleanup of old temporary images...');
        try {
            const oneDayAgo = new Date();
            oneDayAgo.setDate(oneDayAgo.getDate() - 1);
            const oldTempImages = await this.tempImageRepository.find({
                where: {
                    createdAt: (0, typeorm_2.LessThan)(oneDayAgo),
                },
            });
            this.logger.log(`Found ${oldTempImages.length} old temporary images to cleanup`);
            for (const tempImage of oldTempImages) {
                try {
                    await this.s3Service.deleteImage(tempImage.imageUrl);
                    await this.tempImageRepository.remove(tempImage);
                    this.logger.log(`Cleaned up old temp image: ${tempImage.imageUrl}`);
                }
                catch (error) {
                    this.logger.error(`Failed to cleanup temp image: ${tempImage.imageUrl}`, error);
                }
            }
            this.logger.log('Temporary image cleanup completed');
        }
        catch (error) {
            this.logger.error('Failed to cleanup temporary images', error);
        }
    }
};
exports.TempImageCleanupScheduler = TempImageCleanupScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_2AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TempImageCleanupScheduler.prototype, "cleanupOldTempImages", null);
exports.TempImageCleanupScheduler = TempImageCleanupScheduler = TempImageCleanupScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(temp_image_entity_1.TempImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        s3_service_1.S3Service])
], TempImageCleanupScheduler);
//# sourceMappingURL=temp-image-cleanup.scheduler.js.map