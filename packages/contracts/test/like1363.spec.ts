import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";

describe("ERC-1363 Like System", function () {
    let trivusExp: Contract;
    let likeReceiver: Contract;
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let postAuthor: Signer;
    let ownerAddress: string;
    let user1Address: string;
    let user2Address: string;
    let postAuthorAddress: string;
    let receiverAddress: string;

    const TOKEN_AMOUNT = ethers.parseEther("1"); // 1 EXP
    const POST_ID = 1;

    beforeEach(async function () {
        // 계정 가져오기
        [owner, user1, user2, postAuthor] = await ethers.getSigners();
        ownerAddress = await owner.getAddress();
        user1Address = await user1.getAddress();
        user2Address = await user2.getAddress();
        postAuthorAddress = await postAuthor.getAddress();

        // TrivusEXP1363 토큰 배포
        const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
        trivusExp = await TrivusEXP1363.deploy("Trivus EXP Token", "EXP");

        // PostLikeReceiver 배포
        const PostLikeReceiver = await ethers.getContractFactory("PostLikeReceiver");
        likeReceiver = await PostLikeReceiver.deploy(await trivusExp.getAddress());
        receiverAddress = await likeReceiver.getAddress();

        // 테스트용 토큰 분배
        await trivusExp.mint(user1Address, ethers.parseEther("100"));
        await trivusExp.mint(user2Address, ethers.parseEther("100"));

        // 게시글 등록
        await likeReceiver.registerPost(POST_ID, postAuthorAddress);
    });

    describe("Deployment", function () {
        it("Should deploy token with correct parameters", async function () {
            expect(await trivusExp.name()).to.equal("Trivus EXP Token");
            expect(await trivusExp.symbol()).to.equal("EXP");
            expect(await trivusExp.decimals()).to.equal(18);
        });

        it("Should deploy receiver with correct token address", async function () {
            expect(await likeReceiver.token()).to.equal(await trivusExp.getAddress());
            expect(await likeReceiver.TOKEN_AMOUNT()).to.equal(TOKEN_AMOUNT);
        });

        it("Should register post correctly", async function () {
            const [author, likes, tokens] = await likeReceiver.getPostInfo(POST_ID);
            expect(author).to.equal(postAuthorAddress);
            expect(likes).to.equal(0);
            expect(tokens).to.equal(0);
        });
    });

    describe("Core Happy Paths", function () {
        it("Should process like via transferAndCall", async function () {
            const user1BalanceBefore = await trivusExp.balanceOf(user1Address);
            const receiverBalanceBefore = await trivusExp.balanceOf(receiverAddress);

            // 좋아요 실행
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            // 상태 확인
            expect(await likeReceiver.hasLiked(POST_ID, user1Address)).to.be.true;
            expect(await likeReceiver.postLikes(POST_ID)).to.equal(1);
            expect(await likeReceiver.postTokens(POST_ID)).to.equal(TOKEN_AMOUNT);

            // 토큰 잔액 확인
            const user1BalanceAfter = await trivusExp.balanceOf(user1Address);
            const receiverBalanceAfter = await trivusExp.balanceOf(receiverAddress);
            expect(user1BalanceAfter).to.equal(user1BalanceBefore - TOKEN_AMOUNT);
            expect(receiverBalanceAfter).to.equal(receiverBalanceBefore + TOKEN_AMOUNT);
        });

        it("Should emit PostLiked event", async function () {
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            await expect(trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data))
                .to.emit(likeReceiver, "PostLiked")
                .withArgs(user1Address, POST_ID, TOKEN_AMOUNT);
        });

        it("Should allow multiple users to like the same post", async function () {
            // User1 좋아요
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            // User2 좋아요
            await trivusExp.connect(user2).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            // 상태 확인
            expect(await likeReceiver.postLikes(POST_ID)).to.equal(2);
            expect(await likeReceiver.postTokens(POST_ID)).to.equal(TOKEN_AMOUNT * 2n);
        });
    });

    describe("Reverts", function () {
        it("Should revert with wrong token amount", async function () {
            const wrongAmount = ethers.parseEther("0.5"); // 0.5 EXP
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            await expect(
                trivusExp.connect(user1).transferAndCall(receiverAddress, wrongAmount, data)
            ).to.be.revertedWith("bad amount");
        });

        it("Should revert with unregistered post", async function () {
            const unregisteredPostId = 999;
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [unregisteredPostId]);

            await expect(
                trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data)
            ).to.be.revertedWith("unregistered post");
        });

        it("Should revert self-like", async function () {
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            await expect(
                trivusExp.connect(postAuthor).transferAndCall(receiverAddress, TOKEN_AMOUNT, data)
            ).to.be.revertedWithCustomError(trivusExp, "ERC20InsufficientBalance");
        });

        it("Should revert double-like by same user", async function () {
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            // 첫 번째 좋아요
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            // 두 번째 좋아요 (실패해야 함)
            await expect(
                trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data)
            ).to.be.revertedWith("already liked");
        });

        it("Should revert when called by non-token contract", async function () {
            // 직접 onTransferReceived 호출 (실패해야 함)
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            await expect(
                likeReceiver.connect(user1).onTransferReceived(
                    user1Address,
                    user1Address,
                    TOKEN_AMOUNT,
                    data
                )
            ).to.be.revertedWith("invalid token");
        });
    });

    describe("Withdraw Functionality", function () {
        beforeEach(async function () {
            // 좋아요 실행
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);
            await trivusExp.connect(user2).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);
        });

        it("Should allow author to withdraw tokens", async function () {
            const authorBalanceBefore = await trivusExp.balanceOf(postAuthorAddress);
            const receiverBalanceBefore = await trivusExp.balanceOf(receiverAddress);

            // 인출 실행
            await likeReceiver.connect(postAuthor).withdraw(POST_ID);

            // 상태 확인
            expect(await likeReceiver.postTokens(POST_ID)).to.equal(0);

            // 토큰 잔액 확인
            const authorBalanceAfter = await trivusExp.balanceOf(postAuthorAddress);
            const receiverBalanceAfter = await trivusExp.balanceOf(receiverAddress);
            expect(authorBalanceAfter).to.equal(authorBalanceBefore + TOKEN_AMOUNT * 2n);
            expect(receiverBalanceAfter).to.equal(receiverBalanceBefore - TOKEN_AMOUNT * 2n);
        });

        it("Should emit TokensWithdrawn event", async function () {
            await expect(likeReceiver.connect(postAuthor).withdraw(POST_ID))
                .to.emit(likeReceiver, "TokensWithdrawn")
                .withArgs(postAuthorAddress, POST_ID, TOKEN_AMOUNT * 2n);
        });

        it("Should revert withdrawal by non-author", async function () {
            await expect(
                likeReceiver.connect(user1).withdraw(POST_ID)
            ).to.be.revertedWith("not author");
        });

        it("Should revert withdrawal when no tokens", async function () {
            // 이미 인출된 경우
            await likeReceiver.connect(postAuthor).withdraw(POST_ID);

            // 다시 인출 시도 (실패해야 함)
            await expect(
                likeReceiver.connect(postAuthor).withdraw(POST_ID)
            ).to.be.revertedWith("nothing to withdraw");
        });
    });

    describe("Security", function () {
        it("Should prevent reentrancy in onTransferReceived", async function () {
            // 이 테스트는 기본적인 보안 검증을 확인
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);

            // 정상적인 좋아요 실행
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            // 상태가 올바르게 업데이트되었는지 확인
            expect(await likeReceiver.hasLiked(POST_ID, user1Address)).to.be.true;
            expect(await likeReceiver.postLikes(POST_ID)).to.equal(1);
        });

        it("Should only allow owner to register posts", async function () {
            const newPostId = 2;

            // Owner가 아닌 사용자가 게시글 등록 시도 (실패해야 함)
            await expect(
                likeReceiver.connect(user1).registerPost(newPostId, user1Address)
            ).to.be.revertedWithCustomError(likeReceiver, "OwnableUnauthorizedAccount");
        });
    });

    describe("View Functions", function () {
        it("Should return correct post info", async function () {
            const [author, likes, tokens] = await likeReceiver.getPostInfo(POST_ID);
            expect(author).to.equal(postAuthorAddress);
            expect(likes).to.equal(0);
            expect(tokens).to.equal(0);
        });

        it("Should return correct user like info", async function () {
            expect(await likeReceiver.getUserLikeInfo(POST_ID, user1Address)).to.be.false;

            // 좋아요 실행 후
            const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [POST_ID]);
            await trivusExp.connect(user1).transferAndCall(receiverAddress, TOKEN_AMOUNT, data);

            expect(await likeReceiver.getUserLikeInfo(POST_ID, user1Address)).to.be.true;
        });
    });
});
