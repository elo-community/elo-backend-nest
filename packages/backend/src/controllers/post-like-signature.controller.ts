import { Body, Controller, Get, HttpException, HttpStatus, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { UserService } from '../services/user.service';

// 컨트랙트 ABI 상수 정의
const POST_LIKE_SYSTEM_ABI = [
    // PostLiked 이벤트
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "postId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }
        ],
        "name": "PostLiked",
        "type": "event"
    },
    // claimWithSignature 함수
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "postId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "nonce",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "claimWithSignature",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // likePrice 조회
    {
        "inputs": [],
        "name": "likePrice",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const TRIVUS_EXP_ABI = [
    // claimWithSignature 함수
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "deadline",
                "type": "uint256"
            },
            {
                "internalType": "bytes32",
                "name": "nonce",
                "type": "bytes32"
            },
            {
                "internalType": "bytes",
                "name": "signature",
                "type": "bytes"
            }
        ],
        "name": "claimWithSignature",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // balanceOf 조회
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // transfer 함수
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

@Controller('post-like-signature')
export class PostLikeSignatureController {
    constructor(
        private readonly postLikeSystemService: PostLikeSystemService,
        private readonly trivusExpService: TrivusExpService,
        private readonly userService: UserService,
        private readonly configService: ConfigService
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

            // PostLikeSystem1363 컨트랙트 주소 가져오기
            const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');

            return {
                success: true,
                data: {
                    postId: body.postId,
                    encodedData: encodedData,
                    contractAddress: postLikeSystemAddress,
                    contractABI: POST_LIKE_SYSTEM_ABI
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

            // PostLikeSystem1363 컨트랙트 주소 가져오기
            const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');

            return {
                success: true,
                data: {
                    postId: signatureData.postId,
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature,
                    contractAddress: postLikeSystemAddress,
                    contractABI: POST_LIKE_SYSTEM_ABI
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

            // TrivusEXP1363 컨트랙트 주소 가져오기
            const trivusExpAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy');

            return {
                success: true,
                data: {
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature,
                    contractAddress: trivusExpAddress,
                    contractABI: TRIVUS_EXP_ABI
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
