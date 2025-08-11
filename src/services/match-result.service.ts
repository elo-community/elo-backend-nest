import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtUser } from '../auth/jwt-user.interface';
import { CreateMatchResultDto } from '../dtos/create-match-result.dto';
import { RespondMatchResultDto } from '../dtos/respond-match-result.dto';
import { EloService } from '../elo/elo.service';
import { MatchResultHistory } from '../entities/match-result-history.entity';
import { MatchResult, MatchStatus } from '../entities/match-result.entity';
import { SportCategory } from '../entities/sport-category.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
import { SseService } from './sse.service';

@Injectable()
export class MatchResultService {
    constructor(
        @InjectRepository(MatchResult)
        private readonly matchResultRepository: Repository<MatchResult>,
        @InjectRepository(MatchResultHistory)
        private readonly matchResultHistoryRepository: Repository<MatchResultHistory>,
        @InjectRepository(SportCategory)
        private readonly sportCategoryRepository: Repository<SportCategory>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserElo)
        private readonly userEloRepository: Repository<UserElo>,
        private readonly sseService: SseService,
        private readonly eloService: EloService,
        private readonly dataSource: DataSource,
    ) { }

    async create(createMatchResultDto: CreateMatchResultDto, user: JwtUser): Promise<MatchResult> {
        const { sportCategoryId, partnerNickname, myResult, isHandicap = false, playedAt, ...rest } = createMatchResultDto;

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

        // playedAt을 Date 객체로 변환하고 유효성 검사
        let playedAtDate: Date;
        let playedDate: Date;

        if (playedAt) {
            playedAtDate = new Date(playedAt);
            if (isNaN(playedAtDate.getTime())) {
                throw new Error('Invalid playedAt date format');
            }
            // playedDate는 playedAt의 날짜 부분만 (시간 제외)
            playedDate = new Date(playedAtDate.getFullYear(), playedAtDate.getMonth(), playedAtDate.getDate());
        } else {
            // playedAt이 제공되지 않은 경우 현재 시간 사용
            playedAtDate = new Date();
            playedDate = new Date(playedAtDate.getFullYear(), playedAtDate.getMonth(), playedAtDate.getDate());
        }

        // pair_user_lo와 pair_user_hi 계산
        const pairUserLo = Math.min(userEntity.id, partnerUser.id);
        const pairUserHi = Math.max(userEntity.id, partnerUser.id);

        const matchResult = this.matchResultRepository.create({
            ...rest,
            sportCategory,
            user: userEntity,
            partner: partnerUser,
            myResult,
            isHandicap,
            playedAt: playedAtDate,
            playedDate,
            pairUserLo,
            pairUserHi,
            status: MatchStatus.PENDING,
            expiredTime,
        });

        const savedMatchResult = await this.matchResultRepository.save(matchResult);

        // 상대방에게 SSE 알림 전송
        console.log(`[MatchResultService] Sending SSE notification to partner user ${partnerUser.id} for match result ${savedMatchResult.id}`);
        this.sseService.sendMatchResultNotification(
            partnerUser.id,
            savedMatchResult.id,
            sportCategory.name || 'Unknown Sport'
        );

        return savedMatchResult;
    }

    async findSentRequests(user: JwtUser): Promise<MatchResult[]> {
        return this.matchResultRepository.find({
            where: {
                user: { id: user.id },
                status: MatchStatus.PENDING // pending 상태만 필터링
            },
            relations: ['sportCategory', 'partner'],
            order: { createdAt: 'DESC' }
        });
    }

    async findReceivedRequests(user: JwtUser): Promise<MatchResult[]> {
        // 받은 요청은 partner가 현재 사용자인 것들 (pending 상태만)
        return this.matchResultRepository.find({
            where: {
                partner: { id: user.id },
                status: MatchStatus.PENDING // pending 상태만 필터링
            },
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

    // 만료된 요청들을 정리하는 메서드 (스케줄러에서 사용)
    async cleanupExpiredRequests(): Promise<void> {
        const now = new Date();

        try {
            // 만료된 요청 개수 확인 (별칭 명확화)
            const expiredCount = await this.matchResultRepository
                .createQueryBuilder('matchResult')
                .select('COUNT(*)', 'count')
                .where('matchResult.status = :status', { status: MatchStatus.PENDING })
                .andWhere('matchResult.expiredTime < :now', { now })
                .getRawOne();

            const count = parseInt(expiredCount?.count || '0');

            if (count > 0) {
                console.log(`[MatchResultService] 만료된 요청 ${count}개 발견, 정리 시작`);

                // 만료된 요청들을 찾고 업데이트 (UPDATE 쿼리에서는 별칭 사용 불가)
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

    /**
     * Partner responds to a match result (accept, reject, or counter)
     */
    async respond(matchResultId: number, respondDto: RespondMatchResultDto, user: JwtUser): Promise<MatchResult> {
        const matchResult = await this.findOne(matchResultId);
        if (!matchResult) {
            throw new Error('Match result not found');
        }

        // 권한 확인 (받은 요청만 처리 가능)
        if (matchResult.partner?.id !== user.id) {
            throw new Error('You can only respond to requests sent to you');
        }

        // 상태 확인
        if (matchResult.status !== MatchStatus.PENDING) {
            throw new Error('Match result is not pending');
        }

        const { action } = respondDto;

        if (action === 'accept') {
            // 승인 시 즉시 CONFIRMED로 변경하고 Elo 계산
            matchResult.status = MatchStatus.CONFIRMED;
            matchResult.confirmedAt = new Date();

            // partnerResult 자동 설정 (상대방의 myResult와 반대)
            if (matchResult.myResult === 'win') {
                matchResult.partnerResult = 'lose';
            } else if (matchResult.myResult === 'lose') {
                matchResult.partnerResult = 'win';
            } else {
                matchResult.partnerResult = 'draw';
            }

            const updatedMatchResult = await this.matchResultRepository.save(matchResult);

            // Elo 계산 및 적용
            await this.applyEloToMatch(updatedMatchResult);

            return updatedMatchResult;
        } else if (action === 'reject') {
            // 거부 시 REJECTED로 변경
            matchResult.status = MatchStatus.REJECTED;
            return await this.matchResultRepository.save(matchResult);
        }

        throw new Error('Invalid action');
    }

    /**
     * Calculate H2H gap between two users in the same sport
     */
    async h2hGap(sportCategoryId: number, aId: number, bId: number): Promise<number> {
        // CONFIRMED 상태의 매치만 계산에 포함 (relations 포함)
        const confirmedMatches = await this.matchResultRepository.find({
            where: [
                {
                    sportCategory: { id: sportCategoryId },
                    user: { id: aId },
                    partner: { id: bId },
                    status: MatchStatus.CONFIRMED,
                },
                {
                    sportCategory: { id: sportCategoryId },
                    user: { id: bId },
                    partner: { id: aId },
                    status: MatchStatus.CONFIRMED,
                },
            ],
            relations: ['user', 'partner'],
        });

        let aWins = 0;
        let aLosses = 0;

        for (const match of confirmedMatches) {
            if (!match.user || !match.partner) {
                continue; // 잘못된 데이터는 스킵
            }

            if (match.user.id === aId) {
                if (match.myResult === 'win') aWins++;
                else if (match.myResult === 'lose') aLosses++;
            } else {
                if (match.myResult === 'lose') aWins++;
                else if (match.myResult === 'win') aLosses++;
            }
        }

        return Math.abs(aWins - aLosses);
    }

    /**
     * Apply Elo rating changes to a confirmed match
     */
    private async applyEloToMatch(matchResult: MatchResult): Promise<void> {
        if (!matchResult.user || !matchResult.partner || !matchResult.sportCategory) {
            throw new Error('Invalid match result for Elo calculation');
        }

        // 트랜잭션으로 Elo 계산 및 적용
        await this.dataSource.transaction(async (manager) => {
            // 매치 결과 로드 (relations 포함, lock 제거)
            const lockedMatchResult = await manager.findOne(MatchResult, {
                where: { id: matchResult.id },
                relations: ['user', 'partner', 'sportCategory'],
            });

            if (!lockedMatchResult || lockedMatchResult.status !== MatchStatus.CONFIRMED) {
                throw new Error('Match result is not confirmed or has been modified');
            }

            if (!lockedMatchResult.user || !lockedMatchResult.partner || !lockedMatchResult.sportCategory) {
                throw new Error('Invalid match result: missing user, partner, or sport category');
            }

            const userId = lockedMatchResult.user.id;
            const partnerId = lockedMatchResult.partner.id;
            const sportCategoryId = lockedMatchResult.sportCategory.id;
            const isHandicap = lockedMatchResult.isHandicap;
            const result = lockedMatchResult.myResult;

            if (!result) {
                throw new Error('Match result is missing');
            }

            // H2H gap 계산
            const h2hGap = await this.h2hGap(sportCategoryId, userId, partnerId);

            // 현재 rating 조회 또는 초기화
            const ratingA = await this.userEloRepository.findOne({
                where: { user: { id: userId }, sportCategory: { id: sportCategoryId } },
                relations: ['user', 'sportCategory']
            });
            const ratingB = await this.userEloRepository.findOne({
                where: { user: { id: partnerId }, sportCategory: { id: sportCategoryId } },
                relations: ['user', 'sportCategory']
            });

            // Elo 계산
            const eloResult = this.eloService.calculateMatch(
                ratingA?.eloPoint || 1400, // 기본값 설정
                ratingB?.eloPoint || 1400, // 기본값 설정
                result,
                isHandicap,
                h2hGap
            );

            // Rating 업데이트
            if (ratingA) {
                ratingA.eloPoint = Math.round(eloResult.aNew);
                await this.userEloRepository.save(ratingA);
            } else {
                // 새로운 UserElo 생성
                const newUserEloA = this.userEloRepository.create({
                    user: { id: userId },
                    sportCategory: { id: sportCategoryId },
                    eloPoint: Math.round(eloResult.aNew),
                    tier: 'BRONZE', // 기본 티어
                    percentile: 50.00 // 기본 퍼센타일
                });
                await this.userEloRepository.save(newUserEloA);
            }

            if (ratingB) {
                ratingB.eloPoint = Math.round(eloResult.bNew);
                await this.userEloRepository.save(ratingB);
            } else {
                // 새로운 UserElo 생성
                const newUserEloB = this.userEloRepository.create({
                    user: { id: partnerId },
                    sportCategory: { id: sportCategoryId },
                    eloPoint: Math.round(eloResult.bNew),
                    tier: 'BRONZE', // 기본 티어
                    percentile: 50.00 // 기본 퍼센타일
                });
                await this.userEloRepository.save(newUserEloB);
            }

            // History 기록
            const history = this.matchResultHistoryRepository.create({
                matchResult: lockedMatchResult,
                aUser: { id: userId },
                bUser: { id: partnerId },
                aOld: eloResult.aOld,
                aNew: eloResult.aNew,
                aDelta: eloResult.aDelta,
                bOld: eloResult.bOld,
                bNew: eloResult.bNew,
                bDelta: eloResult.bDelta,
                kEff: eloResult.kEff,
                h2hGap: eloResult.h2hGap,
            });

            await manager.save(history);

            // MatchResult 엔티티의 Elo 필드들 업데이트
            lockedMatchResult.eloBefore = Math.round(eloResult.aOld);
            lockedMatchResult.eloAfter = Math.round(eloResult.aNew);
            lockedMatchResult.eloDelta = Math.round(eloResult.aDelta);
            lockedMatchResult.partnerEloBefore = Math.round(eloResult.bOld);
            lockedMatchResult.partnerEloAfter = Math.round(eloResult.bNew);
            lockedMatchResult.partnerEloDelta = Math.round(eloResult.bDelta);

            // 업데이트된 MatchResult 저장
            await manager.save(lockedMatchResult);
        });
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
            .where('match.status = :status', { status: MatchStatus.CONFIRMED })
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

            // ELO 정보 조회 (실제 Elo 값 사용)
            let elo_before, elo_after, elo_delta;

            if (isUserCreator) {
                // 사용자가 매치 생성자인 경우
                elo_before = match.eloBefore || 1400;
                elo_after = match.eloAfter || 1400;
                elo_delta = match.eloDelta || 0;
            } else {
                // 사용자가 파트너인 경우
                elo_before = match.partnerEloBefore || 1400;
                elo_after = match.partnerEloAfter || 1400;
                elo_delta = match.partnerEloDelta || 0;
            }

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