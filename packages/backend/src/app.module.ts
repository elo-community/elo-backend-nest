import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import blockchainConfig from './config/blockchain.config';
import s3Config from './config/s3.config';
import { AuthController } from './controllers/auth.controller';
import { CommentLikesController } from './controllers/comment-likes.controller';
import { CommentsController } from './controllers/comments.controller';
import { ImageController } from './controllers/image.controller';
import { MatchResultsController, UserMatchesController } from './controllers/match-results.controller';
import { PostHatesController } from './controllers/post-hates.controller';
import { PostLikesController } from './controllers/post-likes.controller';
import { PostsController } from './controllers/posts.controller';
import { RepliesController } from './controllers/replies.controller';
import { SportCategoriesController } from './controllers/sport-categories.controller';
import { SseController } from './controllers/sse.controller';
import { UsersController } from './controllers/users.controller';
import { EloModule } from './elo/elo.module';
import { EloService } from './elo/elo.service';
import { CommentLike } from './entities/comment-like.entity';
import { Comment } from './entities/comment.entity';
import { HotPost } from './entities/hot-post.entity';
import { MatchResultHistory } from './entities/match-result-history.entity';
import { MatchResult } from './entities/match-result.entity';
import { PostHate } from './entities/post-hate.entity';
import { PostLike } from './entities/post-like.entity';
import { Post } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { SportCategory } from './entities/sport-category.entity';
import { TempImage } from './entities/temp-image.entity';
import { UserElo } from './entities/user-elo.entity';
import { User } from './entities/user.entity';
import { RewardsController } from './rewards/rewards.controller';
import { RewardsModule } from './rewards/rewards.module';
import { SseController as RewardsSseController } from './rewards/sse.controller';
import { HotPostsScheduler } from './schedulers/hot-posts.scheduler';
import { MatchResultScheduler } from './schedulers/match-result.scheduler';
import { RealTimeHotPostsScheduler } from './schedulers/real-time-hot-posts.scheduler';
import { TempImageCleanupScheduler } from './schedulers/temp-image-cleanup.scheduler';
import { CommentLikeService } from './services/comment-like.service';
import { CommentService } from './services/comment.service';
import { MatchResultService } from './services/match-result.service';
import { PostHateService } from './services/post-hate.service';
import { PostLikeService } from './services/post-like.service';
import { PostService } from './services/post.service';
import { ReplyService } from './services/reply.service';
import { S3Service } from './services/s3.service';
import { SportCategoryService } from './services/sport-category.service';
import { SseService } from './services/sse.service';
import { TempImageService } from './services/temp-image.service';
import { UserService } from './services/user.service';

