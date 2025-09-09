import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateMatchPostDto,
  GetRecommendedMatchPostsDto,
  MatchRequestDto,
  MatchResponseDto,
} from '../dtos/match-post.dto';
import { MatchPostService } from '../services/match-post.service';

@Controller('match-posts')
export class MatchPostController {
  constructor(private readonly matchPostService: MatchPostService) {}

  /**
   * 매치글 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createMatchPost(@Body() createMatchPostDto: CreateMatchPostDto, @Request() req: any) {
    const post = await this.matchPostService.createMatchPost(createMatchPostDto, req.user);
    return {
      success: true,
      data: post,
    };
  }

  /**
   * Elo 기반 추천 매치글 조회
   */
  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommendedMatchPosts(
    @Request() req: any,
    @Query() query?: GetRecommendedMatchPostsDto,
  ) {
    // JWT 토큰에서 사용자 ID 추출
    const userId = req.user.id;
    console.log(`🔍 [MatchPostController] 추천 매치글 조회 - userId: ${userId}`);

    // limit 파라미터 안전하게 처리 (PostService와 동일한 방식)
    let limitNum = 3; // 기본값
    if (query?.limit && query.limit > 0) {
      limitNum = Math.min(query.limit, 20); // 최대 20개로 제한
    }

    if (query?.sport) {
      // 특정 스포츠별 추천
      const posts = await this.matchPostService.getRecommendedMatchPostsByCategory(
        userId,
        query.sport,
        limitNum,
      );

      return {
        success: true,
        data: posts,
        message: `Found ${posts.length} recommended match posts for sport ${query.sport} based on your Elo rating`,
      };
    } else {
      // 전체 추천
      const posts = await this.matchPostService.getRecommendedMatchPosts(userId, limitNum);

      return {
        success: true,
        data: posts,
        message: `Found ${posts.length} recommended match posts based on your Elo rating`,
      };
    }
  }

  /**
   * 매치 신청 (구체적인 라우트를 먼저 정의)
   */
  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestMatch(@Body() matchRequestDto: MatchRequestDto, @Request() req: any) {
    const matchRequest = await this.matchPostService.requestMatch(matchRequestDto, req.user);
    return {
      success: true,
      data: matchRequest,
    };
  }

  /**
   * 매치 신청 응답 (수락/거절) (구체적인 라우트를 먼저 정의)
   */
  @Post('respond')
  @UseGuards(JwtAuthGuard)
  async respondToMatchRequest(@Body() matchResponseDto: MatchResponseDto, @Request() req: any) {
    const matchRequest = await this.matchPostService.respondToMatchRequest(
      matchResponseDto,
      req.user,
    );
    return {
      success: true,
      data: matchRequest,
    };
  }

  /**
   * 매치글 상세 조회 (동적 라우트는 나중에 정의)
   */
  @Get(':id')
  async getMatchPostDetail(@Param('id', ParseIntPipe) id: number) {
    const post = await this.matchPostService.getMatchPostDetail(id);
    return {
      success: true,
      data: post,
    };
  }

  /**
   * 매치글 목록 조회 (루트 경로는 마지막에 정의)
   */
  @Get()
  async getMatchPosts(
    @Query('sportCategoryId') sportCategoryId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const sportId = sportCategoryId ? parseInt(sportCategoryId) : undefined;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const result = await this.matchPostService.getMatchPosts(sportId, pageNum, limitNum);
    return {
      success: true,
      data: result,
    };
  }
}
