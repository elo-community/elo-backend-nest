import { DeleteResult, Repository } from 'typeorm';
import { SportCategory } from '../entities/sport-category.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';
export declare class UserService {
    private readonly userRepository;
    private readonly userEloRepository;
    constructor(userRepository: Repository<User>, userEloRepository: Repository<UserElo>);
    findByEmail(email: string): Promise<User | null>;
    findById(id: number): Promise<User | null>;
    findByWalletUserId(walletUserId: string): Promise<User | null>;
    findByWalletAddress(walletAddress: string): Promise<User | null>;
    findOne(id: number): Promise<User | null>;
    create(data: Partial<User>): Promise<User>;
    createWithDefaultElos(data: Partial<User>, sportCategories: SportCategory[]): Promise<User>;
    findAll(): Promise<User[]>;
    remove(id: number): Promise<DeleteResult>;
    update(id: number, data: Partial<User>): Promise<User | null>;
    findProfileWithElos(userId: number): Promise<{
        user: User;
        userElos: UserElo[];
    }>;
}
