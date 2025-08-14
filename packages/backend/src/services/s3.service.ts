import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;
    private readonly logger = new Logger(S3Service.name);

    constructor(private configService: ConfigService) {
        const region = this.configService.get<string>('aws.region');
        const accessKeyId = this.configService.get<string>('aws.accessKeyId');
        const secretAccessKey = this.configService.get<string>('aws.secretAccessKey');

        // 개발 환경에서는 S3 클라이언트를 생성하지 않음
        this.logger.log('=== S3 Configuration Debug ===');
        this.logger.log(`Region: ${region || 'NOT SET'}`);
        this.logger.log(`Access Key ID: ${accessKeyId ? 'SET' : 'NOT SET'}`);
        this.logger.log(`Secret Access Key: ${secretAccessKey ? 'SET' : 'NOT SET'}`);
        this.logger.log('==============================');

        // 실제 AWS 인증 정보가 있을 때만 S3 클라이언트 생성
        if (accessKeyId && accessKeyId !== 'your_aws_access_key_id' && secretAccessKey) {
            this.s3Client = new S3Client({
                region: region || 'ap-northeast-2',
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                },
            });
            this.bucketName = this.configService.get<string>('aws.s3BucketName') || 'dummy-bucket';
        } else {
            this.logger.warn('S3 client not initialized - using dummy mode');
            this.s3Client = null as any;
            this.bucketName = 'dummy-bucket';
        }
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `images/${uuidv4()}.${fileExtension}`;

        // S3 클라이언트가 없으면 더미 URL 반환
        if (!this.s3Client) {
            this.logger.warn('S3 client not available, returning dummy URL for development');
            return `https://dummy-bucket.s3.ap-northeast-2.amazonaws.com/${fileName}`;
        }

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL 제거 - 버킷 정책으로 권한 관리
        });

        try {
            await this.s3Client.send(command);
            const imageUrl = `https://${this.bucketName}.s3.${this.configService.get('s3.region')}.amazonaws.com/${fileName}`;
            this.logger.log(`Image uploaded successfully: ${imageUrl}`);
            return imageUrl;
        } catch (error) {
            this.logger.error('Failed to upload image to S3', error);
            throw new Error('Failed to upload image');
        }
    }

    async deleteImage(imageUrl: string): Promise<void> {
        // S3 클라이언트가 없으면 삭제 건너뛰기
        if (!this.s3Client) {
            this.logger.warn('S3 client not available, skipping delete for development');
            return;
        }

        try {
            const key = this.extractKeyFromUrl(imageUrl);
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            await this.s3Client.send(command);
            this.logger.log(`Image deleted successfully: ${imageUrl}`);
        } catch (error) {
            this.logger.error('Failed to delete image from S3', error);
            throw new Error('Failed to delete image');
        }
    }

    private extractKeyFromUrl(url: string): string {
        const bucketName = this.bucketName;
        const region = this.configService.get('aws.region');
        const prefix = `https://${bucketName}.s3.${region}.amazonaws.com/`;

        if (url.startsWith(prefix)) {
            return url.substring(prefix.length);
        }

        throw new Error('Invalid S3 URL format');
    }
} 