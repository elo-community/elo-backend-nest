import { ethers } from "hardhat";

async function main() {
    console.log("🚀 PostLikeSystem1363 컨트랙트만 배포 시작...");

    // 배포자 주소 확인
    const [deployer] = await ethers.getSigners();
    console.log("👤 배포자 주소:", deployer.address);

    // 환경변수에서 TrivusEXP1363 주소 가져오기
    const trivusExpAddress = process.env.TRIVUS_EXP_1363_VERY;
    if (!trivusExpAddress) {
        throw new Error("TRIVUS_EXP_1363_VERY 환경변수가 설정되지 않았습니다.");
    }
    console.log("💰 TrivusEXP1363 주소:", trivusExpAddress);

    // PostLikeSystem1363 컨트랙트 배포
    console.log("\n❤️ PostLikeSystem1363 컨트랙트 배포 중...");
    const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");

    // 가스 한도와 가스 가격 설정
    const deployOptions = {
        gasLimit: 3000000, // 3M 가스 한도 (증가)
        gasPrice: 1000000000, // 1 gwei (매우 낮은 가스 가격)
    };

    const postLikeSystem = await PostLikeSystem1363.deploy(
        trivusExpAddress, // 토큰 컨트랙트 주소
        deployOptions // 가스 설정
    );
    await postLikeSystem.waitForDeployment();

    const postLikeSystemAddress = await postLikeSystem.getAddress();
    console.log("✅ PostLikeSystem1363 배포 완료:", postLikeSystemAddress);

    // 환경변수 파일용 출력
    console.log("\n📝 .env.very.deploy에 추가할 내용:");
    console.log(`TRIVUS_EXP_1363_VERY=${trivusExpAddress}`);
    console.log(`POST_LIKE_SYSTEM_1363_VERY=${postLikeSystemAddress}`);

    console.log("\n🎉 Very 네트워크 컨트랙트 배포 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 배포 실패:", error);
        process.exit(1);
    });
