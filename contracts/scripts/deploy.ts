import { ethers, upgrades } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    if (!deployer) {
        throw new Error("No deployer account found");
    }

    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy RewardPool
    console.log("\n1. Deploying RewardPool...");
    const RewardPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = await upgrades.deployProxy(RewardPool, [deployer.address]);
    await rewardPool.waitForDeployment();

    const rewardPoolAddress = await rewardPool.getAddress();
    console.log("RewardPool deployed to:", rewardPoolAddress);

    // Deploy SignedRewardDistributor
    console.log("\n2. Deploying SignedRewardDistributor...");
    const SignedRewardDistributor = await ethers.getContractFactory("SignedRewardDistributor");
    const distributor = await upgrades.deployProxy(SignedRewardDistributor, [
        rewardPoolAddress,
        deployer.address,
        deployer.address // For now, admin and signer are the same
    ]);
    await distributor.waitForDeployment();

    const distributorAddress = await distributor.getAddress();
    console.log("SignedRewardDistributor deployed to:", distributorAddress);

    // Set distributor in pool
    console.log("\n3. Setting distributor in RewardPool...");
    const setDistributorTx = await rewardPool.setDistributor(distributorAddress);
    await setDistributorTx.wait();
    console.log("Distributor set in RewardPool");

    // Verify setup
    console.log("\n4. Verifying setup...");
    const poolDistributor = await rewardPool.distributor();
    const distributorPool = await distributor.rewardPool();

    console.log("Pool distributor:", poolDistributor);
    console.log("Distributor pool:", distributorPool);

    if (poolDistributor === distributorAddress && distributorPool === rewardPoolAddress) {
        console.log("✅ Setup verified successfully!");
    } else {
        console.log("❌ Setup verification failed!");
    }

    console.log("\n=== Deployment Summary ===");
    console.log("Network:", (await ethers.provider.getNetwork()).name);
    console.log("RewardPool:", rewardPoolAddress);
    console.log("SignedRewardDistributor:", distributorAddress);
    console.log("Admin/Signer:", deployer.address);

    console.log("\nAdd these addresses to your .env file:");
    console.log(`REWARD_POOL_${process.env.HARDHAT_NETWORK?.toUpperCase() || 'LOCAL'}=${rewardPoolAddress}`);
    console.log(`DISTRIBUTOR_${process.env.HARDHAT_NETWORK?.toUpperCase() || 'LOCAL'}=${distributorAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 