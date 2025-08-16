import { ConfigService } from "@nestjs/config";

async function main() {
    console.log("🧪 Testing ConfigService...");

    try {
        // ConfigService 인스턴스 생성
        const configService = new ConfigService();

        console.log("📋 Environment Variables Test:");

        // 기본 환경 변수들
        const network = configService.get<string>('NETWORK');
        console.log(`- NETWORK: ${network}`);

        // 블록체인 설정
        const rpcAmoy = configService.get<string>('RPC_AMOY');
        console.log(`- RPC_AMOY: ${rpcAmoy}`);

        const chainAmoyId = configService.get<string>('CHAIN_AMOY_ID');
        console.log(`- CHAIN_AMOY_ID: ${chainAmoyId}`);

        // 관리자 개인키
        const adminPrivKey = configService.get<string>('ADMIN_PRIV_KEY');
        console.log(`- ADMIN_PRIV_KEY: ${adminPrivKey ? '✅ Set' : '❌ Not Set'}`);

        // 컨트랙트 주소들
        const trivusExpAmoy = configService.get<string>('TRIVUS_EXP_AMOY');
        console.log(`- TRIVUS_EXP_AMOY: ${trivusExpAmoy}`);

        const postLikeSystemAmoy = configService.get<string>('POST_LIKE_SYSTEM_AMOY');
        console.log(`- POST_LIKE_SYSTEM_AMOY: ${postLikeSystemAmoy}`);

        // ConfigService를 통한 중첩 설정 읽기 테스트
        console.log("\n🔍 Nested Config Test:");

        const blockchainConfig = configService.get('blockchain');
        console.log(`- blockchain config: ${blockchainConfig ? '✅ Available' : '❌ Not Available'}`);

        if (blockchainConfig) {
            console.log(`  - admin.privateKey: ${configService.get('blockchain.admin.privateKey') ? '✅ Set' : '❌ Not Set'}`);
            console.log(`  - amoy.rpcUrl: ${configService.get('blockchain.amoy.rpcUrl') ? '✅ Set' : '❌ Not Set'}`);
            console.log(`  - contracts.trivusExp.amoy: ${configService.get('blockchain.contracts.trivusExp.amoy') ? '✅ Set' : '❌ Not Set'}`);
        }

        console.log("\n✅ ConfigService test completed!");

    } catch (error) {
        console.error("❌ ConfigService test failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
