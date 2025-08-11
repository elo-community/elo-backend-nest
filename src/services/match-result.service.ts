import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateMatchResultDto } from '../dtos/match-result.dto';
import { MatchResult, MatchStatus } from '../entities/match-result.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { User } from '../entities/user.entity';
import { SseService } from './sse.service';

@Injectable()
export class MatchResultService {
    constructor(
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly sseService: SseService,
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

        const savedMatchResult = await this.matchResultRepository.save(matchResult);

        // 상대방에게 SSE 알림 전송
        console.log(`[MatchResultService] Sending SSE notification to partner user ${partnerUser.id} for match result ${savedMatchResult.id}`);
        console.log(`[MatchResultService] Partner user details:`, {
            id: partnerUser.id,
            nickname: partnerUser.nickname,
            email: partnerUser.email
        });
        console.log(`[MatchResultService] Current user details:`, {
            id: userEntity.id,
            nickname: userEntity.nickname,
            email: userEntity.email
        });

        this.sseService.sendMatchResultNotification(
            partnerUser.id,
            savedMatchResult.id,
            sportCategory.name || 'Unknown Sport'
        );

        return savedMatchResult;
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

        const updatedMatchResult = await this.matchResultRepository.save(matchResult);

        // 매치 결과를 생성한 사용자에게 상태 변경 알림 전송
        console.log(`[MatchResultService] Sending SSE status change notification to match creator ${matchResult.user.id} for match result ${updatedMatchResult.id}`);
        this.sseService.sendMatchResultStatusNotification(
            matchResult.user.id,
            updatedMatchResult.id,
            action === 'accept' ? 'approved' : 'rejected',
            matchResult.sportCategory?.name || 'Unknown Sport'
        );

        // 승인/거부한 사용자(파트너)에게도 상태 변경 알림 전송
        console.log(`[MatchResultService] Sending SSE status change notification to partner ${matchResult.partner.id} for match result ${updatedMatchResult.id}`);
        this.sseService.sendMatchResultStatusNotification(
            matchResult.partner.id,
            updatedMatchResult.id,
            action === 'accept' ? 'approved' : 'rejected',
            matchResult.sportCategory?.name || 'Unknown Sport'
        );

        return updatedMatchResult;
    }

    // 만료된 요청들을 정리하는 메서드 (스케줄러에서 사용)
    async cleanupExpiredRequests(): Promise<void> {
        const now = new Date();

        try {
            // 만료된 요청 개수 확인
            const expiredCount = await this.matchResultRepository
                .createQueryBuilder()
                .select('COUNT(*)', 'count')
                .from(MatchResult, 'match')
                .where('status = :status', { status: MatchStatus.PENDING })
                .andWhere('expired_time < :now', { now })
                .getRawOne();

            const count = parseInt(expiredCount?.count || '0');

            if (count > 0) {
                console.log(`[MatchResultService] 만료된 요청 ${count}개 발견, 정리 시작`);

                // 만료된 요청들을 찾고 업데이트
                const result = await this.matchResultRepository
                    .createQueryBuilder()
                    .update(MatchResult)
                    .set({ status: MatchStatus.EXPIRED })
                    .where('status = :status', { status: MatchStatus.PENDING })
                    .andWhere('expired_time < :now', { now })
                    .execute();

                console.log(`[MatchResultService] 만료 처리 완료: ${result.affected}개 요청`);
            }
            // 만료된 요청이 없으면 로그 출력하지 않음
        } catch (error) {
            console.error('[MatchResultService] 만료된 요청 정리 중 오류 발생:', error);
            throw error;
        }
    }

    async findByUserId(userId: number): Promise<MatchResult[]> {
        return this.matchResultRepository.find({
            where: { user: { id: userId } },
            relations: ['sportCategory', 'user', 'partner']
        });
    }

    async findUserMatchHistory(user: JwtUser, query: any = {}): Promise<{ data: any[], pagination: any }> {
        const { sport, partner, page = 1, limit = 10 } = query;

        // QueryBuilder를 사용하여 더 정확한 필터링 구현
        const queryBuilder = this.matchResultRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.sportCategory', 'sportCategory')
            .leftJoinAndSelect('match.user', 'user')
            .leftJoinAndSelect('match.partner', 'partner')
            .where('match.status = :status', { status: MatchStatus.ACCEPTED })
            .andWhere('(match.user.id = :userId OR match.partner.id = :userId)', { userId: user.id });

        // 스포츠 카테고리 필터링
        if (sport) {
            queryBuilder.andWhere('sportCategory.id = :sportId', { sportId: sport });
        }

        // 파트너 필터링
        if (partner) {
            queryBuilder.andWhere('(partner.nickname = :partnerName OR user.nickname = :partnerName)', { partnerName: partner });
        }

        // 전체 개수 조회
        const totalCount = await queryBuilder.getCount();

        // 페이지네이션 적용하여 데이터 조회
        const matchResults = await queryBuilder
            .orderBy('match.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        const historyItems: any[] = [];

        for (const match of matchResults) {
            // 현재 사용자가 매치의 주체인지 파트너인지 확인
            const isUserCreator = match.user.id === user.id;
            const partner = isUserCreator ? match.partner : match.user;

            // partner가 undefined인 경우 스킵
            if (!partner) {
                continue;
            }

            // 결과 결정
            let result: 'win' | 'lose' | 'draw';
            if (isUserCreator) {
                result = match.myResult || 'draw';
            } else {
                // 파트너의 결과는 반대
                result = match.myResult === 'win' ? 'lose' :
                    match.myResult === 'lose' ? 'win' : 'draw';
            }

            // ELO 정보 조회 (실제 구현에서는 ELO 히스토리 테이블이 필요할 수 있음)
            // 현재는 기본값으로 설정
            const elo_before = 1400; // 기본 ELO
            const elo_after = 1400; // 기본 ELO
            const elo_delta = 0; // 기본 변화량

            historyItems.push({
                id: match.id,
                partner: partner.id,
                partner_nickname: partner.nickname || 'Unknown',
                sportCategory: match.sportCategory.name || 'Unknown',
                result,
                isHandicap: match.isHandicap,
                created_at: match.createdAt,
                elo_before,
                elo_after,
                elo_delta
            });
        }

        // 페이지네이션 정보 계산
        const totalPages = Math.ceil(totalCount / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            data: historyItems,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext,
                hasPrev
            }
        };
    }
} 