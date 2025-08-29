import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { SportCategory } from '../entities/sport-category.entity';
import { TransactionType } from '../entities/token-transaction.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
import { TokenAccumulationService } from './token-accumulation.service';
import { TokenTransactionService } from './token-transaction.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserElo)
        private readonly userEloRepository: Repository<UserElo>,
        private readonly tokenAccumulationService: TokenAccumulationService,
        // TrivusExpService는 순환 참조로 인해 제거, 직접 블록체인 접근으로 대체
        private readonly tokenTransactionService: TokenTransactionService,
        private readonly configService: ConfigService,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByWalletUserId(walletUserId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { walletUserId } });
    }

    async findByWalletAddress(walletAddress: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { walletAddress } });
    }

    async findOne(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }

    async createWithDefaultElos(data: Partial<User>, sportCategories: SportCategory[]): Promise<User> {
        const user = await this.create(data);
        // 더 이상 기본 elo를 생성하지 않음
        return user;
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async remove(id: number): Promise<DeleteResult> {
        return this.userRepository.delete(id);
    }

    async update(id: number, data: Partial<User>): Promise<User | null> {
        await this.userRepository.update(id, data);
        return this.userRepository.findOne({ where: { id } });
    }

    async findProfileWithElos(userId: number): Promise<{ user: User; userElos: UserElo[] }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userElos', 'userElos.sportCategory']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            user,
            userElos: user.userElos || []
        };
    }

    /**
     * 사용자의 특정 스포츠 Elo 조회 (없으면 null 반환)
     */
    async findUserElo(userId: number, sportCategoryId: number): Promise<UserElo | null> {
        return this.userEloRepository.findOne({
            where: { user: { id: userId }, sportCategory: { id: sportCategoryId } },
            relations: ['sportCategory']
        });
    }

    /**
 * 사용자의 특정 스포츠 Elo 생성 (초기값 1400)
 */
    async createUserElo(userId: number, sportCategoryId: number): Promise<UserElo> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const userElo = this.userEloRepository.create({
            user,
            sportCategory: { id: sportCategoryId },
            eloPoint: 1400,
            tier: 'BRONZE',
            percentile: 50.0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0
        });

        return this.userEloRepository.save(userElo);
    }

    /**
     * 사용자의 특정 스포츠 Elo 조회 또는 생성 (초기값 1400)
     */
    async findOrCreateUserElo(userId: number, sportCategoryId: number): Promise<UserElo> {
        let userElo = await this.findUserElo(userId, sportCategoryId);

        if (!userElo) {
            userElo = await this.createUserElo(userId, sportCategoryId);
        }

        return userElo;
    }

    /**
     * 사용자의 수확 가능한 토큰 업데이트 (DB accumulation에서 자동 계산)
     */
    async updateAvailableTokens(walletAddress: string): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // TokenAccumulation에서 수확 가능한 토큰 양 조회
        const availableAmount = await this.tokenAccumulationService.getTotalAccumulatedAmount(walletAddress);

        // 튜토리얼 보상은 이미 EXP 단위로 저장되어 있음 (wei 변환 불필요)
        // 다른 보상 타입과 구분하여 처리
        const availableTokens = availableAmount ? parseFloat(availableAmount) : 0;

        console.log(`[UserService] updateAvailableTokens: walletAddress=${walletAddress}, availableAmount=${availableAmount}, availableTokens=${availableTokens}`);

        // availableToken 업데이트
        await this.userRepository.update(user.id, {
            availableToken: availableTokens
        });

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        return updatedUser;
    }

    /**
     * 사용자의 전체 토큰 동기화 (수확한 토큰을 tokenAmount에 반영)
     */
    async syncTokenAmount(walletAddress: string, claimedAmount: number): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // tokenAmount에 수확한 토큰 추가 (명시적으로 숫자로 변환)
        const currentTokenAmount = parseFloat(user.tokenAmount?.toString() || '0');
        const newTokenAmount = currentTokenAmount + claimedAmount;

        // availableToken에서 수확한 토큰 차감 (명시적으로 숫자로 변환)
        const currentAvailableToken = parseFloat(user.availableToken?.toString() || '0');
        const newAvailableToken = Math.max(0, currentAvailableToken - claimedAmount);

        // 트랜잭션을 명시적으로 관리
        await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.update(User, user.id, {
                tokenAmount: newTokenAmount,
                availableToken: newAvailableToken
            });
        });

        // 업데이트 후 잠시 대기 후 조회 (DB 반영 시간 고려)
        await new Promise(resolve => setTimeout(resolve, 100));

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        console.log(`[UserService] Token synchronized: ${walletAddress} +${claimedAmount} EXP`);

        return updatedUser;
    }

    /**
     * 사용자의 availableToken을 직접 설정 (claim 처리 시 사용)
     */
    async updateAvailableTokenDirectly(walletAddress: string, newAvailableToken: number): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 트랜잭션을 명시적으로 관리
        await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.update(User, user.id, {
                availableToken: newAvailableToken
            });
        });

        // 업데이트 후 잠시 대기 후 조회 (DB 반영 시간 고려)
        await new Promise(resolve => setTimeout(resolve, 100));

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        return updatedUser;
    }

    /**
     * 블록체인에서 사용자의 토큰 잔액 동기화 (첫 로그인 시)
     * @param walletAddress 지갑 주소
     * @returns 동기화된 사용자 정보
     */
    async syncTokenBalanceFromBlockchain(walletAddress: string): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        try {
            // 블록체인에서 현재 토큰 잔액 조회
            const blockchainBalance = await this.getBlockchainTokenBalance(walletAddress);

            // 데이터베이스의 토큰 잔액과 비교
            const currentBalance = user.tokenAmount || 0;
            const balanceDifference = blockchainBalance - currentBalance;

            if (balanceDifference !== 0) {
                // 토큰 잔액이 다르면 동기화
                await this.userRepository.update(user.id, {
                    tokenAmount: blockchainBalance,
                    lastTokenSyncAt: new Date()
                });

                console.log(`[UserService] Token balance synced for ${walletAddress}: ${currentBalance} → ${blockchainBalance} (diff: ${balanceDifference})`);
            } else {
                console.log(`[UserService] Token balance already in sync for ${walletAddress}: ${blockchainBalance}`);
            }

            // 동기화 시간 업데이트
            await this.userRepository.update(user.id, {
                lastTokenSyncAt: new Date()
            });

            const updatedUser = await this.findByWalletAddress(walletAddress);
            if (!updatedUser) {
                throw new NotFoundException('User not found after update');
            }

            return updatedUser;

        } catch (error) {
            console.error(`[UserService] Failed to sync token balance from blockchain: ${error.message}`);
            // 블록체인 동기화 실패 시에도 사용자 반환 (기존 잔액 유지)
            return user;
        }
    }

    /**
     * 사용자가 첫 로그인인지 확인
     * @param walletAddress 지갑 주소
     * @returns 첫 로그인 여부
     */
    async isFirstLogin(walletAddress: string): Promise<boolean> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            return true; // 사용자가 없으면 첫 로그인
        }

        // lastTokenSyncAt이 없거나 null이면 첫 로그인으로 간주
        return !user.lastTokenSyncAt;
    }

    /**
     * 블록체인에서 사용자의 토큰 잔액 조회
     * @param walletAddress 지갑 주소
     * @returns 블록체인상 토큰 잔액
     */
    private async getBlockchainTokenBalance(walletAddress: string): Promise<number> {
        try {
            // 현재 활성 네트워크 가져오기
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

            const rpcUrl = this.configService.get<string>(`blockchain.${activeNetwork}.rpcUrl`);
            const contractAddress = this.configService.get<string>(`blockchain.contracts.trivusExp.${activeNetwork}`);

            if (!rpcUrl || !contractAddress) {
                throw new Error('Blockchain configuration not found');
            }

            // ERC-20 balanceOf 함수 호출
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: contractAddress,
                        data: `0x70a08231${'0'.repeat(24)}${walletAddress.slice(2)}` // balanceOf(address)
                    }, 'latest'],
                    id: 1
                })
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(`RPC error: ${data.error.message}`);
            }

            // hex를 decimal로 변환하고 18자리 소수점 제거
            const balanceHex = data.result;
            const balanceWei = BigInt(balanceHex);
            const balanceEth = Number(balanceWei) / Math.pow(10, 18);

            return balanceEth;

        } catch (error) {
            console.error(`[UserService] Failed to get blockchain token balance: ${error.message}`);
            throw error;
        }
    }

    /**
     * 사용자의 토큰 정보 조회
     */
    async getUserTokenInfo(walletAddress: string): Promise<{
        totalTokens: number;      // 전체 보유 토큰 (tokenAmount)
        availableTokens: number;  // 수확 가능한 토큰 (availableToken)
        pendingTokens: number;    // 대기 중인 토큰 (accumulation에서 계산)
    }> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // DB에서 실시간으로 대기 중인 토큰 조회
        const pendingAmount = await this.tokenAccumulationService.getTotalAccumulatedAmount(walletAddress);
        const pendingTokens = pendingAmount ? parseFloat(pendingAmount) : 0; // 이미 EXP 단위

        return {
            totalTokens: user.tokenAmount || 0,
            availableTokens: user.availableToken || 0,
            pendingTokens: pendingTokens
        };
    }

    /**
     * 토큰 사용 (게임 참여, 좋아요 등에서 토큰 차감)
     */
    async deductTokens(walletAddress: string, amount: number): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if ((user.tokenAmount || 0) < amount) {
            throw new Error('Insufficient tokens');
        }

        const newTokenAmount = (user.tokenAmount || 0) - amount;

        await this.userRepository.update(user.id, {
            tokenAmount: newTokenAmount
        });

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        return updatedUser;
    }

    /**
     * 토큰 추가 (좋아요 취소, 보상 등에서 토큰 반환)
     */
    async addTokens(walletAddress: string, amount: number): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 문자열을 숫자로 명시적 변환
        const currentTokenAmount = parseFloat(user.tokenAmount?.toString() || '0');
        const newTokenAmount = currentTokenAmount + amount;

        // 트랜잭션을 명시적으로 관리
        await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.update(User, user.id, {
                tokenAmount: newTokenAmount
            });
        });

        // 업데이트 후 잠시 대기 후 조회 (DB 반영 시간 고려)
        await new Promise(resolve => setTimeout(resolve, 100));

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        console.log(`[UserService] Tokens added: ${walletAddress} +${amount} EXP`);
        return updatedUser;
    }

    /**
     * 튜토리얼 첫글 작성 완료 처리 및 토큰 지급
     */
    async completeTutorialFirstPost(userId: number): Promise<{ user: User; tokenAccumulation: any }> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 이미 완료된 경우
        if (user.tutorialFirstPostCompleted) {
            throw new Error('Tutorial first post already completed');
        }

        // wallet address가 없는 경우 스킵
        if (!user.walletAddress) {
            throw new Error('User has no wallet address');
        }

        // 토큰 적립 생성
        const tokenAccumulation = await this.tokenAccumulationService.accumulateTutorialFirstPostReward(user.walletAddress);

        // 사용자 튜토리얼 상태 업데이트
        await this.userRepository.update(user.id, {
            tutorialFirstPostCompleted: true,
            tutorialFirstPostCompletedAt: new Date()
        });

        // availableToken 업데이트
        await this.updateAvailableTokens(user.walletAddress);

        const updatedUser = await this.findById(userId);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        return { user: updatedUser, tokenAccumulation };
    }

    /**
     * 튜토리얼 첫 매치결과 등록 완료 처리 및 토큰 지급
     */
    async completeTutorialFirstMatch(userId: number): Promise<{ user: User; tokenAccumulation: any }> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // 이미 완료된 경우
        if (user.tutorialFirstMatchCompleted) {
            throw new Error('Tutorial first match already completed');
        }

        // wallet address가 없는 경우 스킵
        if (!user.walletAddress) {
            throw new Error('User has no wallet address');
        }

        // 토큰 적립 생성
        const tokenAccumulation = await this.tokenAccumulationService.accumulateTutorialFirstMatchReward(user.walletAddress);

        // 사용자 튜토리얼 상태 업데이트
        await this.userRepository.update(user.id, {
            tutorialFirstMatchCompleted: true,
            tutorialFirstMatchCompletedAt: new Date()
        });

        // availableToken 업데이트
        await this.updateAvailableTokens(user.walletAddress);

        const updatedUser = await this.findById(userId);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }

        return { user: updatedUser, tokenAccumulation };
    }

    /**
     * 사용자의 튜토리얼 완료 상태 조회
     */
    async getTutorialStatus(userId: number): Promise<{
        firstPostCompleted: boolean;
        firstMatchCompleted: boolean;
        firstPostCompletedAt?: Date;
        firstMatchCompletedAt?: Date;
    }> {
        const user = await this.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            firstPostCompleted: user.tutorialFirstPostCompleted || false,
            firstMatchCompleted: user.tutorialFirstMatchCompleted || false,
            firstPostCompletedAt: user.tutorialFirstPostCompletedAt,
            firstMatchCompletedAt: user.tutorialFirstMatchCompletedAt
        };
    }

    /**
     * 모든 사용자의 토큰 잔액을 블록체인에서 동기화
     */
    async syncAllUsersTokenAmount(): Promise<void> {
        try {
            const users = await this.findAll();
            console.log(`🔄 Starting token balance sync for ${users.length} users...`);

            for (const user of users) {
                if (user.walletAddress) {
                    try {
                        // 블록체인에서 현재 토큰 잔액을 직접 조회하여 DB 업데이트
                        const currentBalance = await this.getBlockchainTokenBalance(user.walletAddress);
                        const previousBalance = user.tokenAmount || 0;

                        // DB 업데이트 (토큰 잔액과 동기화 시간)
                        await this.userRepository.update(user.id, {
                            tokenAmount: currentBalance,
                            lastTokenSyncAt: new Date()
                        });

                        // 초기 동기화 시 token_tx에 기록 (변경사항이 있을 때만)
                        if (Math.abs(currentBalance - previousBalance) > 0.000001) { // 부동소수점 오차 고려
                            await this.recordInitialTokenSync(user.id, user.walletAddress, previousBalance, currentBalance);
                        }

                        console.log(`✅ Synced token amount for user ${user.id} (${user.walletAddress}): ${previousBalance} → ${currentBalance} EXP`);
                    } catch (error) {
                        console.error(`❌ Failed to sync token amount for user ${user.id} (${user.walletAddress}): ${error.message}`);
                    }
                }
            }

            console.log(`🎉 Token balance sync completed for ${users.length} users`);
        } catch (error) {
            console.error(`❌ Failed to sync all users token amount: ${error.message}`);
        }
    }

    /**
     * 초기 토큰 동기화를 token_tx에 기록
     */
    private async recordInitialTokenSync(userId: number, walletAddress: string, previousBalance: number, currentBalance: number): Promise<void> {
        try {
            await this.tokenTransactionService.createTransaction({
                userId: userId,
                transactionType: TransactionType.INITIAL_SYNC,
                amount: currentBalance - previousBalance, // 변화량 (양수면 증가, 음수면 감소)
                balanceBefore: previousBalance,
                balanceAfter: currentBalance,
                transactionHash: undefined, // 초기 동기화는 트랜잭션 해시 없음
                blockchainAddress: walletAddress,
                description: `Initial token balance sync: ${previousBalance} → ${currentBalance} EXP`,
                metadata: {
                    sync_type: 'initial_server_startup',
                    previous_balance: previousBalance,
                    current_balance: currentBalance,
                    change_amount: currentBalance - previousBalance
                },
                referenceType: 'initial_sync'
            });

            console.log(`📝 Initial token sync recorded for user ${userId}: ${previousBalance} → ${currentBalance} EXP`);
        } catch (error) {
            console.error(`❌ Failed to record initial token sync for user ${userId}: ${error.message}`);
        }
    }
} 