"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_elo_entity_1 = require("../entities/user-elo.entity");
const user_entity_1 = require("../entities/user.entity");
let UserService = class UserService {
    userRepository;
    userEloRepository;
    constructor(userRepository, userEloRepository) {
        this.userRepository = userRepository;
        this.userEloRepository = userEloRepository;
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email } });
    }
    async findById(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async findByWalletUserId(walletUserId) {
        return this.userRepository.findOne({ where: { walletUserId } });
    }
    async findByWalletAddress(walletAddress) {
        return this.userRepository.findOne({ where: { walletAddress } });
    }
    async findOne(id) {
        return this.userRepository.findOne({ where: { id } });
    }
    async create(data) {
        const user = this.userRepository.create(data);
        return this.userRepository.save(user);
    }
    async createWithDefaultElos(data, sportCategories) {
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
            wins: 0,
            losses: 0,
            draws: 0,
            totalMatches: 0
        }));
        await this.userEloRepository.save(userElos);
        return user;
    }
    async findAll() {
        return this.userRepository.find();
    }
    async remove(id) {
        return this.userRepository.delete(id);
    }
    async update(id, data) {
        await this.userRepository.update(id, data);
        return this.userRepository.findOne({ where: { id } });
    }
    async findProfileWithElos(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['userElos', 'userElos.sportCategory']
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            user,
            userElos: user.userElos || []
        };
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_elo_entity_1.UserElo)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], UserService);
//# sourceMappingURL=user.service.js.map