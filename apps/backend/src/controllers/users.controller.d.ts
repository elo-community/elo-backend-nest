import { JwtUser } from '../auth/jwt-user.interface';
import { MatchResultHistoryQueryDto } from '../dtos/match-result-history.dto';
import { PostResponseDto } from '../dtos/post-response.dto';
import { UserProfileResponseDto } from '../dtos/user-profile-response.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';
import { MatchResultService } from '../services/match-result.service';
import { PostService } from '../services/post.service';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';
export declare class UsersController {
    private readonly userService;
    private readonly sportCategoryService;
    private readonly postService;
    private readonly matchResultService;
    constructor(userService: UserService, sportCategoryService: SportCategoryService, postService: PostService, matchResultService: MatchResultService);
    findAll(): Promise<{
        success: boolean;
        data: UserResponseDto[];
        message: string;
    }>;
    getMe(currentUser: JwtUser): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: UserResponseDto;
        message: string;
    }>;
    findOne(id: number): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: UserResponseDto;
        message: string;
    }>;
    getMyProfile(user?: JwtUser): Promise<UserProfileResponseDto>;
    getProfile(id: string): Promise<UserProfileResponseDto>;
    getUserPosts(id: string, currentUser: JwtUser): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: PostResponseDto[];
        message: string;
    }>;
    create(createUserDto: CreateUserDto): Promise<{
        success: boolean;
        data: UserResponseDto;
        message: string;
    }>;
    updateNickname(createUserDto: CreateUserDto, currentUser: JwtUser): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: UserResponseDto;
        message: string;
    }>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: UserResponseDto;
        message: string;
    }>;
    getMyMatchHistory(query: MatchResultHistoryQueryDto, currentUser: JwtUser): Promise<{
        success: boolean;
        data: {
            matches: any[];
        };
        pagination: any;
        message: string;
    }>;
    remove(id: number): Promise<{
        success: boolean;
        data: {
            deleted: boolean;
        };
        message: string;
    }>;
}
