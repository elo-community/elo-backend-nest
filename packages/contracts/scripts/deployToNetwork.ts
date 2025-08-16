import * as dotenv from "dotenv";
import { ethers } from "hardhat";

// 환경 변수 로드 (프로젝트 루트의 .env 파일)
dotenv.config({ path: '../../.env' });

async function main() {
    console.log("🚀 Deploying PostLikeSystem to actual network...");

    // 환경 변수에서 설정 가져오기
    const network = process.env.NETWORK || "amoy";
    const adminPrivKey = process.env.ADMIN_PRIV_KEY;
    const rpcUrl = process.env.RPC_AMOY;
    const trivusExpAddress = process.env.TRIVUS_EXP_AMOY;

    if (!adminPrivKey) {
        throw new Error("❌ ADMIN_PRIV_KEY environment variable is required");
    }

    if (!rpcUrl) {
        throw new Error("❌ RPC_AMOY environment variable is required");
    }

    if (!trivusExpAddress) {
        throw new Error("❌ TRIVUS_EXP_AMOY environment variable is required");
    }

    console.log(`🌐 Network: ${network}`);
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    console.log(`🔑 Admin Address: ${new ethers.Wallet(adminPrivKey).address}`);
    console.log(`🎯 TrivusEXP Address: ${trivusExpAddress}`);

    // 네트워크 연결
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(adminPrivKey, provider);

    console.log(`\n📝 Step 1: Deploying PostLikeSystem contract...`);

    // PostLikeSystem 컨트랙트 배포
    const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem", wallet);
    const postLikeSystem = await PostLikeSystem.deploy(trivusExpAddress);

    console.log("⏳ Waiting for deployment confirmation...");
    await postLikeSystem.waitForDeployment();

    const contractAddress = await postLikeSystem.getAddress();
    console.log(`✅ PostLikeSystem deployed successfully!`);
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log(`🔗 TrivusEXP Token: ${trivusExpAddress}`);
    console.log(`👤 Owner: ${await postLikeSystem.owner()}`);

    // 컨트랙트 검증
    console.log(`\n📊 Contract Verification:`);
    console.log(`- Owner: ${await postLikeSystem.owner()}`);
    console.log(`- Trivus Token Address: ${await postLikeSystem.trivusToken()}`);
    console.log(`- Contract Token Balance: ${ethers.formatEther(await postLikeSystem.getContractTokenBalance())} TRIVUS`);

    // 배포 정보 저장
    const deploymentInfo = {
        network,
        contractName: "PostLikeSystem",
        contractAddress,
        trivusExpAddress,
        owner: await postLikeSystem.owner(),
        deploymentTime: new Date().toISOString(),
        rpcUrl,
        gasUsed: await postLikeSystem.deploymentTransaction()?.gasLimit?.toString() || "Unknown"
    };

    console.log(`\n📋 Deployment Information:`);
    console.log(JSON.stringify(deploymentInfo, null, 2));

    // 환경 변수 설정 가이드
    console.log(`\n🔧 Environment Variables to Add:`);
    console.log(`POST_LIKE_SYSTEM_AMOY=${contractAddress}`);

    // Remix에서 테스트할 수 있는 정보
    console.log(`\n🎯 Remix Testing Instructions:`);
    console.log(`1. Remix IDE (https://remix.ethereum.org) 접속`);
    console.log(`2. Deploy & Run Transactions 탭 선택`);
    console.log(`3. Environment: Injected Provider - MetaMask 선택`);
    console.log(`4. MetaMask에서 ${network} 네트워크 연결`);
    console.log(`5. Contract: PostLikeSystem 선택`);
    console.log(`6. At Address에 ${contractAddress} 입력`);
    console.log(`7. Load 버튼 클릭하여 컨트랙트 로드`);
    console.log(`8. 각 함수들을 테스트해보세요!`);

    console.log(`\n⚠️  Important Notes:`);
    console.log(`- 이 주소들을 백엔드 설정에 추가하세요`);
    console.log(`- 컨트랙트 주소를 안전하게 보관하세요`);
    console.log(`- 테스트 완료 후 실제 사용을 시작하세요`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
