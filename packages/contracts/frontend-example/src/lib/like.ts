import { AbiCoder, Contract, parseUnits } from "ethers";

/**
 * ERC-1363 토큰 ABI (transferAndCall 함수 포함)
 */
export const tokenAbi = [
    "function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];

/**
 * PostLikeReceiver ABI
 */
export const receiverAbi = [
    "function getPostInfo(uint256 postId) external view returns (address author, uint256 likes, uint256 tokens)",
    "function getUserLikeInfo(uint256 postId, address user) external view returns (bool userHasLiked)",
    "function withdraw(uint256 postId) external",
    "event PostLiked(address indexed user, uint256 indexed postId, uint256 amount)",
    "event TokensWithdrawn(address indexed author, uint256 indexed postId, uint256 amount)"
];

/**
 * ERC-1363을 사용하여 게시글에 좋아요를 보내는 함수
 * @param tokenAddress 토큰 컨트랙트 주소
 * @param likeReceiverAddress PostLikeReceiver 컨트랙트 주소
 * @param postId 게시글 ID
 * @param signer 사용자 서명자
 * @returns 트랜잭션 결과
 */
export async function likePostWith1363(
    tokenAddress: string,
    likeReceiverAddress: string,
    postId: bigint,
    signer: any
) {
    const token = new Contract(tokenAddress, tokenAbi, signer);

    // postId를 ABI 인코딩
    const data = AbiCoder.defaultAbiCoder().encode(["uint256"], [postId]);

    // 1 EXP (1e18 wei)
    const amount = parseUnits("1", 18);

    // transferAndCall 실행
    const tx = await token.transferAndCall(likeReceiverAddress, amount, data);
    return await tx.wait();
}

/**
 * 게시글 정보를 조회하는 함수
 * @param receiverAddress PostLikeReceiver 컨트랙트 주소
 * @param postId 게시글 ID
 * @param provider 이더리움 프로바이더
 * @returns 게시글 정보
 */
export async function getPostInfo(
    receiverAddress: string,
    postId: bigint,
    provider: any
) {
    const receiver = new Contract(receiverAddress, receiverAbi, provider);
    const [author, likes, tokens] = await receiver.getPostInfo(postId);

    return {
        author,
        likes: likes.toString(),
        tokens: tokens.toString()
    };
}

/**
 * 사용자의 좋아요 여부를 확인하는 함수
 * @param receiverAddress PostLikeReceiver 컨트랙트 주소
 * @param postId 게시글 ID
 * @param userAddress 사용자 주소
 * @param provider 이더리움 프로바이더
 * @returns 좋아요 여부
 */
export async function getUserLikeInfo(
    receiverAddress: string,
    postId: bigint,
    userAddress: string,
    provider: any
) {
    const receiver = new Contract(receiverAddress, receiverAbi, provider);
    return await receiver.getUserLikeInfo(postId, userAddress);
}

/**
 * 토큰을 인출하는 함수 (게시글 작성자만)
 * @param receiverAddress PostLikeReceiver 컨트랙트 주소
 * @param postId 게시글 ID
 * @param signer 작성자 서명자
 * @returns 트랜잭션 결과
 */
export async function withdrawTokens(
    receiverAddress: string,
    postId: bigint,
    signer: any
) {
    const receiver = new Contract(receiverAddress, receiverAbi, signer);
    const tx = await receiver.withdraw(postId);
    return await tx.wait();
}

/**
 * 사용 예시:
 * 
 * ```typescript
 * import { likePostWith1363, getPostInfo } from './lib/like';
 * 
 * // 좋아요 보내기
 * const result = await likePostWith1363(
 *     "0x...", // 토큰 주소
 *     "0x...", // PostLikeReceiver 주소
 *     1n,      // 게시글 ID
 *     signer
 * );
 * 
 * // 게시글 정보 조회
 * const info = await getPostInfo(
 *     "0x...", // PostLikeReceiver 주소
 *     1n,      // 게시글 ID
 *     provider
 * );
 * ```
 */
