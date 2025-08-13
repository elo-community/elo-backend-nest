import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { MockERC20, RewardPool, SignedRewardDistributor } from "../typechain-types";

// Hardhat ethers v6 호환성을 위해 hre.ethers 사용
const { ethers: hreEthers } = require("hardhat");

describe("SignedRewardDistributor", function () {
    let distributor: SignedRewardDistributor;
    let rewardPool: RewardPool;
    let token: MockERC20;
    let owner: any;
    let user: any;
    let signer: any;

    beforeEach(async function () {
        [owner, user, signer] = await hreEthers.getSigners();

        // Deploy mock ERC20 token
        const MockToken = await hreEthers.getContractFactory("MockERC20");
        token = await MockToken.deploy("Test Token", "TEST");

        // Deploy RewardPool
        const RewardPool = await hreEthers.getContractFactory("RewardPool");
        rewardPool = await upgrades.deployProxy(RewardPool, [owner.address]) as RewardPool;

        // Deploy Distributor
        const SignedRewardDistributor = await hreEthers.getContractFactory("SignedRewardDistributor");
        distributor = await upgrades.deployProxy(SignedRewardDistributor, [
            await rewardPool.getAddress(),
            owner.address,
            signer.address
        ]) as SignedRewardDistributor;

        // Set distributor in pool
        await rewardPool.setDistributor(await distributor.getAddress());
    });

    describe("Initialization", function () {
        it("Should set the correct admin", async function () {
            const adminRole = await distributor.DEFAULT_ADMIN_ROLE();
            expect(await distributor.hasRole(adminRole, owner.address)).to.be.true;
        });

        it("Should set the correct distributor", async function () {
            expect(await rewardPool.distributor()).to.equal(await distributor.getAddress());
        });
    });

    describe("Distributions", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1000");
            await token.approve(await rewardPool.getAddress(), amount);
            await rewardPool.deposit(await token.getAddress(), amount);
        });

        it("Should create distribution successfully", async function () {
            const distributionId = 1;
            const totalAmount = ethers.parseEther("100");
            const snapshotBlock = await hreEthers.provider.getBlockNumber();
            const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

            await distributor.createDistribution(
                distributionId,
                await token.getAddress(),
                totalAmount,
                snapshotBlock,
                deadline
            );

            const distribution = await distributor.dists(distributionId);
            expect(distribution.token).to.equal(await token.getAddress());
            expect(distribution.total).to.equal(totalAmount);
            expect(distribution.active).to.be.true;
        });

        it("Should not allow non-admin to create distribution", async function () {
            const distributionId = 1;
            const totalAmount = ethers.parseEther("100");
            const snapshotBlock = await hreEthers.provider.getBlockNumber();
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            await expect(
                distributor.connect(user).createDistribution(
                    distributionId,
                    await token.getAddress(),
                    totalAmount,
                    snapshotBlock,
                    deadline
                )
            ).to.be.revertedWithCustomError(distributor, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Claims", function () {
        let distributionId: number;
        let deadline: number;

        beforeEach(async function () {
            distributionId = 1;
            const totalAmount = ethers.parseEther("100");
            const snapshotBlock = await hreEthers.provider.getBlockNumber();
            deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

            await distributor.createDistribution(
                distributionId,
                await token.getAddress(),
                totalAmount,
                snapshotBlock,
                deadline
            );
        });

        it("Should process valid claim", async function () {
            const postId = ethers.keccak256(ethers.toUtf8Bytes("test-post"));
            const authorizedAmount = ethers.parseEther("10");
            const message = {
                distributionId,
                postId,
                account: user.address,
                authorizedAmount,
                deadline
            };

            const domain = {
                name: "SignedRewardDistributor",
                version: "1",
                chainId: await hreEthers.provider.getNetwork().then((n: any) => Number(n.chainId)),
                verifyingContract: await distributor.getAddress()
            };

            const types = {
                Claim: [
                    { name: "distributionId", type: "uint256" },
                    { name: "postId", type: "bytes32" },
                    { name: "account", type: "address" },
                    { name: "authorizedAmount", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const signature = await signer.signTypedData(domain, types, message);

            await distributor.claim(distributionId, postId, user.address, authorizedAmount, deadline, signature);

            const claimed = await distributor.claimed(distributionId, user.address);
            expect(claimed).to.be.true;
        });

        it("Should reject expired claim", async function () {
            const postId = ethers.keccak256(ethers.toUtf8Bytes("test-post"));
            const expiredDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
            const authorizedAmount = ethers.parseEther("10");

            const message = {
                distributionId,
                postId,
                account: user.address,
                authorizedAmount,
                deadline: expiredDeadline
            };

            const domain = {
                name: "SignedRewardDistributor",
                version: "1",
                chainId: await hreEthers.provider.getNetwork().then((n: any) => Number(n.chainId)),
                verifyingContract: await distributor.getAddress()
            };

            const types = {
                Claim: [
                    { name: "distributionId", type: "uint256" },
                    { name: "postId", type: "bytes32" },
                    { name: "account", type: "address" },
                    { name: "authorizedAmount", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const signature = await signer.signTypedData(domain, types, message);

            await expect(
                distributor.claim(distributionId, postId, user.address, authorizedAmount, expiredDeadline, signature)
            ).to.be.revertedWithCustomError(distributor, "ClaimExpired");
        });
    });
}); 