import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { TransactionType } from '../entities/token-transaction.entity';
import { PostLikeService } from '../services/post-like.service';
import { CreateTransactionDto, TokenTransactionService } from '../services/token-transaction.service';
import { UserService } from '../services/user.service';
import { ClaimEventService } from './claim-event.service';

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
        private claimEventService: ClaimEventService, // ClaimEventService 주입
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
                            "internalType": "uint256",
                            "name": "postId",
                            "type": "uint256"
                        },
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "user",
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
                            "name": "timestamp",
                            "type": "uint256"
                        }
                    ],
                    "name": "PostLiked",
                    "type": "event"
                },
                // PostUnliked 이벤트 (사용하지 않음 - unlike 기능 제거됨)
                // {
                //     "anonymous": false,
                //     "inputs": [
                //         {
                //             "indexed": true,
                //             "internalType": "address",
                //             "name": "user",
                //             "type": "address"
                //         },
                //         {
                //             "indexed": true,
                //             "internalType": "uint256",
                //             "name": "postId",
                //             "type": "uint256"
                //         },
                //         {
                //             "indexed": false,
                //             "internalType": "uint256",
                //             "name": "timestamp",
                //             "type": "uint256"
                //         },
                //         {
                //             "indexed": false,
                //             "internalType": "uint256",
                //             "name": "totalLikes",
                //             "type": "uint256"
                //         },
                //         {
                //             "indexed": false,
                //             "internalType": "uint256",
                //             "name": "totalTokensCollected",
                //             "type": "uint256"
                //         }
                //     ],
                //     "name": "PostUnliked",
                //     "type": "event"
                // },
                // TokensClaimed 이벤트 (PostLikeSystem1363의 claimWithSignature에서 emit)
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
                            "internalType": "bytes",
                            "name": "signature",
                            "type": "bytes"
                        }
                    ],
                    "name": "TokensClaimed",
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

        // 10초마다 최근 블록에서 이벤트 확인 (빠른 감지를 위해)
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
        }, 10000); // 10초마다 (빠른 감지를 위해)

        this.logger.log(`Event polling started (10 second intervals) - Instance ID: ${this.instanceId}`);
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
            this.logger.log(`🔄 Polling events: currentBlock=${currentBlock}, lastProcessedBlock=${this.lastProcessedBlock}`);

            // 이미 처리한 블록은 건너뛰기
            if (this.lastProcessedBlock >= currentBlock) {
                this.logger.log(`⏭️ Skipping: already processed up to block ${this.lastProcessedBlock}`);
                return;
            }

            // 백엔드 시작 시 더 넓은 범위로 검색 (이미 발생한 이벤트들을 놓치지 않도록)
            const searchRange = this.lastProcessedBlock === 0 ? 1000 : 100; // 초기 검색 시 1000블록, 이후 100블록
            const fromBlock = Math.max(this.lastProcessedBlock + 1, currentBlock - searchRange);
            const toBlock = currentBlock;

            this.logger.log(`📊 Block range: ${fromBlock} ~ ${toBlock} (${toBlock - fromBlock + 1} blocks)`);

            // 블록 범위가 유효하지 않으면 건너뛰기
            if (fromBlock > toBlock) {
                this.logger.warn(`⚠️ Invalid block range: fromBlock=${fromBlock} > toBlock=${toBlock}`);
                return;
            }



            // PostLikeEvent는 더 이상 사용되지 않음 - PostLiked 이벤트만 처리
            // let postLikeEvents: any[] = [];
            // try {
            //     postLikeEvents = await this.provider.getLogs({
            //         address: this.postLikeContract.target,
            //         topics: [
            //         ethers.id('PostLikeEvent(address,uint256,uint256,bool)')
            //         ],
            //         fromBlock: fromBlock,
            //         toBlock: toBlock
            //     });

            //     if (postLikeEvents.length > 0) {
            //         this.logger.log(`Found ${postLikeEvents.length} PostLikeEvent(s)`);
            //     }
            // } catch (error) {
            //     if (error.message && error.message.includes('network does not support ENS')) {
            //         this.logger.warn('ENS not supported, skipping PostLikeEvent query');
            //     } else {
            //         this.logger.error(`Failed to query PostLikeEvent: ${error.message}`);
            //     }
            // }

            // PostLiked 이벤트 폴링 (getLogs 사용)
            let postLikedEvents: any[] = [];
            try {
                this.logger.log(`🔍 PostLiked 이벤트 검색 중: 블록 ${fromBlock} ~ ${toBlock}`);

                postLikedEvents = await this.provider.getLogs({
                    address: this.postLikeContract.target,
                    topics: [
                        ethers.id('PostLiked(uint256,address,uint256,uint256)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });

                if (postLikedEvents.length > 0) {
                    this.logger.log(`✅ Found ${postLikedEvents.length} PostLiked event(s)`);
                } else {
                    this.logger.log(`ℹ️ No PostLiked events found in block range ${fromBlock} ~ ${toBlock}`);
                }
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



            // PostLikeEvent는 더 이상 사용되지 않음 - PostLiked 이벤트만 처리
            // for (const event of postLikeEvents) {
            //     try {
            //         const parsedEvent = this.postLikeContract.interface.parseLog(event);
            //         if (parsedEvent && parsedEvent.args) {
            //             await this.handlePostLikeEvent(
            //                 parsedEvent.args[1] as string, // user (address)
            //                 parsedEvent.args[0] as bigint, // postId (uint256)
            //                 parsedEvent.args[2] as bigint, // amount (uint256)
            //                 true, // isLike (PostLiked는 항상 true)
            //                 event
            //             );
            //         }
            //     } catch (parseError) {
            //         this.logger.warn(`Failed to parse PostLikeEvent: ${parseError.message}`);
            //     }
            // }

            // PostLiked 이벤트 처리
            if (postLikedEvents.length > 0) {
                this.logger.log(`🔄 Processing ${postLikedEvents.length} PostLiked event(s)...`);
            }

            for (const event of postLikedEvents) {
                try {
                    this.logger.log(`📋 Processing PostLiked event: block ${event.blockNumber}, tx ${event.transactionHash}`);
                    this.logger.log(`🔍 Event data: ${JSON.stringify(event)}`);

                    const parsedEvent = this.postLikeContract.interface.parseLog(event);
                    this.logger.log(`🔍 Parsed event: ${JSON.stringify(parsedEvent)}`);

                    if (parsedEvent && parsedEvent.args) {
                        this.logger.log(`✅ PostLiked event parsed successfully: postId=${parsedEvent.args[0]}, user=${parsedEvent.args[1]}, amount=${parsedEvent.args[2]}, timestamp=${parsedEvent.args[3]}`);

                        this.logger.log(`🚀 Calling handlePostLikedEvent...`);
                        await this.handlePostLikedEvent(
                            parsedEvent.args[0] as bigint, // postId ✅ (올바름)
                            parsedEvent.args[1] as string, // user ✅ (올바름)
                            parsedEvent.args[2] as bigint, // amount ✅ (올바름)
                            parsedEvent.args[3] as bigint, // timestamp ✅ (올바름)
                            event
                        );
                        this.logger.log(`✅ handlePostLikedEvent completed successfully`);
                    } else {
                        this.logger.error(`❌ Parsed event is null or has no args: parsedEvent=${parsedEvent}`);
                    }
                } catch (parseError) {
                    this.logger.error(`❌ Failed to parse PostLiked: ${parseError.message}`);
                    this.logger.error(`❌ Parse error stack: ${parseError.stack}`);
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

            // TokensClaimed 이벤트 폴링 (PostLikeSystem1363의 claimWithSignature에서 emit)
            let tokensClaimedEvents: any[] = [];
            try {
                tokensClaimedEvents = await this.provider.getLogs({
                    address: this.postLikeContract.target,
                    topics: [
                        ethers.id('TokensClaimed(address,uint256,uint256,bytes)')
                    ],
                    fromBlock: fromBlock,
                    toBlock: toBlock
                });

                if (tokensClaimedEvents.length > 0) {
                    this.logger.log(`✅ Found ${tokensClaimedEvents.length} TokensClaimed event(s)`);
                }
            } catch (error) {
                if (error.message && error.message.includes('network does not support ENS')) {
                    this.logger.warn('ENS not supported, skipping TokensClaimed query');
                } else {
                    this.logger.error(`Failed to query TokensClaimed: ${error.message}`);
                }
            }

            // TokensClaimed 이벤트 처리
            for (const event of tokensClaimedEvents) {
                try {
                    const parsedEvent = this.postLikeContract.interface.parseLog(event);
                    if (parsedEvent && parsedEvent.args) {
                        await this.handleTokensClaimedEvent(
                            parsedEvent.args[0] as string, // to
                            parsedEvent.args[1] as bigint, // postId
                            parsedEvent.args[2] as bigint, // amount
                            parsedEvent.args[3] as string, // signature
                            event
                        );
                    }
                } catch (parseError) {
                    this.logger.warn(`Failed to parse TokensClaimed: ${parseError.message}`);
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
                // 좋아요 토큰 차감 처리 - tokenAmount에서 차감
                await this.userService.deductTokens(user, amountNumber);

                // post_like 테이블에 좋아요 기록
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
                        balanceBefore: (userEntity.tokenAmount || 0) + amountNumber, // 차감 전 tokenAmount
                        balanceAfter: (userEntity.tokenAmount || 0), // 차감 후 tokenAmount
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
                // 좋아요 취소는 지원하지 않음 (토큰이 걸려있어서 복잡함)
                this.logger.warn(`Unlike event detected but not processed: user ${user}, post ${postIdNumber}`);
            }
        } catch (error) {
            this.logger.error(`Failed to process PostLikeEvent: ${(error as Error).message}`);
        }
    }

    private async handlePostLikedEvent(postId: bigint, user: string, amount: bigint, timestamp: bigint, event: any) {
        this.logger.log(`PostLiked event detected: postId ${Number(postId)}, user ${user}, amount ${ethers.formatEther(amount)} EXP, timestamp ${Number(timestamp)}`);

        // PostLiked 이벤트 처리 로직 구현
        try {
            const postIdNumber = Number(postId);
            const amountNumber = Number(ethers.formatEther(amount));
            const transactionHash = event.transactionHash;

            this.logger.log(`Processing PostLiked event: postId=${postIdNumber}, user=${user}, amount=${amountNumber} EXP`);

            // 사용자 정보 조회
            const userEntity = await this.userService.findByWalletAddress(user);
            if (!userEntity) {
                this.logger.warn(`User not found for wallet address: ${user}`);
                return;
            }

            // post_like 테이블에 좋아요 기록 생성
            try {
                await this.postLikeService.processLikeTokenDeduction(
                    userEntity.id,
                    postIdNumber,
                    transactionHash,
                    amountNumber
                );
                this.logger.log(`Post like record created: user ${userEntity.id} -> post ${postIdNumber}`);
            } catch (likeError) {
                this.logger.error(`Failed to create post like record: ${likeError.message}`);
            }

            // token_tx 테이블에 LIKE_DEDUCT 기록
            try {
                const transactionDto: CreateTransactionDto = {
                    userId: userEntity.id,
                    transactionType: TransactionType.LIKE_DEDUCT,
                    amount: -amountNumber, // 차감이므로 음수
                    balanceBefore: userEntity.tokenAmount || 0,
                    balanceAfter: (userEntity.tokenAmount || 0) - amountNumber,
                    transactionHash,
                    blockchainAddress: user,
                    description: `Like payment for post ${postIdNumber}: ${amountNumber} EXP`,
                    metadata: {
                        postId: postIdNumber,
                        action: 'like',
                        blockchainEvent: 'PostLiked'
                    },
                    referenceId: postIdNumber.toString(),
                    referenceType: 'post_like'
                };

                await this.tokenTransactionService.createTransaction(transactionDto);
                this.logger.log(`Like token transaction recorded: user ${userEntity.id}, post ${postIdNumber}, amount ${amountNumber} EXP`);
            } catch (txError) {
                this.logger.error(`Failed to record like token transaction: ${txError.message}`);
            }

        } catch (error) {
            this.logger.error(`Failed to process PostLiked event: ${(error as Error).message}`);
        }
    }

    private async handlePostUnlikedEvent(user: string, postId: bigint, timestamp: bigint, totalLikes: bigint, totalTokensCollected: bigint, event: any) {
        this.logger.log(`PostUnliked event detected: user ${user}, postId ${Number(postId)}, totalLikes ${Number(totalLikes)}, totalTokens ${ethers.formatEther(totalTokensCollected)}`);

        // Unlike 기능은 제거됨 - 로그만 남기고 처리하지 않음
        this.logger.warn(`Unlike functionality has been removed. Skipping processing for user ${user}, post ${Number(postId)}`);
    }



    /**
     * TokensClaimed 이벤트 처리 (PostLikeSystem1363의 claimWithSignature에서 emit)
     */
    private async handleTokensClaimedEvent(to: string, postId: bigint, amount: bigint, signature: string, event: any) {
        const postIdNumber = Number(postId);
        const amountNumber = Number(ethers.formatEther(amount));
        const transactionHash = event.transactionHash;

        this.logger.log(`TokensClaimed event detected: to ${to}, postId ${postIdNumber}, amount ${amountNumber}`);
        this.logger.log(`Transaction hash: ${transactionHash}`);

        try {
            // 사용자 정보 조회
            const userEntity = await this.userService.findByWalletAddress(to);
            if (!userEntity) {
                this.logger.warn(`User not found for wallet address: ${to}`);
                return;
            }

            // 사용자의 토큰 정보 업데이트 (availableToken에서 tokenAmount로 이동)
            await this.userService.syncTokenAmount(to, amountNumber);

            // 중복 기록 방지: 같은 transactionHash로 TRANSFER_IN이 이미 기록되었는지 확인
            const existingTransferIn = await this.tokenTransactionService.getTransactionByHashAndType(
                transactionHash,
                TransactionType.TRANSFER_IN
            );

            if (existingTransferIn) {
                this.logger.log(`TRANSFER_IN already recorded for hash ${transactionHash}, skipping REWARD_CLAIM to avoid duplicate`);
                return;
            }

            // token_tx 테이블에 토큰 주입 기록
            try {
                const transactionDto: CreateTransactionDto = {
                    userId: userEntity.id,
                    transactionType: TransactionType.REWARD_CLAIM,
                    amount: amountNumber, // 주입이므로 양수
                    balanceBefore: (userEntity.availableToken || 0) - amountNumber,
                    balanceAfter: userEntity.availableToken || 0,
                    transactionHash,
                    blockchainAddress: to,
                    description: `Like token claim for post ${postIdNumber}`,
                    metadata: {
                        postId: postIdNumber,
                        action: 'claim',
                        blockchainEvent: 'TokensClaimed'
                    },
                    referenceId: postIdNumber.toString(),
                    referenceType: 'post_like'
                };

                await this.tokenTransactionService.createTransaction(transactionDto);
                this.logger.log(`Token transaction recorded for claim: user ${userEntity.id}, post ${postIdNumber}, amount ${amountNumber}`);
            } catch (txError) {
                this.logger.error(`Failed to record like token claim transaction: ${txError.message}`);
            }
        } catch (error) {
            this.logger.error(`Failed to process TokensClaimed: ${(error as Error).message}`);
        }
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
            this.logger.log(`PostLikeSystem transfer detected in LikeEventService: ${amount} tokens from ${from} to ${to}`);
            this.logger.log(`Skipping TRANSFER_OUT record - PostLiked event will handle this`);
            // PostLikeSystem으로의 전송은 PostLiked 이벤트에서 처리하므로 여기서는 아무것도 하지 않음
            return;
        }

        // 처리된 트랜잭션 해시 기록
        this.processedTransactions.add(transactionHash);
    }

    // processLikeTokenTransfer 메서드는 더 이상 사용되지 않음
    // PostLikeSystem으로의 전송은 PostLiked 이벤트에서 처리됨
    // private async processLikeTokenTransfer(from: string, to: string, amount: string, transactionHash: string) { ... }

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
