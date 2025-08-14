import * as dotenv from "dotenv";
import { ethers } from "hardhat";

// 환경변수 로드 (루트 디렉토리의 .env 파일)
dotenv.config({ path: "/Users/okhaeeun/Desktop/elo-community/elo-community-backend-nest/.env" });

async function main() {
    console.log("🚀 Deploying Trivus EXP Token to Polygon Amoy...");

    // 환경변수 확인
    const adminPrivateKey = process.env.ADMIN_PRIV_KEY;
    if (!adminPrivateKey) {
        throw new Error("❌ ADMIN_PRIV_KEY environment variable is not set");
    }

    console.log("🔑 Admin private key loaded:", adminPrivateKey.substring(0, 10) + "...");

    // 직접 private key로 계정 생성
    const deployer = new ethers.Wallet(adminPrivateKey);
    console.log("📝 Deploying contracts with the account:", deployer.address);

    // RPC URL 설정
    const rpcUrl = process.env.RPC_AMOY || "https://rpc-amoy.polygon.technology";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const connectedDeployer = deployer.connect(provider);

    // 계정 잔액 확인
    const balance = await provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");

    if (balance === 0n) {
        throw new Error("❌ Account has no MATIC balance. Please fund the account first.");
    }

    // 네트워크 정보 확인
    const network = await provider.getNetwork();
    console.log("🌐 Network:", network.name, "Chain ID:", network.chainId);

    // Trivus EXP Token 컨트랙트 배포
    console.log("📦 Deploying Trivus EXP Token...");
    const TrivusEXP = await ethers.getContractFactory("TrivusEXP", connectedDeployer);
    const trivusEXP = await TrivusEXP.deploy();

    await trivusEXP.waitForDeployment();
    const trivusEXPAddress = await trivusEXP.getAddress();

    console.log("✅ Trivus EXP Token deployed to:", trivusEXPAddress);

    // 토큰 정보 확인
    const name = await trivusEXP.name();
    const symbol = await trivusEXP.symbol();
    const decimals = await trivusEXP.decimals();
    const totalSupply = await trivusEXP.totalSupply();
    const owner = await trivusEXP.owner();

    console.log("\n📊 Token Information:");
    console.log("   Name:", name);
    console.log("   Symbol:", symbol);
    console.log("   Decimals:", decimals.toString());
    console.log("   Total Supply:", ethers.formatEther(totalSupply), "EXP");
    console.log("   Owner:", owner);

    // 배포자 잔액 확인
    const deployerBalance = await trivusEXP.balanceOf(deployer.address);
    console.log("   Deployer Balance:", ethers.formatEther(deployerBalance), "EXP");

    console.log("\n🎉 Deployment completed successfully!");
    console.log("🔗 Contract Address:", trivusEXPAddress);

    // 배포 정보를 파일로 저장 (선택사항)
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId.toString(),
        contractName: "TrivusEXP",
        contractAddress: trivusEXPAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        tokenInfo: {
            name,
            symbol,
            decimals: decimals.toString(),
            totalSupply: ethers.formatEther(totalSupply),
            owner
        }
    };

    console.log("\n📄 Deployment Info:");
    console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 