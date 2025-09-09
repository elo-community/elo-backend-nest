import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PostService } from '../services/post.service';

@Injectable()
export class RealTimeHotPostsScheduler {
  private readonly logger = new Logger(RealTimeHotPostsScheduler.name);

  constructor(private readonly postService: PostService) {}

  // 매시간마다 실시간 인기글 업데이트
  @Cron('0 0 * * * *') // 매시 0분마다 실행
  async updateRealTimeHotPosts() {
    const startTime = Date.now();
    this.logger.log('Starting real-time hot posts update...');

    try {
      // 실시간 인기글 계산
      const realTimeHotPosts = await this.postService.getRealTimeHotPosts();
      const processingTime = Date.now() - startTime;

      this.logger.log(`Real-time hot posts update completed in ${processingTime}ms`);

      // 각 카테고리별 인기글 상세 로깅
      for (const category of realTimeHotPosts) {
        this.logger.log(
          `Category: ${category.categoryName} (${category.categoryId}) - Top ${category.posts.length} posts`,
        );

        for (const post of category.posts) {
          this.logger.log(
            `  - Rank: Post ID: ${post.id}, Title: "${post.title}", Score: ${post.popularityScore}, Views: ${post.viewCount}`,
          );
        }
      }

      // 성능 메트릭 로깅
      this.logger.log(
        `Performance: Processed ${realTimeHotPosts.length} categories in ${processingTime}ms`,
      );

      // TODO: 여기에 캐시 업데이트 로직 추가 가능
      // await this.cacheService.set('real-time-hot-posts', realTimeHotPosts, 3600); // 1시간 캐시
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Failed to update real-time hot posts after ${processingTime}ms`, error);
    }
  }

  // 매 30분마다 빠른 체크 (선택적)
  @Cron('0 */30 * * * *') // 매 30분마다 실행
  async quickHealthCheck() {
    try {
      const hotPosts = await this.postService.getRealTimeHotPosts();
      const totalPosts = hotPosts.reduce((sum, category) => sum + category.posts.length, 0);

      this.logger.log(`Health check: ${hotPosts.length} categories, ${totalPosts} total hot posts`);
    } catch (error) {
      this.logger.warn('Health check failed for real-time hot posts', error);
    }
  }
}
