import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import {
  appConfig,
  awsConfig,
  blockchainConfig,
  databaseConfig,
  jwtConfig,
} from './config/env.config';
import { AuthController } from './controllers/auth.controller';
import { CommentLikesController } from './controllers/comment-likes.controller';
import { CommentsController } from './controllers/comments.controller';
import { HealthController } from './controllers/health.controller';
import { HotPostRewardController } from './controllers/hot-post-reward.controller';
import { ImageController } from './controllers/image.controller';
import { MatchPostController } from './controllers/match-post.controller';
import {
  MatchResultsController,
  UserMatchesController,
} from './controllers/match-results.controller';
import { PostHatesController } from './controllers/post-hates.controller';
import { PostLikeSignatureController } from './controllers/post-like-signature.controller';
import { PostLikesController } from './controllers/post-likes.controller';
import { PostsController } from './controllers/posts.controller';
import { RepliesController } from './controllers/replies.controller';
import { SportCategoriesController } from './controllers/sport-categories.controller';
import { SseController } from './controllers/sse.controller';
import { TokenAccumulationController } from './controllers/token-accumulation.controller';
import { TokenTransactionsController } from './controllers/token-transactions.controller';
import { TrivusExpController } from './controllers/trivus-exp.controller';
import { UsersController } from './controllers/users.controller';
import { EloModule } from './elo/elo.module';
import { EloService } from './elo/elo.service';
import { ClaimNonce } from './entities/claim-nonce.entity';
import { ClaimRequest } from './entities/claim-request.entity';
import { CommentLike } from './entities/comment-like.entity';
import { Comment } from './entities/comment.entity';
import { HotPostReward } from './entities/hot-post-reward.entity';
import { HotPost } from './entities/hot-post.entity';
import { MatchRequest } from './entities/match-request.entity';
import { MatchResultHistory } from './entities/match-result-history.entity';
import { MatchResult } from './entities/match-result.entity';
import { PostHate } from './entities/post-hate.entity';
import { PostLike } from './entities/post-like.entity';
import { Post, PostType } from './entities/post.entity';
import { Reply } from './entities/reply.entity';
import { SportCategory } from './entities/sport-category.entity';
import { TempImage } from './entities/temp-image.entity';
import { TokenAccumulation } from './entities/token-accumulation.entity';
import { TokenTransaction } from './entities/token-transaction.entity';
import { UserElo } from './entities/user-elo.entity';
import { User } from './entities/user.entity';
import { RewardsController } from './rewards/rewards.controller';
import { RewardsModule } from './rewards/rewards.module';
import { SseController as RewardsSseController } from './rewards/sse.controller';
import { HotPostsScheduler } from './schedulers/hot-posts.scheduler';
import { MatchResultScheduler } from './schedulers/match-result.scheduler';
import { RealTimeHotPostsScheduler } from './schedulers/real-time-hot-posts.scheduler';
import { TempImageCleanupScheduler } from './schedulers/temp-image-cleanup.scheduler';
import { BlockchainSyncService } from './services/blockchain-sync.service';
import { ClaimNonceService } from './services/claim-nonce.service';
import { CommentLikeService } from './services/comment-like.service';
import { CommentService } from './services/comment.service';
import { MatchPostService } from './services/match-post.service';
import { MatchResultService } from './services/match-result.service';
import { PostHateService } from './services/post-hate.service';
import { PostLikeService } from './services/post-like.service';
import { PostService } from './services/post.service';
import { ReplyService } from './services/reply.service';
import { S3Service } from './services/s3.service';
import { SportCategoryService } from './services/sport-category.service';
import { SseService } from './services/sse.service';
import { TempImageService } from './services/temp-image.service';
import { TokenAccumulationService } from './services/token-accumulation.service';
import { TokenTransactionService } from './services/token-transaction.service';
import { UserService } from './services/user.service';

