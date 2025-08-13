import { expect } from "chai";
import { upgrades } from "hardhat";
import { RewardPool } from "../typechain-types";

describe("RewardPool", function () {
    let rewardPool: RewardPool;
    let owner: any;
    let user: any;

    beforeEach(async function () {
        // Hardhat ethers v6 호환성을 위해 hre.ethers 사용
        const { ethers: hreEthers } = require("hardhat");
        [owner, user] = await hreEthers.getSigners();

        const RewardPool = await hreEthers.getContractFactory("RewardPool");
        rewardPool = await upgrades.deployProxy(RewardPool, [owner.address]) as RewardPool;
        await rewardPool.waitForDeployment();
    });

    it("Should set the right admin", async function () {
        const adminRole = await rewardPool.DEFAULT_ADMIN_ROLE();
        expect(await rewardPool.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("Should allow admin to set distributor", async function () {
        await rewardPool.setDistributor(user.address);
        expect(await rewardPool.distributor()).to.equal(user.address);
    });

    it("Should not allow non-admin to set distributor", async function () {
        await expect(
            rewardPool.connect(user).setDistributor(user.address)
        ).to.be.revertedWithCustomError(rewardPool, "AccessControlUnauthorizedAccount");
    });
});

