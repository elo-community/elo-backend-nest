import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateMatchResultDto } from '../dtos/match-result.dto';
import { MatchResult, MatchStatus } from '../entities/match-result.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MatchResultService {
    constructor(
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async create(createMatchResultDto: CreateMatchResultDto, user: JwtUser): Promise<MatchResult> {
        const { sportCategoryId, partnerNickname, ...rest } = createMatchResultDto;

        // 스포츠 카테고리 조회
        const sportCategory = await this.sportCategoryRepository.findOne({
            where: { id: sportCategoryId }
        });
        if (!sportCategory) {
            throw new Error('Sport category not found');
        }

        // 사용자 조회
        const userEntity = await this.userRepository.findOne({
            where: { id: user.id }
        });
        if (!userEntity) {
            throw new Error('User not found');
        }

        // 파트너 사용자 조회 (닉네임으로)
        const partnerUser = await this.userRepository.findOne({
            where: { nickname: partnerNickname }
        });
        if (!partnerUser) {
            throw new Error('Partner user not found');
        }

        // 자기 자신과의 매치는 불가능
        if (userEntity.id === partnerUser.id) {
            throw new Error('Cannot create match with yourself');
        }

        // 만료 시간 설정 (2분 후)
        const expiredTime = new Date();
        expiredTime.setMinutes(expiredTime.getMinutes() + 2);

        const matchResult = this.matchResultRepository.create({
            ...rest,
            sportCategory,
            user: userEntity,
            partner: partnerUser,
            status: MatchStatus.PENDING,
            expiredTime,
        });

        return this.matchResultRepository.save(matchResult);
    }

    async findSentRequests(user: JwtUser): Promise<MatchResult[]> {
        return this.matchResultRepository.find({
            where: { user: { id: user.id } },
            relations: ['sportCategory', 'partner'],
            order: { createdAt: 'DESC' }
        });
    }

    async findReceivedRequests(user: JwtUser): Promise<MatchResult[]> {
        // 받은 요청은 partner가 현재 사용자인 것들
        return this.matchResultRepository.find({
            where: { partner: { id: user.id } },
            relations: ['sportCategory', 'user'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: number): Promise<MatchResult | null> {
        return this.matchResultRepository.findOne({
            where: { id },
            relations: ['sportCategory', 'user', 'partner']
        });
    }

    async updateStatus(id: number, action: 'accept' | 'reject', user: JwtUser): Promise<MatchResult> {
        const matchResult = await this.findOne(id);
        if (!matchResult) {
            throw new Error('Match result not found');
        }

        // 만료 시간 확인
        if (new Date() > matchResult.expiredTime) {
            matchResult.status = MatchStatus.EXPIRED;
            await this.matchResultRepository.save(matchResult);
            throw new Error('Match request has expired');
        }

        // 권한 확인 (받은 요청만 처리 가능)
        if (matchResult.partner?.id !== user.id) {
            throw new Error('You can only respond to requests sent to you');
        }

        // 상태 업데이트
        matchResult.status = action === 'accept' ? MatchStatus.ACCEPTED : MatchStatus.REJECTED;

        return this.matchResultRepository.save(matchResult);
    }

    // 만료된 요청들을 정리하는 메서드 (스케줄러에서 사용)
    async cleanupExpiredRequests(): Promise<void> {
        const now = new Date();

        // TypeORM의 QueryBuilder를 사용하여 만료된 요청들을 찾고 업데이트
        await this.matchResultRepository
            .createQueryBuilder()
            .update(MatchResult)
            .set({ status: MatchStatus.EXPIRED })
            .where('status = :status', { status: MatchStatus.PENDING })
            .andWhere('expired_time < :now', { now })
            .execute();
    }

    async findByUserId(userId: number): Promise<MatchResult[]> {
        return this.matchResultRepository.find({
            where: { user: { id: userId } },
            relations: ['sportCategory', 'user', 'partner']
        });
    }
} 