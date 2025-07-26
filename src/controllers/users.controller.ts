import { Body, Controller, Delete, Get, Param, Post, Put, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { UserProfileResponseDto } from '../dtos/user-profile-response.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly userService: UserService,
        private readonly sportCategoryService: SportCategoryService,
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

    @Get(':id/profile')
    async getProfile(@Param('id') id: string, @CurrentUser() user?: JwtUser): Promise<UserProfileResponseDto> {
        const userId = id === 'me' ? user?.id : parseInt(id);

        if (!userId) {
            throw new UnauthorizedException('User not authenticated');
        }

        const profileData = await this.userService.findProfileWithElos(userId);
        return new UserProfileResponseDto(profileData.user, profileData.userElos);
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