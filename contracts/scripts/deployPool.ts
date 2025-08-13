import { upgrades } from "hardhat";

async function main() {
    // Hardhat ethers v6 호환성을 위해 hre.ethers 사용
    const { ethers: hreEthers } = require("hardhat");
    const [deployer] = await hreEthers.getSigners();

    if (!deployer) {
        throw new Error("No deployer account found");
    }

    console.log("Deploying RewardPool with account:", deployer.address);
    const balance = await hreEthers.provider.getBalance(deployer.address);
    console.log("Account balance:", balance.toString());

    // Deploy RewardPool
    console.log("\n1. Deploying RewardPool...");
    const RewardPool = await hreEthers.getContractFactory("RewardPool");
    const rewardPool = await upgrades.deployProxy(RewardPool, [deployer.address]);
    await rewardPool.waitForDeployment();

    const rewardPoolAddress = await rewardPool.getAddress();
    console.log("RewardPool deployed to:", rewardPoolAddress);

    // Verify setup
    console.log("\n2. Verifying setup...");
    const poolAdmin = await rewardPool.admin();
    console.log("Pool admin:", poolAdmin);

    if (poolAdmin === deployer.address) {
        console.log("✅ Setup verified successfully!");
    } else {
        console.log("❌ Setup verification failed!");
    }

    console.log("\n=== Deployment Summary ===");
    const network = await hreEthers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("RewardPool:", rewardPoolAddress);
    console.log("Admin:", deployer.address);

    console.log("\nAdd this address to your .env file:");
    console.log(`REWARD_POOL_${process.env.HARDHAT_NETWORK?.toUpperCase() || 'LOCAL'}=${rewardPoolAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 