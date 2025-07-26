import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { SportCategory } from '../entities/sport-category.entity';
import { UserElo } from '../entities/user-elo.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserElo)
        private readonly userEloRepository: Repository<UserElo>,
    ) { }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findById(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByWalletUserId(walletUserId: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { walletUserId } });
    }

    async findByWalletAddress(walletAddress: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { walletAddress } });
    }

    async findOne(id: number): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async create(data: Partial<User>): Promise<User> {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }

    async createWithDefaultElos(data: Partial<User>, sportCategories: SportCategory[]): Promise<User> {
        const user = await this.create(data);
        const sports = ['테니스', '배드민턴', '탁구', '당구', '바둑', '체스'];
        const userElos = sportCategories
            .filter(cat => sports.includes(cat.name || ''))
            .map(cat => this.userEloRepository.create({
                user,
                sportCategory: cat,
                eloPoint: 1400,
                tier: 'BRONZE',
                percentile: 50.0,
            }));
        await this.userEloRepository.save(userElos);
        return user;
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async remove(id: number): Promise<DeleteResult> {
        return this.userRepository.delete(id);
    }

    async update(id: number, data: Partial<User>): Promise<User | null> {
        await this.userRepository.update(id, data);
        return this.userRepository.findOne({ where: { id } });
    }

    async findProfileWithElos(userId: number): Promise<{ user: User; userElos: UserElo[] }> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userElos', 'userElos.sportCategory']
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            user,
            userElos: user.userElos || []
        };
    }
} 