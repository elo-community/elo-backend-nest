import { ethers } from 'ethers';

/**
 * 프론트엔드에서 좋아요 서명을 사용하는 방법
 * 
 * 1. 백엔드에서 좋아요 서명 요청
 * 2. 받은 서명으로 transferAndCall 실행
 * 3. 서명 검증 및 좋아요 처리
 */

export class LikeSignatureExample {
    private provider: ethers.JsonRpcProvider;
    private tokenContract: ethers.Contract;
    private postLikeContract: ethers.Contract;
    private userWallet: ethers.Wallet;

    constructor(
        rpcUrl: string,
        tokenAddress: string,
        postLikeAddress: string,
        userPrivateKey: string
    ) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.userWallet = new ethers.Wallet(userPrivateKey, this.provider);

        // TrivusEXP1363 토큰 컨트랙트 ABI (transferAndCall 포함)
        const tokenABI = [
            'function transferAndCall(address to, uint256 amount, bytes calldata data) returns (bool)',
            'function balanceOf(address account) view returns (uint256)',
            'function allowance(address owner, address spender) view returns (uint256)',
            'function approve(address spender, uint256 amount) returns (bool)'
        ];

        this.tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.userWallet);

        // PostLikeSystem1363 컨트랙트 ABI
        const postLikeABI = [
            'function likePrice() view returns (uint256)',
            'function getPostInfo(uint256 postId, address user) view returns (uint256 totalLikes, uint256 totalTokens, bool isLikedByUser)'
        ];

        this.postLikeContract = new ethers.Contract(postLikeAddress, postLikeABI, this.userWallet);
    }

    /**
     * 1. 백엔드에서 좋아요 서명 요청
     */
    async requestLikeSignature(postId: number, userAddress: string, amount: string): Promise<any> {
        const response = await fetch('http://localhost:3000/api/v1/post-like-signature/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                postId: postId,
                userAddress: userAddress,
                amount: amount,
                deadline: Math.floor(Date.now() / 1000) + 3600 // 1시간 후
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to request like signature: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * 2. 좋아요 실행 (transferAndCall)
     */
    async likePost(postId: number, amount: string): Promise<string> {
        try {
            // 1. 백엔드에서 서명 요청
            const signatureResponse = await this.requestLikeSignature(
                postId,
                this.userWallet.address,
                amount
            );

            if (!signatureResponse.success) {
                throw new Error(`Failed to get signature: ${signatureResponse.message}`);
            }

            const signatureData = signatureResponse.data;

            // 2. 서명 데이터를 abi.encode로 인코딩
            const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
                ['uint256', 'uint256', 'bytes32', 'bytes'],
                [
                    signatureData.postId,
                    signatureData.deadline,
                    signatureData.nonce,
                    signatureData.signature
                ]
            );

            // 3. transferAndCall 실행
            const tx = await this.tokenContract.transferAndCall(
                this.postLikeContract.target,
                amount,
                encodedData
            );

            console.log(`Like transaction sent: ${tx.hash}`);

            // 4. 트랜잭션 완료 대기
            const receipt = await tx.wait();
            console.log(`Like transaction confirmed in block ${receipt.blockNumber}`);

            return tx.hash;
        } catch (error) {
            console.error('Failed to like post:', error);
            throw error;
        }
    }

    /**
     * 3. 좋아요 가격 조회
     */
    async getLikePrice(): Promise<string> {
        try {
            const response = await fetch('http://localhost:3000/api/v1/post-like-signature/price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get like price: ${response.statusText}`);
            }

            const result = await response.json();
            return result.data.price;
        } catch (error) {
            console.error('Failed to get like price:', error);
            throw error;
        }
    }

    /**
     * 4. 게시글 정보 조회
     */
    async getPostInfo(postId: number): Promise<any> {
        try {
            const response = await fetch('http://localhost:3000/api/v1/post-like-signature/post-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: postId,
                    userAddress: this.userWallet.address
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to get post info: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to get post info:', error);
            throw error;
        }
    }

    /**
     * 5. 사용자 토큰 잔액 확인
     */
    async getUserBalance(): Promise<string> {
        try {
            const balance = await this.tokenContract.balanceOf(this.userWallet.address);
            return balance.toString();
        } catch (error) {
            console.error('Failed to get user balance:', error);
            throw error;
        }
    }

    /**
     * 6. 전체 좋아요 프로세스 실행
     */
    async executeLikeProcess(postId: number): Promise<void> {
        try {
            console.log('=== 좋아요 프로세스 시작 ===');

            // 1. 좋아요 가격 확인
            const likePrice = await this.getLikePrice();
            console.log(`좋아요 가격: ${likePrice} wei (${ethers.formatEther(likePrice)} EXP)`);

            // 2. 사용자 잔액 확인
            const userBalance = await this.getUserBalance();
            console.log(`사용자 잔액: ${userBalance} wei (${ethers.formatEther(userBalance)} EXP)`);

            // 3. 잔액 부족 확인
            if (BigInt(userBalance) < BigInt(likePrice)) {
                throw new Error(`Insufficient balance. Required: ${likePrice} wei, Available: ${userBalance} wei`);
            }

            // 4. 게시글 정보 확인
            const postInfo = await this.getPostInfo(postId);
            console.log(`게시글 ${postId} 정보:`, postInfo.data);

            // 5. 이미 좋아요를 눌렀는지 확인
            if (postInfo.data.isLikedByUser) {
                console.log(`이미 게시글 ${postId}에 좋아요를 눌렀습니다.`);
                return;
            }

            // 6. 좋아요 실행
            console.log(`게시글 ${postId}에 좋아요를 실행합니다...`);
            const txHash = await this.likePost(postId, likePrice);
            console.log(`좋아요 완료! 트랜잭션 해시: ${txHash}`);

            // 7. 업데이트된 게시글 정보 확인
            const updatedPostInfo = await this.getPostInfo(postId);
            console.log(`업데이트된 게시글 ${postId} 정보:`, updatedPostInfo.data);

            console.log('=== 좋아요 프로세스 완료 ===');
        } catch (error) {
            console.error('좋아요 프로세스 실패:', error);
            throw error;
        }
    }
}

// 사용 예시
async function main() {
    const example = new LikeSignatureExample(
        'https://rpc-amoy.polygon.technology', // Amoy 테스트넷 RPC
        '0x...', // TrivusEXP1363 토큰 주소
        '0x...', // PostLikeSystem1363 주소
        '0x...'  // 사용자 개인키
    );

    try {
        await example.executeLikeProcess(1); // 게시글 ID 1에 좋아요
    } catch (error) {
        console.error('Main execution failed:', error);
    }
}

// main().catch(console.error);
