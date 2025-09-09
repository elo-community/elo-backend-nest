import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TransactionType } from '../entities/token-transaction.entity';
import { PostLikeService } from './post-like.service';
import { PostService } from './post.service';
import { TokenTransactionService } from './token-transaction.service';
import { UserService } from './user.service';

@Injectable()
export class BlockchainSyncService {
  private readonly logger = new Logger(BlockchainSyncService.name);
  private provider: ethers.JsonRpcProvider;
  private postLikeContract: ethers.Contract;

  constructor(
    private configService: ConfigService,
    private postLikeService: PostLikeService,
    private postService: PostService,
    private userService: UserService,
    private tokenTransactionService: TokenTransactionService,
  ) {
    this.initializeBlockchainConnection();
  }

  private async initializeBlockchainConnection() {
    try {
      // 현재 활성 네트워크 가져오기
      const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

      const rpcUrl = this.configService.get<string>(`blockchain.${activeNetwork}.rpcUrl`);
      const postLikeContractAddress = this.configService.get<string>(
        `blockchain.contracts.postLikeSystem.${activeNetwork}`,
      );

      if (!rpcUrl || !postLikeContractAddress) {
        this.logger.warn(
          'Blockchain configuration incomplete - BlockchainSyncService will not start',
        );
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // PostLikeSystem 컨트랙트 ABI (간단한 버전)
      const contractABI = [
        'event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp)',
        'function getPostLikes(uint256 postId) view returns (uint256)',
        'function hasUserLikedPost(uint256 postId, address user) view returns (bool)',
      ];

      this.postLikeContract = new ethers.Contract(
        postLikeContractAddress,
        contractABI,
        this.provider,
      );
      this.logger.log(`Blockchain connection initialized successfully for sync`);
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain connection: ${error.message}`);
    }
  }

  /**
   * 블록체인에서 기존 좋아요 현황을 동기화
   * @param fromBlock 시작 블록 번호
   * @param toBlock 끝 블록 번호
   */
  async syncExistingLikes(
    fromBlock: number,
    toBlock: number,
  ): Promise<{
    totalEvents: number;
    processedEvents: number;
    newLikes: number;
    errors: number;
  }> {
    if (!this.provider || !this.postLikeContract) {
      throw new Error('Blockchain connection not initialized');
    }

    this.logger.log(`Starting like synchronization from block ${fromBlock} to ${toBlock}`);

    let totalEvents = 0;
    let processedEvents = 0;
    let newLikes = 0;
    let errors = 0;

    try {
      // PostLiked 이벤트 조회
      const logs = await this.provider.getLogs({
        address: this.postLikeContract.target,
        topics: [ethers.id('PostLiked(uint256,address,uint256,uint256)')],
        fromBlock: fromBlock,
        toBlock: toBlock,
      });

      totalEvents = logs.length;
      this.logger.log(`Found ${totalEvents} PostLiked events to process`);

      // 각 이벤트를 순차적으로 처리
      for (const log of logs) {
        try {
          const result = await this.processLikeEvent(log);
          if (result.success) {
            newLikes++;
          }
          processedEvents++;
        } catch (error) {
          this.logger.error(`Failed to process like event: ${error.message}`);
          errors++;
        }
      }

      this.logger.log(
        `Like synchronization completed: ${processedEvents}/${totalEvents} events processed, ${newLikes} new likes added, ${errors} errors`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync existing likes: ${error.message}`);
      throw error;
    }

    return {
      totalEvents,
      processedEvents,
      newLikes,
      errors,
    };
  }