// NOTE: 앞으로 생성할 컨트롤러/라우트는 모두 복수형으로 작성 (예: users, posts, comments, auths)
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath 제거 - network-loader에서 자동으로 로드
      load: [databaseConfig, jwtConfig, awsConfig, blockchainConfig, appConfig],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Post,
      Comment,
      Reply,
      SportCategory,
      PostLike,
      PostHate,
      CommentLike,
      UserElo,
      MatchResult,
      MatchResultHistory,
      TempImage,
      HotPost,
      HotPostReward,
      TokenTransaction,
      TokenAccumulation,
      ClaimNonce,
      ClaimRequest,
      MatchRequest,
    ]),
    AuthModule,
    EloModule,
    forwardRef(() => BlockchainModule),
    RewardsModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    PostsController,
    CommentsController,
    RepliesController,
    SportCategoriesController,
    HotPostRewardController,
    PostLikeSignatureController,
    PostLikesController,
    PostHatesController,
    CommentLikesController,
    MatchResultsController,
    UserMatchesController,
    ImageController,
    SseController,
    RewardsSseController,
    RewardsController,
    TrivusExpController,
    TokenTransactionsController,
    TokenAccumulationController,
    MatchPostController,
    HealthController,
  ],
  providers: [
    PostService,
    CommentService,
    ReplyService,
    SportCategoryService,
    PostHateService,
    PostLikeService,
    CommentLikeService,
    MatchResultService,
    MatchResultScheduler,
    S3Service,
    SseService,
    TempImageService,
    TempImageCleanupScheduler,
    EloService,
    HotPostsScheduler,
    RealTimeHotPostsScheduler,
    TokenTransactionService,
    TokenAccumulationService,
    BlockchainSyncService,
    MatchPostService,
    ClaimNonceService,
  ],
  exports: [
    PostService,
    PostLikeService,
    TokenAccumulationService,
    TokenTransactionService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly sportCategoryService: SportCategoryService,
    private readonly userService: UserService,
    private readonly postService: PostService,
    private readonly matchResultService: MatchResultService,
    private readonly matchPostService: MatchPostService,
    private readonly blockchainSyncService: BlockchainSyncService,
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

    // 모든 사용자의 토큰 잔액을 블록체인에서 동기화 (에러 처리 추가)
    try {
      await this.userService.syncAllUsersTokenAmount();
      console.log('✅ 모든 사용자의 토큰 잔액이 블록체인과 동기화되었습니다.');
    } catch (error) {
      console.warn('⚠️ 토큰 잔액 동기화 실패 (블록체인 네트워크 문제일 수 있음):', error.message);
      console.log('ℹ️ 애플리케이션은 정상적으로 실행됩니다. 토큰 기능은 제한될 수 있습니다.');
    }

    // 블록체인에서 기존 좋아요 현황 동기화
    try {
      console.log('🔄 블록체인에서 기존 좋아요 현황을 동기화하는 중...');

      // 최근 1000블록에서 좋아요 이벤트 검색 (약 1-2일치)
      const currentBlock = await this.getCurrentBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const syncResult = await this.blockchainSyncService.syncExistingLikes(
        fromBlock,
        currentBlock,
      );

      if (syncResult.totalEvents > 0) {
        console.log(
          `✅ 블록체인 동기화 완료: ${syncResult.processedEvents}/${syncResult.totalEvents} 이벤트 처리, ${syncResult.newLikes}개 새 좋아요 추가`,
        );
      } else {
        console.log('ℹ️ 동기화할 좋아요 이벤트가 없습니다.');
      }
    } catch (error) {
      console.warn(
        '⚠️ 블록체인 좋아요 동기화 실패 (블록체인 네트워크 문제일 수 있음):',
        error.message,
      );
      console.log('ℹ️ 애플리케이션은 정상적으로 실행됩니다. 좋아요 동기화는 제한될 수 있습니다.');
    }
  }

  private async createSampleUsers() {
    // 환경변수에서 지갑 주소 가져오기
    const sampleUserWallet = process.env.SAMPLE_USER_ADDRESS || 'sample-user-wallet';
    const takkuKingWallet = process.env.TABLE_TENNIS_USER_ADDRESS || 'table-tennis-user';

    // 기존 샘플 사용자가 있는지 확인
    let mainUser = await this.userService.findByWalletAddress(sampleUserWallet);
    let tableTennisUser = await this.userService.findByWalletAddress(takkuKingWallet);

    const categories = await this.sportCategoryService.findAll();

    if (!mainUser) {
      mainUser = await this.userService.create({
        walletUserId: 'sample-user',
        walletAddress: sampleUserWallet,
        nickname: '샘플유저',
        email: 'sample@example.com',
      });
    }

    if (!tableTennisUser) {
      tableTennisUser = await this.userService.create({
        walletUserId: 'table-tennis-user',
        walletAddress: takkuKingWallet,
        nickname: '탁구왕민수',
        email: 'tabletennis@example.com',
      });
    }

    return {
      mainUser,
      tableTennisUser,
    };
  }

  private async createSampleMatchRequests(sampleUsers: any) {
    // 기존 매치 요청이 있는지 확인
    const existingRequests = await this.matchResultService.findSentRequests({
      id: sampleUsers.mainUser.id,
      nickname: sampleUsers.mainUser.nickname,
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
        createdAt: sampleUsers.mainUser.createdAt,
      };

      await this.matchResultService.create(
        {
          partnerNickname: '탁구왕민수',
          sportCategoryId: tableTennisCategory.id,
          senderResult: 'win',
          isHandicap: false,
          playedAt: new Date(), // 현재 시간으로 설정
        },
        sampleUserJwt,
      );

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
      {
        title: '안녕하세요!',
        content: '처음 가입했습니다. 반갑습니다!',
        categoryName: '자유글',
        type: PostType.GENERAL,
      },
      {
        title: '오늘 날씨가 좋네요',
        content: '산책하기 좋은 날씨입니다.',
        categoryName: '자유글',
        type: PostType.GENERAL,
      },

      // 테니스
      {
        title: '테니스 레슨 후기',
        content: '오늘 테니스 레슨 받았는데 정말 재미있었어요!',
        categoryName: '테니스',
        type: PostType.GENERAL,
      },
      {
        title: '테니스 라켓 추천',
        content: '초보자용 테니스 라켓 추천해주세요.',
        categoryName: '테니스',
        type: PostType.GENERAL,
      },

      // 배드민턴
      {
        title: '배드민턴 동호회 모집',
        content: '배드민턴 동호회에 가입하고 싶습니다.',
        categoryName: '배드민턴',
        type: PostType.GENERAL,
      },
      {
        title: '배드민턴 기술 팁',
        content: '배드민턴 서브 기술을 연마하고 있습니다.',
        categoryName: '배드민턴',
        type: PostType.GENERAL,
      },

      // 탁구
      {
        title: '탁구 대회 정보',
        content: '다음 달에 탁구 대회가 열린다고 하네요.',
        categoryName: '탁구',
        type: PostType.GENERAL,
      },
      {
        title: '탁구 연습 방법',
        content: '탁구 연습을 위한 좋은 방법이 있을까요?',
        categoryName: '탁구',
        type: PostType.GENERAL,
      },

      // 당구
      {
        title: '당구장 추천',
        content: '좋은 당구장 추천해주세요.',
        categoryName: '당구',
        type: PostType.GENERAL,
      },
      {
        title: '당구 기술 연습',
        content: '당구 기술을 연마하고 있습니다.',
        categoryName: '당구',
        type: PostType.GENERAL,
      },

      // 바둑
      {
        title: '바둑 동호회',
        content: '바둑 동호회에 가입하고 싶습니다.',
        categoryName: '바둑',
        type: PostType.GENERAL,
      },
      {
        title: '바둑 기보 공유',
        content: '재미있는 바둑 기보를 공유합니다.',
        categoryName: '바둑',
        type: PostType.GENERAL,
      },

      // 체스
      {
        title: '체스 대회 정보',
        content: '체스 대회가 열린다고 하네요.',
        categoryName: '체스',
        type: PostType.GENERAL,
      },
      {
        title: '체스 전략',
        content: '체스 전략에 대해 이야기해보세요.',
        categoryName: '체스',
        type: PostType.GENERAL,
      },

      // 공지사항
      {
        title: '커뮤니티 이용 안내',
        content: '커뮤니티 이용 시 주의사항을 확인해주세요.',
        categoryName: '공지사항',
        type: PostType.GENERAL,
      },
      {
        title: '새로운 기능 안내',
        content: '새로운 기능이 추가되었습니다.',
        categoryName: '공지사항',
        type: PostType.GENERAL,
      },
    ];

    for (const postData of samplePosts) {
      const category = categories.find(cat => cat.name === postData.categoryName);
      if (category) {
        await this.postService.create(
          {
            title: postData.title,
            content: postData.content,
            sportCategoryId: category.id,
            type: postData.type,
          },
          user,
        );
      }
    }

    // 매치글 샘플 데이터 추가
    await this.createSampleMatchPosts(user, categories);
  }

  private async createSampleMatchPosts(user: any, categories: any[]) {
    // 기존 매치글이 있는지 확인
    const existingMatchPosts = await this.postService.findAll({ type: PostType.MATCH });
    if (existingMatchPosts.data.length > 0) {
      console.log('이미 매치글이 존재합니다. 샘플 매치글 생성을 건너뜁니다.');
      return;
    }

    const sampleMatchPosts = [
      {
        title: '테니스 2:2 매칭 구합니다',
        content:
          '강남구 테니스장에서 2:2 매칭 구합니다. 실력은 중급 정도이고, 즐겁게 치고 싶습니다.',
        categoryName: '테니스',
        matchLocation: '강남구 테니스장',
        myElo: 1200,
        preferredElo: 'similar',
        participantCount: 4,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1주일 후
        matchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3일 후
      },
      {
        title: '탁구 1:1 연습 상대 구합니다',
        content: '서초구 탁구장에서 1:1 연습 상대를 구합니다. 초급자도 환영합니다.',
        categoryName: '탁구',
        matchLocation: '서초구 탁구장',
        myElo: 800,
        preferredElo: 'any',
        participantCount: 2,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5일 후
        matchDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2일 후
      },
      {
        title: '배드민턴 복식 파트너 구합니다',
        content: '마포구 배드민턴장에서 복식 파트너를 구합니다. 여성 선수 우선입니다.',
        categoryName: '배드민턴',
        matchLocation: '마포구 배드민턴장',
        myElo: 1000,
        preferredElo: 'similar',
        participantCount: 2,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10일 후
        matchDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4일 후
      },
    ];

    for (const matchPostData of sampleMatchPosts) {
      const category = categories.find(cat => cat.name === matchPostData.categoryName);
      if (category) {
        await this.matchPostService.createMatchPost(
          {
            title: matchPostData.title,
            content: matchPostData.content,
            sportCategoryId: category.id,
            matchLocation: matchPostData.matchLocation,
            myElo: matchPostData.myElo,
            preferredElo: matchPostData.preferredElo,
            participantCount: matchPostData.participantCount,
            deadline: matchPostData.deadline.toISOString(),
            matchDate: matchPostData.matchDate.toISOString(),
          },
          user,
        );
      }
    }

    console.log('✅ 샘플 매치글 3개가 생성되었습니다.');
  }

  /**
   * 현재 블록 번호 조회
   */
  private async getCurrentBlockNumber(): Promise<number> {
    try {
      // 간단한 RPC 호출로 현재 블록 번호 조회
      const rpcUrl = process.env.BLOCKCHAIN_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/';
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      return parseInt(data.result, 16);
    } catch (error) {
      console.warn('⚠️ 현재 블록 번호 조회 실패, 기본값 사용:', error.message);
      return 1000; // 기본값
    }
  }
}
