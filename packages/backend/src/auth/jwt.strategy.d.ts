import { Strategy } from 'passport-jwt';
import { UserService } from '../services/user.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly userService;
    constructor(userService: UserService);
    validate(payload: any): Promise<{
        id: number;
        email: string;
        nickname: string;
        walletAddress: string;
        walletUserId: string;
        tokenAmount: number;
        availableToken: number;
        profileImageUrl: string;
        createdAt: Date;
    }>;
}
export {};
