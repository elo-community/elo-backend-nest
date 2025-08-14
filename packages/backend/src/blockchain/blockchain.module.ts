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
                // 환경변수가 설정되지 않은 경우 기본값 사용 (개발/테스트 환경)
                const rpcUrl = config?.rpcUrl || 'https://rpc-amoy.polygon.technology';
                const chainId = config?.chainId || 80002;

                console.log(`[BlockchainModule] Using RPC URL: ${rpcUrl}`);
                return { rpcUrl, chainId };
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
        //         },
        //     inject: [ConfigService],
        // },
        {
            provide: 'ADMIN_WALLET',
            useFactory: (configService: ConfigService) => {
                const privateKey = configService.get('blockchain.admin.privateKey');

                // 환경변수가 설정되지 않은 경우 null 반환 (기능 비활성화)
                if (!privateKey || privateKey === '0x1234567890123456789012345678901234567890123456789012345678901234') {
                    console.warn('[BlockchainModule] Admin wallet not configured - blockchain features will be limited');
                    return { privateKey: null };
                }

                return { privateKey };
            },
            inject: [ConfigService],
        },
        {
            provide: 'SIGNER_WALLET',
            useFactory: (configService: ConfigService) => {
                const privateKey = configService.get('blockchain.signer.privateKey');

                // 환경변수가 설정되지 않은 경우 null 반환 (기능 비활성화)
                if (!privateKey || privateKey === '0x1234567890123456789012345678901234567890123456789012345678901234') {
                    console.warn('[BlockchainModule] Signer wallet not configured - signing features will be limited');
                    return { privateKey: null };
                }

                return { privateKey };
            },
            inject: [ConfigService],
        },
    ],
    exports: [BlockchainService],
})
export class BlockchainModule { } 