import { ethers } from "hardhat";

async function main() {
    console.log("🚀 수정된 컨트랙트 배포 시작...");

    // 1. TrivusEXP1363 토큰 컨트랙트 배포
    console.log("\n📝 TrivusEXP1363 토큰 컨트랙트 배포 중...");
    const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
    const trivusExp = await TrivusEXP1363.deploy();
    await trivusExp.waitForDeployment();

    const trivusExpAddress = await trivusExp.getAddress();
    console.log(`✅ TrivusEXP1363 배포 완료: ${trivusExpAddress}`);

    // 2. PostLikeSystem1363 컨트랙트 배포
    console.log("\n❤️ PostLikeSystem1363 컨트랙트 배포 중...");
    const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");

    // 배포자 주소 가져오기
    const [deployer] = await ethers.getSigners();
    const deployerAddress = deployer.address;

    const postLikeSystem = await PostLikeSystem1363.deploy(
        trivusExpAddress // 토큰 컨트랙트 주소
    );
    await postLikeSystem.waitForDeployment();

    const postLikeSystemAddress = await postLikeSystem.getAddress();
    console.log(`✅ PostLikeSystem1363 배포 완료: ${postLikeSystemAddress}`);

    // PostLikeSystem의 trustedSigner를 배포자로 설정
    console.log("\n🔐 PostLikeSystem의 trustedSigner 설정 중...");
    const setTrustedSignerTx = await postLikeSystem.setTrustedSigner(deployerAddress);
    await setTrustedSignerTx.wait();
    console.log(`✅ trustedSigner를 ${deployerAddress}로 설정 완료`);

    // 3. 배포자에게 초기 토큰 민팅
    console.log("\n💰 배포자에게 초기 토큰 민팅 중...");
    const mintAmount = ethers.parseEther("10000"); // 10,000 EXP

    const mintTx = await trivusExp.mint(deployerAddress, mintAmount);
    await mintTx.wait();
    console.log(`✅ ${ethers.formatEther(mintAmount)} EXP를 ${deployerAddress}에게 민팅 완료`);

    // 4. PostLikeSystem에 토큰 전송 (좋아요 테스트용)
    console.log("\n🎯 PostLikeSystem에 테스트용 토큰 전송 중...");
    const testAmount = ethers.parseEther("1000"); // 1,000 EXP
    const transferTx = await trivusExp.transfer(postLikeSystemAddress, testAmount);
    await transferTx.wait();
    console.log(`✅ ${ethers.formatEther(testAmount)} EXP를 PostLikeSystem에 전송 완료`);

    // 5. 컨트랙트 상태 확인
    console.log("\n🔍 컨트랙트 상태 확인 중...");

    // TrivusEXP1363 상태
    const totalSupply = await trivusExp.totalSupply();
    const deployerBalance = await trivusExp.balanceOf(deployerAddress);
    const postLikeBalance = await trivusExp.balanceOf(postLikeSystemAddress);

    console.log(`📊 TrivusEXP1363 총 공급량: ${ethers.formatEther(totalSupply)} EXP`);
    console.log(`👤 배포자 잔액: ${ethers.formatEther(deployerBalance)} EXP`);
    console.log(`❤️ PostLikeSystem 잔액: ${ethers.formatEther(postLikeBalance)} EXP`);

    // PostLikeSystem1363 상태
    const likePrice = await postLikeSystem.likePrice();
    const trustedSigner = await postLikeSystem.trustedSigner();
    const tokenAddress = await postLikeSystem.token();

    console.log(`💰 좋아요 가격: ${ethers.formatEther(likePrice)} EXP`);
    console.log(`🔐 신뢰할 수 있는 서명자: ${trustedSigner}`);
    console.log(`🪙 토큰 컨트랙트: ${tokenAddress}`);

    // 6. 배포 결과 요약
    console.log("\n🎉 배포 완료! 환경 변수 설정 정보:");
    console.log("=".repeat(60));
    console.log(`TRIVUS_EXP_1363_AMOY=${trivusExpAddress}`);
    console.log(`POST_LIKE_SYSTEM_AMOY=${postLikeSystemAddress}`);
    console.log(`SIGNER_ADDRESS=${deployerAddress}`);
    console.log("=".repeat(60));

    console.log("\n📝 .env 파일에 위 주소들을 추가하세요!");
    console.log("🔧 백엔드 서버를 재시작하면 새로운 컨트랙트를 사용할 수 있습니다.");

    return {
        trivusExp: trivusExpAddress,
        postLikeSystem: postLikeSystemAddress,
        deployer: deployerAddress
    };
}

main()
    .then((result) => {
        console.log("\n✅ 배포 성공!");
        console.log("배포된 컨트랙트 주소:", result);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ 배포 실패:", error);
        process.exit(1);
    });
