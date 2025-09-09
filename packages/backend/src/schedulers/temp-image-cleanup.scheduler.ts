import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TempImage } from '../entities/temp-image.entity';
import { S3Service } from '../services/s3.service';

@Injectable()
export class TempImageCleanupScheduler {
  private readonly logger = new Logger(TempImageCleanupScheduler.name);

  constructor(
    @InjectRepository(TempImage)
    private readonly tempImageRepository: Repository<TempImage>,
    private readonly s3Service: S3Service,
  ) {}

  // 매일 새벽 2시에 24시간 이상 된 임시 이미지 정리
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupOldTempImages() {
    this.logger.log('Starting cleanup of old temporary images...');

    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const oldTempImages = await this.tempImageRepository.find({
        where: {
          createdAt: LessThan(oneDayAgo),
        },
      });

      this.logger.log(`Found ${oldTempImages.length} old temporary images to cleanup`);

      for (const tempImage of oldTempImages) {
        try {
          await this.s3Service.deleteImage(tempImage.imageUrl);
          await this.tempImageRepository.remove(tempImage);
          this.logger.log(`Cleaned up old temp image: ${tempImage.imageUrl}`);
        } catch (error) {
          this.logger.error(`Failed to cleanup temp image: ${tempImage.imageUrl}`, error);
        }
      }

      this.logger.log('Temporary image cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup temporary images', error);
    }
  }
}
