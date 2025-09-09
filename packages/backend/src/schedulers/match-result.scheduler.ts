import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MatchResultService } from '../services/match-result.service';

@Injectable()
export class MatchResultScheduler {
  private readonly logger = new Logger(MatchResultScheduler.name);

  constructor(private readonly matchResultService: MatchResultService) {}

  @Cron('0 */5 * * * *') // 매 5분마다 실행 (매시 0, 5, 10, 15...)
  async cleanupExpiredRequests() {
    try {
      const result = await this.matchResultService.cleanupExpiredRequests();
      // 실제 정리 작업이 있었을 때만 로그 출력 (MatchResultService에서 처리)
    } catch (error) {
      this.logger.error('만료된 매치 결과 정리 중 오류 발생:', error);
    }
  }
}
