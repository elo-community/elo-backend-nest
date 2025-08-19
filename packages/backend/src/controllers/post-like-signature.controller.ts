import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ethers } from 'ethers';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';
import { TrivusExpService } from '../blockchain/trivus-exp.service';

@Controller('post-like-signature')
export class PostLikeSignatureController {
    constructor(
        private readonly postLikeSystemService: PostLikeSystemService,
        private readonly trivusExpService: TrivusExpService
    ) { }

    /**
     * 좋아요 데이터 생성 (ERC-1363용, 서명 없음)
     * @param body 게시글 ID
     * @returns 인코딩된 좋아요 데이터
     */
    @Post('likes/data')
    async createLikeData(@Body() body: { postId: number }) {
        try {
            if (body.postId === undefined || body.postId === null || body.postId < 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [body.postId]);
            return {
                success: true,
                data: {
                    postId: body.postId,
                    encodedData: encodedData
                },
                message: 'Like data created successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to create like data: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 좋아요 서명 생성 (EIP-712용, 클레임용)
     * @param createLikeSignatureDto 좋아요 서명 생성 요청 데이터
     * @returns EIP-712 서명 데이터
     */
    @Post('create')
    async createLikeSignature(@Body() createLikeSignatureDto: {
        postId: number;
        userAddress: string;
        amount: string;
    }) {
        try {
            const { postId, userAddress, amount } = createLikeSignatureDto;

            if (!postId || postId <= 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            if (!userAddress || !ethers.isAddress(userAddress)) {
                throw new HttpException('Invalid userAddress', HttpStatus.BAD_REQUEST);
            }

            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
            }

            const deadline = Math.floor(Date.now() / 1000) + 300; // 5분 후 만료

            const signatureData = await this.postLikeSystemService.createLikeSignature(
                postId,
                userAddress,
                amount,
                deadline
            );

            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256', 'address', 'uint256', 'uint256', 'bytes32'],
                [signatureData.postId, signatureData.to, ethers.parseUnits(signatureData.amount, 18), signatureData.deadline, signatureData.nonce]
            );

            return {
                success: true,
                data: {
                    postId: signatureData.postId,
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature,
                    encodedData: encodedData,
                    eip712Data: {
                        domain: signatureData.domain,
                        types: signatureData.types,
                        value: {
                            postId: signatureData.postId,
                            to: signatureData.to,
                            amount: signatureData.amount,
                            deadline: signatureData.deadline,
                            nonce: signatureData.nonce
                        }
                    }
                },
                message: 'Like signature created successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to create like signature: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * TrivusEXP1363 토큰 클레임 서명 생성 (EIP-712용)
     * @param createTokenClaimDto 토큰 클레임 서명 생성 요청 데이터
     * @returns EIP-712 서명 데이터
     */
    @Post('token-claim/create')
    async createTokenClaimSignature(@Body() createTokenClaimDto: {
        address: string;
        amount: string;
        reason?: string;
    }) {
        try {
            const { address, amount, reason } = createTokenClaimDto;

            if (!address || !ethers.isAddress(address)) {
                throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
            }

            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
                throw new HttpException('Invalid amount', HttpStatus.BAD_REQUEST);
            }

            const signatureData = await this.trivusExpService.createTokenClaimSignature({
                address,
                amount,
                reason
            });

            return {
                success: true,
                data: {
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature,
                    eip712Data: {
                        domain: {
                            name: 'TrivusEXP1363',
                            version: '1',
                            chainId: 80002, // Polygon Amoy
                            verifyingContract: await this.trivusExpService.getContractAddress()
                        },
                        types: {
                            Claim: [
                                { name: 'to', type: 'address' },
                                { name: 'amount', type: 'uint256' },
                                { name: 'deadline', type: 'uint256' },
                                { name: 'nonce', type: 'bytes32' }
                            ]
                        },
                        value: {
                            to: signatureData.to,
                            amount: ethers.parseUnits(signatureData.amount, 18),
                            deadline: signatureData.deadline,
                            nonce: signatureData.nonce
                        }
                    }
                },
                message: 'Token claim signature created successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to create token claim signature: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 서비스 상태 확인
     */
    @Post('status')
    async getServiceStatus() {
        try {
            const trivusExpStatus = await this.trivusExpService.getServiceStatus();

            return {
                success: true,
                data: {
                    trivusExp: trivusExpStatus
                },
                message: 'Service status retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get service status: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
