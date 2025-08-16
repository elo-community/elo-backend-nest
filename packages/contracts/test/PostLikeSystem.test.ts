import { expect } from "chai";
import { ethers } from "hardhat";

describe("PostLikeSystem", function () {
    let postLikeSystem: any;
    let mockToken: any;
    let owner: any;
    let user1: any;
    let user2: any;
    let postAuthor: any;

    beforeEach(async function () {
        // 계정 가져오기
        [owner, user1, user2, postAuthor] = await ethers.getSigners();

        // Mock ERC20 토큰 배포
        const MockToken = await ethers.getContractFactory("MockERC20");
        mockToken = await MockToken.deploy("Mock Token", "MTK");

        // PostLikeSystem 컨트랙트 배포
        const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem");
        postLikeSystem = await PostLikeSystem.deploy(await mockToken.getAddress());

        // 테스트용 토큰 분배
        await mockToken.mint(user1.address, ethers.parseEther("100"));
        await mockToken.mint(user2.address, ethers.parseEther("100"));
        await mockToken.mint(postAuthor.address, ethers.parseEther("100"));
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await postLikeSystem.owner()).to.equal(owner.address);
        });

        it("Should set the correct token address", async function () {
            expect(await postLikeSystem.trivusToken()).to.equal(await mockToken.getAddress());
        });
    });

    describe("Post Like", function () {
        const postId = 1;

        beforeEach(async function () {
            // 사용자가 토큰 사용 권한 부여
            await mockToken.connect(user1).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
        });

        it("Should allow user to like a post", async function () {
            const initialBalance = await mockToken.balanceOf(user1.address);

            await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);

            // 좋아요 정보 확인
            const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(postId);
            expect(totalLikes).to.equal(1);
            expect(totalTokens).to.equal(ethers.parseEther("1"));

            // 사용자 좋아요 여부 확인
            const [hasLiked, timestamp] = await postLikeSystem.getUserLikeInfo(postId, user1.address);
            expect(hasLiked).to.be.true;
            expect(timestamp).to.be.gt(0);

            // 토큰 차감 확인
            const finalBalance = await mockToken.balanceOf(user1.address);
            expect(finalBalance).to.equal(initialBalance - ethers.parseEther("1"));
        });

        it("Should prevent liking own post", async function () {
            await expect(
                postLikeSystem.connect(postAuthor).likePost(postId, postAuthor.address)
            ).to.be.revertedWith("Cannot like your own post");
        });

        it("Should prevent duplicate likes", async function () {
            await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);

            await expect(
                postLikeSystem.connect(user1).likePost(postId, postAuthor.address)
            ).to.be.revertedWith("Already liked this post");
        });

        it("Should prevent liking with insufficient tokens", async function () {
            const poorUser = user2;
            await mockToken.connect(poorUser).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));

            // 토큰을 모두 전송하여 잔액을 0으로 만듦
            await mockToken.connect(poorUser).transfer(owner.address, await mockToken.balanceOf(poorUser.address));

            await expect(
                postLikeSystem.connect(poorUser).likePost(postId, postAuthor.address)
            ).to.be.revertedWith("Insufficient tokens");
        });
    });

    describe("Post Unlike", function () {
        const postId = 1;

        beforeEach(async function () {
            await mockToken.connect(user1).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
            await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);
        });

        it("Should allow user to unlike a post", async function () {
            const initialBalance = await mockToken.balanceOf(user1.address);

            await postLikeSystem.connect(user1).unlikePost(postId);

            // 좋아요 정보 확인
            const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(postId);
            expect(totalLikes).to.equal(0);
            expect(totalTokens).to.equal(0);

            // 사용자 좋아요 여부 확인
            const [hasLiked, timestamp] = await postLikeSystem.getUserLikeInfo(postId, user1.address);
            expect(hasLiked).to.be.false;

            // 토큰 반환 확인 - 좋아요 시 1 ether 차감, 취소 시 1 ether 반환
            const finalBalance = await mockToken.balanceOf(user1.address);
            // 초기 잔액과 동일해야 함 (100 ether)
            expect(finalBalance).to.equal(ethers.parseEther("100"));
        });

        it("Should prevent unliking without liking", async function () {
            await expect(
                postLikeSystem.connect(user2).unlikePost(postId)
            ).to.be.revertedWith("Not liked this post");
        });
    });

    describe("Token Withdrawal", function () {
        const postId = 1;

        beforeEach(async function () {
            // 여러 사용자가 좋아요
            await mockToken.connect(user1).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
            await mockToken.connect(user2).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));

            await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);
            await postLikeSystem.connect(user2).likePost(postId, postAuthor.address);
        });

        it("Should allow post author to withdraw collected tokens", async function () {
            const initialBalance = await mockToken.balanceOf(postAuthor.address);

            await postLikeSystem.connect(postAuthor).withdrawTokens(postId);

            // 토큰 수집량 초기화 확인
            const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(postId);
            expect(totalTokens).to.equal(0);

            // 작성자에게 토큰 전송 확인
            const finalBalance = await mockToken.balanceOf(postAuthor.address);
            expect(finalBalance).to.equal(initialBalance + ethers.parseEther("2"));
        });

        it("Should prevent withdrawal when no tokens collected", async function () {
            await postLikeSystem.connect(postAuthor).withdrawTokens(postId);

            await expect(
                postLikeSystem.connect(postAuthor).withdrawTokens(postId)
            ).to.be.revertedWith("No tokens to withdraw");
        });
    });

    describe("View Functions", function () {
        const postId = 1;

        beforeEach(async function () {
            await mockToken.connect(user1).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
            await postLikeSystem.connect(user1).likePost(postId, postAuthor.address);
        });

        it("Should return correct post like count", async function () {
            const likeCount = await postLikeSystem.getPostLikeCount(postId);
            expect(likeCount).to.equal(1);
        });

        it("Should return correct collected tokens", async function () {
            const collectedTokens = await postLikeSystem.getPostCollectedTokens(postId);
            expect(collectedTokens).to.equal(ethers.parseEther("1"));
        });

        it("Should return correct user liked posts", async function () {
            const likedPosts = await postLikeSystem.getUserLikedPosts(user1.address);
            expect(likedPosts).to.include(BigInt(postId));
            expect(likedPosts.length).to.equal(1);
        });

        it("Should return correct user liked posts count", async function () {
            const count = await postLikeSystem.getUserLikedPostsCount(user1.address);
            expect(count).to.equal(1);
        });
    });

    describe("Events", function () {
        const postId = 1;

        beforeEach(async function () {
            await mockToken.connect(user1).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
        });

        it("Should emit PostLiked event", async function () {
            await expect(postLikeSystem.connect(user1).likePost(postId, postAuthor.address))
                .to.emit(postLikeSystem, "PostLiked")
                .withArgs(user1.address, postId, anyValue, 1, ethers.parseEther("1"));
        });

        it("Should emit PostLikeEvent", async function () {
            await expect(postLikeSystem.connect(user1).likePost(postId, postAuthor.address))
                .to.emit(postLikeSystem, "PostLikeEvent")
                .withArgs(user1.address, postId, ethers.parseEther("1"), true);
        });
    });

    describe("Batch Transaction Functions", () => {
        it("Should return correct user allowance", async () => {
            const allowance = await postLikeSystem.getUserAllowance(user1.address);
            expect(allowance).to.equal(0);
        });

        it("Should return correct required allowance when allowance is insufficient", async () => {
            const requiredAllowance = await postLikeSystem.getRequiredAllowance(user1.address);
            expect(requiredAllowance).to.equal(ethers.parseEther("1"));
        });

        it("Should return 0 required allowance when allowance is sufficient", async () => {
            // 먼저 approve
            await mockToken.connect(user1).approve(postLikeSystem.target, ethers.parseEther("1"));

            const requiredAllowance = await postLikeSystem.getRequiredAllowance(user1.address);
            expect(requiredAllowance).to.equal(0);
        });

        it("Should allow likePostWithApprove when allowance is sufficient", async () => {
            // 먼저 approve
            await mockToken.connect(user1).approve(postLikeSystem.target, ethers.parseEther("1"));

            // likePostWithApprove 실행
            await postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address);

            // 좋아요 상태 확인
            const [hasLiked] = await postLikeSystem.getUserLikeInfo(1, user1.address);
            expect(hasLiked).to.be.true;

            // 게시글 정보 확인
            const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(1);
            expect(totalLikes).to.equal(1);
            expect(totalTokens).to.equal(ethers.parseEther("1"));
        });

        it("Should revert likePostWithApprove when allowance is insufficient", async () => {
            // approve 없이 likePostWithApprove 실행 시도
            await expect(
                postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address)
            ).to.be.revertedWith("Insufficient allowance. Please approve tokens first.");
        });

        it("Should revert likePostWithApprove when already liked", async () => {
            // 먼저 approve
            await mockToken.connect(user1).approve(postLikeSystem.target, ethers.parseEther("2"));

            // 첫 번째 좋아요
            await postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address);

            // 두 번째 좋아요 시도 (중복)
            await expect(
                postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address)
            ).to.be.revertedWith("Already liked this post");
        });

        it("Should revert likePostWithApprove when liking own post", async () => {
            await mockToken.connect(user1).approve(postLikeSystem.target, ethers.parseEther("1"));

            await expect(
                postLikeSystem.connect(user1).likePostWithApprove(1, user1.address)
            ).to.be.revertedWith("Cannot like your own post");
        });

        it("Should revert likePostWithApprove with insufficient tokens", async () => {
            // 토큰이 없는 사용자 (user2를 사용하여 토큰을 모두 전송)
            const poorUser = user2;
            await mockToken.connect(poorUser).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));

            // 토큰을 모두 전송하여 잔액을 0으로 만듦
            await mockToken.connect(poorUser).transfer(owner.address, await mockToken.balanceOf(poorUser.address));

            await expect(
                postLikeSystem.connect(poorUser).likePostWithApprove(1, postAuthor.address)
            ).to.be.revertedWith("Insufficient tokens");
        });
    });
});

// anyValue matcher for timestamp
function anyValue() {
    return true;
}
