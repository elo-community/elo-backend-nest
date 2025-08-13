import { S3Service } from 'src/services/s3.service';
import { TempImageService } from '../services/temp-image.service';
export declare class ImageController {
    private readonly s3Service;
    private readonly tempImageService;
    constructor(s3Service: S3Service, tempImageService: TempImageService);
    uploadImage(file: Express.Multer.File, req: any): Promise<{
        success: boolean;
        imageUrl: string;
        tempImageId: number;
    }>;
}
