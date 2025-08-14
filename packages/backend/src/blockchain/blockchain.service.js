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
exports.BlockchainService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ethers_1 = require("ethers");
let BlockchainService = class BlockchainService {
    amoyProvider;
    adminWalletConfig;
    signerWalletConfig;
    configService;
    providers = new Map();
    adminWallets = new Map();
    signerWallet;
    distributors = new Map();
    pools = new Map();
    constructor(amoyProvider, adminWalletConfig, signerWalletConfig, configService) {
        this.amoyProvider = amoyProvider;
        this.adminWalletConfig = adminWalletConfig;
        this.signerWalletConfig = signerWalletConfig;
        this.configService = configService;
        this.providers.set('amoy', new ethers_1.ethers.JsonRpcProvider(this.amoyProvider.rpcUrl));
        this.adminWallets.set('amoy', new ethers_1.ethers.Wallet(this.adminWalletConfig.privateKey, this.providers.get('amoy')));
        this.signerWallet = new ethers_1.ethers.Wallet(this.signerWalletConfig.privateKey);
    }
    async onModuleInit() {
        this.distributors.set('amoy', this.configService.get('blockchain.contracts.distributor.amoy') || '');
        this.pools.set('amoy', this.configService.get('blockchain.contracts.rewardPool.amoy') || '');
    }
    getProvider(chain) {
        const provider = this.providers.get(chain);
        if (!provider) {
            throw new Error(`Provider not found for chain: ${chain}`);
        }
        return provider;
    }
    adminWallet(chain) {
        const wallet = this.adminWallets.get(chain);
        if (!wallet) {
            throw new Error(`Admin wallet not found for chain: ${chain}`);
        }
        return wallet;
    }
    signer() {
        return this.signerWallet;
    }
    getDistributorAddress(chain) {
        const address = this.distributors.get(chain);
        if (!address) {
            throw new Error(`Distributor address not found for chain: ${chain}`);
        }
        return address;
    }
    getPoolAddress(chain) {
        const address = this.pools.get(chain);
        if (!address) {
            throw new Error(`Pool address not found for chain: ${chain}`);
        }
        return address;
    }
    getChainId(chain) {
        switch (chain) {
            case 'amoy':
                return this.amoyProvider.chainId;
            default:
                throw new Error(`Unknown chain: ${chain}`);
        }
    }
    isValidChain(chain) {
        return chain === 'amoy';
    }
};
exports.BlockchainService = BlockchainService;
exports.BlockchainService = BlockchainService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('AMOY_PROVIDER')),
    __param(1, (0, common_1.Inject)('ADMIN_WALLET')),
    __param(2, (0, common_1.Inject)('SIGNER_WALLET')),
    __metadata("design:paramtypes", [Object, Object, Object, config_1.ConfigService])
], BlockchainService);
//# sourceMappingURL=blockchain.service.js.map