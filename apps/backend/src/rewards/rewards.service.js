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
var RewardsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsService = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
const blockchain_service_1 = require("../blockchain/blockchain.service");
const eip712_1 = require("../shared/eip712");
let RewardsService = RewardsService_1 = class RewardsService {
    blockchainService;
    logger = new common_1.Logger(RewardsService_1.name);
    constructor(blockchainService) {
        this.blockchainService = blockchainService;
    }
    async createDistribution(dto) {
        try {
            const { chain, id, token, total, snapshotBlock, deadline } = dto;
            const adminWallet = this.blockchainService.adminWallet(chain);
            const provider = this.blockchainService.getProvider(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);
            const distributor = new ethers_1.ethers.Contract(distributorAddress, [
                'function createDistribution(uint256 id, address token, uint256 total, uint256 snapshotBlock, uint256 deadline) external',
            ], adminWallet);
            const tx = await distributor.createDistribution(id, token, total, snapshotBlock, deadline);
            const receipt = await tx.wait();
            this.logger.log(`Distribution ${id} created on ${chain} with tx: ${receipt.hash}`);
            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber || 0,
            };
        }
        catch (error) {
            this.logger.error(`Failed to create distribution on ${dto.chain}:`, error);
            throw error;
        }
    }
    async generateClaimTicket(distributionId, query) {
        try {
            const { chain, account, postId } = query;
            const chainId = this.blockchainService.getChainId(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);
            const signerWallet = this.blockchainService.signer();
            const domain = (0, eip712_1.domainFor)(chainId, distributorAddress);
            const message = {
                distributionId,
                postId: postId,
                account: account,
                authorizedAmount: await this.calculateAuthorizedAmount(distributionId, account, chain),
                deadline: Math.floor(Date.now() / 1000) + 86400,
            };
            const signature = await signerWallet.signTypedData(domain, eip712_1.claimTypes, message);
            this.logger.log(`Claim ticket generated for distribution ${distributionId}, account ${account} on ${chain}`);
            return {
                domain,
                types: eip712_1.claimTypes,
                message,
                signature,
            };
        }
        catch (error) {
            this.logger.error(`Failed to generate claim ticket:`, error);
            throw error;
        }
    }
    async calculateAuthorizedAmount(distributionId, account, chain) {
        return ethers_1.ethers.parseEther('100').toString();
    }
    async getDistribution(distributionId, chain) {
        try {
            const provider = this.blockchainService.getProvider(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);
            const distributor = new ethers_1.ethers.Contract(distributorAddress, [
                'function getDistribution(uint256 id) external view returns (tuple(address token, uint256 total, uint256 remaining, uint256 snapshotBlock, uint256 deadline, bool active))',
            ], provider);
            const distribution = await distributor.getDistribution(distributionId);
            return {
                token: distribution[0],
                total: distribution[1].toString(),
                remaining: distribution[2].toString(),
                snapshotBlock: distribution[3].toString(),
                deadline: distribution[4].toString(),
                active: distribution[5],
            };
        }
        catch (error) {
            this.logger.error(`Failed to get distribution ${distributionId} on ${chain}:`, error);
            throw error;
        }
    }
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = RewardsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map