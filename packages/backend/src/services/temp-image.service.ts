import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TempImage } from '../entities/temp-image.entity';
import { S3Service } from './s3.service';

@Injectable()
export class TempImageService {
  private readonly logger = new Logger(TempImageService.name);

  constructor(
    @InjectRepository(TempImage)
    private readonly tempImageRepository: Repository<TempImage>,
    private readonly s3Service: S3Service,
  ) {}

  async createTempImage(imageUrl: string, userId: number): Promise<TempImage> {
    const tempImage = this.tempImageRepository.create({
      imageUrl,
      userId,
      createdAt: new Date(),
    });

    return this.tempImageRepository.save(tempImage);
  }

  async getTempImagesByUserId(userId: number): Promise<TempImage[]> {
    return this.tempImageRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteTempImage(id: number): Promise<void> {
    const tempImage = await this.tempImageRepository.findOne({ where: { id } });
    if (tempImage) {
      try {
        await this.s3Service.deleteImage(tempImage.imageUrl);
        await this.tempImageRepository.remove(tempImage);
        this.logger.log(`Temp image deleted: ${tempImage.imageUrl}`);
      } catch (error) {
        this.logger.error(`Failed to delete temp image: ${tempImage.imageUrl}`, error);
      }
    }
  }

  async deleteTempImagesByUserId(userId: number): Promise<void> {
    const tempImages = await this.getTempImagesByUserId(userId);

    for (const tempImage of tempImages) {
      await this.deleteTempImage(tempImage.id);
    }
  }

  async cleanupUnusedImages(usedImageUrls: string[], userId: number): Promise<void> {
    const userTempImages = await this.getTempImagesByUserId(userId);

    for (const tempImage of userTempImages) {
      if (!usedImageUrls.includes(tempImage.imageUrl)) {
        await this.deleteTempImage(tempImage.id);
      }
    }
  }

  async markImageAsUsed(imageUrl: string, userId: number): Promise<void> {
    const tempImage = await this.tempImageRepository.findOne({
      where: { imageUrl, userId },
    });

    if (tempImage) {
      await this.tempImageRepository.remove(tempImage);
    }
  }
}
