import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { ClaimRequestService } from '../services/claim-request.service';
import { UserService } from '../services/user.service';

@Injectable()
export class PostLikeSystemService {
    private readonly logger = new Logger(PostLikeSystemService.name);
    private provider: ethers.JsonRpcProvider;
    private postLikeContract: ethers.Contract;
    private trustedSigner: ethers.Wallet;

    constructor(
        private configService: ConfigService,
        private userService: UserService,
        private claimRequestService: ClaimRequestService
    ) {
        this.initializeBlockchainConnection();
    }

    private async initializeBlockchainConnection() {
        try {
            const rpcUrl = this.configService.get<string>('blockchain.amoy.rpcUrl');
            const postLikeContractAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');
            const trustedSignerPrivateKey = this.configService.get<string>('blockchain.trustedSigner.privateKey');

            if (!rpcUrl || !postLikeContractAddress || !trustedSignerPrivateKey) {
                this.logger.warn('PostLikeSystem configuration incomplete');
                return;
            }

            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            // private key에서 0x 접두사 제거하고 ethers.Wallet 생성
            const cleanPrivateKey = trustedSignerPrivateKey.startsWith('0x')
                ? trustedSignerPrivateKey.slice(2)
                : trustedSignerPrivateKey;
            this.trustedSigner = new ethers.Wallet(cleanPrivateKey, this.provider);

            // 디버깅: 실제 사용되는 private key 확인
            this.logger.log(`Original private key: ${trustedSignerPrivateKey}`);
            this.logger.log(`Clean private key: ${cleanPrivateKey}`);
            this.logger.log(`Wallet private key: ${this.trustedSigner.privateKey}`);

            // PostLikeSystem1363 컨트랙트 ABI (필요한 함수만)
            const postLikeContractABI = [
                'function likePrice() view returns (uint256)',
                'function trustedSigner() view returns (address)',
                'function getPostInfo(uint256 postId, address user) view returns (uint256 totalLikes, uint256 totalTokens, bool isLikedByUser)',
                'function hasLiked(uint256 postId, address user) view returns (bool)',
                'function postLikes(uint256 postId) view returns (uint256)',
                'function postTokens(uint256 postId) view returns (uint256)'
            ];

            this.postLikeContract = new ethers.Contract(
                postLikeContractAddress,
                postLikeContractABI,
                this.provider
            );

            this.logger.log('PostLikeSystem service initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize PostLikeSystem service:', error);
        }
    }

    /**
     * 특정 postId에서 사용자가 가져올 수 있는 토큰 양 계산
     * @param postId 게시글 ID
     * @param userAddress 사용자 주소
     * @returns 가져올 수 있는 토큰 양 (EXP 단위)
     */
    async calculateAvailableTokens(postId: number, userAddress: string): Promise<number> {
        try {
            if (!this.postLikeContract) {
                throw new Error('PostLikeSystem contract not initialized');
            }

            // 블록체인에서 해당 postId의 수집된 토큰 양 조회
            const postTokens = await this.postLikeContract.postTokens(postId);
            const postTokensInExp = parseFloat(ethers.formatEther(postTokens));

            this.logger.log(`Post ${postId} has collected ${postTokensInExp} EXP tokens`);

            // 사용자가 해당 post의 author인지 확인 (PostService에서 이미 확인했지만 추가 검증)
            // 여기서는 단순히 수집된 토큰 양만 반환
            // 실제 권한 검사는 Controller에서 수행

            return postTokensInExp;
        } catch (error) {
            this.logger.error(`Failed to calculate available tokens for post ${postId}: ${error.message}`);
            throw new Error(`Failed to calculate available tokens: ${error.message}`);
        }
    }

