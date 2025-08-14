import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto'; // For nonce generation
import { ethers } from 'ethers';

export interface TokenClaimRequest {
    to: string;
    amount: string; // "100" (EXP 단위)
    reason?: string; // 지급 이유 (로그용)
}

export interface TokenClaimSignature {
    to: string;
    amount: string;
    deadline: number;
    signature: string;
    nonce: string;
}

@Injectable()
export class TrivusExpService {
    private readonly logger = new Logger(TrivusExpService.name);
    private readonly provider: ethers.JsonRpcProvider;
    private readonly trustedSigner: ethers.Wallet;
    private readonly contractAddress: string;
    private readonly contract: ethers.Contract;
    private isInitialized: boolean = false; // 초기화 상태 추적

    constructor(private configService: ConfigService) {
        // Polygon Amoy 네트워크 설정
        const rpcUrl = this.configService.get<string>('blockchain.amoy.rpcUrl');
        const trustedSignerKey = this.configService.get<string>('blockchain.trustedSigner.privateKey');

        if (!rpcUrl || !trustedSignerKey) {
            this.logger.warn('Blockchain configuration not complete - TrivusExpService will be limited');
            return;
        }

        try {
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.trustedSigner = new ethers.Wallet(trustedSignerKey, this.provider);
            this.contractAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy') || '';

            // 컨트랙트 ABI (실제 TrivusEXP 컨트랙트와 일치)
            const contractABI = [
                // ERC20 기본 함수들
                {
                    "inputs": [],
                    "name": "name",
                    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "symbol",
                    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "decimals",
                    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "totalSupply",
                    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
                    "name": "balanceOf",
                    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                // TrivusEXP 전용 함수들
                {
                    "inputs": [],
                    "name": "trustedSigner",
                    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [
                        { "internalType": "address", "name": "to", "type": "address" },
                        { "internalType": "uint256", "name": "amount", "type": "uint256" },
                        { "internalType": "uint256", "name": "deadline", "type": "uint256" },
                        { "internalType": "bytes", "name": "signature", "type": "bytes" }
                    ],
                    "name": "claimWithSignature",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ];

            this.contract = new ethers.Contract(this.contractAddress, contractABI, this.trustedSigner);

            this.logger.log(`TrivusExpService initialized with contract: ${this.contractAddress}`);
            this.logger.log(`TrustedSigner address: ${this.trustedSigner.address}`);
            this.isInitialized = true;
        } catch (error) {
            this.logger.error(`Failed to initialize TrivusExpService: ${(error as Error).message}`);
            this.isInitialized = false;
        }
    }

    /**
     * 토큰 지급을 위한 EIP-712 서명 생성
     */
    async createTokenClaimSignature(request: TokenClaimRequest): Promise<TokenClaimSignature> {
        try {
            const { to, amount } = request;

            // EIP-712 도메인 설정
            const domain = {
                name: 'Trivus EXP Token',
                version: '1',
                chainId: 80002, // Polygon Amoy
                verifyingContract: this.contractAddress
            };

            // 서명할 데이터 타입
            const types = {
                Claim: [
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            // 서명할 값
            const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료
            const amountWei = ethers.parseEther(amount);
            const nonce = randomBytes(32).toString('hex');

            const value = {
                to,
                amount: amountWei,
                deadline
            };

            // EIP-712 서명 생성
            const signature = await this.trustedSigner.signTypedData(domain, types, value);

            this.logger.log(`Token claim signature created for ${to}: ${amount} EXP`);

            return {
                to,
                amount,
                deadline,
                signature,
                nonce
            };
        } catch (error) {
            this.logger.error(`Failed to create token claim signature: ${(error as Error).message}`);
            throw error;
        }
    }

    /**
     * 서명을 사용하여 토큰 지급 실행
     */
    async executeTokenClaim(claimSignature: TokenClaimSignature): Promise<string> {
        try {
            const { to, amount, deadline, signature } = claimSignature;
            const amountWei = ethers.parseEther(amount);

            // 서명 유효성 검증
            // const isValid = await this.contract.verifySignature(to, amountWei, deadline, signature); // Removed verifySignature
            // if (!isValid) {
            //     throw new Error('Invalid signature for token claim');
            // }

            // 토큰 지급 실행
            const tx = await this.contract.claimWithSignature(to, amountWei, deadline, signature);
            await tx.wait();

            this.logger.log(`Tokens claimed successfully: ${amount} EXP to ${to}, TX: ${tx.hash}`);

            return tx.hash;
        } catch (error) {
            this.logger.error(`Failed to execute token claim: ${error.message}`);
            throw error;
        }
    }

    /**
     * 사용자 토큰 잔액 조회
     */
    async getBalance(address: string): Promise<string> {
        try {
            const balance = await this.contract.balanceOf(address);
            return ethers.formatEther(balance);
        } catch (error) {
            this.logger.error(`Failed to get balance for ${address}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 총 토큰 공급량 조회
     */
    async getTotalSupply(): Promise<string> {
        try {
            const totalSupply = await this.contract.totalSupply();
            return ethers.formatEther(totalSupply);
        } catch (error) {
            this.logger.error(`Failed to get total supply: ${error.message}`);
            throw error;
        }
    }

    /**
     * TrustedSigner 주소 조회
     */
    async getTrustedSigner(): Promise<string> {
        try {
            return await this.contract.trustedSigner();
        } catch (error) {
            this.logger.error(`Failed to get trusted signer: ${error.message}`);
            throw error;
        }
    }

    /**
     * 서명이 유효한지 확인 (읽기 전용)
     * @param data 서명 데이터
     * @return 유효한 서명인지 여부
     */
    async verifySignature(data: { to: string; amount: string; deadline: number; signature: string }): Promise<boolean> {
        try {
            const { to, amount, deadline, signature } = data;

            this.logger.log(`[DEBUG] Starting signature verification for ${to}, amount: ${amount} EXP`);
            this.logger.log(`[DEBUG] Current timestamp: ${Math.floor(Date.now() / 1000)}`);
            this.logger.log(`[DEBUG] Deadline: ${deadline}`);

            // 서명 만료 시간 체크
            if (deadline <= Math.floor(Date.now() / 1000)) {
                this.logger.warn(`[DEBUG] Signature expired: deadline ${deadline}, current ${Math.floor(Date.now() / 1000)}`);
                return false;
            }

            this.logger.log(`[DEBUG] Signature not expired, proceeding with verification`);

            // EIP-712 서명 검증 (signTypedData로 생성된 서명 검증)
            const domain = {
                name: 'Trivus EXP Token',
                version: '1',
                chainId: 80002, // Polygon Amoy
                verifyingContract: this.contractAddress
            };

            const types = {
                Claim: [
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' }
                ]
            };

            const value = {
                to,
                amount: ethers.parseEther(amount),
                deadline
            };

            this.logger.log(`[DEBUG] EIP-712 verification data:`);
            this.logger.log(`[DEBUG]   Domain: ${JSON.stringify(domain)}`);
            this.logger.log(`[DEBUG]   Types: ${JSON.stringify(types)}`);
            this.logger.log(`[DEBUG]   Value: ${JSON.stringify({
                to: value.to,
                amount: value.amount.toString(),
                deadline: value.deadline
            })}`);

            // signTypedData로 생성된 서명 검증
            const recoveredAddress = ethers.verifyTypedData(domain, types, value, signature);
            this.logger.log(`[DEBUG] Recovered address from signature: ${recoveredAddress}`);

            // TrustedSigner와 비교
            const trustedSigner = await this.contract.trustedSigner();
            this.logger.log(`[DEBUG] Contract trustedSigner: ${trustedSigner}`);
            this.logger.log(`[DEBUG] Current backend trustedSigner: ${this.trustedSigner.address}`);

            const isValid = recoveredAddress.toLowerCase() === trustedSigner.toLowerCase();
            this.logger.log(`[DEBUG] Address comparison: ${recoveredAddress.toLowerCase()} === ${trustedSigner.toLowerCase()} = ${isValid}`);

            if (!isValid) {
                this.logger.warn(`[DEBUG] Signature verification failed: recovered address doesn't match trustedSigner`);
                this.logger.warn(`[DEBUG] Recovered: ${recoveredAddress}`);
                this.logger.warn(`[DEBUG] Expected: ${trustedSigner}`);
                this.logger.warn(`[DEBUG] Backend signer: ${this.trustedSigner.address}`);
            }

            return isValid;
        } catch (error) {
            this.logger.error(`[DEBUG] Failed to verify signature: ${(error as Error).message}`);
            this.logger.error(`[DEBUG] Error stack: ${(error as Error).stack}`);
            return false;
        }
    }

    /**
     * 컨트랙트 주소 조회
     */
    async getContractAddress(): Promise<string> {
        return this.contractAddress;
    }

    /**
     * 서비스 상태 확인
     */
    async getServiceStatus(): Promise<{
        isReady: boolean;
        contractAddress: string;
        trustedSigner: string;
        network: string;
    }> {
        if (!this.isInitialized) {
            this.logger.warn('TrivusExpService is not properly initialized');
            return {
                isReady: false,
                contractAddress: this.contractAddress || 'Not configured',
                trustedSigner: 'Not configured',
                network: 'Not configured'
            };
        }

        try {
            const trustedSigner = await this.contract.trustedSigner();
            const network = await this.provider.getNetwork();

            return {
                isReady: true,
                contractAddress: this.contractAddress,
                trustedSigner,
                network: network.name
            };
        } catch (error) {
            this.logger.error(`Service status check failed: ${(error as Error).message}`);
            return {
                isReady: false,
                contractAddress: this.contractAddress || 'Not configured',
                trustedSigner: 'Not configured',
                network: 'Not configured'
            };
        }
    }
} 