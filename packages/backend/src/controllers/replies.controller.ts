import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { ReplyResponseDto } from '../dtos/reply-response.dto';
import { CreateReplyDto, ReplyQueryDto, UpdateReplyDto } from '../dtos/reply.dto';
import { ReplyService } from '../services/reply.service';

@Controller('replies')
@UseGuards(JwtAuthGuard)
export class RepliesController {
  constructor(private readonly replyService: ReplyService) {}

  @Get()
  async findAll(@Query() query: ReplyQueryDto) {
    const replies = await this.replyService.findAll(query);
    return {
      success: true,
      data: replies.map(reply => new ReplyResponseDto(reply)),
      message: 'Replies retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reply = await this.replyService.findOne(id);
    return {
      success: true,
      data: new ReplyResponseDto(reply),
      message: 'Reply retrieved successfully',
    };
  }

  @Post()
  async create(@Body() createReplyDto: CreateReplyDto, @CurrentUser() user: JwtUser) {
    const reply = await this.replyService.create(createReplyDto, user);
    return {
      success: true,
      data: new ReplyResponseDto(reply),
      message: 'Reply created successfully',
    };
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReplyDto: UpdateReplyDto,
    @CurrentUser() user: JwtUser,
  ) {
    const reply = await this.replyService.update(id, updateReplyDto, user);
    return {
      success: true,
      data: new ReplyResponseDto(reply),
      message: 'Reply updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    const result = await this.replyService.remove(id, user);
    return {
      success: true,
      data: { deleted: !!result.affected },
      message: 'Reply deleted successfully',
    };
  }

  @Get('comment/:commentId')
  async findByCommentId(@Param('commentId', ParseIntPipe) commentId: number) {
    const replies = await this.replyService.findByCommentId(commentId);
    return {
      success: true,
      data: replies.map(reply => new ReplyResponseDto(reply)),
      message: 'Replies for comment retrieved successfully',
    };
  }
}
