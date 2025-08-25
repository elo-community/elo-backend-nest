import { Body, Controller, HttpException, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/user.decorator';
import { PostLikeSystemService } from '../blockchain/post-like-system.service';
import { TrivusExpService } from '../blockchain/trivus-exp.service';
import { BlockchainSyncService } from '../services/blockchain-sync.service';
import { PostLikeService } from '../services/post-like.service';
import { PostService } from '../services/post.service';
import { UserService } from '../services/user.service';
import { ERROR_CODES, ERROR_MESSAGES } from '../shared/error-codes';

// PostLikeSystem1363 ABI는 PostLikeSystemService에서 가져옴
// TrivusEXP1363 ABI는 TrivusExpService에서 가져옴

@Controller('post-like-signature')
export class PostLikeSignatureController {
    constructor(
        private readonly postLikeSystemService: PostLikeSystemService,
        private readonly trivusExpService: TrivusExpService,
        private readonly userService: UserService,
        private readonly postService: PostService,
        private readonly postLikeService: PostLikeService,
        private readonly blockchainSyncService: BlockchainSyncService,
        private readonly configService: ConfigService
    ) { }

    /**
     * 좋아요 데이터 생성 (ERC-1363용, 서명 없음)
     * @param body 게시글 ID
     * @param currentUser JWT 토큰에서 추출한 사용자 정보
     * @returns 인코딩된 좋아요 데이터 또는 이미 좋아요 처리됨 응답
     */
    @Post('likes/data')
    @UseGuards(JwtAuthGuard)
    async createLikeData(@Body() body: { postId: number }, @CurrentUser() currentUser: any) {
        try {
            if (body.postId === undefined || body.postId === null || body.postId < 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            // JWT 토큰에서 사용자 ID 추출
            const userId = currentUser.sub || currentUser.id;
            if (!userId) {
                throw new HttpException('Invalid user token', HttpStatus.UNAUTHORIZED);
            }

            // 사용자가 이미 해당 게시글에 좋아요를 눌렀는지 확인
            const hasAlreadyLiked = await this.postLikeService.hasUserLikedPost(userId, body.postId);
            if (hasAlreadyLiked) {
                return {
                    success: false,
                    data: null,
                    error: {
                        code: ERROR_CODES.ALREADY_LIKED,
                        message: ERROR_MESSAGES[ERROR_CODES.ALREADY_LIKED]
                    }
                };
            }

            // 사용자 정보 조회하여 walletAddress 가져오기
            const user = await this.userService.findOne(userId);
            if (!user || !user.walletAddress) {
                throw new HttpException('User not found or no wallet address', HttpStatus.BAD_REQUEST);
            }

            const userAddress = user.walletAddress;

            // 사용자의 현재 tokenAmount 확인 (좋아요를 누르려면 최소 1 EXP 필요)
            if (!user.tokenAmount || user.tokenAmount < 1) {
                return {
                    success: false,
                    data: null,
                    error: {
                        code: ERROR_CODES.INSUFFICIENT_TOKENS,
                        message: ERROR_MESSAGES[ERROR_CODES.INSUFFICIENT_TOKENS],
                        details: {
                            currentBalance: user.tokenAmount || 0,
                            requiredAmount: 1,
                            action: 'like_post'
                        }
                    }
                };
            }

            // post-specific nonce: 각 게시글마다 0부터 시작
            const nonce = "0";

            // payload: postId 인코딩
            const payload = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [body.postId]);

            // TrivusEXP1363에서 기대하는 형식: (nonce, payload)
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256', 'bytes'],
                [nonce, payload]
            );

            // TrivusEXP1363 토큰 컨트랙트 주소와 ABI 가져오기
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

            const tokenContractAddress = this.configService.get<string>(`blockchain.contracts.trivusExp.${activeNetwork}`);
            const postLikeSystemAddress = this.configService.get<string>(`blockchain.contracts.postLikeSystem.${activeNetwork}`);

            // TrivusExpService에서 실제 컨트랙트 ABI 가져오기
            const contractABI = this.trivusExpService.getContractAbi();

            return {
                success: true,
                data: {
                    postId: body.postId,
                    to: postLikeSystemAddress, // PostLikeSystem1363 컨트랙트 주소
                    encodedData: encodedData,
                    contractAddress: tokenContractAddress,
                    contractABI: contractABI,
                    userTokenInfo: {
                        currentBalance: user.tokenAmount || 0,
                        requiredAmount: 1
                    }
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
    @UseGuards(JwtAuthGuard)
    async createLikeSignature(@Body() createLikeSignatureDto: { postId: number }, @CurrentUser() currentUser: any) {
        try {
            const { postId } = createLikeSignatureDto;

            if (!postId || postId <= 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            // JWT 토큰에서 사용자 ID 추출
            const userId = currentUser.sub || currentUser.id;
            if (!userId) {
                throw new HttpException('Invalid user token', HttpStatus.UNAUTHORIZED);
            }

            // 사용자 정보 조회하여 walletAddress 가져오기
            const user = await this.userService.findOne(userId);
            if (!user || !user.walletAddress) {
                throw new HttpException('User not found or no wallet address', HttpStatus.BAD_REQUEST);
            }

            const userAddress = user.walletAddress;

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
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');
            const postLikeSystemAddress = this.configService.get<string>(`blockchain.contracts.postLikeSystem.${activeNetwork}`);

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
                    contractABI: this.postLikeSystemService.getContractAbi()
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
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');
            const trivusExpAddress = this.configService.get<string>(`blockchain.contracts.trivusExp.${activeNetwork}`);

            return {
                success: true,
                data: {
                    to: signatureData.to,
                    amount: signatureData.amount,
                    deadline: signatureData.deadline,
                    nonce: signatureData.nonce,
                    signature: signatureData.signature,
                    contractAddress: trivusExpAddress,
                    contractABI: this.trivusExpService.getContractAbi()
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
     * 특정 게시글에서 수확할 수 있는 토큰 양 확인
     * @param body 게시글 ID
     * @param currentUser JWT 토큰에서 추출한 사용자 정보
     * @returns 수확 가능한 토큰 양 정보
     */
    @Post('harvestable-amount')
    @UseGuards(JwtAuthGuard)
    async getHarvestableAmount(@Body() body: { postId: number }, @CurrentUser() currentUser: any) {
        try {
            if (body.postId === undefined || body.postId === null || body.postId < 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            // JWT 토큰에서 사용자 ID 추출
            const userId = currentUser.sub || currentUser.id;
            if (!userId) {
                throw new HttpException('Invalid user token', HttpStatus.UNAUTHORIZED);
            }

            // 사용자 정보 조회하여 walletAddress 가져오기
            const user = await this.userService.findOne(userId);
            if (!user || !user.walletAddress) {
                throw new HttpException('User not found or no wallet address', HttpStatus.BAD_REQUEST);
            }

            const userAddress = user.walletAddress;

            // 1. postId의 author 확인
            const post = await this.postService.findOne(body.postId);
            if (!post) {
                throw new HttpException(`Post with ID ${body.postId} not found`, HttpStatus.NOT_FOUND);
            }

            // 2. author의 walletAddress 확인
            if (!post.author || !post.author.walletAddress) {
                throw new HttpException(`Post author not found or has no wallet address`, HttpStatus.BAD_REQUEST);
            }

            // 3. 요청한 userAddress가 post의 author인지 확인
            if (post.author.walletAddress.toLowerCase() !== userAddress.toLowerCase()) {
                throw new HttpException(
                    `User ${userAddress} is not the author of post ${body.postId}. Only the post author can check harvestable tokens.`,
                    HttpStatus.FORBIDDEN
                );
            }

            // 4. 해당 postId에서 가져올 수 있는 토큰 양 계산
            const availableTokens = await this.postLikeSystemService.calculateAvailableTokens(body.postId, userAddress);

            // 5. 게시글의 총 좋아요 수 조회
            const totalLikes = await this.postLikeService.getLikeCount(body.postId);

            // 6. 사용자의 현재 availableToken 확인
            const userTokenInfo = await this.userService.getUserTokenInfo(userAddress);

            return {
                success: true,
                data: {
                    postId: body.postId,
                    postTitle: post.title || 'Untitled',
                    author: {
                        id: post.author.id,
                        nickname: post.author.nickname,
                        walletAddress: post.author.walletAddress
                    },
                    harvestableTokens: availableTokens,
                    totalLikes: totalLikes,
                    userTokenInfo: {
                        totalTokens: userTokenInfo.totalTokens,
                        availableTokens: userTokenInfo.availableTokens,
                        pendingTokens: userTokenInfo.pendingTokens
                    },
                    canHarvest: availableTokens > 0,
                    message: availableTokens > 0
                        ? `You can harvest ${availableTokens} EXP from this post`
                        : 'No tokens available to harvest from this post'
                },
                message: 'Harvestable amount retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get harvestable amount: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 사용자가 작성한 모든 게시글에서 수확할 수 있는 토큰 양 확인
     * @param currentUser JWT 토큰에서 추출한 사용자 정보
     * @returns 모든 게시글의 수확 가능한 토큰 양 정보
     */
    @Post('all-harvestable-amounts')
    @UseGuards(JwtAuthGuard)
    async getAllHarvestableAmounts(@CurrentUser() currentUser: any) {
        try {
            // JWT 토큰에서 사용자 ID 추출
            const userId = currentUser.sub || currentUser.id;
            if (!userId) {
                throw new HttpException('Invalid user token', HttpStatus.UNAUTHORIZED);
            }

            // 사용자 정보 조회하여 walletAddress 가져오기
            const user = await this.userService.findOne(userId);
            if (!user || !user.walletAddress) {
                throw new HttpException('User not found or no wallet address', HttpStatus.BAD_REQUEST);
            }

            const userAddress = user.walletAddress;

            // 1. 사용자가 작성한 모든 게시글 조회
            const userPosts = await this.postService.findByAuthorId(userId);

            if (!userPosts || userPosts.length === 0) {
                return {
                    success: true,
                    data: {
                        totalHarvestableTokens: 0,
                        totalPosts: 0,
                        posts: [],
                        userTokenInfo: await this.userService.getUserTokenInfo(userAddress)
                    },
                    message: 'No posts found for this user'
                };
            }

            // 2. 각 게시글별로 수확 가능한 토큰 양 계산
            const postsWithHarvestableAmounts: Array<{
                postId: number;
                title: string;
                createdAt: Date;
                harvestableTokens: number;
                totalLikes: number;
                canHarvest: boolean;
                error?: string;
            }> = [];
            let totalHarvestableTokens = 0;

            for (const post of userPosts) {
                try {
                    const availableTokens = await this.postLikeSystemService.calculateAvailableTokens(post.id, userAddress);
                    const totalLikes = await this.postLikeService.getLikeCount(post.id);

                    postsWithHarvestableAmounts.push({
                        postId: post.id,
                        title: post.title || 'Untitled',
                        createdAt: post.createdAt,
                        harvestableTokens: availableTokens,
                        totalLikes: totalLikes,
                        canHarvest: availableTokens > 0
                    });

                    totalHarvestableTokens += availableTokens;
                } catch (error) {
                    // 개별 게시글 처리 실패 시 로그만 남기고 계속 진행
                    console.error(`Failed to calculate available tokens for post ${post.id}: ${error.message}`);
                    postsWithHarvestableAmounts.push({
                        postId: post.id,
                        title: post.title || 'Untitled',
                        createdAt: post.createdAt,
                        harvestableTokens: 0,
                        totalLikes: 0,
                        canHarvest: false,
                        error: 'Failed to calculate'
                    });
                }
            }

            // 3. 수확 가능한 토큰이 있는 게시글만 필터링하여 정렬 (수확 가능한 양 순으로 내림차순)
            const harvestablePosts = postsWithHarvestableAmounts
                .filter(post => post.canHarvest)
                .sort((a, b) => b.harvestableTokens - a.harvestableTokens);

            // 4. 사용자의 현재 토큰 정보 조회
            const userTokenInfo = await this.userService.getUserTokenInfo(userAddress);

            return {
                success: true,
                data: {
                    totalHarvestableTokens: totalHarvestableTokens,
                    totalPosts: userPosts.length,
                    harvestablePostsCount: harvestablePosts.length,
                    posts: postsWithHarvestableAmounts,
                    harvestablePosts: harvestablePosts,
                    userTokenInfo: {
                        totalTokens: userTokenInfo.totalTokens,
                        availableTokens: userTokenInfo.availableTokens,
                        pendingTokens: userTokenInfo.pendingTokens
                    },
                    summary: {
                        message: totalHarvestableTokens > 0
                            ? `You can harvest a total of ${totalHarvestableTokens} EXP from ${harvestablePosts.length} posts`
                            : 'No tokens available to harvest from any posts',
                        recommendation: harvestablePosts.length > 0
                            ? `Start with post "${harvestablePosts[0].title}" (${harvestablePosts[0].harvestableTokens} EXP available)`
                            : 'Create more engaging content to receive likes and earn tokens'
                    }
                },
                message: 'All harvestable amounts retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get all harvestable amounts: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 블록체인에서 기존 좋아요 현황 동기화 (관리자용)
     * @param body 동기화할 블록 범위
     * @returns 동기화 결과
     */
    @Post('sync-blockchain-likes')
    @UseGuards(JwtAuthGuard)
    async syncBlockchainLikes(@Body() body: { fromBlock?: number; toBlock?: number }) {
        try {
            // 블록 범위 설정 (기본값: 최근 1000블록)
            let fromBlock = body.fromBlock;
            let toBlock = body.toBlock;

            if (!fromBlock || !toBlock) {
                // 현재 블록 번호 조회
                const currentBlock = await this.getCurrentBlockNumber();
                fromBlock = fromBlock || Math.max(0, currentBlock - 1000);
                toBlock = toBlock || currentBlock;
            }

            // 동기화 실행
            const syncResult = await this.blockchainSyncService.syncExistingLikes(fromBlock, toBlock);

            return {
                success: true,
                data: {
                    blockRange: { fromBlock, toBlock },
                    syncResult: {
                        totalEvents: syncResult.totalEvents,
                        processedEvents: syncResult.processedEvents,
                        newLikes: syncResult.newLikes,
                        errors: syncResult.errors
                    },
                    message: `Blockchain synchronization completed for blocks ${fromBlock} to ${toBlock}`
                },
                message: 'Blockchain synchronization completed successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to sync blockchain likes: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 특정 게시글의 블록체인 좋아요 개수 확인
     * @param body 게시글 ID
     * @returns 블록체인상 좋아요 개수
     */
    @Post('blockchain-like-count')
    @UseGuards(JwtAuthGuard)
    async getBlockchainLikeCount(@Body() body: { postId: number }) {
        try {
            if (body.postId === undefined || body.postId === null || body.postId < 0) {
                throw new HttpException('Invalid postId', HttpStatus.BAD_REQUEST);
            }

            const blockchainLikeCount = await this.blockchainSyncService.syncPostLikeCount(body.postId);
            const databaseLikeCount = await this.postLikeService.getLikeCount(body.postId);

            return {
                success: true,
                data: {
                    postId: body.postId,
                    blockchainLikeCount: blockchainLikeCount,
                    databaseLikeCount: databaseLikeCount,
                    isSynchronized: blockchainLikeCount === databaseLikeCount,
                    difference: blockchainLikeCount - databaseLikeCount
                },
                message: 'Blockchain like count retrieved successfully'
            };
        } catch (error) {
            throw new HttpException(
                `Failed to get blockchain like count: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * 현재 블록 번호 조회
     */
    private async getCurrentBlockNumber(): Promise<number> {
        try {
            // 현재 활성 네트워크 가져오기
            const activeNetwork = this.configService.get<string>('blockchain.activeNetwork');

            const rpcUrl = this.configService.get<string>(`blockchain.${activeNetwork}.rpcUrl`);
            if (!rpcUrl) {
                throw new Error('RPC URL not configured');
            }

            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                })
            });

            const data = await response.json();
            return parseInt(data.result, 16);
        } catch (error) {
            console.warn('⚠️ 현재 블록 번호 조회 실패, 기본값 사용:', error.message);
            return 1000; // 기본값
        }
    }

}
