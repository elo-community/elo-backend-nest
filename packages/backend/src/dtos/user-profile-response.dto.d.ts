import { UserEloResponseDto } from './user-elo-response.dto';
import { UserResponseDto } from './user-response.dto';
export declare class UserProfileResponseDto {
    user: UserResponseDto;
    userElos: UserEloResponseDto[];
    constructor(user: any, userElos: any[]);
}
