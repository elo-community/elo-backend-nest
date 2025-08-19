import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { ethers } from 'ethers';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { UserService } from '../services/user.service';

@Controller('post-like-signature')
export class PostLikeSignatureController {
    constructor(
        private readonly postLikeSystemService: PostLikeSystemService,
        private readonly trivusExpService: TrivusExpService,
        private readonly userService: UserService
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
     * 좋아요 서명 생성 (EIP-712용)
     * @param createLikeSignatureDto 좋아요 서명 생성 요청 데이터
     * @returns EIP-712 서명 데이터
     */
    @Post('create')
    async createLikeSignature(@Body() createLikeSignatureDto: {
        postId: number;
        userAddress: string;
    }) {
        try {
            const { postId, userAddress } = createLikeSignatureDto;

            if (!postId || postId <= 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            if (!userAddress || !ethers.isAddress(userAddress)) {
                throw new HttpException('Invalid userAddress', HttpStatus.BAD_REQUEST);
            }

            const deadline = Math.floor(Date.now() / 1000) + 300; // 5분 후 만료

            const signatureData = await this.postLikeSystemService.createLikeSignature(
                postId,
                userAddress,
                deadline
            );

            return {
                success: true,
                data: {
                    postId: signatureData.postId,
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature
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
        reason?: string;
    }) {
        try {
            const { address, reason } = createTokenClaimDto;

            if (!address || !ethers.isAddress(address)) {
                throw new HttpException('Invalid address', HttpStatus.BAD_REQUEST);
            }

            const signatureData = await this.trivusExpService.createTokenClaimSignature({
                address,
                reason
            });

            return {
                success: true,
                data: {
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature
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

    /**
     * 사용자 토큰 정보 조회
     */
    @Get('user/tokens')
    async getUserTokenInfo(@Query('walletAddress') walletAddress: string) {
        try {
            if (!walletAddress || !ethers.isAddress(walletAddress)) {
                throw new HttpException('Invalid wallet address', HttpStatus.BAD_REQUEST);
            }

            const tokenInfo = await this.userService.getUserTokenInfo(walletAddress);

            return {
                success: true,
                data: {
                    walletAddress,
                    totalTokens: tokenInfo.totalTokens,
                    availableTokens: tokenInfo.availableTokens,
                    pendingTokens: tokenInfo.pendingTokens
                },
                message: 'User token info retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get user token info: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
