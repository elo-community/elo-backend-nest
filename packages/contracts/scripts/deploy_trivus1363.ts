import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🚀 TrivusEXP1363 토큰 배포 시작...\n");

    // 계정 가져오기
    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}\n`);

    // TrivusEXP1363 토큰 배포
    console.log("📝 TrivusEXP1363 토큰 배포 중...");
    const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
    const trivusExp = await TrivusEXP1363.deploy("Trivus EXP Token", "EXP");
    await trivusExp.waitForDeployment();

    const tokenAddress = await trivusExp.getAddress();
    console.log(`✅ TrivusEXP1363 배포 완료: ${tokenAddress}\n`);

    // 테스트용 토큰 발행
    console.log("💰 테스트용 토큰 발행 중...");
    const mintAmount = ethers.parseEther("10000"); // 10,000 EXP
    await trivusExp.mint(deployer.address, mintAmount);
    console.log(`✅ ${ethers.formatEther(mintAmount)} EXP 발행 완료\n`);

    // 토큰 정보 확인
    console.log("📊 토큰 정보:");
    console.log(`   이름: ${await trivusExp.name()}`);
    console.log(`   심볼: ${await trivusExp.symbol()}`);
    console.log(`   소수점: ${await trivusExp.decimals()}`);
    console.log(`   총 발행량: ${ethers.formatEther(await trivusExp.totalSupply())} EXP`);
    console.log(`   Deployer 잔액: ${ethers.formatEther(await trivusExp.balanceOf(deployer.address))} EXP\n`);

    // 배포 정보 출력
    console.log("📋 배포 정보:");
    console.log(`   토큰 주소: ${tokenAddress}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   네트워크: ${(await ethers.provider.getNetwork()).name}\n`);

    console.log("🎉 TrivusEXP1363 토큰 배포 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 배포 실패:", error);
        process.exit(1);
    });
