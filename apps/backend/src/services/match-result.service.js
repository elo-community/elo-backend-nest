"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchResultService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const elo_service_1 = require("../elo/elo.service");
const match_result_history_entity_1 = require("../entities/match-result-history.entity");
const match_result_entity_1 = require("../entities/match-result.entity");
const sport_category_entity_1 = require("../entities/sport-category.entity");
const user_elo_entity_1 = require("../entities/user-elo.entity");
const user_entity_1 = require("../entities/user.entity");
const sse_service_1 = require("./sse.service");
let MatchResultService = class MatchResultService {
    matchResultRepository;
    matchResultHistoryRepository;
    sportCategoryRepository;
    userRepository;
    userEloRepository;
    sseService;
    eloService;
    dataSource;
    constructor(matchResultRepository, matchResultHistoryRepository, sportCategoryRepository, userRepository, userEloRepository, sseService, eloService, dataSource) {
        this.matchResultRepository = matchResultRepository;
        this.matchResultHistoryRepository = matchResultHistoryRepository;
        this.sportCategoryRepository = sportCategoryRepository;
        this.userRepository = userRepository;
        this.userEloRepository = userEloRepository;
        this.sseService = sseService;
        this.eloService = eloService;
        this.dataSource = dataSource;
    }
    async create(createMatchResultDto, user) {
        const { sportCategoryId, partnerNickname, senderResult, isHandicap = false, playedAt, ...rest } = createMatchResultDto;
        const sportCategory = await this.sportCategoryRepository.findOne({
            where: { id: sportCategoryId }
        });
        if (!sportCategory) {
            throw new Error('Sport category not found');
        }
        const userEntity = await this.userRepository.findOne({
            where: { id: user.id }
        });
        if (!userEntity) {
            throw new Error('User not found');
        }
        const partnerUser = await this.userRepository.findOne({
            where: { nickname: partnerNickname }
        });
        if (!partnerUser) {
            throw new Error('Partner user not found');
        }
        if (userEntity.id === partnerUser.id) {
            throw new Error('Cannot create match with yourself');
        }
        const expiredTime = new Date();
        expiredTime.setMinutes(expiredTime.getMinutes() + 2);
        let playedAtDate;
        let playedDate;
        if (playedAt) {
            playedAtDate = new Date(playedAt);
            if (isNaN(playedAtDate.getTime())) {
                throw new Error('Invalid playedAt date format');
            }
            playedDate = new Date(playedAtDate.getFullYear(), playedAtDate.getMonth(), playedAtDate.getDate());
        }
        else {
            playedAtDate = new Date();
            playedDate = new Date(playedAtDate.getFullYear(), playedAtDate.getMonth(), playedAtDate.getDate());
        }
        const pairUserLo = Math.min(userEntity.id, partnerUser.id);
        const pairUserHi = Math.max(userEntity.id, partnerUser.id);
        let partnerResult;
        if (senderResult === 'win') {
            partnerResult = 'lose';
        }
        else if (senderResult === 'lose') {
            partnerResult = 'win';
        }
        else {
            partnerResult = 'draw';
        }
        const matchResult = this.matchResultRepository.create({
            ...rest,
            sportCategory,
            user: userEntity,
            partner: partnerUser,
            senderResult,
            partnerResult,
            isHandicap,
            playedAt: playedAtDate,
            playedDate,
            pairUserLo,
            pairUserHi,
            status: match_result_entity_1.MatchStatus.PENDING,
            expiredTime,
        });
        const savedMatchResult = await this.matchResultRepository.save(matchResult);
        console.log(`[MatchResultService] Sending SSE notification to partner user ${partnerUser.id} for match result ${savedMatchResult.id}`);
        this.sseService.sendMatchResultNotification(partnerUser.id, savedMatchResult.id, sportCategory.name || 'Unknown Sport');
        return savedMatchResult;
    }
    async findSentRequests(user) {
        return this.matchResultRepository.find({
            where: {
                user: { id: user.id },
                status: match_result_entity_1.MatchStatus.PENDING
            },
            relations: ['sportCategory', 'partner'],
            order: { createdAt: 'DESC' }
        });
    }
    async findReceivedRequests(user) {
        return this.matchResultRepository.find({
            where: {
                partner: { id: user.id },
                status: match_result_entity_1.MatchStatus.PENDING
            },
            relations: ['sportCategory', 'user'],
            order: { createdAt: 'DESC' }
        });
    }
    async findOne(id) {
        return this.matchResultRepository.findOne({
            where: { id },
            relations: ['sportCategory', 'user', 'partner']
        });
    }
    async cleanupExpiredRequests() {
        const now = new Date();
        try {
            const expiredCount = await this.matchResultRepository
                .createQueryBuilder('matchResult')
                .select('COUNT(*)', 'count')
                .where('matchResult.status = :status', { status: match_result_entity_1.MatchStatus.PENDING })
                .andWhere('matchResult.expiredTime < :now', { now })
                .getRawOne();
            const count = parseInt(expiredCount?.count || '0');
            if (count > 0) {
                console.log(`[MatchResultService] 만료된 요청 ${count}개 발견, 정리 시작`);
                const result = await this.matchResultRepository
                    .createQueryBuilder()
                    .update(match_result_entity_1.MatchResult)
                    .set({ status: match_result_entity_1.MatchStatus.EXPIRED })
                    .where('status = :status', { status: match_result_entity_1.MatchStatus.PENDING })
                    .andWhere('expired_time < :now', { now })
                    .execute();
                console.log(`[MatchResultService] 만료 처리 완료: ${result.affected}개 요청`);
            }
        }
        catch (error) {
            console.error('[MatchResultService] 만료된 요청 정리 중 오류 발생:', error);
            throw error;
        }
    }
    async respond(matchResultId, respondDto, user) {
        const matchResult = await this.findOne(matchResultId);
        if (!matchResult) {
            throw new Error('Match result not found');
        }
        if (matchResult.partner?.id !== user.id) {
            throw new Error('You can only respond to requests sent to you');
        }
        if (matchResult.status !== match_result_entity_1.MatchStatus.PENDING) {
            throw new Error('Match result is not pending');
        }
        const { action } = respondDto;
        if (action === 'accept') {
            matchResult.status = match_result_entity_1.MatchStatus.ACCEPTED;
            matchResult.confirmedAt = new Date();
            const updatedMatchResult = await this.matchResultRepository.save(matchResult);
            console.log('After save - partnerResult:', updatedMatchResult.partnerResult);
            await this.applyEloToMatch(updatedMatchResult);
            if (updatedMatchResult.user && updatedMatchResult.sportCategory) {
                this.sseService.sendMatchResultStatusNotification(updatedMatchResult.user.id, updatedMatchResult.id, 'approved', updatedMatchResult.sportCategory.name || 'Unknown');
            }
            this.sseService.sendMatchResultStatusNotification(user.id, updatedMatchResult.id, 'approved', updatedMatchResult.sportCategory?.name || 'Unknown');
            return updatedMatchResult;
        }
        else if (action === 'reject') {
            matchResult.status = match_result_entity_1.MatchStatus.REJECTED;
            const rejectedMatchResult = await this.matchResultRepository.save(matchResult);
            if (rejectedMatchResult.user && rejectedMatchResult.sportCategory) {
                this.sseService.sendMatchResultStatusNotification(rejectedMatchResult.user.id, rejectedMatchResult.id, 'rejected', rejectedMatchResult.sportCategory.name || 'Unknown');
            }
            this.sseService.sendMatchResultStatusNotification(user.id, rejectedMatchResult.id, 'rejected', rejectedMatchResult.sportCategory?.name || 'Unknown');
            return rejectedMatchResult;
        }
        throw new Error('Invalid action');
    }
    async h2hGap(sportCategoryId, aId, bId) {
        const confirmedMatches = await this.matchResultRepository.find({
            where: [
                {
                    sportCategory: { id: sportCategoryId },
                    user: { id: aId },
                    partner: { id: bId },
                    status: match_result_entity_1.MatchStatus.ACCEPTED,
                },
                {
                    sportCategory: { id: sportCategoryId },
                    user: { id: bId },
                    partner: { id: aId },
                    status: match_result_entity_1.MatchStatus.ACCEPTED,
                },
            ],
            relations: ['user', 'partner'],
        });
        let aWins = 0;
        let aLosses = 0;
        for (const match of confirmedMatches) {
            if (!match.user || !match.partner) {
                continue;
            }
            if (match.user.id === aId) {
                if (match.senderResult === 'win')
                    aWins++;
                else if (match.senderResult === 'lose')
                    aLosses++;
            }
            else {
                if (match.senderResult === 'lose')
                    aWins++;
                else if (match.senderResult === 'win')
                    aLosses++;
            }
        }
        return Math.abs(aWins - aLosses);
    }
    async applyEloToMatch(matchResult) {
        if (!matchResult.user || !matchResult.partner || !matchResult.sportCategory) {
            throw new Error('Invalid match result for Elo calculation');
        }
        await this.dataSource.transaction(async (manager) => {
            const lockedMatchResult = await manager.findOne(match_result_entity_1.MatchResult, {
                where: { id: matchResult.id },
                relations: ['user', 'partner', 'sportCategory'],
            });
            console.log('Transaction loaded match result:', {
                id: lockedMatchResult?.id,
                senderResult: lockedMatchResult?.senderResult,
                hasUser: !!lockedMatchResult?.user,
                hasPartner: !!lockedMatchResult?.partner,
                hasSportCategory: !!lockedMatchResult?.sportCategory
            });
            if (!lockedMatchResult || lockedMatchResult.status !== match_result_entity_1.MatchStatus.ACCEPTED) {
                throw new Error('Match result is not accepted or has been modified');
            }
            if (!lockedMatchResult.user || !lockedMatchResult.partner || !lockedMatchResult.sportCategory) {
                throw new Error('Invalid match result: missing user, partner, or sport category');
            }
            const userId = lockedMatchResult.user.id;
            const partnerId = lockedMatchResult.partner.id;
            const sportCategoryId = lockedMatchResult.sportCategory.id;
            const isHandicap = lockedMatchResult.isHandicap;
            const result = lockedMatchResult.senderResult;
            console.log('Elo calculation params:', {
                userId,
                partnerId,
                sportCategoryId,
                isHandicap,
                result
            });
            if (!result) {
                throw new Error('Match result is missing');
            }
            const h2hGap = await this.h2hGap(sportCategoryId, userId, partnerId);
            const ratingA = await this.userEloRepository.findOne({
                where: { user: { id: userId }, sportCategory: { id: sportCategoryId } },
                relations: ['user', 'sportCategory']
            });
            const ratingB = await this.userEloRepository.findOne({
                where: { user: { id: partnerId }, sportCategory: { id: sportCategoryId } },
                relations: ['user', 'sportCategory']
            });
            const eloResult = this.eloService.calculateMatch(ratingA?.eloPoint || 1400, ratingB?.eloPoint || 1400, result, isHandicap, h2hGap);
            if (ratingA) {
                ratingA.eloPoint = Math.round(eloResult.aNew);
                if (result === 'win') {
                    ratingA.wins += 1;
                }
                else if (result === 'lose') {
                    ratingA.losses += 1;
                }
                else {
                    ratingA.draws += 1;
                }
                ratingA.totalMatches += 1;
                await this.userEloRepository.save(ratingA);
            }
            else {
                const newUserEloA = this.userEloRepository.create({
                    user: { id: userId },
                    sportCategory: { id: sportCategoryId },
                    eloPoint: Math.round(eloResult.aNew),
                    tier: 'BRONZE',
                    percentile: 50.00,
                    wins: result === 'win' ? 1 : 0,
                    losses: result === 'lose' ? 1 : 0,
                    draws: result === 'draw' ? 1 : 0,
                    totalMatches: 1
                });
                await this.userEloRepository.save(newUserEloA);
            }
            if (ratingB) {
                ratingB.eloPoint = Math.round(eloResult.bNew);
                if (result === 'win') {
                    ratingB.losses += 1;
                }
                else if (result === 'lose') {
                    ratingB.wins += 1;
                }
                else {
                    ratingB.draws += 1;
                }
                ratingB.totalMatches += 1;
                await this.userEloRepository.save(ratingB);
            }
            else {
                const newUserEloB = this.userEloRepository.create({
                    user: { id: partnerId },
                    sportCategory: { id: sportCategoryId },
                    eloPoint: Math.round(eloResult.bNew),
                    tier: 'BRONZE',
                    percentile: 50.00,
                    wins: result === 'win' ? 0 : (result === 'lose' ? 1 : 0),
                    losses: result === 'win' ? 1 : (result === 'lose' ? 0 : 0),
                    draws: result === 'draw' ? 1 : 0,
                    totalMatches: 1
                });
                await this.userEloRepository.save(newUserEloB);
            }
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
            lockedMatchResult.eloBefore = Math.round(eloResult.aOld);
            lockedMatchResult.eloAfter = Math.round(eloResult.aNew);
            lockedMatchResult.eloDelta = Math.round(eloResult.aDelta);
            lockedMatchResult.partnerEloBefore = Math.round(eloResult.bOld);
            lockedMatchResult.partnerEloAfter = Math.round(eloResult.bNew);
            lockedMatchResult.partnerEloDelta = Math.round(eloResult.bDelta);
            await manager.save(lockedMatchResult);
        });
    }
    async findByUserId(userId) {
        return this.matchResultRepository.find({
            where: { user: { id: userId } },
            relations: ['sportCategory', 'user', 'partner']
        });
    }
    async findUserMatchHistory(user, query = {}) {
        const { sport, partner, page = 1, limit = 10 } = query;
        const queryBuilder = this.matchResultRepository
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.sportCategory', 'sportCategory')
            .leftJoinAndSelect('match.user', 'user')
            .leftJoinAndSelect('match.partner', 'partner')
            .where('match.status = :status', { status: match_result_entity_1.MatchStatus.ACCEPTED })
            .andWhere('(match.user.id = :userId OR match.partner.id = :userId)', { userId: user.id });
        if (sport) {
            queryBuilder.andWhere('sportCategory.id = :sportId', { sportId: sport });
        }
        if (partner) {
            queryBuilder.andWhere('(partner.nickname = :partnerName OR user.nickname = :partnerName)', { partnerName: partner });
        }
        const totalCount = await queryBuilder.getCount();
        const matchResults = await queryBuilder
            .orderBy('match.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const historyItems = [];
        for (const match of matchResults) {
            const isUserCreator = match.user.id === user.id;
            const partnerUser = isUserCreator ? match.partner : match.user;
            if (!partnerUser) {
                continue;
            }
            let result;
            if (isUserCreator) {
                result = match.senderResult || 'draw';
            }
            else {
                result = match.senderResult === 'win' ? 'lose' :
                    match.senderResult === 'lose' ? 'win' : 'draw';
            }
            let elo_before, elo_after, elo_delta;
            let partner_elo_before, partner_elo_after, partner_elo_delta;
            if (isUserCreator) {
                elo_before = match.eloBefore || 1400;
                elo_after = match.eloAfter || 1400;
                elo_delta = match.eloDelta || 0;
                partner_elo_before = match.partnerEloBefore || 1400;
                partner_elo_after = match.partnerEloAfter || 1400;
                partner_elo_delta = match.partnerEloDelta || 0;
            }
            else {
                elo_before = match.partnerEloBefore || 1400;
                elo_after = match.partnerEloAfter || 1400;
                elo_delta = match.partnerEloDelta || 0;
                partner_elo_before = match.eloBefore || 1400;
                partner_elo_after = match.eloAfter || 1400;
                partner_elo_delta = match.eloDelta || 0;
            }
            let partnerCurrentElo = 1400;
            let partnerWins = 0, partnerLosses = 0, partnerDraws = 0, partnerTotalMatches = 0;
            try {
                const partnerElo = await this.userEloRepository.findOne({
                    where: {
                        user: { id: partnerUser.id },
                        sportCategory: { id: match.sportCategory.id }
                    }
                });
                partnerCurrentElo = partnerElo?.eloPoint || 1400;
                partnerWins = partnerElo?.wins || 0;
                partnerLosses = partnerElo?.losses || 0;
                partnerDraws = partnerElo?.draws || 0;
                partnerTotalMatches = partnerElo?.totalMatches || 0;
            }
            catch (error) {
                console.log(`Failed to get current Elo for partner ${partnerUser.id}:`, error);
            }
            let myWins = 0, myLosses = 0, myDraws = 0, myTotalMatches = 0;
            try {
                const myElo = await this.userEloRepository.findOne({
                    where: {
                        user: { id: user.id },
                        sportCategory: { id: match.sportCategory.id }
                    }
                });
                myWins = myElo?.wins || 0;
                myLosses = myElo?.losses || 0;
                myDraws = myElo?.draws || 0;
                myTotalMatches = myElo?.totalMatches || 0;
            }
            catch (error) {
                console.log(`Failed to get current Elo for user ${user.id}:`, error);
            }
            historyItems.push({
                id: match.id,
                partner: partnerUser.id,
                partner_nickname: partnerUser.nickname || 'Unknown',
                sportCategory: match.sportCategory.name || 'Unknown',
                result,
                isHandicap: match.isHandicap,
                created_at: match.createdAt,
                elo_before,
                elo_after,
                elo_delta,
                partner_elo_before,
                partner_elo_after,
                partner_elo_delta,
                partner_current_elo: partnerCurrentElo,
                my_wins: myWins,
                my_losses: myLosses,
                my_draws: myDraws,
                my_total_matches: myTotalMatches,
                partner_wins: partnerWins,
                partner_losses: partnerLosses,
                partner_draws: partnerDraws,
                partner_total_matches: partnerTotalMatches
            });
        }
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
};
exports.MatchResultService = MatchResultService;
exports.MatchResultService = MatchResultService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(match_result_entity_1.MatchResult)),
    __param(1, (0, typeorm_1.InjectRepository)(match_result_history_entity_1.MatchResultHistory)),
    __param(2, (0, typeorm_1.InjectRepository)(sport_category_entity_1.SportCategory)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(user_elo_entity_1.UserElo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        sse_service_1.SseService,
        elo_service_1.EloService,
        typeorm_2.DataSource])
], MatchResultService);
//# sourceMappingURL=match-result.service.js.map