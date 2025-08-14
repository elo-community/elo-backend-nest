import { Body, Controller, Delete, Get, Param, Post, Put, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { MatchResultHistoryQueryDto } from '../dtos/match-result-history.dto';
import { PostResponseDto } from '../dtos/post-response.dto';
import { UserProfileResponseDto } from '../dtos/user-profile-response.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { MatchResultService } from '../services/match-result.service';
import { PostService } from '../services/post.service';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UserService,
        private readonly sportCategoryService: SportCategoryService,
        private readonly postService: PostService,
        private readonly matchResultService: MatchResultService,
    ) { }

    @Get()
    async findAll() {
        const users = await this.userService.findAll();
        return {
            success: true,
            data: users.map((user) => new UserResponseDto(user)),
            message: 'Users retrieved successfully'
        };
    }

    @Get('me')
    async getMe(@CurrentUser() currentUser: JwtUser) {
        const user = await this.userService.findOne(currentUser.id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new UserResponseDto(user),
            message: 'Current user profile retrieved successfully'
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: number) {
        const user = await this.userService.findOne(id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new UserResponseDto(user),
            message: 'User retrieved successfully'
        };
    }


    @Get('me/profile')
    async getMyProfile(@CurrentUser() user?: JwtUser): Promise<UserProfileResponseDto> {
        const userId = user?.id;

        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const profileData = await this.userService.findProfileWithElos(userId);
        return new UserProfileResponseDto(profileData.user, profileData.userElos);
    }

    @Public()
    @Get(':id/profile')
    async getProfile(@Param('id') id: string): Promise<UserProfileResponseDto> {
        const userId = parseInt(id);

        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const profileData = await this.userService.findProfileWithElos(userId);
        return new UserProfileResponseDto(profileData.user, profileData.userElos);
    }

    @Get(':id/posts')
    async getUserPosts(@Param('id') id: string, @CurrentUser() currentUser: JwtUser) {
        const userId = id === 'me' ? currentUser.id : parseInt(id);

        if (!userId) {
            return {
                success: false,
                message: 'Invalid user ID'
            };
        }

        // Check if user exists
        const user = await this.userService.findOne(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Get posts by user
        const posts = await this.postService.findByUserId(userId);

        // 각 포스트에 대해 사용자의 좋아요/싫어요 여부 확인
        const postsWithStatus = await Promise.all(
            posts.map(async (post) => {
                const isLiked = await this.postService.checkUserLikeStatus(post.id, currentUser.id);
                const isHated = await this.postService.checkUserHateStatus(post.id, currentUser.id);
                return new PostResponseDto(post, isLiked, isHated);
            })
        );

        return {
            success: true,
            data: postsWithStatus,
            message: 'User posts retrieved successfully'
        };
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const categories = await this.sportCategoryService.findAll();
        const user = await this.userService.createWithDefaultElos({
            ...createUserDto,
            nickname: createUserDto.nickname || `user${Date.now()}`,
        }, categories);
        return {
            success: true,
            data: new UserResponseDto(user),
            message: 'User created successfully'
        };
    }

    @Put('me/nickname')
    async updateNickname(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: JwtUser) {
        const user = await this.userService.findById(currentUser.id);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        user.nickname = createUserDto.nickname;
        await this.userService.update(currentUser.id, user);

        return {
            success: true,
            data: new UserResponseDto(user),
            message: 'User created successfully'
        };
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.userService.update(id, updateUserDto);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }
        return {
            success: true,
            data: new UserResponseDto(user),
            message: 'User updated successfully'
        };
    }

    @Get('me/match-results')
    async getMyMatchHistory(@Query() query: MatchResultHistoryQueryDto, @CurrentUser() currentUser: JwtUser) {
        const matchHistory = await this.matchResultService.findUserMatchHistory(currentUser, query);

        return {
            success: true,
            data: {
                matches: matchHistory.data
            },
            pagination: matchHistory.pagination,
            message: 'Match history retrieved successfully'
        };
    }

    @Delete(':id')
    async remove(@Param('id') id: number) {
        const result = await this.userService.remove(id);
        return {
            success: true,
            data: { deleted: !!result.affected },
            message: 'User deleted successfully'
        };
    }
} 