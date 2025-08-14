import { expect } from "chai";
import { ethers } from "hardhat";

describe("TrivusEXP", function () {
    let trivusEXP: any;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        // 계정 가져오기
        [owner, user1, user2] = await ethers.getSigners();

        // Trivus EXP Token 배포
        const TrivusEXP = await ethers.getContractFactory("TrivusEXP");
        trivusEXP = await TrivusEXP.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await trivusEXP.owner()).to.equal(owner.address);
        });

        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await trivusEXP.balanceOf(owner.address);
            expect(await trivusEXP.totalSupply()).to.equal(ownerBalance);
        });

        it("Should have correct token information", async function () {
            expect(await trivusEXP.name()).to.equal("Trivus EXP Token");
            expect(await trivusEXP.symbol()).to.equal("EXP");
            expect(await trivusEXP.decimals()).to.equal(18);
        });

        it("Should have correct initial supply", async function () {
            const totalSupply = await trivusEXP.totalSupply();
            expect(totalSupply).to.equal(5000n * 10n ** 18n); // 5000 EXP with 18 decimals
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const mintAmount = ethers.parseEther("100");
            await trivusEXP.mint(user1.address, mintAmount);

            expect(await trivusEXP.balanceOf(user1.address)).to.equal(mintAmount);
        });

        it("Should fail if non-owner tries to mint", async function () {
            const mintAmount = ethers.parseEther("100");

            await expect(
                trivusEXP.connect(user1).mint(user2.address, mintAmount)
            ).to.be.revertedWithCustomError(trivusEXP, "OwnableUnauthorizedAccount");
        });
    });

    describe("Burning", function () {
        it("Should allow owner to burn their own tokens", async function () {
            const burnAmount = ethers.parseEther("100");
            await trivusEXP.burn(burnAmount);

            const expectedBalance = ethers.parseEther("4900"); // 5000 - 100
            expect(await trivusEXP.balanceOf(owner.address)).to.equal(expectedBalance);
        });

        it("Should allow owner to burn tokens from other address", async function () {
            // 먼저 user1에게 토큰 전송
            const transferAmount = ethers.parseEther("100");
            await trivusEXP.transfer(user1.address, transferAmount);

            // user1의 토큰 소각
            const burnAmount = ethers.parseEther("50");
            await trivusEXP.burnFrom(user1.address, burnAmount);

            expect(await trivusEXP.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
        });

        it("Should fail if non-owner tries to burn", async function () {
            const burnAmount = ethers.parseEther("100");

            await expect(
                trivusEXP.connect(user1).burn(burnAmount)
            ).to.be.revertedWithCustomError(trivusEXP, "OwnableUnauthorizedAccount");
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseEther("100");
            await trivusEXP.transfer(user1.address, transferAmount);

            expect(await trivusEXP.balanceOf(user1.address)).to.equal(transferAmount);
            expect(await trivusEXP.balanceOf(owner.address)).to.equal(ethers.parseEther("4900"));
        });

        it("Should fail if sender doesn't have enough tokens", async function () {
            const initialOwnerBalance = await trivusEXP.balanceOf(owner.address);

            await expect(
                trivusEXP.connect(user1).transfer(owner.address, 1)
            ).to.be.revertedWithCustomError(trivusEXP, "ERC20InsufficientBalance");

            expect(await trivusEXP.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });
    });
}); 