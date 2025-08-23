import { expect } from "chai";
import { ethers } from "hardhat";
import { PostLikeSystem1363, TrivusEXP1363 } from "../typechain-types";

describe("TrivusEXP1363 - Post-specific Nonce", function () {
    let trivusEXP: TrivusEXP1363;
    let postLikeSystem: PostLikeSystem1363;
    let owner: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // TrivusEXP1363 배포
        const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
        trivusEXP = await TrivusEXP1363.deploy();

        // PostLikeSystem1363 배포
        const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");
        postLikeSystem = await PostLikeSystem1363.deploy(await trivusEXP.getAddress());

        // PostLikeSystem에 토큰 전송
        await trivusEXP.transfer(await postLikeSystem.getAddress(), ethers.parseEther("1000"));

        // 사용자들에게 토큰 전송
        await trivusEXP.transfer(user1.address, ethers.parseEther("100"));
        await trivusEXP.transfer(user2.address, ethers.parseEther("100"));
    });

    describe("Post-specific nonce management", function () {
        it("Should allow user to like multiple posts with different nonces", async function () {
            const postId1 = 1;
            const postId2 = 2;
            const postId3 = 3;
            const likePrice = ethers.parseEther("1");

            // PostLikeSystem에 대한 allowance 설정
            await trivusEXP.connect(user1).approve(await postLikeSystem.getAddress(), likePrice * 10n);

            // 게시글 1에 좋아요 (nonce 0)
            const data1 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId1])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data1
            );

            // 게시글 2에 좋아요 (nonce 0)
            const data2 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId2])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data2
            );

            // 게시글 3에 좋아요 (nonce 0)
            const data3 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId3])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data3
            );

            // 게시글별 nonce 확인
            expect(await trivusEXP.userPostNonces(user1.address, postId1)).to.equal(1);
            expect(await trivusEXP.userPostNonces(user1.address, postId2)).to.equal(1);
            expect(await trivusEXP.userPostNonces(user1.address, postId3)).to.equal(1);
        });

        it("Should reject duplicate nonce for same post", async function () {
            const postId = 1;
            const likePrice = ethers.parseEther("1");

            await trivusEXP.connect(user1).approve(await postLikeSystem.getAddress(), likePrice * 10n);

            // 첫 번째 좋아요 (nonce 0)
            const data1 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data1
            );

            // 같은 nonce로 다시 시도 (실패해야 함)
            const data2 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await expect(
                trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                    await postLikeSystem.getAddress(),
                    likePrice,
                    data2
                )
            ).to.be.revertedWith("BAD_NONCE");
        });

        it("Should allow different users to use same nonce for same post", async function () {
            const postId = 1;
            const likePrice = ethers.parseEther("1");

            await trivusEXP.connect(user1).approve(await postLikeSystem.getAddress(), likePrice * 10n);
            await trivusEXP.connect(user2).approve(await postLikeSystem.getAddress(), likePrice * 10n);

            // user1이 게시글 1에 좋아요 (nonce 0)
            const data1 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data1
            );

            // user2가 같은 게시글에 좋아요 (nonce 0) - 성공해야 함
            const data2 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await trivusEXP.connect(user2)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data2
            );

            // 각 사용자의 게시글별 nonce 확인
            expect(await trivusEXP.userPostNonces(user1.address, postId)).to.equal(1);
            expect(await trivusEXP.userPostNonces(user2.address, postId)).to.equal(1);
        });

        it("Should prevent user from liking the same post twice", async function () {
            const postId = 1;
            const likePrice = ethers.parseEther("1");

            await trivusEXP.connect(user1).approve(await postLikeSystem.getAddress(), likePrice * 10n);

            // 첫 번째 좋아요 (nonce 0)
            const data1 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [0, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                await postLikeSystem.getAddress(),
                likePrice,
                data1
            );

            // 같은 게시글에 다시 좋아요 시도 (nonce 1) - 실패해야 함
            const data2 = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "bytes"],
                [1, ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [postId])]
            );

            await expect(
                trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
                    await postLikeSystem.getAddress(),
                    likePrice,
                    data2
                )
            ).to.be.revertedWith("ALREADY_LIKED");

            // nonce는 증가하지 않아야 함
            expect(await trivusEXP.userPostNonces(user1.address, postId)).to.equal(1);
        });
    });
});
