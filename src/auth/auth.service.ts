import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface LoginResponse {
    success: boolean;
    data?: {
        accessToken: string;
    };
    message?: string;
}

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async login(user: { id: number; username: string; walletAddress?: string }): Promise<LoginResponse> {
        const payload = { username: user.username, sub: user.id, walletAddress: user.walletAddress };
        const accessToken = this.jwtService.sign(payload);

        return {
            success: true,
            data: {
                accessToken
            },
            message: 'Login successful'
        };
    }
} 