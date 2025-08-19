import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ethers } from 'ethers';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';

export class CreateLikeSignatureDto {
    postId: number;
    userAddress: string;
    amount: string; // wei 단위
    deadline?: number; // 선택사항, 기본값은 1시간 후
}

@Controller('post-like-signature')
export class PostLikeSignatureController {
    constructor(private readonly postLikeSystemService: PostLikeSystemService) { }

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

            // ERC-1363 좋아요용: postId만 인코딩
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [body.postId]);

            return {
                success: true,
                data: {
                    postId: body.postId,
                    encodedData: encodedData // ← 이것만 FE에서 transferAndCall에 사용
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
    async createLikeSignature(@Body() createLikeSignatureDto: CreateLikeSignatureDto) {
        try {
            // 1. 입력값 검증
            if (!createLikeSignatureDto.postId || !createLikeSignatureDto.userAddress || !createLikeSignatureDto.amount) {
                throw new HttpException('Missing required fields: postId, userAddress, amount', HttpStatus.BAD_REQUEST);
            }

            // 2. 주소 형식 검증
            if (!/^0x[a-fA-F0-9]{40}$/.test(createLikeSignatureDto.userAddress)) {
                throw new HttpException('Invalid user address format', HttpStatus.BAD_REQUEST);
            }

            // 3. 게시글 ID 검증
            if (createLikeSignatureDto.postId <= 0) {
                throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
            }

            // 4. 토큰 양 검증
            if (!/^\d+$/.test(createLikeSignatureDto.amount) || BigInt(createLikeSignatureDto.amount) <= 0n) {
                throw new HttpException('Invalid token amount', HttpStatus.BAD_REQUEST);
            }

            // 5. deadline 설정 (기본값: 1시간 후)
            const deadline = createLikeSignatureDto.deadline || Math.floor(Date.now() / 1000) + 3600;

            // 6. 서명 생성
            const signatureData = await this.postLikeSystemService.createLikeSignature(
                createLikeSignatureDto.postId,
                createLikeSignatureDto.userAddress,
                createLikeSignatureDto.amount,
                deadline
            );

            // 7. 프론트엔드에서 바로 사용할 수 있는 인코딩된 데이터 생성
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256', 'uint256', 'bytes32', 'bytes'],
                [
                    signatureData.postId,
                    signatureData.deadline,
                    signatureData.nonce,
                    signatureData.signature
                ]
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
                    // 프론트엔드에서 바로 사용할 수 있는 인코딩된 데이터
                    encodedData: encodedData,
                    // 프론트엔드에서 사용할 수 있는 EIP-712 데이터
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
     * 좋아요 가격 조회
     * @returns 좋아요 가격 (wei)
     */
    @Post('price')
    async getLikePrice() {
        try {
            const price = await this.postLikeSystemService.getLikePrice();
            return {
                success: true,
                data: {
                    price: price,
                    priceInEther: (BigInt(price) / BigInt(10 ** 18)).toString()
                },
                message: 'Like price retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get like price: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 게시글 정보 조회
     * @param body 게시글 ID와 사용자 주소
     * @returns 게시글 정보
     */
    @Post('post-info')
    async getPostInfo(@Body() body: { postId: number; userAddress: string }) {
        try {
            if (!body.postId || !body.userAddress) {
                throw new HttpException('Missing required fields: postId, userAddress', HttpStatus.BAD_REQUEST);
            }

            const postInfo = await this.postLikeSystemService.getPostInfo(body.postId, body.userAddress);
            return {
                success: true,
                data: postInfo,
                message: 'Post info retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get post info: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
