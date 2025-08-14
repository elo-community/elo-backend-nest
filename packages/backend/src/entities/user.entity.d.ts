import { Comment } from './comment.entity';
import { Post } from './post.entity';
import { Reply } from './reply.entity';
import { UserElo } from './user-elo.entity';
export declare class User {
    id: number;
    walletUserId: string;
    walletAddress?: string;
    nickname?: string;
    email?: string;
    createdAt: Date;
    tokenAmount: number;
    availableToken: number;
    profileImageUrl?: string;
    comments?: Comment[];
    posts?: Post[];
    replies?: Reply[];
    userElos?: UserElo[];
}
