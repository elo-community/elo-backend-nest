import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
export type ChainType = 'amoy';
interface ChainConfig {
    rpcUrl: string;
    chainId: number;
}
export declare class BlockchainService implements OnModuleInit {
    private amoyProvider;
    private adminWalletConfig;
    private signerWalletConfig;
    private configService;
    private providers;
    private adminWallets;
    private signerWallet;
    private distributors;
    private pools;
    constructor(amoyProvider: ChainConfig, adminWalletConfig: {
        privateKey: string;
    }, signerWalletConfig: {
        privateKey: string;
    }, configService: ConfigService);
    onModuleInit(): Promise<void>;
    getProvider(chain: ChainType): ethers.JsonRpcProvider;
    adminWallet(chain: ChainType): ethers.Wallet;
    signer(): ethers.Wallet;
    getDistributorAddress(chain: ChainType): string;
    getPoolAddress(chain: ChainType): string;
    getChainId(chain: ChainType): number;
    isValidChain(chain: string): chain is ChainType;
}
export {};
