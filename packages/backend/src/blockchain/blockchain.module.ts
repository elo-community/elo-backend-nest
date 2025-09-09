import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { ClaimNonce } from '../entities/claim-nonce.entity';
import { ClaimRequest } from '../entities/claim-request.entity';
import { HotPostReward } from '../entities/hot-post-reward.entity';
import { HotPost } from '../entities/hot-post.entity';
import { PostLike } from '../entities/post-like.entity';
import { Post } from '../entities/post.entity';
import { TokenAccumulation } from '../entities/token-accumulation.entity';
import { TokenTransaction } from '../entities/token-transaction.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
import { ClaimNonceService } from '../services/claim-nonce.service';
import { ClaimRequestService } from '../services/claim-request.service';
import { HotPostRewardService } from '../services/hot-post-reward.service';
import { PostLikeService } from '../services/post-like.service';
import { TokenAccumulationService } from '../services/token-accumulation.service';
import { TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';
import { BlockchainService } from './blockchain.service';
import { ClaimEventService } from './claim-event.service';
import { LikeEventService } from './like-event.service';
import { PostLikeSystemService } from './post-like-system.service';
import { TrivusExpService } from './trivus-exp.service';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => AppModule),
    TypeOrmModule.forFeature([
      ClaimNonce,
      ClaimRequest,
      HotPost,
      HotPostReward,
      Post,
      PostLike,
      TokenAccumulation,
      TokenTransaction,
      User,
      UserElo,
    ]),
  ],
  providers: [
    BlockchainService,
    TrivusExpService,
    ClaimNonceService,
    ClaimRequestService,
    HotPostRewardService,
    PostLikeService,
    TokenAccumulationService,
    TokenTransactionService,
    UserService,
    {
      provide: ClaimEventService,
      useClass: ClaimEventService,
    },
    {
      provide: LikeEventService,
      useClass: LikeEventService,
    },
    PostLikeSystemService,
    {
      provide: 'AMOY_PROVIDER',
      useFactory: (configService: ConfigService) => {
        // 현재 활성 네트워크 가져오기
        const activeNetwork = configService.get<string>('blockchain.activeNetwork');
        const config = configService.get(`blockchain.${activeNetwork}`);
        // 환경변수가 설정되지 않은 경우 기본값 사용 (개발/테스트 환경)
        const rpcUrl = config?.rpcUrl || 'https://rpc-amoy.polygon.technology';
        const chainId = config?.chainId || 80002;

        console.log(`[BlockchainModule] Using RPC URL: ${rpcUrl}`);
        return { rpcUrl, chainId };
      },
      inject: [ConfigService],
    },
    // {
    //     provide: 'VERY_PROVIDER',
    //     useFactory: (configService: ConfigService) => {
    //         const config = configService.get('blockchain.very');
    //         if (!config?.rpcUrl || !config?.chainId) {
    //             throw new Error('RPC_VERY or CHAIN_VERY_ID not configured');
    //         }
    //         return { rpcUrl: config.rpcUrl, chainId: config.chainId };
    //         },
    //     inject: [ConfigService],
    // },
    {
      provide: 'ADMIN_WALLET',
      useFactory: (configService: ConfigService) => {
        const privateKey = configService.get('blockchain.admin.privateKey');

        // 환경변수가 설정되지 않은 경우 null 반환 (기능 비활성화)
        if (
          !privateKey ||
          privateKey === '0x1234567890123456789012345678901234567890123456789012345678901234'
        ) {
          console.warn(
            '[BlockchainModule] Admin wallet not configured - blockchain features will be limited',
          );
          return { privateKey: null };
        }

        return { privateKey };
      },
      inject: [ConfigService],
    },
    {
      provide: 'SIGNER_WALLET',
      useFactory: (configService: ConfigService) => {
        const privateKey = configService.get('blockchain.signer.privateKey');

        // 환경변수가 설정되지 않은 경우 null 반환 (기능 비활성화)
        if (
          !privateKey ||
          privateKey === '0x1234567890123456789012345678901234567890123456789012345678901234'
        ) {
          console.warn(
            '[BlockchainModule] Signer wallet not configured - signing features will be limited',
          );
          return { privateKey: null };
        }

        return { privateKey };
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    BlockchainService,
    TrivusExpService,
    ClaimEventService,
    LikeEventService,
    PostLikeService,
    PostLikeSystemService,
    HotPostRewardService,
    TokenAccumulationService,
    TokenTransactionService,
    UserService,
  ],
})
export class BlockchainModule { }
