import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

export type ChainType = 'amoy';

interface ChainConfig {
    rpcUrl: string;
    chainId: number;
}

@Injectable()
export class BlockchainService implements OnModuleInit {
    private providers: Map<ChainType, ethers.JsonRpcProvider> = new Map();
    private adminWallets: Map<ChainType, ethers.Wallet> = new Map();
    private signerWallet: ethers.Wallet;
    private distributors: Map<ChainType, string> = new Map();
    private pools: Map<ChainType, string> = new Map();

    constructor(
        @Inject('AMOY_PROVIDER') private amoyProvider: ChainConfig,
        // @Inject('VERY_PROVIDER') private veryProvider: ChainConfig,
        @Inject('ADMIN_WALLET') private adminWalletConfig: { privateKey: string },
        @Inject('SIGNER_WALLET') private signerWalletConfig: { privateKey: string },
        private configService: ConfigService,
    ) {
        // Initialize providers
        this.providers.set('amoy', new ethers.JsonRpcProvider(this.amoyProvider.rpcUrl));
        // this.providers.set('very', new ethers.JsonRpcProvider(this.veryProvider.rpcUrl));

        // Initialize wallets
        this.adminWallets.set('amoy', new ethers.Wallet(this.adminWalletConfig.privateKey, this.providers.get('amoy')!));
        // this.adminWallets.set('very', new ethers.Wallet(this.adminWalletConfig.privateKey, this.providers.get('very')!));

        this.signerWallet = new ethers.Wallet(this.signerWalletConfig.privateKey);
    }

    async onModuleInit() {
        // Load contract addresses from config
        this.distributors.set('amoy', this.configService.get<string>('blockchain.contracts.distributor.amoy') || '');
        // this.distributors.set('very', this.configService.get<string>('blockchain.contracts.distributor.very') || '');
        this.pools.set('amoy', this.configService.get<string>('blockchain.contracts.rewardPool.amoy') || '');
        // this.pools.set('very', this.configService.get<string>('blockchain.contracts.rewardPool.very') || '');
    }

    /**
     * Get provider for a specific chain
     */
    getProvider(chain: ChainType): ethers.JsonRpcProvider {
        const provider = this.providers.get(chain);
        if (!provider) {
            throw new Error(`Provider not found for chain: ${chain}`);
        }
        return provider;
    }

    /**
     * Get admin wallet for a specific chain
     */
    adminWallet(chain: ChainType): ethers.Wallet {
        const wallet = this.adminWallets.get(chain);
        if (!wallet) {
            throw new Error(`Admin wallet not found for chain: ${chain}`);
        }
        return wallet;
    }

    /**
     * Get signer wallet (for EIP-712 signing only)
     */
    signer(): ethers.Wallet {
        return this.signerWallet;
    }

    /**
     * Get distributor address for a chain
     */
    getDistributorAddress(chain: ChainType): string {
        const address = this.distributors.get(chain);
        if (!address) {
            throw new Error(`Distributor address not found for chain: ${chain}`);
        }
        return address;
    }

    /**
     * Get pool address for a chain
     */
    getPoolAddress(chain: ChainType): string {
        const address = this.pools.get(chain);
        if (!address) {
            throw new Error(`Pool address not found for chain: ${chain}`);
        }
        return address;
    }

    /**
     * Get chain ID for a chain
     */
    getChainId(chain: ChainType): number {
        switch (chain) {
            case 'amoy':
                return this.amoyProvider.chainId;
            // case 'very':
            //     return this.veryProvider.chainId;
            default:
                throw new Error(`Unknown chain: ${chain}`);
        }
    }

    /**
     * Validate chain type
     */
    isValidChain(chain: string): chain is ChainType {
        return chain === 'amoy';
    }
} 