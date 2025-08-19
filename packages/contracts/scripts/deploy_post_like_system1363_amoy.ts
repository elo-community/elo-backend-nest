import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config({ path: "../../.env" });

async function main() {
    console.log("🚀 Amoy 네트워크에 통합된 PostLikeSystem1363 배포 시작...\n");

    // 네트워크 정보
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 네트워크: Amoy (Chain ID: ${network.chainId})`);
    console.log(`🔗 RPC URL: https://rpc-amoy.polygon.technology/\n`);

    // 계정 설정
    const privateKey = process.env.ADMIN_PRIV_KEY;
    if (!privateKey) {
        throw new Error("ADMIN_PRIV_KEY 환경변수가 설정되지 않았습니다.");
    }

    const deployer = new ethers.Wallet(privateKey, ethers.provider);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 잔액: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC\n`);

    // TrivusEXP1363 배포 (먼저)
    console.log("📝 1단계: TrivusEXP1363 토큰 배포 중...");
    const TrivusEXP1363 = await ethers.getContractFactory("TrivusEXP1363");
    const trivusEXP1363 = await TrivusEXP1363.connect(deployer).deploy("Trivus EXP Token", "EXP", deployer.address);
    await trivusEXP1363.waitForDeployment();

    const trivusEXP1363Address = await trivusEXP1363.getAddress();
    console.log(`✅ TrivusEXP1363 배포 완료: ${trivusEXP1363Address}`);

    // PostLikeSystem1363 배포
    console.log("\n📝 2단계: PostLikeSystem1363 배포 중...");
    const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");
    const postLikeSystem1363 = await PostLikeSystem1363.connect(deployer).deploy(trivusEXP1363Address);
    await postLikeSystem1363.waitForDeployment();

    const postLikeSystem1363Address = await postLikeSystem1363.getAddress();
    console.log(`✅ PostLikeSystem1363 배포 완료: ${postLikeSystem1363Address}`);

    // 컨트랙트 정보 확인
    console.log("\n📊 컨트랙트 정보:");
    console.log(`   - TrivusEXP1363 주소: ${trivusEXP1363Address}`);
    console.log(`   - PostLikeSystem1363 주소: ${postLikeSystem1363Address}`);
    console.log(`   - Deployer: ${deployer.address}`);
    console.log(`   - 네트워크: Amoy (Chain ID: ${network.chainId})`);

    // 토큰 정보 확인
    console.log("\n📊 토큰 정보:");
    console.log(`   - 이름: ${await trivusEXP1363.name()}`);
    console.log(`   - 심볼: ${await trivusEXP1363.symbol()}`);
    console.log(`   - 소수점: ${await trivusEXP1363.decimals()}`);
    console.log(`   - 총 공급량: ${ethers.formatEther(await trivusEXP1363.totalSupply())} EXP`);
    console.log(`   - Admin Role: ${await trivusEXP1363.hasRole(await trivusEXP1363.DEFAULT_ADMIN_ROLE(), deployer.address) ? 'Deployer' : 'Other'}`);

    // ERC1363 기능 테스트
    console.log("\n🧪 ERC1363 기능 테스트:");

    // transferAndCall 함수 존재 확인
    const transferAndCallFragment = trivusEXP1363.interface.getFunction("transferAndCall");
    if (transferAndCallFragment) {
        console.log(`   ✅ transferAndCall 함수: 존재함`);
        console.log(`   📝 함수 시그니처: ${transferAndCallFragment.format()}`);
    } else {
        console.log(`   ❌ transferAndCall 함수: 존재하지 않음`);
    }

    // PostLikeSystem1363 기능 확인
    console.log("\n🧪 PostLikeSystem1363 기능 테스트:");

    // onTransferReceived 함수 존재 확인
    const onTransferReceivedFragment = postLikeSystem1363.interface.getFunction("onTransferReceived");
    if (onTransferReceivedFragment) {
        console.log(`   ✅ onTransferReceived 함수: 존재함`);
        console.log(`   📝 함수 시그니처: ${onTransferReceivedFragment.format()}`);
    } else {
        console.log(`   ❌ onTransferReceived 함수: 존재하지 않음`);
    }

    // claimWithSignature 함수 존재 확인
    const claimWithSignatureFragment = postLikeSystem1363.interface.getFunction("claimWithSignature");
    if (claimWithSignatureFragment) {
        console.log(`   ✅ claimWithSignature 함수: 존재함`);
        console.log(`   📝 함수 시그니처: ${claimWithSignatureFragment.format()}`);
    } else {
        console.log(`   ❌ claimWithSignature 함수: 존재하지 않음`);
    }

    // 테스트용 토큰 발행
    console.log("\n📝 테스트용 토큰 발행 중...");
    const mintAmount = ethers.parseEther("1000"); // 1000 EXP
    const mintTx = await trivusEXP1363.mint(deployer.address, mintAmount);
    await mintTx.wait();
    console.log(`✅ ${ethers.formatEther(mintAmount)} EXP 발행 완료`);
    console.log(`💰 현재 잔액: ${ethers.formatEther(await trivusEXP1363.balanceOf(deployer.address))} EXP`);

    // 데모 게시글 등록
    console.log("\n📝 데모 게시글 등록 중...");
    const registerTx = await postLikeSystem1363.registerPost(1, deployer.address);
    await registerTx.wait();
    console.log(`✅ Post ID 1 등록 완료 (작성자: ${deployer.address})`);

    console.log("\n📋 배포 정보:");
    console.log(`   TrivusEXP1363 주소: ${trivusEXP1363Address}`);
    console.log(`   PostLikeSystem1363 주소: ${postLikeSystem1363Address}`);
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   네트워크: Amoy (Chain ID: ${network.chainId})`);

    console.log("\n📝 .env 파일에 다음을 추가하세요:");
    console.log(`   TRIVUS_EXP_1363_AMOY=${trivusEXP1363Address}`);
    console.log(`   POST_LIKE_SYSTEM_AMOY=${postLikeSystem1363Address}`);

    console.log("\n📖 통합 시스템 사용법:");
    console.log("   1. transferAndCall(receiverAddress, amount, abi.encode(postId)) 호출");
    console.log("   2. 자동으로 onTransferReceived 콜백 실행");
    console.log("   3. 좋아요 처리 및 토큰 수집");
    console.log("   4. claimWithSignature(postId, signature, deadline, nonce)로 토큰 인출");
    console.log("   5. unlikePost(postId)로 좋아요 취소");
    console.log("   6. batchLikePosts로 여러 게시글 동시 좋아요");

    console.log("\n🎉 Amoy 네트워크 배포 완료!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
