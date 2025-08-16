import * as dotenv from "dotenv";

// 환경 변수 로드 (프로젝트 루트의 .env 파일)
dotenv.config({ path: '../../.env' });

async function main() {
    console.log("🧪 Testing dotenv environment variables...");

    console.log("📋 Environment Variables Test:");

    // 기본 환경 변수들
    const network = process.env.NETWORK;
    console.log(`- NETWORK: ${network}`);

    // 블록체인 설정
    const rpcAmoy = process.env.RPC_AMOY;
    console.log(`- RPC_AMOY: ${rpcAmoy}`);

    const chainAmoyId = process.env.CHAIN_AMOY_ID;
    console.log(`- CHAIN_AMOY_ID: ${chainAmoyId}`);

    // 관리자 개인키
    const adminPrivKey = process.env.ADMIN_PRIV_KEY;
    console.log(`- ADMIN_PRIV_KEY: ${adminPrivKey ? '✅ Set' : '❌ Not Set'}`);

    // 컨트랙트 주소들
    const trivusExpAmoy = process.env.TRIVUS_EXP_AMOY;
    console.log(`- TRIVUS_EXP_AMOY: ${trivusExpAmoy}`);

    const postLikeSystemAmoy = process.env.POST_LIKE_SYSTEM_AMOY;
    console.log(`- POST_LIKE_SYSTEM_AMOY: ${postLikeSystemAmoy}`);

    // 기타 설정
    const rewardPoolAmoy = process.env.REWARD_POOL_AMOY;
    console.log(`- REWARD_POOL_AMOY: ${rewardPoolAmoy}`);

    const distributorAmoy = process.env.DISTRIBUTOR_AMOY;
    console.log(`- DISTRIBUTOR_AMOY: ${distributorAmoy}`);

    console.log("\n✅ dotenv test completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
