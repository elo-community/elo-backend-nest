import { Repository } from 'typeorm';
import { TempImage } from '../entities/temp-image.entity';
import { S3Service } from '../services/s3.service';
export declare class TempImageCleanupScheduler {
    private readonly tempImageRepository;
    private readonly s3Service;
    private readonly logger;
    constructor(tempImageRepository: Repository<TempImage>, s3Service: S3Service);
    cleanupOldTempImages(): Promise<void>;
}
