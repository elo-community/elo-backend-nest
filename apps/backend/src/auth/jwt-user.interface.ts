export interface JwtUser {
    id: number;
    email?: string;
    nickname?: string;
    walletAddress?: string;
    walletUserId: string;
    tokenAmount: number;
    availableToken: number;
    profileImageUrl?: string;
    createdAt: Date;
} 