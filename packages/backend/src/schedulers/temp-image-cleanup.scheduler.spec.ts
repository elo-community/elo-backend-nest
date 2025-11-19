import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { awsConfig } from '../config/env.config';
import { TempImage } from '../entities/temp-image.entity';
import { User } from '../entities/user.entity';
import { S3Service } from '../services/s3.service';
import { TempImageCleanupScheduler } from './temp-image-cleanup.scheduler';

// 테스트 전에 환경변수 로드
const loadEnvFiles = () => {
  const possiblePaths = [
    join(process.cwd(), '..', '..'), // 루트 디렉토리
    join(process.cwd()), // 현재 디렉토리
  ];

  const envFiles = [
    '.env',
    `.env.${process.env.NETWORK || 'amoy'}.${process.env.NODE_ENV || 'local'}`,
    `.env.${process.env.NETWORK || 'amoy'}`,
    `.env.${process.env.NODE_ENV || 'local'}`,
  ];

  for (const basePath of possiblePaths) {
    for (const envFile of envFiles) {
      const envPath = join(basePath, envFile);
      if (existsSync(envPath)) {
        config({ path: envPath, override: true });
        console.log(`✅ 테스트 환경변수 로드: ${envPath}`);
        return;
      }
    }
  }
  console.warn('⚠️ 환경변수 파일을 찾을 수 없습니다. 기본값을 사용합니다.');
};

// 테스트 시작 전 환경변수 로드
loadEnvFiles();

