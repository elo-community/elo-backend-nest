import { User } from './user.entity';
export declare class TempImage {
    id: number;
    imageUrl: string;
    userId: number;
    createdAt: Date;
    user: User;
}
