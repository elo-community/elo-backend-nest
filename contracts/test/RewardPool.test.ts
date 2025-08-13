import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { RewardPool, SignedRewardDistributor } from "../typechain-types";

describe("RewardPool", function () {
    let rewardPool: RewardPool;
    let distributor: SignedRewardDistributor;
    let owner: any;
    let user: any;
    let token: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const MockToken = await ethers.getContractFactory("MockERC20");
        token = await MockToken.deploy("Test Token", "TEST");

        // Deploy RewardPool
        const RewardPool = await ethers.getContractFactory("RewardPool");
        rewardPool = await upgrades.deployProxy(RewardPool, [owner.address]) as RewardPool;

        // Deploy Distributor
        const SignedRewardDistributor = await ethers.getContractFactory("SignedRewardDistributor");
        distributor = await upgrades.deployProxy(SignedRewardDistributor, [
            rewardPool.target,
            owner.address,
            owner.address
        ]) as SignedRewardDistributor;

        // Set distributor in pool
        await rewardPool.setDistributor(distributor.target);
    });

    describe("Initialization", function () {
        it("Should set the correct admin", async function () {
            expect(await rewardPool.hasRole(await rewardPool.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
        });

        it("Should set the correct distributor", async function () {
            expect(await rewardPool.distributor()).to.equal(distributor.target);
        });
    });

    describe("Deposits", function () {
        it("Should allow admin to deposit tokens", async function () {
            const amount = ethers.parseEther("1000");

            // Approve tokens
            await token.approve(rewardPool.target, amount);

            // Deposit
            await rewardPool.deposit(token.target, amount);

            expect(await rewardPool.balance(token.target)).to.equal(amount);
        });

        it("Should not allow non-admin to deposit", async function () {
            const amount = ethers.parseEther("1000");

            await token.approve(rewardPool.target, amount);

            await expect(
                rewardPool.connect(user).deposit(token.target, amount)
            ).to.be.revertedWithCustomError(rewardPool, "AccessControlUnauthorizedAccount");
        });
    });

    describe("Payments", function () {
        beforeEach(async function () {
            const amount = ethers.parseEther("1000");
            await token.approve(rewardPool.target, amount);
            await rewardPool.deposit(token.target, amount);
        });

        it("Should allow distributor to pay tokens", async function () {
            const payAmount = ethers.parseEther("100");

            // distributor 컨트랙트의 payTo 함수를 통해 토큰 지급
            await distributor.payTo(token.target, user.address, payAmount);

            expect(await token.balanceOf(user.address)).to.equal(payAmount);
            expect(await rewardPool.balance(token.target)).to.equal(ethers.parseEther("900"));
        });

        it("Should not allow non-distributor to pay tokens", async function () {
            const payAmount = ethers.parseEther("100");

            await expect(
                rewardPool.connect(user).payTo(token.target, user.address, payAmount)
            ).to.be.revertedWithCustomError(rewardPool, "AccessControlUnauthorizedAccount");
        });
    });
});

