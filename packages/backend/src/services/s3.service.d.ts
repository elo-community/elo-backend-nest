import { ConfigService } from '@nestjs/config';
export declare class S3Service {
    private configService;
    private readonly s3Client;
    private readonly bucketName;
    private readonly logger;
    constructor(configService: ConfigService);
    uploadImage(file: Express.Multer.File): Promise<string>;
    deleteImage(imageUrl: string): Promise<void>;
    private extractKeyFromUrl;
}
