import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: resolve(__dirname, "../../.env.very.deploy") });

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        amoy: {
            url: process.env.RPC_AMOY || "https://rpc-amoy.polygon.technology",
            chainId: 80002,
            accounts: process.env.ADMIN_PRIV_KEY ? [process.env.ADMIN_PRIV_KEY] : [],
        },
        very: {
            url: process.env.RPC_VERY || "",
            chainId: parseInt(process.env.CHAIN_VERY_ID || "0"),
            accounts: process.env.ADMIN_PRIV_KEY ? [process.env.ADMIN_PRIV_KEY] : [],
            gas: parseInt(process.env.GAS_LIMIT_VERY || "2000000"), // 2M 가스 한도
            blockGasLimit: parseInt(process.env.BLOCK_GAS_LIMIT_VERY || "30000000"), // 30M 블록 가스 한도
            // 가스 한도 제한 해제
            allowUnlimitedContractSize: true,
            // 가스 가격 명시적 설정
            gasPrice: parseInt(process.env.GAS_PRICE_VERY || "1000000000"), // 1 gwei
            // 가스 한도 제한 완전 해제
            gasMultiplier: 1.5,
            timeout: 60000, // 60초 타임아웃
        },
    },
    etherscan: {
        apiKey: {
            polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
        },
    },
    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config; 