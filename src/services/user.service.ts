import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
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
} 