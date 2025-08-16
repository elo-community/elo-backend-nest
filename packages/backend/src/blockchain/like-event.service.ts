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
    private reconnectInterval: NodeJS.Timeout;
    private readonly RECONNECT_DELAY = 5000; // 5초

    constructor(
        private configService: ConfigService,
        private postLikeService: PostLikeService,
        private userService: UserService,
        private tokenTransactionService: TokenTransactionService,
    ) { }

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
                },
                // TokensWithdrawn 이벤트
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "postAuthor",
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
                            "internalType": "uint256",
                            "name": "remainingTokens",
                            "type": "uint256"
                        }
                    ],
                    "name": "TokensWithdrawn",
                    "type": "event"
                },
                // View 함수들
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        }
                    ],
                    "name": "getPostLikeInfo",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "totalLikes",
                            "type": "uint256"
                        },
                        {
                            "internalType": "uint256",
                            "name": "totalTokensCollected",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        },
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        }
                    ],
                    "name": "getUserLikeInfo",
                    "outputs": [
                        {
                            "internalType": "bool",
                            "name": "hasLiked",
                            "type": "bool"
                        },
                        {
                            "internalType": "uint256",
                            "name": "likeTimestamp",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        }
                    ],
                    "name": "getUserAllowance",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "allowance",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "address",
                            "name": "user",
                            "type": "address"
                        }
                    ],
                    "name": "getRequiredAllowance",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "requiredAllowance",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "TOKEN_AMOUNT",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
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
        // 10초마다 최근 블록에서 이벤트 확인
        const pollInterval = setInterval(async () => {
            if (!this.isListening) {
                clearInterval(pollInterval);
                return;
            }

            try {
                await this.pollRecentEvents();
            } catch (error) {
                this.logger.error(`Error polling events: ${(error as Error).message}`);
            }
        }, 10000); // 10초마다

        this.logger.log('Event polling started (10 second intervals)');
    }

    private async pollRecentEvents() {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const fromBlock = currentBlock - 10; // 최근 10개 블록 확인

            this.logger.log(`Polling events from block ${fromBlock} to ${currentBlock}`);

            // PostLikeSystem 이벤트 폴링
            const postLikeEvents = await this.postLikeContract.queryFilter('PostLikeEvent', fromBlock, currentBlock);
            for (const event of postLikeEvents) {
                if ('args' in event && event.args) {
                    await this.handlePostLikeEvent(
                        event.args[0] as string, // user
                        event.args[1] as bigint, // postId
                        event.args[2] as bigint, // amount
                        event.args[3] as boolean, // isLike
                        event
                    );
                }
            }

            // PostLiked 이벤트 폴링
            const postLikedEvents = await this.postLikeContract.queryFilter('PostLiked', fromBlock, currentBlock);
            for (const event of postLikedEvents) {
                if ('args' in event && event.args) {
                    await this.handlePostLikedEvent(
                        event.args[0] as string, // user
                        event.args[1] as bigint, // postId
                        event.args[2] as bigint, // timestamp
                        event.args[3] as bigint, // totalLikes
                        event.args[4] as bigint, // totalTokensCollected
                        event
                    );
                }
            }

            // PostUnliked 이벤트 폴링
            const postUnlikedEvents = await this.postLikeContract.queryFilter('PostUnliked', fromBlock, currentBlock);
            for (const event of postUnlikedEvents) {
                if ('args' in event && event.args) {
                    await this.handlePostUnlikedEvent(
                        event.args[0] as string, // user
                        event.args[1] as bigint, // postId
                        event.args[2] as bigint, // timestamp
                        event.args[3] as bigint, // totalLikes
                        event.args[4] as bigint, // totalTokensCollected
                        event
                    );
                }
            }

            // Transfer 이벤트 폴링 (PostLikeSystem 관련만)
            const transferEvents = await this.trivusExpContract.queryFilter('Transfer', fromBlock, currentBlock);
            for (const event of transferEvents) {
                if ('args' in event && event.args) {
                    const from = event.args[0] as string;
                    const to = event.args[1] as string;
                    const value = event.args[2] as bigint;

                    // PostLikeSystem과 관련된 Transfer만 처리
                    if (this.isLikeRelatedTransfer(from, to, ethers.formatEther(value))) {
                        await this.handleTransferEvent(from, to, value, event);
                    }
                }
            }

            if (postLikeEvents.length > 0 || postLikedEvents.length > 0 || postUnlikedEvents.length > 0) {
                this.logger.log(`Processed ${postLikeEvents.length + postLikedEvents.length + postUnlikedEvents.length} events`);
            }

        } catch (error) {
            this.logger.error(`Error in event polling: ${(error as Error).message}`);
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
            } else {
                // 좋아요 취소 토큰 반환 처리
                await this.postLikeService.processLikeTokenRefund(
                    userEntity.id,
                    postIdNumber,
                    transactionHash,
                    amountNumber
                );
                this.logger.log(`Like token refund processed for user: ${userEntity.id}, post: ${postIdNumber}`);
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

        this.logger.log(`Transfer event detected: ${amount} tokens from ${from} to ${to}`);
        this.logger.log(`Block: ${blockNumber}, TX: ${transactionHash}`);

        // 좋아요 관련 토큰 이동인지 확인
        if (this.isLikeRelatedTransfer(from, to, amount)) {
            await this.processLikeTokenTransfer(from, to, amount, transactionHash);
        }
    }

    private async processLikeTokenTransfer(from: string, to: string, amount: string, transactionHash: string) {
        try {
            this.logger.log(`Processing like token transfer: ${amount} tokens from ${from} to ${to}`);

            // 사용자 정보 조회
            const user = await this.userService.findByWalletAddress(from);
            if (!user) {
                this.logger.warn(`User not found for wallet address: ${from}`);
                return;
            }

            // 블록체인 이벤트를 토큰 거래 내역에 기록
            const transactionDto: CreateTransactionDto = {
                userId: user.id,
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

        // PostLikeSystem 컨트랙트에서의 토큰 이동인지 확인
        if (from === postLikeSystemAddress) {
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
