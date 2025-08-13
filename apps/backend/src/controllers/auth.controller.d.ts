import { AuthService } from '../auth/auth.service';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';
export declare class AuthController {
    private readonly authService;
    private readonly userService;
    private readonly sportCategoryService;
    constructor(authService: AuthService, userService: UserService, sportCategoryService: SportCategoryService);
    login(loginDto: {
        accounts: any[];
        email: string;
        idToken: string;
    }): Promise<import("../auth/auth.service").LoginResponse | {
        success: boolean;
        message: string;
        error: any;
    }>;
    sampleLogin(loginDto: {
        userType: 'sample-user' | 'table-tennis-user';
    }): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        data: {
            user: {
                id: number;
                walletUserId: string;
                walletAddress: string;
                nickname: string;
                email: string;
            };
            accessToken: string;
        };
        message: string;
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        data?: undefined;
    }>;
    createTestUser(): Promise<{
        success: boolean;
        data: {
            user: {
                id: number;
                walletUserId: string;
                walletAddress: string;
                nickname: string;
                email: string;
            };
            accessToken: string;
            message: string;
        };
    }>;
    verifyToken(): Promise<{
        success: boolean;
        message: string;
    }>;
}
