import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🔍 ERC-1363 기본 동작 테스트 시작...\n");

    // 계정 가져오기
    const [owner, user1] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}\n`);

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
    console.log("✅ 토큰 분배 완료\n`");

    // 게시글 등록
    console.log("📝 게시글 등록 중...");
    await likeReceiver.registerPost(1, owner.address);
    console.log("✅ 게시글 등록 완료\n");

    // 1. 기본 transfer 테스트
    console.log("🔍 1단계: 기본 transfer 테스트");
    try {
        await trivusExp.connect(user1).transfer(await likeReceiver.getAddress(), ethers.parseEther("1"));
        console.log("   ✅ 기본 transfer 성공");
    } catch (error) {
        console.log(`   ❌ 기본 transfer 실패: ${error.message}`);
    }

    // 2. transferAndCall 테스트
    console.log("\n🔍 2단계: transferAndCall 테스트");
    try {
        const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1]);
        await trivusExp.connect(user1).transferAndCall(await likeReceiver.getAddress(), ethers.parseEther("1"), data);
        console.log("   ✅ transferAndCall 성공");
    } catch (error) {
        console.log(`   ❌ transferAndCall 실패: ${error.message}`);

        // 에러 상세 분석
        if (error.message.includes('1363: non receiver')) {
            console.log("\n   🔍 '1363: non receiver' 에러 분석:");
            console.log("   - PostLikeReceiver가 IERC1363Receiver 인터페이스를 제대로 구현하지 못함");
            console.log("   - onTransferReceived 함수의 반환값이 올바르지 않음");
        }
    }

    // 3. PostLikeReceiver 상태 확인
    console.log("\n🔍 3단계: PostLikeReceiver 상태 확인");
    try {
        const [author, likes, tokens] = await likeReceiver.getPostInfo(1);
        console.log(`   게시글 작성자: ${author}`);
        console.log(`   총 좋아요 수: ${likes}`);
        console.log(`   수집된 토큰: ${ethers.formatEther(tokens)} EXP`);
    } catch (error) {
        console.log(`   ❌ 상태 확인 실패: ${error.message}`);
    }

    console.log("\n🎉 ERC-1363 기본 동작 테스트 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 테스트 실패:", error);
        process.exit(1);
    });
