import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../services/user.service';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UserService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret,
        });
    }

    async validate(payload: any) {
        // payload: { sub: userId, username: ... }
        const userId = payload.sub;

        if (!userId) {
            throw new UnauthorizedException('Invalid token payload');
        }

        // 데이터베이스에서 최신 사용자 정보 조회
        const user = await this.userService.findById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // 최신 사용자 정보 반환
        return {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            walletAddress: user.walletAddress,
            walletUserId: user.walletUserId,
            tokenAmount: user.tokenAmount,
            availableToken: user.availableToken,
            profileImageUrl: user.profileImageUrl,
            createdAt: user.createdAt
        };
    }
} 