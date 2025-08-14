import { User } from '../entities/user.entity';
export declare class UserResponseDto {
    id: number;
    email?: string;
    nickname?: string;
    walletAddress?: string;
    profileImageUrl?: string;
    tokenAmount: number;
    availableToken: number;
    constructor(user: User);
}
export declare class UserSimpleResponseDto {
    id: number;
    nickname?: string;
    profileImageUrl?: string;
    constructor(user: User);
}
