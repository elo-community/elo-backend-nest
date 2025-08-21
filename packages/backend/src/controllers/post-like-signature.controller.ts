import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { PostService } from '../services/post.service';
import { UserService } from '../services/user.service';

// PostLikeSystem1363 ABI는 PostLikeSystemService에서 가져옴

const TRIVUS_EXP_ABI = [
    // transferAndCall 함수 (ERC-1363)
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
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "transferAndCall",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
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
        private readonly postService: PostService,
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

            // PostLikeSystem1363.sol의 data 형식: (postId만)
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [body.postId]);

            // TrivusEXP1363 토큰 컨트랙트 주소와 ABI 가져오기
            const tokenContractAddress = this.configService.get<string>('blockchain.contracts.trivusExp.amoy');

            // PostLikeSystem1363 컨트랙트 주소 가져오기
            const postLikeSystemAddress = this.configService.get<string>('blockchain.contracts.postLikeSystem.amoy');

            // TrivusExpService에서 실제 컨트랙트 ABI 가져오기
            const contractABI = this.trivusExpService.getContractABI();

            return {
                success: true,
                data: {
                    postId: body.postId,
                    to: postLikeSystemAddress, // PostLikeSystem1363 컨트랙트 주소
                    encodedData: encodedData,
                    contractAddress: tokenContractAddress,
                    contractABI: contractABI
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

            // 1. postId의 author 확인
            const post = await this.postService.findOne(postId);
            if (!post) {
                throw new HttpException(`Post with ID ${postId} not found`, HttpStatus.NOT_FOUND);
            }

            // 2. author의 walletAddress 확인
            if (!post.author || !post.author.walletAddress) {
                throw new HttpException(`Post author not found or has no wallet address`, HttpStatus.BAD_REQUEST);
            }

            // 3. 요청한 userAddress가 post의 author인지 확인
            if (post.author.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
                throw new HttpException(
                    `User ${userAddress} is not the author of post ${postId}. Only the post author can claim like tokens.`,
                    HttpStatus.FORBIDDEN
                );
            }

            // 4. 해당 postId에서 가져올 수 있는 토큰 양 계산
            const availableTokens = await this.postLikeSystemService.calculateAvailableTokens(postId, userAddress);

            if (availableTokens <= 0) {
                throw new HttpException(
                    `No tokens available to claim for post ${postId}. This post may not have received any likes yet.`,
                    HttpStatus.BAD_REQUEST
                );
            }

            const deadline = Math.floor(Date.now() / 1000) + 300; // 5분 후 만료

            const signatureData = await this.postLikeSystemService.createLikeSignature(
                postId,
                userAddress,
                deadline,
                availableTokens // 계산된 토큰 양 전달
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
                    contractABI: this.postLikeSystemService.getContractABI()
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


}
