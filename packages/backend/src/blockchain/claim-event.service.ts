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

            // TrivusEXP 컨트랙트 ABI (ClaimExecuted 이벤트 포함)
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
                    this.logger.log(`Found ${claimEvents.length} ClaimExecuted events in blocks ${fromBlock}-${toBlock}`);
                }
            } catch (error) {
                this.logger.error(`Failed to get logs for ClaimExecuted: ${error.message}`);
                return;
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

                    // DB에서 claim request 상태 업데이트
                    await this.claimRequestService.updateClaimStatus(
                        to,
                        nonce,
                        ClaimStatus.EXECUTED,
                        log.transactionHash
                    );

                    // token_tx 테이블에 토큰 이동 내역 기록
                    try {
                        const user = await this.userService.findByWalletAddress(to);
                        if (user) {
                            const amountDecimal = parseFloat(ethers.formatEther(amount));

                            // 사용자의 토큰 정보 업데이트 (availableToken에서 tokenAmount로 이동)
                            await this.userService.syncTokenAmount(to, amountDecimal);

                            // 토큰 거래 내역 기록
                            await this.tokenTransactionService.createTransaction({
                                userId: user.id,
                                transactionType: TransactionType.REWARD_CLAIM,
                                amount: amountDecimal,
                                balanceBefore: user.tokenAmount || 0,
                                balanceAfter: (user.tokenAmount || 0) + amountDecimal,
                                transactionHash: log.transactionHash,
                                blockchainAddress: to,
                                description: `Token claim executed for nonce ${nonce}`,
                                metadata: {
                                    nonce: nonce.toString(),
                                    claim_type: 'bulk_claim',
                                    deadline: deadline.toString(),
                                    event_source: 'ClaimExecuted'
                                },
                                referenceId: nonce.toString(),
                                referenceType: 'claim_request'
                            });

                            this.logger.log(`Token transaction recorded for user ${user.id}: ${amountDecimal} EXP claimed`);
                        } else {
                            this.logger.warn(`User not found for wallet address: ${to}`);
                        }
                    } catch (txError) {
                        this.logger.error(`Failed to record token transaction: ${txError.message}`);
                    }

                    this.logger.log(`Claim request status updated for ${to} with nonce ${nonce}`);
                } catch (parseError) {
                    this.logger.warn(`Failed to parse ClaimExecuted: ${parseError.message}`);
                }
            }

            this.lastProcessedBlock = toBlock;
        } catch (error) {
            this.logger.error(`Failed to get current block number for polling: ${(error as Error).message}`);
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
