import {
    BadRequestException,
    Controller,
    Post,
    Request,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { S3Service } from 'src/services/s3.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TempImageService } from '../services/temp-image.service';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImageController {
    constructor(
        private readonly s3Service: S3Service,
        private readonly tempImageService: TempImageService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('image', {
        storage: memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
    }))
    async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('No image file provided');
        }

        // 파일 타입 검증
        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestException('File must be an image');
        }

        // 파일 크기 검증 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            throw new BadRequestException('File size must be less than 5MB');
        }

        try {
            // S3에 이미지 업로드
            const imageUrl = await this.s3Service.uploadImage(file);

            // 임시 이미지로 저장
            const tempImage = await this.tempImageService.createTempImage(
                imageUrl,
                req.user.id,
            );

            return {
                success: true,
                imageUrl,
                tempImageId: tempImage.id,
            };
        } catch (error) {
            throw new BadRequestException('Failed to upload image');
        }
    }
} 