import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/jwt-user.interface';
import { CurrentUser } from '../auth/user.decorator';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) { }

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

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.userService.create({
            ...createUserDto,
            nickname: createUserDto.nickname || `user${Date.now()}`,
        });
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