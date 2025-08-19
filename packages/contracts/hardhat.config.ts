import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { resolve } from "path";

// 프로젝트 루트의 .env 파일 로드
dotenv.config({ path: resolve(__dirname, "../../.env") });

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