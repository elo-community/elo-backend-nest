import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService) { }

    async login(user: { id: number; username: string; walletAddress?: string }) {
        const payload = { username: user.username, sub: user.id, walletAddress: user.walletAddress };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
} 