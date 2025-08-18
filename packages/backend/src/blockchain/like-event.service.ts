import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TransactionType } from '../entities/token-transaction.entity';
import { PostLikeService } from '../services/post-like.service';
import { CreateTransactionDto, TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';

@Injectable()
export class LikeEventService implements OnModuleInit {
    private readonly logger = new Logger(LikeEventService.name);
    private provider: ethers.JsonRpcProvider;
    private postLikeContract: ethers.Contract;
    private trivusExpContract: ethers.Contract;
    private isListening: boolean = false;
    private isProcessing: boolean = false; // 중복 처리 방지 플래그
    private reconnectInterval: NodeJS.Timeout;
    private readonly RECONNECT_DELAY = 5000; // 5초
    private lastProcessedBlock: number = 0; // 마지막으로 처리한 블록 번호
    private pollingInterval: NodeJS.Timeout | null = null; // 폴링 인터벌 저장
    private instanceId: string; // 인스턴스 ID 추가
    private processedTransactions = new Set<string>(); // 처리된 트랜잭션 해시 추적

    constructor(
        private configService: ConfigService,
        private postLikeService: PostLikeService,
        private userService: UserService,
        private tokenTransactionService: TokenTransactionService,
    ) {
        this.instanceId = Math.random().toString(36).substring(2, 15); // 인스턴스 ID 생성
    }

    async onModuleInit() {
        await this.initializeBlockchainConnection();
        if (this.postLikeContract) {
            await this.startEventListening();
        }
    }

    private async initializeBlockchainConnection() {
        try {
            const rpcUrl = this.configService.get<string>('blockchain.amoy.rpcUrl');
            const postLikeContractAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');
            const trivusExpContractAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy');

            if (!rpcUrl || !postLikeContractAddress || !trivusExpContractAddress) {
                this.logger.warn('Blockchain configuration incomplete - LikeEventService will not start');
                this.logger.warn(`RPC URL: ${rpcUrl ? 'Set' : 'Not Set'}`);
                this.logger.warn(`PostLikeSystem Address: ${postLikeContractAddress ? 'Set' : 'Not Set'}`);
                this.logger.warn(`TrivusEXP Address: ${trivusExpContractAddress ? 'Set' : 'Not Set'}`);
                return;
            }

            // ENS 에러 방지를 위한 provider 설정
            this.provider = new ethers.JsonRpcProvider(rpcUrl);

            // PostLikeSystem 컨트랙트 ABI
            const postLikeContractABI = [
                // PostLikeEvent 이벤트
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "amount",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "bool",
                            "name": "isLike",
                            "type": "bool"
                        }
                    ],
                    "name": "PostLikeEvent",
                    "type": "event"
                },
                // PostLiked 이벤트
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "totalLikes",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "totalTokensCollected",
                            "type": "uint256"
                        }
                    ],
                    "name": "PostLiked",
                    "type": "event"
                },
                // PostUnliked 이벤트
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        },
                        {
                            "indexed": true,
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "timestamp",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "totalLikes",
                            "type": "uint256"
                        },
                        {
                            "indexed": false,
                            "internalType": "uint256",
                            "name": "totalTokensCollected",
                            "type": "uint256"
                        }
                    ],
                    "name": "PostUnliked",
                    "type": "event"
                }
            ];

            // TrivusEXP 컨트랙트 ABI (Transfer 이벤트만)
            const trivusExpContractABI = [
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

            this.postLikeContract = new ethers.Contract(postLikeContractAddress, postLikeContractABI, this.provider);
            this.trivusExpContract = new ethers.Contract(trivusExpContractAddress, trivusExpContractABI, this.provider);

            this.logger.log(`Blockchain connection initialized successfully`);
            this.logger.log(`PostLikeSystem contract: ${postLikeContractAddress}`);
            this.logger.log(`TrivusEXP contract: ${trivusExpContractAddress}`);
            this.logger.log(`RPC URL: ${rpcUrl}`);

        } catch (error) {
            this.logger.error(`Failed to initialize blockchain connection: ${(error as Error).message}`);
            this.scheduleReconnect();
        }
    }

    private async startEventListening() {
        if (this.isListening) {
            return;
        }

        try {
            this.isListening = true;
            this.logger.log('Starting to listen for like events...');

            // 폴링 방식으로 이벤트 감지 (더 안정적)
            this.startEventPolling();

            this.logger.log('Event listeners configured successfully');
            this.logger.log('Like event listener started successfully');
        } catch (error) {
            this.logger.error(`Failed to start event listening: ${(error as Error).message}`);
            this.isListening = false;
            this.scheduleReconnect();
        }
    }

    private startEventPolling() {
        // 중복 실행 방지
        if (this.pollingInterval) {
            this.logger.warn('Event polling already started, skipping...');
            return;
        }

        // 10초마다 최근 블록에서 이벤트 확인
        this.pollingInterval = setInterval(async () => {
            if (!this.isListening) {
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = null;
                }
                return;
            }

            try {
                await this.pollRecentEvents();
            } catch (error) {
                this.logger.error(`Error polling events: ${(error as Error).message}`);
            }
        }, 5000); // 5초마다 (더 자주 확인)

        this.logger.log(`Event polling started (5 second intervals) - Instance ID: ${this.instanceId}`);
    }

    private async pollRecentEvents() {
        // 중복 실행 방지
        if (this.isProcessing) {
            this.logger.debug('Event processing already in progress, skipping...');
            return;
        }

        try {
            this.isProcessing = true; // 처리 시작 플래그 설정

            const currentBlock = await this.provider.getBlockNumber();

            // 이미 처리한 블록은 건너뛰기
            if (this.lastProcessedBlock >= currentBlock) {
                this.logger.debug(`Block ${currentBlock} already processed, skipping...`);
                return;
            }

            const fromBlock = Math.max(this.lastProcessedBlock + 1, currentBlock - 1); // 마지막 처리 블록 + 1부터
            const toBlock = currentBlock;

            this.logger.log(`Polling events from block ${fromBlock} to ${toBlock}`);

            // 블록 범위가 유효하지 않으면 건너뛰기
            if (fromBlock > toBlock) {
                this.logger.debug(`Invalid block range: fromBlock ${fromBlock} > toBlock ${toBlock}`);
                return;
            }

            // PostLikeEvent 이벤트 폴링 (getLogs 사용으로 필터 오류 방지)
            let postLikeEvents: any[] = [];
            try {
                postLikeEvents = await this.provider.getLogs({
                    address: this.postLikeContract.target,
                    topics: [
                        ethers.id('PostLikeEvent(address,uint256,uint256,bool)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });
            } catch (error) {
                if (error.message && error.message.includes('network does not support ENS')) {
                    this.logger.warn('ENS not supported, skipping PostLikeEvent query');
                } else {
                    this.logger.error(`Failed to query PostLikeEvent: ${error.message}`);
                }
            }

            // PostLiked 이벤트 폴링 (getLogs 사용)
            let postLikedEvents: any[] = [];
            try {
                postLikedEvents = await this.provider.getLogs({
                    address: this.postLikeContract.target,
                    topics: [
                        ethers.id('PostLiked(address,uint256,uint256,uint256,uint256)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });
            } catch (error) {
                if (error.message && error.message.includes('network does not support ENS')) {
                    this.logger.warn('ENS not supported, skipping PostLiked query');
                } else {
                    this.logger.error(`Failed to query PostLiked: ${error.message}`);
                }
            }

            // PostUnliked 이벤트 폴링 (getLogs 사용)
            let postUnlikedEvents: any[] = [];
            try {
                postUnlikedEvents = await this.provider.getLogs({
                    address: this.postLikeContract.target,
                    topics: [
                        ethers.id('PostUnliked(address,uint256,uint256,uint256,uint256)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });
            } catch (error) {
                if (error.message && error.message.includes('network does not support ENS')) {
                    this.logger.warn('ENS not supported, skipping PostUnliked query');
                } else {
                    this.logger.error(`Failed to query PostUnliked: ${error.message}`);
                }
            }

            for (const event of postLikeEvents) {
                try {
                    const parsedEvent = this.postLikeContract.interface.parseLog(event);
                    if (parsedEvent && parsedEvent.args) {
                        await this.handlePostLikeEvent(
                            parsedEvent.args[0] as string, // user
                            parsedEvent.args[1] as bigint, // postId
                            parsedEvent.args[2] as bigint, // amount
                            parsedEvent.args[3] as boolean, // isLike
                            event
                        );
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse PostLikeEvent: ${parseError.message}`);
                }
            }

            // PostLiked 이벤트 처리
            for (const event of postLikedEvents) {
                try {
                    const parsedEvent = this.postLikeContract.interface.parseLog(event);
                    if (parsedEvent && parsedEvent.args) {
                        await this.handlePostLikedEvent(
                            parsedEvent.args[0] as string, // user
                            parsedEvent.args[1] as bigint, // postId
                            parsedEvent.args[2] as bigint, // timestamp
                            parsedEvent.args[3] as bigint, // totalLikes
                            parsedEvent.args[4] as bigint, // totalTokensCollected
                            event
                        );
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse PostLiked: ${parseError.message}`);
                }
            }

            // PostUnliked 이벤트 처리
            for (const event of postUnlikedEvents) {
                try {
                    const parsedEvent = this.postLikeContract.interface.parseLog(event);
                    if (parsedEvent && parsedEvent.args) {
                        await this.handlePostUnlikedEvent(
                            parsedEvent.args[0] as string, // user
                            parsedEvent.args[1] as bigint, // postId
                            parsedEvent.args[2] as bigint, // timestamp
                            parsedEvent.args[3] as bigint, // totalLikes
                            parsedEvent.args[4] as bigint, // totalTokensCollected
                            event
                        );
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse PostUnliked: ${parseError.message}`);
                }
            }

            // Transfer 이벤트 폴링 (getLogs 사용)
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
            } catch (error) {
                if (error.message && error.message.includes('network does not support ENS')) {
                    this.logger.warn('ENS not supported, skipping Transfer query');
                } else {
                    this.logger.error(`Failed to query Transfer: ${error.message}`);
                }
            }

            // Transfer 이벤트 처리
            for (const event of transferEvents) {
                try {
                    const parsedEvent = this.trivusExpContract.interface.parseLog(event);
                    if (parsedEvent && parsedEvent.args) {
                        await this.handleTransferEvent(
                            parsedEvent.args[0] as string, // from
                            parsedEvent.args[1] as string, // to
                            parsedEvent.args[2] as bigint, // value
                            event
                        );
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse Transfer: ${parseError.message}`);
                }
            }

            // 마지막 처리 블록 업데이트
            this.lastProcessedBlock = toBlock;
            this.logger.debug(`Updated lastProcessedBlock to ${this.lastProcessedBlock}`);

        } catch (error) {
            this.logger.error(`Error in event polling: ${(error as Error).message}`);
        } finally {
            this.isProcessing = false; // 처리 완료 플래그 해제
        }
    }



    private scheduleReconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }

        this.logger.log(`Scheduling reconnection in ${this.RECONNECT_DELAY}ms...`);
        this.reconnectInterval = setTimeout(async () => {
            this.logger.log('Attempting to reconnect...');
            await this.reconnect();
        }, this.RECONNECT_DELAY);
    }

    private async reconnect() {
        try {
            this.logger.log('Reconnecting to blockchain...');
            await this.initializeBlockchainConnection();
            if (this.postLikeContract) {
                await this.startEventListening();
            }
        } catch (error) {
            this.logger.error(`Reconnection failed: ${(error as Error).message}`);
            this.scheduleReconnect();
        }
    }

    private async handlePostLikeEvent(user: string, postId: bigint, amount: bigint, isLike: boolean, event: any) {
        const postIdNumber = Number(postId);
        const amountNumber = Number(ethers.formatEther(amount));
        const transactionHash = event.transactionHash;

        this.logger.log(`PostLikeEvent detected: user ${user}, postId ${postIdNumber}, amount ${amountNumber}, isLike ${isLike}`);
        this.logger.log(`Transaction hash: ${transactionHash}`);

        try {
            // 사용자 정보 조회
            const userEntity = await this.userService.findByWalletAddress(user);
            if (!userEntity) {
                this.logger.warn(`User not found for wallet address: ${user}`);
                return;
            }

            if (isLike) {
                // 좋아요 토큰 차감 처리
                await this.postLikeService.processLikeTokenDeduction(
                    userEntity.id,
                    postIdNumber,
                    transactionHash,
                    amountNumber
                );
                this.logger.log(`Like token deduction processed for user: ${userEntity.id}, post: ${postIdNumber}`);

                // token_tx 테이블에 좋아요 토큰 차감 기록
                try {
                    const transactionDto: CreateTransactionDto = {
                        userId: userEntity.id,
                        transactionType: TransactionType.LIKE_DEDUCT,
                        amount: -amountNumber, // 차감이므로 음수
                        balanceBefore: (userEntity.availableToken || 0) + amountNumber,
                        balanceAfter: userEntity.availableToken || 0,
                        transactionHash,
                        blockchainAddress: user,
                        description: `Like token deduction for post ${postIdNumber}`,
                        metadata: {
                            postId: postIdNumber,
                            action: 'like',
                            blockchainEvent: 'PostLikeEvent'
                        },
                        referenceId: postIdNumber.toString(),
                        referenceType: 'post_like'
                    };

                    await this.tokenTransactionService.createTransaction(transactionDto);
                    this.logger.log(`Token transaction recorded for like: user ${userEntity.id}, post ${postIdNumber}, amount ${amountNumber}`);
                } catch (txError) {
                    this.logger.error(`Failed to record like token transaction: ${txError.message}`);
                }

            } else {
                // 좋아요 취소 토큰 반환 처리
                await this.postLikeService.processLikeTokenRefund(
                    userEntity.id,
                    postIdNumber,
                    transactionHash,
                    amountNumber
                );
                this.logger.log(`Like token refund processed for user: ${userEntity.id}, post: ${postIdNumber}`);

                // token_tx 테이블에 좋아요 취소 토큰 반환 기록
                try {
                    const transactionDto: CreateTransactionDto = {
                        userId: userEntity.id,
                        transactionType: TransactionType.LIKE_REFUND,
                        amount: amountNumber, // 반환이므로 양수
                        balanceBefore: (userEntity.availableToken || 0) - amountNumber,
                        balanceAfter: userEntity.availableToken || 0,
                        transactionHash,
                        blockchainAddress: user,
                        description: `Like token refund for post ${postIdNumber}`,
                        metadata: {
                            postId: postIdNumber,
                            action: 'unlike',
                            blockchainEvent: 'PostLikeEvent'
                        },
                        referenceId: postIdNumber.toString(),
                        referenceType: 'post_like'
                    };

                    await this.tokenTransactionService.createTransaction(transactionDto);
                    this.logger.log(`Token transaction recorded for unlike: user ${userEntity.id}, post ${postIdNumber}, amount ${amountNumber}`);
                } catch (txError) {
                    this.logger.error(`Failed to record unlike token transaction: ${txError.message}`);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to process PostLikeEvent: ${(error as Error).message}`);
        }
    }

    private async handlePostLikedEvent(user: string, postId: bigint, timestamp: bigint, totalLikes: bigint, totalTokensCollected: bigint, event: any) {
        this.logger.log(`PostLiked event detected: user ${user}, postId ${Number(postId)}, totalLikes ${Number(totalLikes)}, totalTokens ${ethers.formatEther(totalTokensCollected)}`);

        // 추가적인 로직이 필요한 경우 여기에 구현
    }

    private async handlePostUnlikedEvent(user: string, postId: bigint, timestamp: bigint, totalLikes: bigint, totalTokensCollected: bigint, event: any) {
        this.logger.log(`PostUnliked event detected: user ${user}, postId ${Number(postId)}, totalLikes ${Number(totalLikes)}, totalTokens ${ethers.formatEther(totalTokensCollected)}`);

        // 추가적인 로직이 필요한 경우 여기에 구현
    }

    private async handleTransferEvent(from: string, to: string, value: bigint, event: any) {
        const amount = ethers.formatEther(value);
        const blockNumber = event.blockNumber;
        const transactionHash = event.transactionHash;

        // 이미 처리된 트랜잭션이면 건너뛰기
        if (this.processedTransactions.has(transactionHash)) {
            this.logger.debug(`Transaction ${transactionHash} already processed, skipping...`);
            return;
        }

        this.logger.log(`Transfer event detected: ${amount} tokens from ${from} to ${to}`);
        this.logger.log(`Block: ${blockNumber}, TX: ${transactionHash}`);

        // 좋아요 관련 토큰 이동인지 확인
        if (this.isLikeRelatedTransfer(from, to, amount)) {
            this.logger.log(`Processing like token transfer: ${amount} tokens from ${from} to ${to}`);
            await this.processLikeTokenTransfer(from, to, amount, transactionHash);
        }

        // 처리된 트랜잭션 해시 기록
        this.processedTransactions.add(transactionHash);
    }

    private async processLikeTokenTransfer(from: string, to: string, amount: string, transactionHash: string) {
        try {
            this.logger.log(`=== START processLikeTokenTransfer ===`);
            this.logger.log(`Instance ID: ${this.instanceId}, Processing: ${this.isProcessing}`);
            this.logger.log(`Processing like token transfer: ${amount} tokens from ${from} to ${to}`);

            // 사용자 정보 조회
            const user = await this.userService.findByWalletAddress(from);
            if (!user) {
                this.logger.warn(`User not found for wallet address: ${from}`);
                return;
            }

            this.logger.log(`User found: ID ${user.id}, Available Token: ${user.availableToken}`);

            // PostLikeSystem 컨트랙트 주소 확인
            const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');
            const postLikeReceiverAddress = this.configService.get<string>('blockchain.contracts.postLikeReceiver.amoy');

            // 좋아요 처리 (PostLikeSystem 또는 PostLikeReceiver로의 전송)
            if (to === postLikeSystemAddress || to === postLikeReceiverAddress) {
                // 임시로 postId를 1로 설정 (실제로는 블록체인에서 postId를 추출해야 함)
                const postId = 1; // TODO: 블록체인 데이터에서 postId 추출

                this.logger.log(`Processing like for user ${user.id}, post ${postId}, amount ${amount}`);

                // post_like 테이블에 좋아요 기록 추가 및 토큰 차감
                await this.postLikeService.processLikeTokenDeduction(
                    user.id, // 사용자 ID를 명시적으로 전달
                    postId,
                    transactionHash,
                    parseFloat(amount)
                );

                this.logger.log(`Post like created for user ${user.id}, post ${postId}`);

                // PostLikeService에서 이미 토큰 거래 내역을 기록하므로 여기서는 추가로 기록하지 않음
                return;
            }

            // PostLikeSystem으로의 전송이 아닌 경우에만 여기서 처리
            this.logger.log(`Non-PostLikeSystem transfer, processing as regular transfer...`);

            // 블록체인 이벤트를 토큰 거래 내역에 기록
            const transactionDto: CreateTransactionDto = {
                userId: user.id, // 명시적으로 userId 설정
                transactionType: TransactionType.LIKE_DEDUCT,
                amount: -parseFloat(amount), // 차감이므로 음수
                balanceBefore: user.availableToken + parseFloat(amount), // 차감 전 잔액
                balanceAfter: user.availableToken, // 현재 잔액
                transactionHash,
                description: `Blockchain like token transfer: ${amount} tokens deducted`,
                metadata: {
                    blockchainEvent: 'Transfer',
                    from,
                    to,
                    amount,
                    action: 'blockchain_like_deduct',
                },
                referenceType: 'blockchain_event',
            };

            await this.tokenTransactionService.createTransaction(transactionDto);

            this.logger.log(`Like token transfer processed and recorded for user: ${user.id}`);
        } catch (error) {
            this.logger.error(`Failed to process like token transfer: ${(error as Error).message}`);
        }
    }

    private isLikeRelatedTransfer(from: string, to: string, amount: string): boolean {
        // PostLikeSystem 컨트랙트 주소 확인
        const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');

        // PostLikeSystem 컨트랙트로의 토큰 이동인지 확인
        if (to === postLikeSystemAddress) {
            return true;
        }

        return false;
    }

    // 서비스 상태 조회 메서드
    getServiceStatus() {
        return {
            isListening: this.isListening,
            isConnected: !!this.provider && !!this.postLikeContract && !!this.trivusExpContract,
            postLikeContractAddress: this.postLikeContract?.target?.toString() || 'Not connected',
            trivusExpContractAddress: this.trivusExpContract?.target?.toString() || 'Not connected',
            rpcUrl: 'Connected',
            lastReconnectAttempt: this.reconnectInterval ? 'Scheduled' : 'None',
        };
    }

    // 서비스 중지 메서드
    async stopService() {
        this.logger.log('Stopping LikeEventService...');

        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
        }

        if (this.pollingInterval) { // 폴링 인터벌도 중지
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.postLikeContract) {
            this.postLikeContract.removeAllListeners();
        }

        if (this.trivusExpContract) {
            this.trivusExpContract.removeAllListeners();
        }

        this.isListening = false;
        this.logger.log('LikeEventService stopped');
    }
}
