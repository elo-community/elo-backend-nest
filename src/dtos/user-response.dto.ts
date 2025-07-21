import { User } from '../entities/user.entity';

export class UserResponseDto {
    id: number;
    email?: string;
    nickname?: string;
    walletAddress?: string;
    profileImageUrl?: string;
    createdAt: Date;
    tokenAmount: number;
    availableToken: number;

    constructor(user: User) {
        this.id = user.id;
        this.email = user.email;
        this.nickname = user.nickname;
        this.walletAddress = user.walletAddress;
        this.profileImageUrl = user.profileImageUrl;
        this.createdAt = user.createdAt;
        this.tokenAmount = user.tokenAmount;
        this.availableToken = user.availableToken;
    }
} 