    /**
     * 좋아요 서명 생성
     * @param postId 게시글 ID
     * @param userAddress 사용자 주소
     * @param deadline 만료 시간 (Unix timestamp)
     * @param amount 클레임할 토큰 양 (EXP 단위)
     * @returns 서명 데이터
     */
    async createLikeSignature(
        postId: number,
        userAddress: string,
        deadline: number,
        amount: number
    ): Promise<{
        postId: number;
        to: string;
        amount: string;
        deadline: number;
        nonce: string;
        signature: string;
        domain: any;
        types: any;
    }> {
        try {
            // 1. 전달받은 amount를 wei 단위로 변환
            const amountInWei = ethers.parseEther(amount.toString());

            if (amountInWei === 0n) {
                throw new Error('Amount must be greater than 0');
            }

            // 2. 사용자의 availableToken 업데이트 (accumulation에서 최신 데이터로)
            // 이는 단순히 DB 동기화용이며, 클레임 가능 여부와는 무관
            await this.userService.updateAvailableTokens(userAddress);

            // 3. 사용자 정보 조회 (로깅용)
            const tokenInfo = await this.userService.getUserTokenInfo(userAddress);
            this.logger.log(`User ${userAddress} has ${tokenInfo.availableTokens} EXP in available_token, but claiming ${amount} EXP from post ${postId}`);

            // 4. 예측 불가능한 nonce 생성 (32바이트)
            const randomNonce = randomBytes(32);
            const nonce = '0x' + randomNonce.toString('hex');

            // 5. EIP-712 도메인 설정
            const chainId = this.configService.get<number>('blockchain.amoy.chainId');
            const postLikeContractAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');
            const domain = {
                name: 'PostLikeSystem1363',
                version: '1',
                chainId: chainId,
                verifyingContract: postLikeContractAddress
            };

            // 6. EIP-712 타입 정의
            const types = {
                Claim: [
                    { name: 'postId', type: 'uint256' },
                    { name: 'to', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'bytes32' }
                ]
            };

            // 7. 서명할 데이터 (amount는 wei 단위)
            const value = {
                postId: postId,
                to: userAddress,
                amount: amountInWei,
                deadline: deadline,
                nonce: nonce
            };

            // 8. EIP-712 서명 생성
            if (!this.trustedSigner) {
                throw new Error('TrustedSigner is not initialized');
            }

            this.logger.log(`Signing with address: ${this.trustedSigner.address}`);
            this.logger.log(`Private key (first 10 chars): ${this.trustedSigner.privateKey.substring(0, 10)}...`);
            this.logger.log(`Full private key: ${this.trustedSigner.privateKey}`);
            const signature = await this.trustedSigner.signTypedData(domain, types, value);

            this.logger.log(`Created like signature for post ${postId}, user ${userAddress}, nonce ${nonce}, amount: ${ethers.formatEther(amountInWei)} EXP`);

            // claim_request 테이블에 기록 (reason 포함)
            await this.claimRequestService.createClaimRequest(
                userAddress,
                nonce.toString(),
                amount.toString(),
                BigInt(deadline),
                signature,
                'like_claim_post_tokens' // reason 추가
            );

            return {
                postId,
                to: userAddress,
                amount: ethers.formatEther(amountInWei), // wei를 EXP 단위로 변환해서 반환
                deadline,
                nonce: nonce.toString(), // string으로 변환
                signature,
                domain,
                types
            };
        } catch (error) {
            this.logger.error('Failed to create like signature:', error);
            throw new Error(`Failed to create like signature: ${error.message}`);
        }
    }

    /**
     * 좋아요 가격 조회
     */
    async getLikePrice(): Promise<string> {
        try {
            const price = await this.postLikeContract.likePrice();
            return price.toString();
        } catch (error) {
            this.logger.error('Failed to get like price:', error);
            throw new Error(`Failed to get like price: ${error.message}`);
        }
    }

    /**
     * 게시글 정보 조회
     */
    async getPostInfo(postId: number, userAddress: string): Promise<{
        totalLikes: number;
        totalTokens: string;
        isLikedByUser: boolean;
    }> {
        try {
            const info = await this.postLikeContract.getPostInfo(postId, userAddress);
            return {
                totalLikes: Number(info[0]),
                totalTokens: info[1].toString(),
                isLikedByUser: info[2]
            };
        } catch (error) {
            this.logger.error('Failed to get post info:', error);
            throw new Error(`Failed to get post info: ${error.message}`);
        }
    }

    /**
     * 사용자가 게시글에 좋아요를 눌렀는지 확인
     */
    async hasUserLiked(postId: number, userAddress: string): Promise<boolean> {
        try {
            return await this.postLikeContract.hasLiked(postId, userAddress);
        } catch (error) {
            this.logger.error('Failed to check if user liked:', error);
            throw new Error(`Failed to check if user liked: ${error.message}`);
        }
    }

    /**
     * 게시글 좋아요 수 조회
     */
    async getPostLikes(postId: number): Promise<number> {
        try {
            const likes = await this.postLikeContract.postLikes(postId);
            return Number(likes);
        } catch (error) {
            this.logger.error('Failed to get post likes:', error);
            throw new Error(`Failed to get post likes: ${error.message}`);
        }
    }

    /**
     * 게시글 수집된 토큰 양 조회
     */
    async getPostTokens(postId: number): Promise<string> {
        try {
            const tokens = await this.postLikeContract.postTokens(postId);
            return tokens.toString();
        } catch (error) {
            this.logger.error('Failed to get post tokens:', error);
            throw new Error(`Failed to get post tokens: ${error.message}`);
        }
    }
}