  /**
   * 개별 좋아요 이벤트 처리
   */
  private async processLikeEvent(log: any): Promise<{ success: boolean; message: string }> {
    try {
      const parsedEvent = this.postLikeContract.interface.parseLog(log);
      if (!parsedEvent || !parsedEvent.args) {
        return { success: false, message: 'Failed to parse event' };
      }

      const postId = Number(parsedEvent.args[0]);
      const userAddress = parsedEvent.args[1] as string;
      const amount = Number(ethers.formatEther(parsedEvent.args[2]));
      const timestamp = Number(parsedEvent.args[3]);
      const transactionHash = log.transactionHash;

      this.logger.debug(
        `Processing PostLiked event: postId=${postId}, user=${userAddress}, amount=${amount}`,
      );

      // 1. 사용자 정보 조회 또는 생성
      const user = await this.userService.findByWalletAddress(userAddress);
      if (!user) {
        this.logger.warn(`User not found for wallet address: ${userAddress}, skipping...`);
        return { success: false, message: 'User not found' };
      }

      // 2. 게시글 존재 여부 확인
      const post = await this.postService.findOne(postId);
      if (!post) {
        this.logger.warn(`Post not found for ID: ${postId}, skipping...`);
        // 삭제된 게시글에 대한 이벤트는 무시하고 성공으로 처리
        // (이미 삭제된 게시글이므로 더 이상 처리할 필요 없음)
        return { success: true, message: 'Post not found (likely deleted), skipping' };
      }

      // 3. 이미 좋아요가 기록되어 있는지 확인
      const existingLike = await this.postLikeService.findOne(postId, user.id);
      if (existingLike) {
        this.logger.debug(`Like already exists for post ${postId} by user ${user.id}, skipping...`);
        return { success: true, message: 'Like already exists' };
      }

      // 4. post-like 테이블에 좋아요 기록 생성
      await this.postLikeService.processLikeTokenDeduction(
        user.id,
        postId,
        transactionHash,
        amount,
      );

      // 5. token_tx 테이블에 트랜잭션 기록 (동기화 시점의 잔액으로 계산)
      try {
        const balanceBefore = Number(user.tokenAmount || 0);
        const balanceAfter = Math.max(0, balanceBefore - amount);

        await this.tokenTransactionService.createTransaction({
          userId: user.id,
          transactionType: TransactionType.LIKE_DEDUCT,
          amount: -amount,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          transactionHash: transactionHash,
          blockchainAddress: userAddress,
          description: `Like payment for post ${postId}: ${amount} EXP (synced from blockchain)`,
          metadata: {
            postId: postId,
            action: 'like',
            blockchainEvent: 'PostLiked',
            synced: true,
            originalTimestamp: timestamp,
          },
          referenceId: postId.toString(),
          referenceType: 'post_like',
        });

        this.logger.log(
          `Synced like from blockchain: user ${user.id} -> post ${postId}, amount ${amount} EXP`,
        );
        return { success: true, message: 'Like synced successfully' };
      } catch (txError) {
        this.logger.error(`Failed to create token transaction for synced like: ${txError.message}`);
        // 트랜잭션 기록 실패 시에도 좋아요는 기록됨
        return { success: true, message: 'Like synced but transaction record failed' };
      }
    } catch (error) {
      this.logger.error(`Error processing like event: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  /**
   * 특정 게시글의 좋아요 개수 동기화
   */
  async syncPostLikeCount(postId: number): Promise<number> {
    if (!this.provider || !this.postLikeContract) {
      throw new Error('Blockchain connection not initialized');
    }

    try {
      const likeCount = await this.postLikeContract.getPostLikes(postId);
      this.logger.log(`Post ${postId} has ${likeCount} likes on blockchain`);
      return Number(likeCount);
    } catch (error) {
      this.logger.error(`Failed to get post like count from blockchain: ${error.message}`);
      throw error;
    }
  }

  /**
   * 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
   */
  async checkUserLikeStatus(postId: number, userAddress: string): Promise<boolean> {
    if (!this.provider || !this.postLikeContract) {
      throw new Error('Blockchain connection not initialized');
    }

    try {
      const hasLiked = await this.postLikeContract.hasUserLikedPost(postId, userAddress);
      return hasLiked;
    } catch (error) {
      this.logger.error(`Failed to check user like status from blockchain: ${error.message}`);
      throw error;
    }
  }

  /**
   * 서비스 상태 확인
   */
  getServiceStatus() {
    return {
      isConnected: !!this.provider && !!this.postLikeContract,
      postLikeContractAddress: this.postLikeContract?.target?.toString() || 'Not connected',
      provider: this.provider ? 'Connected' : 'Not connected',
    };
  }
}
