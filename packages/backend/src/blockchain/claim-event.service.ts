import { Inject, Injectable, Logger, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { ClaimStatus } from '../entities/claim-request.entity';
import { TransactionType } from '../entities/token-transaction.entity';
import { ClaimRequestService } from '../services/claim-request.service';
import { TokenAccumulationService } from '../services/token-accumulation.service';
import { TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';
import { TrivusExpService } from './trivus-exp.service';

@Injectable()
export class ClaimEventService implements OnModuleInit {
  private readonly logger = new Logger(ClaimEventService.name);
  private provider: ethers.JsonRpcProvider;
  private trivusExpContract: ethers.Contract;
  private isListening: boolean = false;
  private reconnectInterval: NodeJS.Timeout;
  private readonly RECONNECT_DELAY = 5000; // 5초
  private lastProcessedBlock: number | null = null;

  // 지연 처리 큐: ClaimExecuted 이벤트를 일정 시간 대기 후 처리
  private pendingClaimExecutedQueue = new Map<
    string,
    {
      to: string;
      amount: bigint;
      deadline: bigint;
      nonce: string;
      transactionHash: string;
      timestamp: number;
    }
  >();
  private readonly CLAIM_DELAY_MS = 1000; // 1초 지연 (빠른 처리)

  constructor(
    private configService: ConfigService,
    private claimRequestService: ClaimRequestService,
    private tokenTransactionService: TokenTransactionService,
    private tokenAccumulationService: TokenAccumulationService,
    private userService: UserService,
    @Inject(forwardRef(() => TrivusExpService))
    private trivusExpService: TrivusExpService,
  ) { }

  async onModuleInit() {
    await this.initializeBlockchainConnection();
    if (this.trivusExpContract) {
      await this.startEventListening();
    }
  }

  private async initializeBlockchainConnection() {
    try {
      // 현재 활성 네트워크 가져오기
      const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

      const rpcUrl = this.configService.get<string>(`blockchain.${activeNetwork}.rpcUrl`);
      const trivusExpContractAddress = this.configService.get<string>(
        `blockchain.contracts.trivusExp.${activeNetwork}`,
      );

      if (!rpcUrl || !trivusExpContractAddress) {
        this.logger.warn('Blockchain configuration incomplete - ClaimEventService will not start');
        this.logger.warn(`RPC URL: ${rpcUrl ? 'Set' : 'Not Set'}`);
        this.logger.warn(`TrivusEXP Address: ${trivusExpContractAddress ? 'Set' : 'Not Set'}`);
        return;
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // TrivusEXP 컨트랙트 ABI는 TrivusExpService에서 가져옴
      const trivusExpContractABI = this.trivusExpService.getContractAbi();

      this.trivusExpContract = new ethers.Contract(
        trivusExpContractAddress,
        trivusExpContractABI,
        this.provider,
      );

      this.logger.log('Blockchain connection initialized successfully');
      this.logger.log(`TrivusEXP contract: ${trivusExpContractAddress}`);
      this.logger.log(`RPC URL: ${rpcUrl}`);
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain connection: ${error.message}`);
    }
  }

  private async startEventListening() {
    if (this.isListening) {
      this.logger.log('Event listening already started');
      return;
    }

    try {
      this.logger.log('Starting ClaimExecuted event polling...');
      this.isListening = true;
      this.startEventPolling();
    } catch (error) {
      this.logger.error(`Failed to start event listening: ${error.message}`);
      this.isListening = false;
      this.scheduleReconnect();
    }
  }

  private startEventPolling() {
    const pollIntervalMs = 15000; // 15초 (이벤트 감지 빠르게)
    const interval = setInterval(async () => {
      if (!this.isListening) {
        clearInterval(interval);
        return;
      }

      try {
        await this.pollRecentEvents();
      } catch (error) {
        this.logger.error(`Error while polling ClaimExecuted events: ${(error as Error).message}`);
      }
    }, pollIntervalMs);

    this.logger.log('ClaimExecuted event polling started (15s intervals)');
  }

  private async pollRecentEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10); // 최대 10블록 전까지 폴링 (이벤트 놓침 방지)
      const toBlock = currentBlock;

      this.logger.log(
        `[ClaimEventService] Polling blocks: ${fromBlock} to ${toBlock} (current: ${currentBlock})`,
      );
      this.logger.log(`[ClaimEventService] Contract address: ${this.trivusExpContract.target}`);
      this.logger.log(`[ClaimEventService] Provider connected: ${this.provider ? 'Yes' : 'No'}`);

      // ClaimExecuted 이벤트 폴링 (TrivusEXP1363 컨트랙트와 일치)
      let claimEvents: any[] = [];
      try {
        claimEvents = await this.provider.getLogs({
          address: this.trivusExpContract.target,
          topics: [ethers.id('ClaimExecuted(address,uint256,uint256,bytes32)')],
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        // 디버깅: 폴링 결과 로그
        if (claimEvents.length > 0) {
          this.logger.log(`Found ${claimEvents.length} ClaimExecuted events`);
        }
      } catch (error) {
        this.logger.error(`Failed to get logs for ClaimExecuted: ${error.message}`);
        return;
      }

      // Transfer 이벤트 폴링 (mint, claim 등에서 emit)
      let transferEvents: any[] = [];
      try {
        transferEvents = await this.provider.getLogs({
          address: this.trivusExpContract.target,
          topics: [ethers.id('Transfer(address,address,uint256)')],
          fromBlock: fromBlock,
          toBlock: toBlock,
        });

        // Transfer 이벤트 개수는 필요시에만 로깅
      } catch (error) {
        this.logger.error(`Failed to get logs for Transfer: ${error.message}`);
      }

      // 파싱 및 처리
      // 1. ClaimExecuted 이벤트를 먼저 처리 (지연 처리 큐에 추가)
      for (const log of claimEvents) {
        try {
          const parsed = this.trivusExpContract.interface.parseLog(log);
          if (!parsed || !parsed.args) continue;

          const to: string = parsed.args[0] as string;
          const amount: bigint = parsed.args[1] as bigint;
          const deadline: bigint = parsed.args[2] as bigint;
          const nonce: string = parsed.args[3] as string; // nonce는 bytes32 타입

          // 중복 처리 방지: 이미 처리된 nonce인지 확인
          const existingClaim = await this.claimRequestService.findByNonce(nonce);
          if (existingClaim && existingClaim.status === ClaimStatus.EXECUTED) {
            this.logger.log(`Claim with nonce ${nonce} already processed, skipping...`);
            continue;
          }

          // 좋아요 클레임인지 확인 - 좋아요 클레임은 ClaimExecuted에서 처리하지 않음
          const isLikeClaim = await this.isLikeClaim(nonce);
          if (isLikeClaim) {
            this.logger.log(
              `Claim with nonce ${nonce} is a like claim, skipping ClaimExecuted processing (will be handled by TokensClaimed)`,
            );
            continue;
          }

          // 토큰 클레임만 큐에 추가
          this.addToPendingClaimQueue(nonce, {
            to,
            amount,
            deadline,
            nonce,
            transactionHash: log.transactionHash,
            timestamp: Date.now(),
          });
          continue;
        } catch (parseError) {
          this.logger.warn(`Failed to parse ClaimExecuted: ${parseError.message}`);
        }
      }

      // 2. Transfer 이벤트 처리 (mint, claim 등에서 emit)
      // ClaimExecuted와 같은 transactionHash를 가진 Transfer는 스킵
      for (const log of transferEvents) {
        try {
          const parsed = this.trivusExpContract.interface.parseLog(log);
          if (!parsed || !parsed.args) continue;

          const from: string = parsed.args[0] as string;
          const to: string = parsed.args[1] as string;
          const value: bigint = parsed.args[2] as bigint;

          // ClaimExecuted와 같은 transactionHash를 가진 Transfer는 스킵
          const isClaimRelated = Array.from(this.pendingClaimExecutedQueue.values()).some(
            claimData => claimData.transactionHash === log.transactionHash,
          );

          if (isClaimRelated) {
            continue;
          }

          // mint 이벤트 (from이 zero address인 경우)
          if (from === '0x0000000000000000000000000000000000000000') {
            await this.handleMintEvent(to, value, log.transactionHash);
          }
          // claim 이벤트 (from이 zero address가 아닌 경우)
          else {
            await this.handleTransferEvent(from, to, value, log.transactionHash);
          }
        } catch (parseError) {
          this.logger.warn(`Failed to parse Transfer: ${parseError.message}`);
        }
      }

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      this.logger.error(
        `Failed to get current block number for polling: ${(error as Error).message}`,
      );
    }
  }

  /**
   * ClaimExecuted 이벤트를 지연 처리 큐에 추가
   */
  private addToPendingClaimQueue(
    nonce: string,
    claimData: {
      to: string;
      amount: bigint;
      deadline: bigint;
      nonce: string;
      transactionHash: string;
      timestamp: number;
    },
  ) {
    this.pendingClaimExecutedQueue.set(nonce, claimData);

    // 일정 시간 후에 큐에서 제거하고 처리
    setTimeout(async () => {
      await this.processPendingClaim(nonce);
    }, this.CLAIM_DELAY_MS);
  }

  /**
   * 지연 처리된 ClaimExecuted 이벤트 처리
   */
  private async processPendingClaim(nonce: string) {
    const claimData = this.pendingClaimExecutedQueue.get(nonce);
    if (!claimData) {
      return;
    }

    // 큐에서 제거
    this.pendingClaimExecutedQueue.delete(nonce);

    this.logger.log(
      `Processing delayed ClaimExecuted event for nonce ${nonce} (available token claim)`,
    );

    try {
      const { to, amount, deadline, transactionHash } = claimData;

      // DB에서 claim request 상태 업데이트
      await this.claimRequestService.updateClaimStatus(
        to,
        nonce,
        ClaimStatus.EXECUTED,
        transactionHash,
      );

      // token_accumulation 테이블에서 해당 nonce의 상태를 CLAIMED로 업데이트
      let accumulationUpdated = false;
      try {
        await this.tokenAccumulationService.markByNonceAsClaimed(to, nonce, transactionHash);
        this.logger.log(`Token accumulation marked as claimed for nonce ${nonce}, wallet ${to}`);
        accumulationUpdated = true;
      } catch (accumulationError) {
        this.logger.warn(
          `Token accumulation not found for nonce ${nonce}, wallet ${to}: ${accumulationError.message}`,
        );
        this.logger.log(`Will proceed with direct availableToken reduction`);
        // accumulation을 찾을 수 없어도 계속 진행 (availableToken 직접 감소)
      }

      // token_tx 테이블에 토큰 이동 내역 기록
      const user = await this.userService.findByWalletAddress(to);
      if (user) {
        const amountDecimal = parseFloat(ethers.formatEther(amount));

        // 중복 기록 방지: 같은 transactionHash로 TRANSFER_IN이 이미 기록되었는지 확인
        const existingTransferIn = await this.tokenTransactionService.getTransactionByHashAndType(
          transactionHash,
          TransactionType.TRANSFER_IN,
        );

        if (existingTransferIn) {
          this.logger.log(
            `TRANSFER_IN already recorded for hash ${transactionHash}, skipping REWARD_CLAIM to avoid duplicate`,
          );
          return;
        }

        // claim 종류에 따라 처리 분기
        let updatedUser: any;
        const isLikeClaimResult = await this.isLikeClaim(nonce);

        if (isLikeClaimResult) {
          // 1. 좋아요 클레임: availableToken 변화 없음, tokenAmount만 증가
          try {
            // tokenAmount만 증가 (availableToken은 변화 없음)
            updatedUser = await this.userService.addTokens(to, amountDecimal);
            this.logger.log(
              `[ClaimEventService] Like claim: ${to} +${amountDecimal} EXP, availableToken unchanged`,
            );
          } catch (addError) {
            this.logger.error(`Failed to increase user token amount: ${addError.message}`);
            return; // 토큰 증가 실패 시 처리 중단
          }
        } else {
          // 2. 토큰 클레임: availableToken 감소, tokenAmount 증가
          try {
            if (accumulationUpdated) {
              // token_accumulation이 있는 경우: syncTokenAmount 사용
              updatedUser = await this.userService.syncTokenAmount(to, amountDecimal);
              this.logger.log(
                `[ClaimEventService] Token claim via syncTokenAmount: ${to} +${amountDecimal} EXP`,
              );
            } else {
              // token_accumulation이 없는 경우: availableToken 직접 감소 + tokenAmount 증가
              const newAvailableToken = Math.max(0, (user.availableToken || 0) - amountDecimal);

              // 1. availableToken 감소
              await this.userService.updateAvailableTokenDirectly(to, newAvailableToken);

              // 2. tokenAmount 증가
              updatedUser = await this.userService.addTokens(to, amountDecimal);

              this.logger.log(
                `[ClaimEventService] Token claim via direct update: ${to} +${amountDecimal} EXP`,
              );
            }
          } catch (syncError) {
            this.logger.error(`Failed to update user token: ${syncError.message}`);
            return; // 토큰 업데이트 실패 시 처리 중단
          }
        }

        // 2. 트랜잭션 발생 시점의 잔액 기준으로 계산
        const balanceBefore = Number(user.tokenAmount || 0); // 증가 전 잔액

        // DB에서 최신 값을 다시 조회하여 balanceAfter 계산
        const latestUser = await this.userService.findByWalletAddress(to);
        let balanceAfter = Number(latestUser?.tokenAmount || 0); // 증가 후 잔액

        // balanceAfter가 0이거나 balanceBefore와 같다면 수동으로 계산
        if (!latestUser || balanceAfter <= 0 || balanceAfter === balanceBefore) {
          balanceAfter = balanceBefore + amountDecimal;
        }

        // updatedUser를 최신 DB 값으로 업데이트
        updatedUser = latestUser;

        // 4. 토큰 거래 내역 기록
        // claim 종류에 따라 description 구분
        const claimType = isLikeClaimResult ? 'like_claim' : 'available_token_claim';
        const claimDescription = isLikeClaimResult
          ? `Like reward claim executed for nonce ${nonce}`
          : `Available token claim executed for nonce ${nonce}`;

        // claim 종류에 따라 TransactionType 구분
        const transactionType = isLikeClaimResult
          ? TransactionType.LIKE_REWARD_CLAIM
          : TransactionType.AVAILABLE_TOKEN_CLAIM;

        await this.tokenTransactionService.createTransaction({
          userId: user.id,
          transactionType: transactionType,
          amount: amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          transactionHash: transactionHash,
          blockchainAddress: to,
          description: claimDescription,
          metadata: {
            nonce: nonce.toString(),
            claim_type: claimType,
            deadline: deadline.toString(),
            event_source: 'ClaimExecuted',
            availableTokenBefore: user.availableToken || 0,
            availableTokenAfter: isLikeClaimResult ? user.availableToken || 0 : 0, // 좋아요 클레임은 availableToken 변화 없음
          },
          referenceId: nonce.toString(),
          referenceType: 'claim_request',
        });

        this.logger.log(
          `Available token claim recorded: user ${user.id}, ${amountDecimal} EXP claimed`,
        );

        // 4. 사용자의 모든 pending 상태인 token_accumulation을 CLAIMED로 업데이트
        if (!isLikeClaimResult) {
          try {
            const updatedCount = await this.tokenAccumulationService.markAllPendingAsClaimed(
              to,
              transactionHash,
            );
            this.logger.log(
              `Token accumulations updated: ${updatedCount} records marked as claimed`,
            );
          } catch (accumulationError) {
            this.logger.error(
              `Failed to mark all pending accumulations as claimed: ${accumulationError.message}`,
            );
            // accumulation 업데이트 실패는 전체 처리에 영향을 주지 않도록 함
          }
        }
      } else {
        this.logger.warn(`User not found for wallet address: ${to}`);
      }

      this.logger.log(`Claim request status updated for ${to} with nonce ${nonce}`);
    } catch (error) {
      this.logger.error(`Failed to process delayed claim: ${error.message}`);
    }
  }

  /**
   * nonce로 좋아요 클레임인지 확인
   */
  private async isLikeClaim(nonce: string): Promise<boolean> {
    try {
      // claim_request 테이블에서 해당 nonce의 reason을 확인
      const claimRequest = await this.claimRequestService.findByNonce(nonce);
      if (!claimRequest) {
        return false;
      }

      // reason이 'like_claim' 또는 'post_like' 관련이면 좋아요 클레임
      const reason = claimRequest.reason?.toLowerCase() || '';
      return reason.includes('like') || reason.includes('post');
    } catch (error) {
      this.logger.error(`Failed to check if claim is like claim: ${error.message}`);
      return false;
    }
  }

  /**
   * Mint 이벤트 처리 (from이 zero address인 경우)
   */
  private async handleMintEvent(to: string, value: bigint, transactionHash: string): Promise<void> {
    try {
      const user = await this.userService.findByWalletAddress(to);
      if (!user) {
        this.logger.warn(`User not found for wallet address: ${to}`);
        return;
      }

      const amountDecimal = parseFloat(ethers.formatEther(value));

      // 중복 mint 기록 방지: 같은 transactionHash로 이미 기록되었는지 확인
      const existingTransaction =
        await this.tokenTransactionService.getTransactionByHash(transactionHash);
      if (existingTransaction) {
        this.logger.log(
          `Mint transaction already recorded for hash ${transactionHash}, skipping duplicate`,
        );
        return;
      }

      // 변경 전 잔액 기록
      const balanceBefore = user.tokenAmount || 0;

      // user.token_amount 업데이트
      let updatedUser;
      try {
        updatedUser = await this.userService.addTokens(to, amountDecimal);
      } catch (addTokensError) {
        this.logger.error(`Failed to update user token_amount: ${addTokensError.message}`);
        throw addTokensError; // 에러 발생 시 전체 처리 중단
      }

      // 변경 후 잔액 기록
      const balanceAfter = updatedUser.tokenAmount || 0;

      // token_tx 테이블에 mint 기록
      await this.tokenTransactionService.createTransaction({
        userId: user.id,
        transactionType: TransactionType.TRANSFER_IN,
        amount: amountDecimal,
        balanceBefore: balanceBefore,
        balanceAfter: balanceAfter,
        transactionHash,
        blockchainAddress: to,
        description: `Token minted: ${amountDecimal} EXP`,
        metadata: {
          event_source: 'Transfer',
          action: 'mint',
          from: '0x0000000000000000000000000000000000000000',
        },
        referenceType: 'mint',
      });

      this.logger.log(`Mint transaction recorded: user ${user.id}, ${amountDecimal} EXP minted`);
    } catch (error) {
      this.logger.error(`Failed to handle mint event: ${(error as Error).message}`);
    }
  }

  /**
   * 일반 Transfer 이벤트 처리
   */
  private async handleTransferEvent(
    from: string,
    to: string,
    value: bigint,
    transactionHash: string,
  ): Promise<void> {
    try {
      const amountDecimal = parseFloat(ethers.formatEther(value));

      // 1. 컨트랙트 주소로 claim 종류 구분
      const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');
      const trivusExpAddress = this.configService.get<string>(
        `blockchain.contracts.trivusExp.${activeNetwork}`,
      );
      const postLikeSystemAddress = this.configService.get<string>(
        `blockchain.contracts.postLikeSystem.${activeNetwork}`,
      );

      if (from === trivusExpAddress) {
        // 토큰 클레임으로 인한 transfer
        this.logger.log(
          `Token claim transfer detected: ${amountDecimal} EXP from TrivusEXP to ${to}`,
        );
        this.logger.log(
          `Skipping Transfer event - ClaimExecuted will handle available_token reduction`,
        );
        return;
      }

      if (from === postLikeSystemAddress) {
        // 좋아요 클레임으로 인한 transfer
        this.logger.log(
          `Like claim transfer detected: ${amountDecimal} EXP from PostLikeSystem to ${to}`,
        );
        this.logger.log(`Skipping Transfer event - TokensClaimed will handle this`);
        return;
      }

      // PostLikeSystem으로의 전송인지 확인 (좋아요 관련 전송은 PostLiked 이벤트에서 처리)
      if (to === postLikeSystemAddress) {
        this.logger.log(
          `PostLikeSystem transfer detected in ClaimEventService: ${amountDecimal} EXP from ${from} to ${to}`,
        );
        this.logger.log(`Skipping TRANSFER_OUT record - PostLiked event will handle this`);
        return;
      }

      // from 주소의 사용자 조회
      const fromUser = await this.userService.findByWalletAddress(from);
      if (fromUser) {
        // Transfer 이벤트는 이미 발생한 토큰 이동을 감지하는 것이므로
        // 현재 tokenAmount가 이미 차감된 상태라고 가정
        const currentBalance = fromUser.tokenAmount || 0;
        const balanceBefore = currentBalance + amountDecimal; // 차감 전 잔액
        const balanceAfter = currentBalance; // 차감 후 잔액 (현재 상태)

        // from 사용자의 토큰 차감 기록
        await this.tokenTransactionService.createTransaction({
          userId: fromUser.id,
          transactionType: TransactionType.TRANSFER_OUT,
          amount: -amountDecimal,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          transactionHash,
          blockchainAddress: from,
          description: `Token transferred: ${amountDecimal} EXP to ${to}`,
          metadata: {
            event_source: 'Transfer',
            action: 'transfer_out',
            to: to,
          },
          referenceType: 'transfer',
        });

        this.logger.log(
          `Transfer out recorded for user ${fromUser.id}: ${amountDecimal} EXP sent (${balanceBefore} → ${balanceAfter})`,
        );
      }

      // to 주소의 사용자 조회
      const toUser = await this.userService.findByWalletAddress(to);
      if (toUser) {
        // 1. 사용자의 tokenAmount를 실제로 증가시킴 (Transfer는 일반 토큰 이동이므로 availableToken은 건드리지 않음)
        let updatedToUser;
        try {
          updatedToUser = await this.userService.addTokens(to, amountDecimal);
          this.logger.log(`User token amount increased: ${to} +${amountDecimal} EXP`);
        } catch (addTokensError) {
          this.logger.error(`Failed to increase user token amount: ${addTokensError.message}`);
          return; // 토큰 증가 실패 시 처리 중단
        }

        // 2. Transfer 이벤트는 이미 발생한 토큰 이동을 감지하는 것이므로
        // 현재 tokenAmount가 이미 증가된 상태라고 가정
        const balanceBefore = Number(toUser.tokenAmount || 0); // 증가 전 잔액
        const balanceAfter = Number(updatedToUser?.tokenAmount || 0); // 증가 후 잔액

        // 3. to 사용자의 토큰 증가 기록
        // REWARD_CLAIM이 이미 기록되었는지 확인
        const existingRewardClaim = await this.tokenTransactionService.getTransactionByHashAndType(
          transactionHash,
          TransactionType.REWARD_CLAIM,
        );

        if (existingRewardClaim) {
          this.logger.log(
            `REWARD_CLAIM already recorded for hash ${transactionHash}, skipping TRANSFER_IN to avoid duplicate`,
          );
        } else {
          // REWARD_CLAIM이 없는 경우 TRANSFER_IN 기록
          await this.tokenTransactionService.createTransaction({
            userId: toUser.id,
            transactionType: TransactionType.TRANSFER_IN,
            amount: amountDecimal,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            transactionHash,
            blockchainAddress: to,
            description: `Token received: ${amountDecimal} EXP from ${from}`,
            metadata: {
              event_source: 'Transfer',
              action: 'transfer_in',
              from: from,
            },
            referenceType: 'transfer',
          });

          this.logger.log(
            `Transfer in recorded for user ${toUser.id}: ${amountDecimal} EXP received (${balanceBefore} → ${balanceAfter})`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Failed to handle transfer event: ${(error as Error).message}`);
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectInterval = setTimeout(async () => {
      this.logger.log('Attempting to reconnect...');
      this.isListening = false;
      await this.startEventListening();
    }, this.RECONNECT_DELAY);
  }

  async stopEventListening() {
    this.isListening = false;
    this.logger.log('Event listening stopped');
  }

  getStatus() {
    return {
      isListening: this.isListening,
      contractAddress: this.trivusExpContract?.target || 'Not configured',
      provider: this.provider ? 'Connected' : 'Not connected',
    };
  }
}
