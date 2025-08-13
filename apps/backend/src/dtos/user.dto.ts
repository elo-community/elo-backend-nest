export class CreateUserDto {
    email?: string;
    nickname?: string;
    walletAddress?: string;
    profileImageUrl?: string;
}

export class UpdateUserDto {
    email?: string;
    nickname?: string;
    profileImageUrl?: string;
} 