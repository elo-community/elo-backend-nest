import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CommentResponseDto } from 'src/dtos/comment-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { PostDetailResponseDto } from '../dtos/post-detail-response.dto';
import { PostResponseDto } from '../dtos/post-response.dto';
import { CreatePostDto, HotPostResponseDto, PostQueryDto, UpdatePostDto } from '../dtos/post.dto';
import { CommentService } from '../services/comment.service';
import { PostService } from '../services/post.service';

@UseGuards(OptionalJwtAuthGuard)
@Controller('posts')
export class PostsController {
    constructor(
        private readonly postService: PostService,
        private readonly commentService: CommentService,
    ) { }

    @Get()
    async findAll(@Query() query: PostQueryDto, @CurrentUser() user?: JwtUser) {
        const paginatedPosts = await this.postService.findAll(query);

        // 각 포스트에 대해 사용자의 좋아요/싫어요 여부 확인
        const postsWithStatus = await Promise.all(
            paginatedPosts.data.map(async (post) => {
                // 사용자의 좋아요/싫어요 여부 확인
                const isLiked = user ? await this.postService.checkUserLikeStatus(post.id, user.id) : false;
                const isHated = user ? await this.postService.checkUserHateStatus(post.id, user.id) : false;

                return new PostResponseDto(post, isLiked, isHated);
            })
        );

        return {
            success: true,
            data: postsWithStatus,
            pagination: paginatedPosts.pagination,
            message: 'Posts retrieved successfully'
        };
    }

    /**
     * 전체 인기글 조회 (최근 24시간 반응 기준, 전체에서 상위 3개)
     * - 실시간 계산으로 항상 최신 반응 반영
     * - 보상 시스템과는 별개로 운영
     */
    @Public()
    @Get('hot')
    async findHot() {
        const hotPosts = await this.postService.getHotPosts();
        const formattedHotPosts = hotPosts.map(post => new HotPostResponseDto(post));

        return {
            success: true,
            data: formattedHotPosts,
            message: 'Hot posts retrieved successfully'
        };
    }

    /**
     * 카테고리별 실시간 인기글 조회 (최근 1시간 반응 기준, 카테고리별 3개씩)
     * - 1시간마다 자동 업데이트
     * - 사용자들이 최신 트렌드를 볼 수 있음
     * - 카테고리별로 그룹화된 형태로 반환
     */
    @Public()
    @Get('hot/realtime')
    async findRealTimeHot() {
        const hotPosts = await this.postService.getRealTimeHotPosts();

        // 카테고리별로 그룹화된 형태로 반환
        const formattedHotPosts = hotPosts.map(category => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            posts: category.posts.map(post => new HotPostResponseDto(post))
        }));

        return {
            success: true,
            data: formattedHotPosts,
            message: 'Real-time hot posts retrieved successfully'
        };
    }

    /**
     * 저장된 인기글 조회 (24시간마다 선정된 것, 보상용)
     * - 매일 새벽 0시에 자동 선정
     - 전체에서 상위 3개 선정
     * - 보상 지급 기준으로 활용
     * - 하루 동안 고정된 목록
     * - ?date=2024-01-15 쿼리로 특정 날짜 조회 가능
     */
    @Public()
    @Get('hot/stored')
    async findStoredHot(@Query('date') dateStr?: string) {
        let targetDate: Date | undefined;
        if (dateStr) {
            targetDate = new Date(dateStr);
            if (isNaN(targetDate.getTime())) {
                return {
                    success: false,
                    message: 'Invalid date format. Use YYYY-MM-DD'
                };
            }
        }

        const hotPosts = await this.postService.getStoredHotPosts(targetDate);
        const formattedHotPosts = hotPosts.map(post => new HotPostResponseDto(post));

        return {
            success: true,
            data: formattedHotPosts,
            message: 'Stored hot posts retrieved successfully'
        };
    }

    @UseGuards(OptionalJwtAuthGuard)
    @Get(':id')
    async findOneWithDetails(@Param('id') id: number, @Req() req: Request, @CurrentUser() user?: JwtUser) {
        const post = await this.postService.findOneWithDetails(id);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }

        // IP 기반으로 중복 조회 방지하면서 조회수 증가
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const incremented = await this.postService.incrementViewCountIfNotViewed(id, ip);

        // 조회수가 증가된 경우 Post 객체 업데이트
        if (incremented) {
            post.viewCount += 1;
        }

        // 사용자의 좋아요/싫어요 여부와 개수 확인
        const isLiked = user ? await this.postService.checkUserLikeStatus(id, user.id) : false;
        const isHated = user ? await this.postService.checkUserHateStatus(id, user.id) : false;
        const likeCount = await this.postService.getPostLikeCount(id);
        const hateCount = await this.postService.getPostHateCount(id);

        return {
            success: true,
            data: new PostDetailResponseDto(post, isLiked, isHated, likeCount, hateCount, user?.id),
            message: 'Post with details retrieved successfully'
        };
    }

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @Get(':postId/comments')
    async getCommentsByPost(@Param('postId') postId: string, @CurrentUser() user?: JwtUser) {
        const comments = await this.commentService.findByPostId(postId);
        return {
            success: true,
            data: comments.map((comment) => new CommentResponseDto(comment, user?.id)),
            message: 'Comments retrieved successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createPostDto: CreatePostDto, @CurrentUser() user: JwtUser) {
        const post = await this.postService.create(createPostDto, user);
        return {
            success: true,
            data: new PostResponseDto(post),
            message: 'Post created successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async update(@Param('id') id: number, @Body() updatePostDto: UpdatePostDto) {
        const post = await this.postService.update(id, updatePostDto);
        if (!post) {
            return {
                success: false,
                message: 'Post not found'
            };
        }
        return {
            success: true,
            data: new PostResponseDto(post),
            message: 'Post updated successfully'
        };
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: number) {
        const result = await this.postService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'Post deleted successfully'
        };
    }
} 