import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';

@Module({
    imports: [ConfigModule],
    providers: [
        BlockchainService,
        {
            provide: 'AMOY_PROVIDER',
            useFactory: (configService: ConfigService) => {
                const config = configService.get('blockchain.amoy');
                if (!config?.rpcUrl) {
                    throw new Error('RPC_AMOY not configured');
                }
                return { rpcUrl: config.rpcUrl, chainId: config.chainId };
            },
            inject: [ConfigService],
        },
        // {
        //     provide: 'VERY_PROVIDER',
        //     useFactory: (configService: ConfigService) => {
        //         const config = configService.get('blockchain.very');
        //         if (!config?.rpcUrl || !config?.chainId) {
        //             throw new Error('RPC_VERY or CHAIN_VERY_ID not configured');
        //         }
        //         return { rpcUrl: config.rpcUrl, chainId: config.chainId };
        //     },
        //     inject: [ConfigService],
        // },
        {
            provide: 'ADMIN_WALLET',
            useFactory: (configService: ConfigService) => {
                const privateKey = configService.get('blockchain.admin.privateKey');
                if (!privateKey) {
                    throw new Error('ADMIN_PRIV_KEY not configured');
                }
                return { privateKey };
            },
            inject: [ConfigService],
        },
        {
            provide: 'SIGNER_WALLET',
            useFactory: (configService: ConfigService) => {
                const privateKey = configService.get('blockchain.signer.privateKey');
                if (!privateKey) {
                    throw new Error('SIGNER_PRIV_KEY not configured');
                }
                return { privateKey };
            },
            inject: [ConfigService],
        },
    ],
    exports: [BlockchainService],
})
export class BlockchainModule { } 