import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import { CommentQueryDto, CreateCommentDto, UpdateCommentDto } from '../dtos/comment.dto';
import { CommentService } from '../services/comment.service';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({
    summary: '댓글 목록 조회',
    description: '페이지네이션을 지원하는 댓글 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '댓글 목록 조회 성공' })
  async findAll(@Query() query: CommentQueryDto, @CurrentUser() user: JwtUser) {
    const comments = await this.commentService.findAll(query);
    return {
      success: true,
      data: comments.map(comment => new CommentResponseDto(comment, user.id)),
      message: 'Comments retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number, @CurrentUser() user: JwtUser) {
    const { comment } = await this.commentService.findOne(id);
    return {
      success: true,
      data: new CommentResponseDto(comment, user.id),
      message: 'Comment retrieved successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: '댓글 생성', description: '새로운 댓글을 생성합니다.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        postId: {
          type: 'number',
          description: '게시글 ID',
          example: 1,
        },
        content: {
          type: 'string',
          description: '댓글 내용',
          example: '정말 좋은 게시글이네요!',
        },
        parentId: {
          type: 'number',
          description: '부모 댓글 ID (답글인 경우)',
          example: null,
        },
      },
      required: ['postId', 'content'],
    },
  })
  @ApiResponse({ status: 201, description: '댓글 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청 데이터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async create(@Body() createCommentDto: CreateCommentDto, @CurrentUser() user: JwtUser) {
    const { comment } = await this.commentService.create(createCommentDto, user);
    return {
      success: true,
      data: new CommentResponseDto(comment, user.id),
      message: 'Comment created successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: JwtUser,
  ) {
    const { comment } = await this.commentService.update(id, updateCommentDto, user);
    return {
      success: true,
      data: new CommentResponseDto(comment, user.id),
      message: 'Comment updated successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number, @CurrentUser() user: JwtUser) {
    const result = await this.commentService.remove(id, user);
    return {
      success: true,
      data: { deleted: !!result.affected },
      message: 'Comment deleted successfully',
    };
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('post/:postId/tree')
  async getCommentTree(@Param('postId') postId: string, @CurrentUser() user?: JwtUser) {
    const comments = await this.commentService.getCommentTree(Number(postId));
    return {
      success: true,
      data: comments.map(comment => new CommentResponseDto(comment, user?.id)),
      message: 'Comment tree retrieved successfully',
    };
  }
}
