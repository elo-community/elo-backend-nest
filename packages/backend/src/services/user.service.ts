import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { SportCategory } from '../entities/sport-category.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
import { TokenAccumulationService } from './token-accumulation.service';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserElo)
        private readonly userEloRepository: Repository<UserElo>,
        private readonly tokenAccumulationService: TokenAccumulationService,
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
        const sports = ['테니스', '배드민턴', '탁구', '당구', '바둑', '체스'];
        const userElos = sportCategories
            .filter(cat => sports.includes(cat.name || ''))
            .map(cat => this.userEloRepository.create({
                user,
                sportCategory: cat,
                eloPoint: 1400,
                tier: 'BRONZE',
                percentile: 50.0,
                wins: 0,
                losses: 0,
                draws: 0,
                totalMatches: 0
            }));
        await this.userEloRepository.save(userElos);
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
     * 사용자의 수확 가능한 토큰 업데이트 (DB accumulation에서 자동 계산)
     */
    async updateAvailableTokens(walletAddress: string): Promise<User> {
        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // TokenAccumulation에서 수확 가능한 토큰 양 조회
        const availableAmount = await this.tokenAccumulationService.getTotalAccumulatedAmount(walletAddress);
        const availableTokens = parseFloat(availableAmount) / Math.pow(10, 18); // wei를 EXP로 변환

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

        // tokenAmount에 수확한 토큰 추가
        const newTokenAmount = (user.tokenAmount || 0) + claimedAmount;

        // availableToken에서 수확한 토큰 차감
        const newAvailableToken = Math.max(0, (user.availableToken || 0) - claimedAmount);

        await this.userRepository.update(user.id, {
            tokenAmount: newTokenAmount,
            availableToken: newAvailableToken
        });

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            throw new NotFoundException('User not found after update');
        }
        return updatedUser;
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
        const pendingTokens = parseFloat(pendingAmount) / Math.pow(10, 18); // wei를 EXP로 변환

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
        console.log(`[UserService] addTokens called: ${walletAddress} +${amount} EXP`);
        console.log(`[UserService] Amount type: ${typeof amount}, value: ${amount}`);

        const user = await this.findByWalletAddress(walletAddress);
        if (!user) {
            console.error(`[UserService] User not found for wallet: ${walletAddress}`);
            throw new NotFoundException('User not found');
        }

        console.log(`[UserService] Current user.tokenAmount: ${user.tokenAmount || 0}`);
        console.log(`[UserService] Current user.tokenAmount type: ${typeof (user.tokenAmount || 0)}`);

        // 문자열을 숫자로 명시적 변환
        const currentTokenAmount = parseFloat(user.tokenAmount?.toString() || '0');
        console.log(`[UserService] Parsed current tokenAmount: ${currentTokenAmount}`);

        const newTokenAmount = currentTokenAmount + amount;
        console.log(`[UserService] New tokenAmount will be: ${newTokenAmount}`);
        console.log(`[UserService] New tokenAmount type: ${typeof newTokenAmount}`);

        console.log(`[UserService] Updating user ${user.id} with new tokenAmount: ${newTokenAmount}`);
        await this.userRepository.update(user.id, {
            tokenAmount: newTokenAmount
        });

        const updatedUser = await this.findByWalletAddress(walletAddress);
        if (!updatedUser) {
            console.error(`[UserService] User not found after update for wallet: ${walletAddress}`);
            throw new NotFoundException('User not found after update');
        }

        console.log(`[UserService] User updated successfully. New tokenAmount: ${updatedUser.tokenAmount}`);
        return updatedUser;
    }
} 