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
                const rpcUrl = configService.get<string>('RPC_AMOY');
                if (!rpcUrl) {
                    throw new Error('RPC_AMOY not configured');
                }
                return { rpcUrl, chainId: 80002 };
            },
            inject: [ConfigService],
        },
        {
            provide: 'VERY_PROVIDER',
            useFactory: (configService: ConfigService) => {
                const rpcUrl = configService.get<string>('RPC_VERY');
                const chainId = configService.get<number>('CHAIN_VERY_ID');
                if (!rpcUrl || !chainId) {
                    throw new Error('RPC_VERY or CHAIN_VERY_ID not configured');
                }
                return { rpcUrl, chainId };
            },
            inject: [ConfigService],
        },
        {
            provide: 'ADMIN_WALLET',
            useFactory: (configService: ConfigService) => {
                const privateKey = configService.get<string>('ADMIN_PRIV_KEY');
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
                const privateKey = configService.get<string>('SIGNER_PRIV_KEY');
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