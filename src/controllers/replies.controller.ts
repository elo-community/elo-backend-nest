import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { CreateReplyDto, ReplyQueryDto, UpdateReplyDto } from '../dtos/reply.dto';
import { ReplyService } from '../services/reply.service';

@Controller('replies')
@UseGuards(JwtAuthGuard)
export class RepliesController {
    constructor(private readonly replyService: ReplyService) { }

    @Get()
    async findAll(@Query() query: ReplyQueryDto) {
        return this.replyService.findAll(query);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.replyService.findOne(id);
    }

    @Post()
    async create(@Body() createReplyDto: CreateReplyDto, @CurrentUser() user: JwtUser) {
        return this.replyService.create(createReplyDto, user);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateReplyDto: UpdateReplyDto,
        @CurrentUser() user: JwtUser
    ) {
        return this.replyService.update(id, updateReplyDto, user);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
        return this.replyService.remove(id, user);
    }

    @Get('comment/:commentId')
    async findByCommentId(@Param('commentId', ParseIntPipe) commentId: number) {
        return this.replyService.findByCommentId(commentId);
    }
} 