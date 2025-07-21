import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UserService) { }

    @Get()
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userService.findAll();
        return users.map((user) => new UserResponseDto(user));
    }

    @Get(':id')
    async findOne(@Param('id') id: number): Promise<UserResponseDto | null> {
        const user = await this.userService.findOne(id);
        return user ? new UserResponseDto(user) : null;
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.userService.create(createUserDto);
        return new UserResponseDto(user);
    }

    @Put(':id')
    async update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto | null> {
        const user = await this.userService.update(id, updateUserDto);
        return user ? new UserResponseDto(user) : null;
    }

    @Delete(':id')
    async remove(@Param('id') id: number): Promise<{ deleted: boolean }> {
        const result = await this.userService.remove(id);
        return { deleted: !!result.affected };
    }
} 