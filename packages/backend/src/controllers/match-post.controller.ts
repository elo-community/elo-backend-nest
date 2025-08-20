import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMatchPostDto, MatchRequestDto, MatchResponseDto } from '../dtos/match-post.dto';
import { MatchPostService } from '../services/match-post.service';

@Controller('match-posts')
export class MatchPostController {
    constructor(private readonly matchPostService: MatchPostService) { }

    /**
     * 매치글 생성
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    async createMatchPost(@Body() createMatchPostDto: CreateMatchPostDto, @Request() req: any) {
        const post = await this.matchPostService.createMatchPost(createMatchPostDto, req.user);
        return {
            success: true,
            data: post
        };
    }

    /**
     * 매치글 상세 조회
     */
    @Get(':id')
    async getMatchPostDetail(@Param('id', ParseIntPipe) id: number) {
        const post = await this.matchPostService.getMatchPostDetail(id);
        return {
            success: true,
            data: post
        };
    }

    /**
     * 매치글 목록 조회
     */
    @Get()
    async getMatchPosts(
        @Query('sportCategoryId') sportCategoryId?: string,
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '10'
    ) {
        const sportId = sportCategoryId ? parseInt(sportCategoryId) : undefined;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const result = await this.matchPostService.getMatchPosts(sportId, pageNum, limitNum);
        return {
            success: true,
            data: result
        };
    }

    /**
     * 매치 신청
     */
    @Post('request')
    @UseGuards(JwtAuthGuard)
    async requestMatch(@Body() matchRequestDto: MatchRequestDto, @Request() req: any) {
        const matchRequest = await this.matchPostService.requestMatch(matchRequestDto, req.user);
        return {
            success: true,
            data: matchRequest
        };
    }

    /**
     * 매치 신청 응답 (수락/거절)
     */
    @Post('respond')
    @UseGuards(JwtAuthGuard)
    async respondToMatchRequest(@Body() matchResponseDto: MatchResponseDto, @Request() req: any) {
        const matchRequest = await this.matchPostService.respondToMatchRequest(matchResponseDto, req.user);
        return {
            success: true,
            data: matchRequest
        };
    }
}