// NOTE: 앞으로 생성할 컨트롤러/라우트는 모두 복수형으로 작성 (예: users, posts, comments, auths)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      load: [s3Config, blockchainConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'elo-community',
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([
      User, Post, Comment, Reply, SportCategory, PostLike, PostHate, CommentLike, UserElo, MatchResult, MatchResultHistory, TempImage, HotPost
    ]),
    AuthModule,
    EloModule,
    BlockchainModule,
    RewardsModule,
  ],
  controllers: [
    AuthController, UsersController, PostsController, CommentsController, RepliesController, SportCategoriesController, PostLikesController, PostHatesController, CommentLikesController, MatchResultsController, UserMatchesController, ImageController, SseController, RewardsSseController, RewardsController
  ],
  providers: [
    UserService, PostService, CommentService, ReplyService, SportCategoryService, PostLikeService, PostHateService, CommentLikeService, MatchResultService, MatchResultScheduler, S3Service, SseService, TempImageService, TempImageCleanupScheduler, EloService, HotPostsScheduler, RealTimeHotPostsScheduler
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly sportCategoryService: SportCategoryService,
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly matchResultService: MatchResultService,
  ) { }

  async onModuleInit() {
    // 기본 스포츠 카테고리 생성
    await this.sportCategoryService.createDefaultCategories();
    console.log('✅ 기본 스포츠 카테고리가 생성되었습니다.');

    // 샘플 사용자들 생성
    const sampleUsers = await this.createSampleUsers();
    console.log('✅ 샘플 사용자들이 생성되었습니다.');

    // 각 카테고리별 샘플 게시글 생성
    await this.createSamplePosts(sampleUsers.mainUser);
    console.log('✅ 샘플 게시글이 생성되었습니다.');

    // 샘플 매치 요청 생성
    await this.createSampleMatchRequests(sampleUsers);
    console.log('✅ 샘플 매치 요청이 생성되었습니다.');
  }

  private async createSampleUsers() {
    // 기존 샘플 사용자가 있는지 확인
    let mainUser = await this.userService.findByWalletAddress('sample-user-wallet');
    let tableTennisUser = await this.userService.findByWalletAddress('table-tennis-user-wallet');

    const categories = await this.sportCategoryService.findAll();

    if (!mainUser) {
      mainUser = await this.userService.createWithDefaultElos({
        walletUserId: 'sample-user',
        walletAddress: 'sample-user-wallet',
        nickname: '샘플유저',
        email: 'sample@example.com',
      }, categories);
    }

    if (!tableTennisUser) {
      tableTennisUser = await this.userService.createWithDefaultElos({
        walletUserId: 'table-tennis-user',
        walletAddress: 'table-tennis-user-wallet',
        nickname: '탁구왕민수',
        email: 'tabletennis@example.com',
      }, categories);
    }

    return {
      mainUser,
      tableTennisUser
    };
  }

  private async createSampleMatchRequests(sampleUsers: any) {
    // 기존 매치 요청이 있는지 확인
    const existingRequests = await this.matchResultService.findSentRequests({
      id: sampleUsers.mainUser.id,
      nickname: sampleUsers.mainUser.nickname
    } as any);

    if (existingRequests.length > 0) {
      console.log('이미 매치 요청이 존재합니다. 샘플 매치 요청 생성을 건너뜁니다.');
      return;
    }

    const categories = await this.sportCategoryService.findAll();
    const tableTennisCategory = categories.find(cat => cat.name === '탁구');

    if (tableTennisCategory) {
      // 샘플유저가 탁구왕민수에게 보낸 매치 요청 생성
      // 샘플유저의 JWT 정보를 올바르게 전달
      const sampleUserJwt = {
        id: sampleUsers.mainUser.id,
        nickname: sampleUsers.mainUser.nickname,
        email: sampleUsers.mainUser.email,
        walletUserId: sampleUsers.mainUser.walletUserId,
        walletAddress: sampleUsers.mainUser.walletAddress,
        tokenAmount: sampleUsers.mainUser.tokenAmount,
        availableToken: sampleUsers.mainUser.availableToken,
        createdAt: sampleUsers.mainUser.createdAt
      };

      await this.matchResultService.create({
        partnerNickname: '탁구왕민수',
        sportCategoryId: tableTennisCategory.id,
        senderResult: 'win',
        isHandicap: false,
        playedAt: new Date() // 현재 시간으로 설정
      }, sampleUserJwt);

      console.log('샘플 매치 요청이 생성되었습니다: 샘플유저 → 탁구왕민수');
    }
  }

  private async createSamplePosts(user: any) {
    // 기존 게시글이 있는지 확인
    const existingPosts = await this.postService.findAll();
    if (existingPosts.data.length > 0) {
      console.log('이미 게시글이 존재합니다. 샘플 게시글 생성을 건너뜁니다.');
      return;
    }

    const categories = await this.sportCategoryService.findAll();
    const samplePosts = [
      // 자유글
      { title: '안녕하세요!', content: '처음 가입했습니다. 반갑습니다!', categoryName: '자유글', type: '일반' },
      { title: '오늘 날씨가 좋네요', content: '산책하기 좋은 날씨입니다.', categoryName: '자유글', type: '일반' },

      // 테니스
      { title: '테니스 레슨 후기', content: '오늘 테니스 레슨 받았는데 정말 재미있었어요!', categoryName: '테니스', type: '일반' },
      { title: '테니스 라켓 추천', content: '초보자용 테니스 라켓 추천해주세요.', categoryName: '테니스', type: '일반' },

      // 배드민턴
      { title: '배드민턴 동호회 모집', content: '배드민턴 동호회에 가입하고 싶습니다.', categoryName: '배드민턴', type: '일반' },
      { title: '배드민턴 기술 팁', content: '배드민턴 서브 기술을 연마하고 있습니다.', categoryName: '배드민턴', type: '일반' },

      // 탁구
      { title: '탁구 대회 정보', content: '다음 달에 탁구 대회가 열린다고 하네요.', categoryName: '탁구', type: '일반' },
      { title: '탁구 연습 방법', content: '탁구 연습을 위한 좋은 방법이 있을까요?', categoryName: '탁구', type: '일반' },

      // 당구
      { title: '당구장 추천', content: '좋은 당구장 추천해주세요.', categoryName: '당구', type: '일반' },
      { title: '당구 기술 연습', content: '당구 기술을 연마하고 있습니다.', categoryName: '당구', type: '일반' },

      // 바둑
      { title: '바둑 동호회', content: '바둑 동호회에 가입하고 싶습니다.', categoryName: '바둑', type: '일반' },
      { title: '바둑 기보 공유', content: '재미있는 바둑 기보를 공유합니다.', categoryName: '바둑', type: '일반' },

      // 체스
      { title: '체스 대회 정보', content: '체스 대회가 열린다고 하네요.', categoryName: '체스', type: '일반' },
      { title: '체스 전략', content: '체스 전략에 대해 이야기해보세요.', categoryName: '체스', type: '일반' },

      // 공지사항
      { title: '커뮤니티 이용 안내', content: '커뮤니티 이용 시 주의사항을 확인해주세요.', categoryName: '공지사항', type: '일반' },
      { title: '새로운 기능 안내', content: '새로운 기능이 추가되었습니다.', categoryName: '공지사항', type: '일반' },
    ];

    for (const postData of samplePosts) {
      const category = categories.find(cat => cat.name === postData.categoryName);
      if (category) {
        await this.postService.create({
          title: postData.title,
          content: postData.content,
          sportCategoryId: category.id,
          type: postData.type,
        }, user);
      }
    }
  }
}
