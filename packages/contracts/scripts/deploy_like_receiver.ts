import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🚀 PostLikeReceiver 배포 시작...\n");

    // 계정 가져오기
    const [deployer, demoAuthor] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`👤 Demo Author: ${demoAuthor.address}\n`);

    // 토큰 주소 입력 (환경변수 또는 수동 입력)
    const tokenAddress = process.env.TRIVUS_EXP_1363_ADDRESS;
    if (!tokenAddress) {
        console.error("❌ TRIVUS_EXP_1363_ADDRESS 환경변수가 설정되지 않았습니다.");
        console.log("   .env 파일에 토큰 주소를 설정하거나 스크립트를 수정하세요.\n");
        return;
    }

    console.log(`🔗 토큰 주소: ${tokenAddress}\n`);

    // PostLikeReceiver 배포
    console.log("📝 PostLikeReceiver 배포 중...");
    const PostLikeReceiver = await ethers.getContractFactory("PostLikeReceiver");
    const likeReceiver = await PostLikeReceiver.deploy(tokenAddress);
    await likeReceiver.waitForDeployment();

    const receiverAddress = await likeReceiver.getAddress();
    console.log(`✅ PostLikeReceiver 배포 완료: ${receiverAddress}\n`);

    // 데모 게시글 등록
    console.log("📝 데모 게시글 등록 중...");
    const postId = 1;
    await likeReceiver.registerPost(postId, demoAuthor.address);
    console.log(`✅ Post ID ${postId} 등록 완료 (작성자: ${demoAuthor.address})\n`);

    // 게시글 정보 확인
    console.log("📊 게시글 정보:");
    const [author, likes, tokens] = await likeReceiver.getPostInfo(postId);
    console.log(`   Post ID: ${postId}`);
    console.log(`   작성자: ${author}`);
    console.log(`   좋아요 수: ${likes}`);
    console.log(`   수집된 토큰: ${ethers.formatEther(tokens)} EXP\n`);

    // 배포 정보 출력
    console.log("📋 배포 정보:");
    console.log(`   토큰 주소: ${tokenAddress}`);
    console.log(`   LikeReceiver 주소: ${receiverAddress}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Demo Author: ${demoAuthor.address}`);
    console.log(`   네트워크: ${(await ethers.provider.getNetwork()).name}\n`);

    // 사용법 안내
    console.log("📖 사용법:");
    console.log("   1. 사용자가 토큰을 가지고 있어야 합니다");
    console.log("   2. token.transferAndCall(receiverAddress, 1e18, abi.encode(postId)) 호출");
    console.log("   3. 자동으로 좋아요가 처리됩니다");
    console.log("   4. 작성자는 withdraw(postId)로 토큰을 인출할 수 있습니다\n");

    console.log("🎉 PostLikeReceiver 배포 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 배포 실패:", error);
        process.exit(1);
    });
