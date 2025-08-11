import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserResponseDto } from 'src/dtos/user-response.dto';
import { UserService } from 'src/services/user.service';

export interface LoginResponse {
    success: boolean;
    data?: {
        accessToken: string;
        user: UserResponseDto;
    };
    message?: string;
}

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, private userService: UserService) { }

    async login(user: { id: number; username: string; walletAddress?: string }): Promise<LoginResponse> {
        const payload = { username: user.username, sub: user.id, walletAddress: user.walletAddress };
        const foundUser = await this.userService.findOne(user.id);
        const accessToken = this.jwtService.sign(payload);

        if (!foundUser) {
            throw new Error('User not found');
        }

        return {
            success: true,
            data: {
                accessToken: accessToken,
                user: new UserResponseDto(foundUser)
            },
            message: 'Login successful'
        };
    }

    verifyToken(token: string): any {
        try {
            return this.jwtService.verify(token);
        } catch (error) {
            throw new Error('Invalid token');
        }
    }
} 