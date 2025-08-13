import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    if (!deployer) {
        throw new Error("No deployer account found");
    }

    console.log("Deploying RewardPool with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy RewardPool
    console.log("\n1. Deploying RewardPool...");
    const RewardPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = await upgrades.deployProxy(RewardPool, [deployer.address]);
    await rewardPool.waitForDeployment();

    const rewardPoolAddress = await rewardPool.getAddress();
    console.log("RewardPool deployed to:", rewardPoolAddress);

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
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