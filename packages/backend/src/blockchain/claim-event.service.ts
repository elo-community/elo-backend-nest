import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { ClaimStatus } from '../entities/claim-request.entity';
import { TransactionType } from '../entities/token-transaction.entity';
import { ClaimRequestService } from '../services/claim-request.service';
import { TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';

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
    private pendingClaimExecutedQueue = new Map<string, {
        to: string;
        amount: bigint;
        deadline: bigint;
        nonce: string;
        transactionHash: string;
        timestamp: number;
    }>();
    private readonly CLAIM_DELAY_MS = 5000; // 5초 지연

    constructor(
        private configService: ConfigService,
        private claimRequestService: ClaimRequestService,
        private tokenTransactionService: TokenTransactionService,
        private userService: UserService,
    ) { }

    async onModuleInit() {
        await this.initializeBlockchainConnection();
        if (this.trivusExpContract) {
            await this.startEventListening();
        }
    }

    private async initializeBlockchainConnection() {
        try {
            const rpcUrl = this.configService.get<string>('blockchain.amoy.rpcUrl');
            const trivusExpContractAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy');

            if (!rpcUrl || !trivusExpContractAddress) {
                this.logger.warn('Blockchain configuration incomplete - ClaimEventService will not start');
                this.logger.warn(`RPC URL: ${rpcUrl ? 'Set' : 'Not Set'}`);
                this.logger.warn(`TrivusEXP Address: ${trivusExpContractAddress ? 'Set' : 'Not Set'}`);
                return;
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // TrivusEXP 컨트랙트 ABI (ClaimExecuted 이벤트 + Transfer 이벤트 포함)
            const trivusExpContractABI = [
                // ClaimExecuted 이벤트
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "deadline",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "bytes32",
                            "name": "nonce",
                            "type": "bytes32"
                        }
                    ],
                    "name": "ClaimExecuted",
                    "type": "event"
                },
                // Transfer 이벤트 (mint, claim 등에서 emit)
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "from",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "to",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "value",
                            "type": "uint256"
                        }
                    ],
                    "name": "Transfer",
                    "type": "event"
                }
            ];

            this.trivusExpContract = new ethers.Contract(trivusExpContractAddress, trivusExpContractABI, this.provider);

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

            // ClaimExecuted 이벤트 폴링 (TrivusEXP1363 컨트랙트와 일치)
            let claimEvents: any[] = [];
            try {
                claimEvents = await this.provider.getLogs({
                    address: this.trivusExpContract.target,
                    topics: [
                        ethers.id('ClaimExecuted(address,uint256,uint256,bytes32)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
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
                    topics: [
                        ethers.id('Transfer(address,address,uint256)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });

                if (transferEvents.length > 0) {
                    this.logger.log(`Found ${transferEvents.length} Transfer events`);
                }
            } catch (error) {
                this.logger.error(`Failed to get logs for Transfer: ${error.message}`);
            }

            // 파싱 및 처리
            for (const log of claimEvents) {
                try {
                    const parsed = this.trivusExpContract.interface.parseLog(log);
                    if (!parsed || !parsed.args) continue;

                    const to: string = parsed.args[0] as string;
                    const amount: bigint = parsed.args[1] as bigint;
                    const deadline: bigint = parsed.args[2] as bigint;
                    const nonce: string = parsed.args[3] as string; // nonce는 bytes32 타입

                    this.logger.log(`ClaimExecuted event detected: to=${to}, amount=${ethers.formatEther(amount)} EXP, deadline=${deadline}, nonce=${nonce}`);

                    // 중복 처리 방지: 이미 처리된 nonce인지 확인
                    const existingClaim = await this.claimRequestService.findByNonce(nonce);
                    if (existingClaim && existingClaim.status === ClaimStatus.EXECUTED) {
                        this.logger.log(`Claim with nonce ${nonce} already processed, skipping...`);
                        continue;
                    }

                    // 지연 처리: ClaimExecuted를 큐에 추가하고 일정 시간 후 처리
                    this.addToPendingClaimQueue(nonce, {
                        to,
                        amount,
                        deadline,
                        nonce,
                        transactionHash: log.transactionHash,
                        timestamp: Date.now()
                    });

                    this.logger.log(`ClaimExecuted event added to pending queue for nonce ${nonce}, will be processed in ${this.CLAIM_DELAY_MS}ms`);
                    continue;

                } catch (parseError) {
                    this.logger.warn(`Failed to parse ClaimExecuted: ${parseError.message}`);
                }
            }

            // Transfer 이벤트 처리 (mint, claim 등에서 emit)
            for (const log of transferEvents) {
                try {
                    const parsed = this.trivusExpContract.interface.parseLog(log);
                    if (!parsed || !parsed.args) continue;

                    const from: string = parsed.args[0] as string;
                    const to: string = parsed.args[1] as string;
                    const value: bigint = parsed.args[2] as bigint;

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
            this.logger.error(`Failed to get current block number for polling: ${(error as Error).message}`);
        }
    }

    /**
     * ClaimExecuted 이벤트를 지연 처리 큐에 추가
     */
    private addToPendingClaimQueue(nonce: string, claimData: {
        to: string;
        amount: bigint;
        deadline: bigint;
        nonce: string;
        transactionHash: string;
        timestamp: number;
    }) {
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

        // 좋아요 클레임인지 벌크 클레임인지 구분
        const isLikeClaim = await this.isLikeClaim(nonce);

        if (isLikeClaim) {
            this.logger.log(`Claim with nonce ${nonce} is a like claim, skipping ClaimExecuted processing (will be handled by TokensClaimed)`);
            return;
        }

        this.logger.log(`Processing delayed ClaimExecuted event for nonce ${nonce} (bulk claim)`);

        try {
            const { to, amount, deadline, transactionHash } = claimData;

            // DB에서 claim request 상태 업데이트
            await this.claimRequestService.updateClaimStatus(
                to,
                nonce,
                ClaimStatus.EXECUTED,
                transactionHash
            );

            // token_tx 테이블에 토큰 이동 내역 기록
            const user = await this.userService.findByWalletAddress(to);
            if (user) {
                const amountDecimal = parseFloat(ethers.formatEther(amount));

                // 사용자의 토큰 정보 업데이트 (availableToken에서 tokenAmount로 이동)
                await this.userService.syncTokenAmount(to, amountDecimal);

                // 중복 기록 방지: 같은 transactionHash로 TRANSFER_IN이 이미 기록되었는지 확인
                const existingTransferIn = await this.tokenTransactionService.getTransactionByHashAndType(
                    transactionHash,
                    TransactionType.TRANSFER_IN
                );

                if (existingTransferIn) {
                    this.logger.log(`TRANSFER_IN already recorded for hash ${transactionHash}, skipping REWARD_CLAIM to avoid duplicate`);
                    return;
                }

                // 토큰 거래 내역 기록
                await this.tokenTransactionService.createTransaction({
                    userId: user.id,
                    transactionType: TransactionType.REWARD_CLAIM,
                    amount: amountDecimal,
                    balanceBefore: user.tokenAmount || 0,
                    balanceAfter: (user.tokenAmount || 0) + amountDecimal,
                    transactionHash: transactionHash,
                    blockchainAddress: to,
                    description: `Token claim executed for nonce ${nonce}`,
                    metadata: {
                        nonce: nonce.toString(),
                        claim_type: 'bulk_claim', // 벌크 클레임만 여기서 처리
                        deadline: deadline.toString(),
                        event_source: 'ClaimExecuted'
                    },
                    referenceId: nonce.toString(),
                    referenceType: 'claim_request'
                });

                this.logger.log(`Delayed token transaction recorded for user ${user.id}: ${amountDecimal} EXP claimed`);
            } else {
                this.logger.warn(`User not found for wallet address: ${to}`);
            }

            this.logger.log(`Delayed claim request status updated for ${to} with nonce ${nonce}`);
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
            const existingTransaction = await this.tokenTransactionService.getTransactionByHash(transactionHash);
            if (existingTransaction) {
                this.logger.log(`Mint transaction already recorded for hash ${transactionHash}, skipping duplicate`);
                return;
            }

            // user.token_amount 업데이트
            this.logger.log(`Updating user token_amount: ${to} +${amountDecimal} EXP`);
            try {
                const updatedUser = await this.userService.addTokens(to, amountDecimal);
                this.logger.log(`User token_amount updated successfully: ${updatedUser.tokenAmount} EXP (was: ${user.tokenAmount} EXP)`);
            } catch (addTokensError) {
                this.logger.error(`Failed to update user token_amount: ${addTokensError.message}`);
                throw addTokensError; // 에러 발생 시 전체 처리 중단
            }

            // token_tx 테이블에 mint 기록
            await this.tokenTransactionService.createTransaction({
                userId: user.id,
                transactionType: TransactionType.TRANSFER_IN,
                amount: amountDecimal,
                balanceBefore: (user.tokenAmount || 0) - amountDecimal,
                balanceAfter: (user.tokenAmount || 0) + amountDecimal, // 업데이트된 tokenAmount 반영
                transactionHash,
                blockchainAddress: to,
                description: `Token minted: ${amountDecimal} EXP`,
                metadata: {
                    event_source: 'Transfer',
                    action: 'mint',
                    from: '0x0000000000000000000000000000000000000000'
                },
                referenceType: 'mint'
            });

            this.logger.log(`Mint transaction recorded for user ${user.id}: ${amountDecimal} EXP minted, token_amount updated`);
        } catch (error) {
            this.logger.error(`Failed to handle mint event: ${(error as Error).message}`);
        }
    }

    /**
     * 일반 Transfer 이벤트 처리
     */
    private async handleTransferEvent(from: string, to: string, value: bigint, transactionHash: string): Promise<void> {
        try {
            const amountDecimal = parseFloat(ethers.formatEther(value));

            // PostLikeSystem으로의 전송인지 확인 (좋아요 관련 전송은 PostLiked 이벤트에서 처리)
            const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');
            if (to === postLikeSystemAddress) {
                this.logger.log(`PostLikeSystem transfer detected in ClaimEventService: ${amountDecimal} EXP from ${from} to ${to}`);
                this.logger.log(`Skipping TRANSFER_OUT record - PostLiked event will handle this`);
                return;
            }

            // from 주소의 사용자 조회
            const fromUser = await this.userService.findByWalletAddress(from);
            if (fromUser) {
                // from 사용자의 토큰 차감 기록
                await this.tokenTransactionService.createTransaction({
                    userId: fromUser.id,
                    transactionType: TransactionType.TRANSFER_OUT,
                    amount: -amountDecimal,
                    balanceBefore: (fromUser.tokenAmount || 0) + amountDecimal,
                    balanceAfter: fromUser.tokenAmount || 0,
                    transactionHash,
                    blockchainAddress: from,
                    description: `Token transferred: ${amountDecimal} EXP to ${to}`,
                    metadata: {
                        event_source: 'Transfer',
                        action: 'transfer_out',
                        to: to
                    },
                    referenceType: 'transfer'
                });

                this.logger.log(`Transfer out recorded for user ${fromUser.id}: ${amountDecimal} EXP sent`);
            }

            // to 주소의 사용자 조회
            const toUser = await this.userService.findByWalletAddress(to);
            if (toUser) {
                // 중복 기록 방지: 같은 transactionHash로 REWARD_CLAIM이 이미 기록되었는지 확인
                const existingRewardClaim = await this.tokenTransactionService.getTransactionByHashAndType(
                    transactionHash,
                    TransactionType.REWARD_CLAIM
                );

                if (existingRewardClaim) {
                    this.logger.log(`REWARD_CLAIM already recorded for hash ${transactionHash}, skipping TRANSFER_IN to avoid duplicate`);
                    return;
                }

                // to 사용자의 토큰 증가 기록
                await this.tokenTransactionService.createTransaction({
                    userId: toUser.id,
                    transactionType: TransactionType.TRANSFER_IN,
                    amount: amountDecimal,
                    balanceBefore: (toUser.tokenAmount || 0) - amountDecimal,
                    balanceAfter: toUser.tokenAmount || 0,
                    transactionHash,
                    blockchainAddress: to,
                    description: `Token received: ${amountDecimal} EXP from ${from}`,
                    metadata: {
                        event_source: 'Transfer',
                        action: 'transfer_in',
                        from: from
                    },
                    referenceType: 'transfer'
                });

                this.logger.log(`Transfer in recorded for user ${toUser.id}: ${amountDecimal} EXP received`);
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
            provider: this.provider ? 'Connected' : 'Not connected'
        };
    }
}
