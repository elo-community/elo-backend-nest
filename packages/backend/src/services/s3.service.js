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
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
let S3Service = S3Service_1 = class S3Service {
    configService;
    s3Client;
    bucketName;
    logger = new common_1.Logger(S3Service_1.name);
    constructor(configService) {
        this.configService = configService;
        const region = this.configService.get('s3.region');
        const accessKeyId = this.configService.get('s3.accessKeyId');
        const secretAccessKey = this.configService.get('s3.secretAccessKey');
        this.logger.log('=== S3 Configuration Debug ===');
        this.logger.log(`Region: ${region || 'NOT SET'}`);
        this.logger.log(`Access Key ID: ${accessKeyId ? 'SET' : 'NOT SET'}`);
        this.logger.log(`Secret Access Key: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
        this.logger.log('==============================');
        if (accessKeyId && accessKeyId !== 'your_aws_access_key_id' && secretAccessKey) {
            this.s3Client = new client_s3_1.S3Client({
                region: region || 'ap-northeast-2',
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            this.bucketName = this.configService.get('s3.bucketName') || 'dummy-bucket';
        }
        else {
            this.logger.warn('S3 client not initialized - using dummy mode');
            this.s3Client = null;
            this.bucketName = 'dummy-bucket';
        }
    }
    async uploadImage(file) {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `images/${(0, uuid_1.v4)()}.${fileExtension}`;
        if (!this.s3Client) {
            this.logger.warn('S3 client not available, returning dummy URL for development');
            return `https://dummy-bucket.s3.ap-northeast-2.amazonaws.com/${fileName}`;
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
        });
        try {
            await this.s3Client.send(command);
            const imageUrl = `https://${this.bucketName}.s3.${this.configService.get('s3.region')}.amazonaws.com/${fileName}`;
            this.logger.log(`Image uploaded successfully: ${imageUrl}`);
            return imageUrl;
        }
        catch (error) {
            this.logger.error('Failed to upload image to S3', error);
            throw new Error('Failed to upload image');
        }
    }
    async deleteImage(imageUrl) {
        if (!this.s3Client) {
            this.logger.warn('S3 client not available, skipping delete for development');
            return;
        }
        try {
            const key = this.extractKeyFromUrl(imageUrl);
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
            this.logger.log(`Image deleted successfully: ${imageUrl}`);
        }
        catch (error) {
            this.logger.error('Failed to delete image from S3', error);
            throw new Error('Failed to delete image');
        }
    }
    extractKeyFromUrl(url) {
        const bucketName = this.bucketName;
        const region = this.configService.get('s3.region');
        const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;
        if (url.startsWith(prefix)) {
            return url.substring(prefix.length);
        }
        throw new Error('Invalid S3 URL format');
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map