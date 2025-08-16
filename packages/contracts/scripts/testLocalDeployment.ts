import { ethers } from "hardhat";

async function main() {
    console.log("🧪 Testing locally deployed contracts...");

    // 배포된 컨트랙트 주소들
    const MOCK_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const POST_LIKE_SYSTEM_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const OWNER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // 계정들 가져오기
    const [owner, user1, user2, postAuthor] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}`);
    console.log(`👤 User2: ${user2.address}`);
    console.log(`👤 PostAuthor: ${postAuthor.address}`);

    // 컨트랙트 인스턴스 생성
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = MockERC20.attach(MOCK_TOKEN_ADDRESS);

    const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem");
    const postLikeSystem = PostLikeSystem.attach(POST_LIKE_SYSTEM_ADDRESS);

    console.log("\n📊 Initial State:");
    console.log(`- Mock Token Balance (Owner): ${ethers.formatEther(await mockToken.balanceOf(owner.address))} MTK`);
    console.log(`- Mock Token Balance (User1): ${ethers.formatEther(await mockToken.balanceOf(user1.address))} MTK`);
    console.log(`- PostLikeSystem Token Balance: ${ethers.formatEther(await postLikeSystem.getContractTokenBalance())} MTK`);

    // 1. 사용자들에게 테스트 토큰 분배
    console.log("\n🎁 Distributing test tokens to users...");
    await mockToken.mint(user1.address, ethers.parseEther("100"));
    await mockToken.mint(user2.address, ethers.parseEther("100"));
    await mockToken.mint(postAuthor.address, ethers.parseEther("100"));
    console.log("✅ Test tokens distributed");

    // 2. 사용자들이 PostLikeSystem에 토큰 사용 권한 부여
    console.log("\n🔐 Approving tokens for PostLikeSystem...");
    await mockToken.connect(user1).approve(POST_LIKE_SYSTEM_ADDRESS, ethers.parseEther("10"));
    await mockToken.connect(user2).approve(POST_LIKE_SYSTEM_ADDRESS, ethers.parseEther("10"));
    console.log("✅ Tokens approved");

    // 3. 좋아요 테스트
    const postId = 1;
    console.log(`\n❤️ Testing like functionality for post ID: ${postId}`);

    // User1이 PostAuthor의 게시글에 좋아요
    console.log("📝 User1 liking post...");
    await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);

    // 좋아요 정보 확인
    const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(postId);
    console.log(`✅ Post like info: ${totalLikes} likes, ${ethers.formatEther(totalTokens)} tokens collected`);

    // User2도 좋아요
    console.log("📝 User2 liking post...");
    await postLikeSystem.connect(user2).likePost(postId, postAuthor.address);

    const [totalLikes2, totalTokens2] = await postLikeSystem.getPostLikeInfo(postId);
    console.log(`✅ Post like info: ${totalLikes2} likes, ${ethers.formatEther(totalTokens2)} tokens collected`);

    // 4. 토큰 잔액 확인
    console.log("\n💰 Token balances after likes:");
    console.log(`- User1: ${ethers.formatEther(await mockToken.balanceOf(user1.address))} MTK`);
    console.log(`- User2: ${ethers.formatEther(await mockToken.balanceOf(user2.address))} MTK`);
    console.log(`- PostLikeSystem: ${ethers.formatEther(await postLikeSystem.getContractTokenBalance())} MTK`);

    // 5. 좋아요 취소 테스트
    console.log("\n💔 Testing unlike functionality...");
    await postLikeSystem.connect(user1).unlikePost(postId);

    const [totalLikes3, totalTokens3] = await postLikeSystem.getPostLikeInfo(postId);
    console.log(`✅ Post like info after unlike: ${totalLikes3} likes, ${ethers.formatEther(totalTokens3)} tokens collected`);

    // 6. 토큰 회수 테스트 (PostAuthor만 가능)
    console.log("\n💸 Testing token withdrawal...");
    await postLikeSystem.connect(postAuthor).withdrawTokens(postId);

    const [totalLikes4, totalTokens4] = await postLikeSystem.getPostLikeInfo(postId);
    console.log(`✅ Post like info after withdrawal: ${totalLikes4} likes, ${ethers.formatEther(totalTokens4)} tokens collected`);
    console.log(`- PostAuthor balance: ${ethers.formatEther(await mockToken.balanceOf(postAuthor.address))} MTK`);

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`- MockERC20: ${MOCK_TOKEN_ADDRESS}`);
    console.log(`- PostLikeSystem: ${POST_LIKE_SYSTEM_ADDRESS}`);
    console.log(`- Owner: ${OWNER_ADDRESS}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
