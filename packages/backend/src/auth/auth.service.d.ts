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
export declare class AuthService {
    private jwtService;
    private userService;
    constructor(jwtService: JwtService, userService: UserService);
    login(user: {
        id: number;
        username: string;
        walletAddress?: string;
    }): Promise<LoginResponse>;
    verifyToken(token: string): any;
}
