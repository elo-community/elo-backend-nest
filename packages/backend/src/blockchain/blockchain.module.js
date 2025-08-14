"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const blockchain_service_1 = require("./blockchain.service");
let BlockchainModule = class BlockchainModule {
};
exports.BlockchainModule = BlockchainModule;
exports.BlockchainModule = BlockchainModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            blockchain_service_1.BlockchainService,
            {
                provide: 'AMOY_PROVIDER',
                useFactory: (configService) => {
                    const config = configService.get('blockchain.amoy');
                    if (!config?.rpcUrl) {
                        throw new Error('RPC_AMOY not configured');
                    }
                    return { rpcUrl: config.rpcUrl, chainId: config.chainId };
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: 'ADMIN_WALLET',
                useFactory: (configService) => {
                    const privateKey = configService.get('blockchain.admin.privateKey');
                    if (!privateKey) {
                        throw new Error('ADMIN_PRIV_KEY not configured');
                    }
                    return { privateKey };
                },
                inject: [config_1.ConfigService],
            },
            {
                provide: 'SIGNER_WALLET',
                useFactory: (configService) => {
                    const privateKey = configService.get('blockchain.signer.privateKey');
                    if (!privateKey) {
                        throw new Error('SIGNER_PRIV_KEY not configured');
                    }
                    return { privateKey };
                },
                inject: [config_1.ConfigService],
            },
        ],
        exports: [blockchain_service_1.BlockchainService],
    })
], BlockchainModule);
//# sourceMappingURL=blockchain.module.js.map