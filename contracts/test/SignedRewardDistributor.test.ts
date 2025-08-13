import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { MockERC20, RewardPool, SignedRewardDistributor } from "../typechain-types";

describe("SignedRewardDistributor", function () {
    let rewardPool: RewardPool;
    let distributor: SignedRewardDistributor;
    let token: MockERC20;
    let owner: any;
    let user: any;
    let signer: any;

    beforeEach(async function () {
        [owner, user, signer] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        token = await MockToken.deploy("Test Token", "TEST");

        // Deploy RewardPool
        const RewardPool = await ethers.getContractFactory("RewardPool");
        rewardPool = await upgrades.deployProxy(RewardPool, [owner.address]) as RewardPool;

        // Deploy SignedRewardDistributor
        const SignedRewardDistributor = await ethers.getContractFactory("SignedRewardDistributor");
        distributor = await upgrades.deployProxy(SignedRewardDistributor, [
            rewardPool.target,
            owner.address,
            signer.address
        ]) as SignedRewardDistributor;

        // Set distributor in pool
        await rewardPool.setDistributor(distributor.target);

        // Deposit tokens to pool
        const amount = ethers.parseEther("10000");
        await token.approve(rewardPool.target, amount);
        await rewardPool.deposit(token.target, amount);
    });

    describe("Initialization", function () {
        it("Should set the correct admin and signer", async function () {
            expect(await distributor.hasRole(await distributor.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
            expect(await distributor.hasRole(await distributor.SIGNER_ROLE(), signer.address)).to.be.true;
            expect(await distributor.rewardPool()).to.equal(rewardPool.target);
        });
    });

    describe("Distribution Management", function () {
        it("Should allow admin to create distribution", async function () {
            const id = 1;
            const total = ethers.parseEther("1000");
            const snapshotBlock = await ethers.provider.getBlockNumber();
            const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours

            await expect(
                distributor.createDistribution(id, token.target, total, snapshotBlock, deadline)
            ).to.emit(distributor, "DistributionCreated")
                .withArgs(id, token.target, total, snapshotBlock, deadline);

            const dist = await distributor.getDistribution(id);
            expect(dist.token).to.equal(token.target);
            expect(dist.total).to.equal(total);
            expect(dist.remaining).to.equal(total);
            expect(dist.active).to.be.true;
        });

        it("Should not allow non-admin to create distribution", async function () {
            const id = 2;
            const total = ethers.parseEther("1000");
            const snapshotBlock = await ethers.provider.getBlockNumber();
            const deadline = Math.floor(Date.now() / 1000) + 86400;

            await expect(
                distributor.connect(user).createDistribution(id, token.target, total, snapshotBlock, deadline)
            ).to.be.revertedWithCustomError(distributor, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Claim Verification", function () {
        let distributionId: number;
        let deadline: number;

        beforeEach(async function () {
            // Create a distribution
            distributionId = 1;
            const total = ethers.parseEther("1000");
            const snapshotBlock = await ethers.provider.getBlockNumber();
            deadline = Math.floor(Date.now() / 1000) + 86400;

            await distributor.createDistribution(distributionId, token.target, total, snapshotBlock, deadline);
        });

        it("Should verify EIP-712 signature correctly", async function () {
            const postId = ethers.keccak256(ethers.toUtf8Bytes("test-post"));
            const account = user.address;
            const authorizedAmount = ethers.parseEther("100");

            // Get domain separator
            const domainSeparator = await distributor.DOMAIN_SEPARATOR();

            // Build claim message
            const types = {
                Claim: [
                    { name: "distributionId", type: "uint256" },
                    { name: "postId", type: "bytes32" },
                    { name: "account", type: "address" },
                    { name: "authorizedAmount", type: "uint256" },
                    { name: "deadline", type: "uint256" }
                ]
            };

            const message = {
                distributionId,
                postId,
                account,
                authorizedAmount,
                deadline
            };

            // Sign with signer wallet
            const signature = await signer.signTypedData(
                {
                    name: "SignedRewardDistributor",
                    version: "1",
                    chainId: await ethers.provider.getNetwork().then(n => Number(n.chainId)),
                    verifyingContract: distributor.target
                },
                types,
                message
            );

            // Verify signature is valid
            const recoveredSigner = ethers.verifyTypedData(
                {
                    name: "SignedRewardDistributor",
                    version: "1",
                    chainId: await ethers.provider.getNetwork().then(n => Number(n.chainId)),
                    verifyingContract: distributor.target
                },
                types,
                message,
                signature
            );

            expect(recoveredSigner).to.equal(signer.address);
        });
    });

    describe("Pause Functionality", function () {
        it("Should allow admin to pause and unpause", async function () {
            await distributor.pause();
            expect(await distributor.paused()).to.be.true;

            await distributor.unpause();
            expect(await distributor.paused()).to.be.false;
        });

        it("Should not allow non-admin to pause", async function () {
            await expect(
                distributor.connect(user).pause()
            ).to.be.revertedWithCustomError(distributor, "AccessControlUnauthorizedAccount");
        });
    });
}); 