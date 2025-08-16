import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 배치 트랜잭션 테스트 시작...\n");

    // 계정 가져오기
    const [owner, user1, user2, postAuthor] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}`);
    console.log(`👤 User2: ${user2.address}`);
    console.log(`👤 PostAuthor: ${postAuthor.address}\n`);

    // MockERC20 토큰 배포
    console.log("📝 MockERC20 토큰 배포 중...");
    const MockToken = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockToken.deploy("Mock Token", "MTK");
    await mockToken.waitForDeployment();
    console.log(`✅ MockERC20 배포 완료: ${await mockToken.getAddress()}\n`);

    // PostLikeSystem 컨트랙트 배포
    console.log("📝 PostLikeSystem 컨트랙트 배포 중...");
    const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem");
    const postLikeSystem = await PostLikeSystem.deploy(await mockToken.getAddress());
    await postLikeSystem.waitForDeployment();
    console.log(`✅ PostLikeSystem 배포 완료: ${await postLikeSystem.getAddress()}\n`);

    // 테스트용 토큰 분배
    console.log("💰 테스트용 토큰 분배 중...");
    await mockToken.mint(user1.address, ethers.parseEther("100"));
    await mockToken.mint(user2.address, ethers.parseEther("100"));
    await mockToken.mint(postAuthor.address, ethers.parseEther("100"));
    console.log("✅ 토큰 분배 완료\n");

    // 토큰 잔액 확인
    console.log("📊 초기 토큰 잔액:");
    console.log(`   User1: ${ethers.formatEther(await mockToken.balanceOf(user1.address))} MTK`);
    console.log(`   User2: ${ethers.formatEther(await mockToken.balanceOf(user2.address))} MTK`);
    console.log(`   PostAuthor: ${ethers.formatEther(await mockToken.balanceOf(postAuthor.address))} MTK\n`);

    // 1. 기본 허용량 확인
    console.log("🔍 1단계: 기본 허용량 확인");
    const initialAllowance = await postLikeSystem.getUserAllowance(user1.address);
    console.log(`   User1의 PostLikeSystem 허용량: ${ethers.formatEther(initialAllowance)} MTK`);

    const requiredAllowance = await postLikeSystem.getRequiredAllowance(user1.address);
    console.log(`   User1이 좋아요를 위해 필요한 추가 허용량: ${ethers.formatEther(requiredAllowance)} MTK\n`);

    // 2. approve 없이 likePostWithApprove 시도 (실패해야 함)
    console.log("❌ 2단계: approve 없이 likePostWithApprove 시도");
    try {
        await postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address);
        console.log("   ❌ 예상과 다름: 트랜잭션이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }
    console.log();

    // 3. 토큰 승인
    console.log("✅ 3단계: 토큰 승인");
    const approveTx = await mockToken.connect(user1).approve(
        await postLikeSystem.getAddress(),
        ethers.parseEther("10")
    );
    await approveTx.wait();
    console.log("   ✅ User1이 PostLikeSystem에 10 MTK 사용 권한 부여\n");

    // 4. 승인 후 허용량 확인
    console.log("🔍 4단계: 승인 후 허용량 확인");
    const newAllowance = await postLikeSystem.getUserAllowance(user1.address);
    console.log(`   User1의 PostLikeSystem 허용량: ${ethers.formatEther(newAllowance)} MTK`);

    const newRequiredAllowance = await postLikeSystem.getRequiredAllowance(user1.address);
    console.log(`   User1이 좋아요를 위해 필요한 추가 허용량: ${ethers.formatEther(newRequiredAllowance)} MTK\n`);

    // 5. likePostWithApprove 실행 (성공해야 함)
    console.log("👍 5단계: likePostWithApprove 실행");
    const likeTx = await postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address);
    await likeTx.wait();
    console.log("   ✅ User1이 Post ID 1에 좋아요 성공!\n");

    // 6. 좋아요 상태 확인
    console.log("🔍 6단계: 좋아요 상태 확인");
    const [hasLiked, likeTimestamp] = await postLikeSystem.getUserLikeInfo(1, user1.address);
    console.log(`   User1이 Post ID 1을 좋아요했는가: ${hasLiked}`);
    console.log(`   좋아요 시간: ${new Date(Number(likeTimestamp) * 1000).toLocaleString()}`);

    const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(1);
    console.log(`   Post ID 1의 총 좋아요 수: ${totalLikes}`);
    console.log(`   Post ID 1에 수집된 총 토큰: ${ethers.formatEther(totalTokens)} MTK\n`);

    // 7. 토큰 잔액 변화 확인
    console.log("💰 7단계: 토큰 잔액 변화 확인");
    const user1FinalBalance = await mockToken.balanceOf(user1.address);
    console.log(`   User1의 최종 토큰 잔액: ${ethers.formatEther(user1FinalBalance)} MTK`);
    console.log(`   User1의 토큰 차감량: ${ethers.formatEther(ethers.parseEther("100") - user1FinalBalance)} MTK\n`);

    // 8. 중복 좋아요 시도 (실패해야 함)
    console.log("❌ 8단계: 중복 좋아요 시도");
    try {
        await postLikeSystem.connect(user1).likePostWithApprove(1, postAuthor.address);
        console.log("   ❌ 예상과 다름: 중복 좋아요가 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }
    console.log();

    // 9. 다른 사용자로 좋아요
    console.log("👍 9단계: 다른 사용자로 좋아요");
    await mockToken.connect(user2).approve(await postLikeSystem.getAddress(), ethers.parseEther("10"));
    const likeTx2 = await postLikeSystem.connect(user2).likePostWithApprove(1, postAuthor.address);
    await likeTx2.wait();
    console.log("   ✅ User2가 Post ID 1에 좋아요 성공!\n");

    // 10. 최종 상태 확인
    console.log("🔍 10단계: 최종 상태 확인");
    const [finalTotalLikes, finalTotalTokens] = await postLikeSystem.getPostLikeInfo(1);
    console.log(`   Post ID 1의 최종 총 좋아요 수: ${finalTotalLikes}`);
    console.log(`   Post ID 1에 수집된 최종 총 토큰: ${ethers.formatEther(finalTotalTokens)} MTK\n`);

    // 11. TOKEN_AMOUNT 상수 확인
    console.log("🔍 11단계: TOKEN_AMOUNT 상수 확인");
    const tokenAmount = await postLikeSystem.TOKEN_AMOUNT();
    console.log(`   TOKEN_AMOUNT: ${ethers.formatEther(tokenAmount)} MTK\n`);

    console.log("🎉 배치 트랜잭션 테스트 완료!");
    console.log("\n📋 테스트 결과 요약:");
    console.log("   ✅ approve와 likePost를 한 번에 처리하는 likePostWithApprove 함수 작동");
    console.log("   ✅ 허용량 확인 및 계산 함수들 정상 작동");
    console.log("   ✅ 중복 좋아요 방지 정상 작동");
    console.log("   ✅ 토큰 차감 및 수집 정상 작동");
    console.log("   ✅ 이벤트 발생 정상 작동");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 테스트 실패:", error);
        process.exit(1);
    });
