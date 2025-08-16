import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying PostLikeSystem contract...");

    // 1단계: MockERC20 토큰 배포 (테스트용)
    console.log("📝 Step 1: Deploying MockERC20 token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("Mock TrivusEXP", "MTK");
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log(`✅ MockERC20 deployed at: ${mockTokenAddress}`);

    // 2단계: PostLikeSystem 컨트랙트 배포
    console.log("📝 Step 2: Deploying PostLikeSystem contract...");
    const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem");
    const postLikeSystem = await PostLikeSystem.deploy(mockTokenAddress);
    await postLikeSystem.waitForDeployment();
    const contractAddress = await postLikeSystem.getAddress();

    console.log("✅ PostLikeSystem deployed successfully!");
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 Mock Token Address: ${mockTokenAddress}`);
    console.log(`👤 Owner: ${await postLikeSystem.owner()}`);

    // 컨트랙트 검증을 위한 기본 정보 출력
    console.log("\n📊 Contract Verification:");
    console.log(`- Contract Token Balance: ${ethers.formatEther(await postLikeSystem.getContractTokenBalance())} MTK`);
    console.log(`- Owner: ${await postLikeSystem.owner()}`);
    console.log(`- Mock Token Address: ${await postLikeSystem.trivusToken()}`);

    // 테스트용 토큰 분배
    console.log("\n🎁 Distributing test tokens...");
    const [owner] = await ethers.getSigners();
    await mockToken.mint(owner.address, ethers.parseEther("1000"));
    console.log(`✅ Owner received 1000 MTK tokens`);

    console.log("\n🎯 Next Steps:");
    console.log("1. Use these addresses in your backend configuration");
    console.log("2. Test the contract functions");
    console.log("3. For production, deploy with real TrivusEXP token address");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
