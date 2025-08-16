import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🔍 에러 메시지 디버깅 시작...\n");

    // 계정 가져오기
    const [owner, user1, user2] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}`);
    console.log(`👤 User2: ${user2.address}\n`);

    // TrivusEXP1363 토큰 배포
    console.log("📝 TrivusEXP1363 토큰 배포 중...");
    const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
    const trivusExp = await TrivusEXP1363.deploy("Trivus EXP Token", "EXP");
    await trivusExp.waitForDeployment();
    console.log(`✅ TrivusEXP1363 배포 완료: ${await trivusExp.getAddress()}\n`);

    // PostLikeReceiver 배포
    console.log("📝 PostLikeReceiver 배포 중...");
    const PostLikeReceiver = await ethers.getContractFactory("PostLikeReceiver");
    const likeReceiver = await PostLikeReceiver.deploy(await trivusExp.getAddress());
    await likeReceiver.waitForDeployment();
    console.log(`✅ PostLikeReceiver 배포 완료: ${await likeReceiver.getAddress()}\n`);

    // 테스트용 토큰 분배
    console.log("💰 테스트용 토큰 분배 중...");
    await trivusExp.mint(user1.address, ethers.parseEther("100"));
    await trivusExp.mint(user2.address, ethers.parseEther("100"));
    console.log("✅ 토큰 분배 완료\n");

    // 게시글 등록
    console.log("📝 게시글 등록 중...");
    await likeReceiver.registerPost(1, owner.address);
    console.log("✅ 게시글 등록 완료\n");

    // 1. 잘못된 토큰 양으로 테스트
    console.log("🔍 1단계: 잘못된 토큰 양으로 테스트");
    try {
        const wrongAmount = ethers.parseEther("0.5"); // 0.5 EXP
        const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
        await trivusExp.connect(user1).transferAndCall(await likeReceiver.getAddress(), wrongAmount, data);
        console.log("   ❌ 예상과 다름: 트랜잭션이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }

    // 2. 등록되지 않은 게시글으로 테스트
    console.log("\n🔍 2단계: 등록되지 않은 게시글으로 테스트");
    try {
        const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [999]);
        await trivusExp.connect(user1).transferAndCall(await likeReceiver.getAddress(), ethers.parseEther("1"), data);
        console.log("   ❌ 예상과 다름: 트랜잭션이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }

    // 3. 자기 자신 좋아요 테스트
    console.log("\n🔍 3단계: 자기 자신 좋아요 테스트");
    try {
        const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
        await trivusExp.connect(owner).transferAndCall(await likeReceiver.getAddress(), ethers.parseEther("1"), data);
        console.log("   ❌ 예상과 다름: 트랜잭션이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }

    // 4. 중복 좋아요 테스트
    console.log("\n🔍 4단계: 중복 좋아요 테스트");
    try {
        // 첫 번째 좋아요
        const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
        await trivusExp.connect(user1).transferAndCall(await likeReceiver.getAddress(), ethers.parseEther("1"), data);
        console.log("   ✅ 첫 번째 좋아요 성공");

        // 두 번째 좋아요 (실패해야 함)
        await trivusExp.connect(user1).transferAndCall(await likeReceiver.getAddress(), ethers.parseEther("1"), data);
        console.log("   ❌ 예상과 다름: 두 번째 좋아요가 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }

    // 5. Owner가 아닌 사용자가 게시글 등록 시도
    console.log("\n🔍 5단계: Owner가 아닌 사용자가 게시글 등록 시도");
    try {
        await likeReceiver.connect(user1).registerPost(2, user1.address);
        console.log("   ❌ 예상과 다름: 게시글 등록이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }

    console.log("\n🎉 에러 메시지 디버깅 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 디버깅 실패:", error);
        process.exit(1);
    });
