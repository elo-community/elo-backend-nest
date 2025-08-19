import { ethers } from "hardhat";

async function main() {
  console.log("🚀 TrivusEXP1363 컨트랙트 배포 시작...");

  // 환경변수에서 설정 읽기
  const tokenName = process.env.TOKEN_NAME || "TrivusEXP";
  const tokenSymbol = process.env.TOKEN_SYMBOL || "EXP";
  const signerAddress = process.env.SIGNER_ADDRESS;

  if (!signerAddress) {
    throw new Error("❌ SIGNER_ADDRESS 환경변수가 설정되지 않았습니다.");
  }

  console.log(`📝 토큰 정보:`);
  console.log(`   - 이름: ${tokenName}`);
  console.log(`   - 심볼: ${tokenSymbol}`);
  console.log(`   - 서명자: ${signerAddress}`);

  // 컨트랙트 팩토리 가져오기
  const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
  console.log("✅ 컨트랙트 팩토리 로드 완료");

  // 컨트랙트 배포
  console.log("📦 컨트랙트 배포 중...");
  const trivusExp = await TrivusEXP1363.deploy(tokenName, tokenSymbol, signerAddress);
  await trivusExp.waitForDeployment();

  const contractAddress = await trivusExp.getAddress();
  console.log("✅ 컨트랙트 배포 완료!");
  console.log(`📍 컨트랙트 주소: ${contractAddress}`);

  // 배포된 컨트랙트 정보 확인
  console.log("\n🔍 배포된 컨트랙트 정보:");
  console.log(`   - 토큰 이름: ${await trivusExp.name()}`);
  console.log(`   - 토큰 심볼: ${await trivusExp.symbol()}`);
  console.log(`   - 소수점: ${await trivusExp.decimals()}`);
  console.log(`   - 총 공급량: ${ethers.formatEther(await trivusExp.totalSupply())} ${tokenSymbol}`);

  // 역할 확인
  const signerRole = await trivusExp.SIGNER_ROLE();
  const hasSignerRole = await trivusExp.hasRole(signerRole, signerAddress);
  console.log(`   - 서명자 역할 부여됨: ${hasSignerRole}`);

  // 초기 토큰 발행 (테스트용)
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  if (deployerAddress !== signerAddress) {
    console.log("\n💰 초기 토큰 발행 중...");
    const mintAmount = ethers.parseEther("1000000"); // 1,000,000 EXP
    await trivusExp.mint(deployerAddress, mintAmount);
    console.log(`   - ${deployerAddress}에 ${ethers.formatEther(mintAmount)} ${tokenSymbol} 발행 완료`);
  }

  console.log("\n🎉 배포 완료!");
  console.log("\n📋 다음 단계:");
  console.log("1. .env 파일에 다음 정보 추가:");
  console.log(`   TRIVUS_EXP_1363_AMOY=${contractAddress}`);
  console.log(`   SIGNER_ADDRESS=${signerAddress}`);
  console.log("2. 백엔드 서버 재시작");
  console.log("3. API 테스트 실행");

  console.log("\n🔗 Amoy 테스트넷에서 확인:");
  console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 배포 실패:", error);
    process.exit(1);
  });
