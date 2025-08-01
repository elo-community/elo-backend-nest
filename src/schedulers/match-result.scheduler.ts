import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MatchResultService } from '../services/match-result.service';

@Injectable()
export class MatchResultScheduler {
    constructor(
        private readonly matchResultService: MatchResultService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async cleanupExpiredRequests() {
        await this.matchResultService.cleanupExpiredRequests();
    }
} 