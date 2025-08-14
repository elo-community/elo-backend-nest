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
var RewardsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsController = void 0;
const common_1 = require("@nestjs/common");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const claim_ticket_query_dto_1 = require("./dto/claim-ticket-query.dto");
const create_distribution_dto_1 = require("./dto/create-distribution.dto");
const rewards_service_1 = require("./rewards.service");
let RewardsController = RewardsController_1 = class RewardsController {
    rewardsService;
    blockchainService;
    logger = new common_1.Logger(RewardsController_1.name);
    constructor(rewardsService, blockchainService) {
        this.rewardsService = rewardsService;
        this.blockchainService = blockchainService;
    }
    async createDistribution(dto) {
        this.logger.log(`Creating distribution ${dto.id} on ${dto.chain}`);
        const result = await this.rewardsService.createDistribution(dto);
        return {
            success: true,
            distributionId: dto.id,
            chain: dto.chain,
            txHash: result.txHash,
            blockNumber: result.blockNumber,
        };
    }
    async getClaimTicket(id, query) {
        const distributionId = parseInt(id);
        if (isNaN(distributionId)) {
            throw new Error('Invalid distribution ID');
        }
        if (!this.blockchainService.isValidChain(query.chain)) {
            throw new Error('Invalid chain parameter');
        }
        this.logger.log(`Generating claim ticket for distribution ${distributionId}, account ${query.account} on ${query.chain}`);
        return await this.rewardsService.generateClaimTicket(distributionId, query);
    }
    async getDistribution(id, chain) {
        const distributionId = parseInt(id);
        if (isNaN(distributionId)) {
            throw new Error('Invalid distribution ID');
        }
        if (!this.blockchainService.isValidChain(chain)) {
            throw new Error('Invalid chain parameter');
        }
        return await this.rewardsService.getDistribution(distributionId, chain);
    }
};
exports.RewardsController = RewardsController;
__decorate([
    (0, common_1.Post)('admin/distributions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_distribution_dto_1.CreateDistributionDto]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "createDistribution", null);
__decorate([
    (0, common_1.Get)(':id/ticket'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, claim_ticket_query_dto_1.ClaimTicketQueryDto]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getClaimTicket", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('chain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RewardsController.prototype, "getDistribution", null);
exports.RewardsController = RewardsController = RewardsController_1 = __decorate([
    (0, common_1.Controller)('rewards'),
    __metadata("design:paramtypes", [rewards_service_1.RewardsService,
        blockchain_service_1.BlockchainService])
], RewardsController);
//# sourceMappingURL=rewards.controller.js.map