describe('TempImageCleanupScheduler', () => {
  let scheduler: TempImageCleanupScheduler;
  let tempImageRepository: Repository<TempImage>;
  let s3Service: S3Service;
  let configService: ConfigService;

  const mockUser: User = {
    id: 1,
    walletUserId: 'test-user',
    walletAddress: '0x123',
    nickname: 'test',
    createdAt: new Date(),
    tokenAmount: 0,
    availableToken: 0,
    role: 'user',
    tutorialFirstPostCompleted: false,
    tutorialFirstMatchCompleted: false,
  } as User;

  const createMockTempImage = (
    id: number,
    secondsAgo: number,
    imageUrl?: string,
  ): TempImage => {
    // 환경변수에서 bucket 이름을 읽어서 실제 URL 생성
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'dummy-bucket';
    const region = process.env.AWS_REGION || 'ap-northeast-2';
    const finalImageUrl = imageUrl || `https://${bucketName}.s3.${region}.amazonaws.com/images/test${id}.jpg`;
    return {
      id,
      imageUrl: finalImageUrl,
      userId: id,
      createdAt: new Date(Date.now() - secondsAgo * 1000),
      user: mockUser,
    } as TempImage;
  };

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      remove: jest.fn(),
    };

    // S3Service mock 생성 (deleteImage는 Promise<void>를 반환하므로 undefined로 resolve)
    const mockS3Service = {
      deleteImage: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [awsConfig],
          ignoreEnvFile: false,
        }),
      ],
      providers: [
        TempImageCleanupScheduler,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: getRepositoryToken(TempImage),
          useValue: mockRepository,
        },
      ],
    }).compile();

    scheduler = module.get<TempImageCleanupScheduler>(TempImageCleanupScheduler);
    tempImageRepository = module.get(getRepositoryToken(TempImage));
    s3Service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanupOldTempImagesWithThreshold - 20초 기준 테스트', () => {
    it('20초 이상 된 임시 이미지를 정상적으로 정리해야 함', async () => {
      // Given: 20초 이상 전(25초 전), 20초 미만(10초 전) 이미지가 있음
      const oldImage = createMockTempImage(1, 25); // 25초 전 (20초 이상)
      const recentImage = createMockTempImage(2, 10); // 10초 전 (20초 미만)

      // 20초 이상 된 것만 반환되도록 모킹
      (tempImageRepository.find as jest.Mock).mockResolvedValue([oldImage]);
      (tempImageRepository.remove as jest.Mock).mockResolvedValue(oldImage);

      // When: 20초(20000ms) 기준으로 cleanup 실행
      await scheduler.cleanupOldTempImagesWithThreshold(20 * 1000);

      // Then: 20초 전 기준으로 조회했는지 확인
      expect(tempImageRepository.find).toHaveBeenCalledWith({
        where: {
          createdAt: expect.any(Object),
        },
      });

      // Then: S3에서 이미지 삭제가 호출되었는지 확인
      expect(s3Service.deleteImage).toHaveBeenCalledTimes(1);
      expect(s3Service.deleteImage).toHaveBeenCalledWith(oldImage.imageUrl);

      // Then: 레포지토리에서 제거가 호출되었는지 확인
      expect(tempImageRepository.remove).toHaveBeenCalledTimes(1);
      expect(tempImageRepository.remove).toHaveBeenCalledWith(oldImage);
    });

    it('20초 미만 이미지는 정리 대상이 아니어야 함', async () => {
      // Given: 20초 미만 이미지만 있음 (조회 결과가 빈 배열)
      (tempImageRepository.find as jest.Mock).mockResolvedValue([]);

      // When: 20초 기준으로 cleanup 실행
      await scheduler.cleanupOldTempImagesWithThreshold(20 * 1000);

      // Then: 조회만 하고 삭제는 하지 않음
      expect(tempImageRepository.find).toHaveBeenCalled();
      expect(s3Service.deleteImage).not.toHaveBeenCalled();
      expect(tempImageRepository.remove).not.toHaveBeenCalled();
    });

    it('여러 개의 오래된 이미지를 모두 정리해야 함', async () => {
      // Given: 20초 이상 된 이미지 3개
      const oldImage1 = createMockTempImage(1, 25); // 25초 전
      const oldImage2 = createMockTempImage(2, 30); // 30초 전
      const oldImage3 = createMockTempImage(3, 35); // 35초 전

      (tempImageRepository.find as jest.Mock).mockResolvedValue([oldImage1, oldImage2, oldImage3]);
      (tempImageRepository.remove as jest.Mock).mockImplementation((img: TempImage) => Promise.resolve(img));

      // When: 20초 기준으로 cleanup 실행
      await scheduler.cleanupOldTempImagesWithThreshold(20 * 1000);

      // Then: 모든 이미지가 처리됨
      expect(s3Service.deleteImage).toHaveBeenCalledTimes(3);
      expect(tempImageRepository.remove).toHaveBeenCalledTimes(3);
    });

    it('S3 삭제 실패 시에도 다음 이미지 처리를 계속해야 함', async () => {
      // Given: 2개의 오래된 이미지, 첫 번째 S3 삭제 실패
      const oldImage1 = createMockTempImage(1, 25);
      const oldImage2 = createMockTempImage(2, 30);

      (tempImageRepository.find as jest.Mock).mockResolvedValue([oldImage1, oldImage2]);
      (s3Service.deleteImage as jest.Mock)
        .mockRejectedValueOnce(new Error('S3 delete failed'))
        .mockResolvedValueOnce(undefined);
      (tempImageRepository.remove as jest.Mock).mockResolvedValue(oldImage2);

      // When: cleanup 실행
      await scheduler.cleanupOldTempImagesWithThreshold(20 * 1000);

      // Then: 첫 번째는 S3 삭제 실패로 제거되지 않음, 두 번째는 성공
      expect(s3Service.deleteImage).toHaveBeenCalledTimes(2);
      expect(tempImageRepository.remove).toHaveBeenCalledTimes(1);
      expect(tempImageRepository.remove).toHaveBeenCalledWith(oldImage2);
    });

    it('레포지토리 제거 실패 시에도 다음 이미지 처리를 계속해야 함', async () => {
      // Given: 2개의 오래된 이미지, 첫 번째 레포지토리 제거 실패
      const oldImage1 = createMockTempImage(1, 25);
      const oldImage2 = createMockTempImage(2, 30);

      (tempImageRepository.find as jest.Mock).mockResolvedValue([oldImage1, oldImage2]);
      (s3Service.deleteImage as jest.Mock).mockResolvedValue(undefined);
      (tempImageRepository.remove as jest.Mock)
        .mockRejectedValueOnce(new Error('Repository remove failed'))
        .mockResolvedValueOnce(oldImage2);

      // When: cleanup 실행
      await scheduler.cleanupOldTempImagesWithThreshold(20 * 1000);

      // Then: 두 번째 이미지까지 모두 시도함
      expect(s3Service.deleteImage).toHaveBeenCalledTimes(2);
      expect(tempImageRepository.remove).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupOldTempImages - 24시간 기준', () => {
    it('24시간 기준 메서드가 정상적으로 호출되어야 함', async () => {
      // Given
      const oldImage = createMockTempImage(1, 25 * 3600); // 25시간 전
      (tempImageRepository.find as jest.Mock).mockResolvedValue([oldImage]);
      (s3Service.deleteImage as jest.Mock).mockResolvedValue(undefined);
      (tempImageRepository.remove as jest.Mock).mockResolvedValue(oldImage);

      // When: 원래 메서드 호출 (내부적으로 24시간 기준 호출)
      await scheduler.cleanupOldTempImages();

      // Then: 24시간(86400000ms) 기준으로 호출됨
      expect(tempImageRepository.find).toHaveBeenCalled();
      expect(s3Service.deleteImage).toHaveBeenCalled();
      expect(tempImageRepository.remove).toHaveBeenCalled();
    });
  });
});
