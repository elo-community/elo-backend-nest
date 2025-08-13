import { Repository } from 'typeorm';
import { TempImage } from '../entities/temp-image.entity';
import { S3Service } from './s3.service';
export declare class TempImageService {
    private readonly tempImageRepository;
    private readonly s3Service;
    private readonly logger;
    constructor(tempImageRepository: Repository<TempImage>, s3Service: S3Service);
    createTempImage(imageUrl: string, userId: number): Promise<TempImage>;
    getTempImagesByUserId(userId: number): Promise<TempImage[]>;
    deleteTempImage(id: number): Promise<void>;
    deleteTempImagesByUserId(userId: number): Promise<void>;
    cleanupUnusedImages(usedImageUrls: string[], userId: number): Promise<void>;
    markImageAsUsed(imageUrl: string, userId: number): Promise<void>;
}
