import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🔍 Permit 디버깅 시작...\n");

    // 계정 가져오기
    const [owner, user1] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}\n`);

    // TrivusEXP 토큰 배포
    console.log("📝 TrivusEXP 토큰 배포 중...");
    const TrivusEXP = await ethers.getContractFactory("TrivusEXP");
    const trivusExp = await TrivusEXP.deploy();
    await trivusExp.waitForDeployment();
    console.log(`✅ TrivusEXP 배포 완료: ${await trivusExp.getAddress()}\n`);

    // PostLikeSystem 컨트랙트 배포
    console.log("📝 PostLikeSystem 컨트랙트 배포 중...");
    const PostLikeSystem = await ethers.getContractFactory("PostLikeSystem");
    const postLikeSystem = await PostLikeSystem.deploy(await trivusExp.getAddress());
    await postLikeSystem.waitForDeployment();
    console.log(`✅ PostLikeSystem 배포 완료: ${await postLikeSystem.getAddress()}\n`);

    // 테스트용 토큰 분배
    console.log("💰 테스트용 토큰 분배 중...");
    await trivusExp.mint(user1.address, ethers.parseEther("100"));
    console.log("✅ 토큰 분배 완료\n");

    // 1. permit 서명 생성
    console.log("✍️ 1단계: permit 서명 생성");
    const network = await user1.provider.getNetwork();
    const domain = {
        name: 'Trivus EXP Token',
        version: '1',
        chainId: Number(network.chainId),
        verifyingContract: await trivusExp.getAddress()
    };

    const types = {
        Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
        ]
    };

    const nonce = await trivusExp.nonces(user1.address);
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후
    const value = ethers.parseEther("1"); // 1 EXP

    console.log(`   Domain: ${JSON.stringify(domain, null, 2)}`);
    console.log(`   Message: ${JSON.stringify({
        owner: user1.address,
        spender: await postLikeSystem.getAddress(),
        value: ethers.formatEther(value),
        nonce: nonce.toString(),
        deadline: deadline.toString()
    }, null, 2)}`);

    // 서명 생성
    const signature = await user1.signTypedData(domain, types, {
        owner: user1.address,
        spender: await postLikeSystem.getAddress(),
        value: value.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString()
    });
    const { v, r, s } = ethers.Signature.from(signature);

    console.log(`   Signature: ${signature}`);
    console.log(`   v: ${v}, r: ${r}, s: ${s}\n`);

    // 2. permit 함수 직접 호출 테스트
    console.log("🔐 2단계: permit 함수 직접 호출 테스트");
    try {
        const permitTx = await trivusExp.connect(user1).permit(
            user1.address,
            await postLikeSystem.getAddress(),
            value,
            deadline,
            v, r, s
        );
        const receipt = await permitTx.wait();
        console.log("   ✅ permit 함수 호출 성공!");

        // 디버깅 이벤트 확인
        console.log("\n   📊 디버깅 이벤트 분석:");
        for (const log of receipt.logs) {
            try {
                const parsedLog = trivusExp.interface.parseLog(log);
                if (parsedLog.name === 'DebugPermit') {
                    console.log(`   🔍 DebugPermit: owner=${parsedLog.args[0]}, spender=${parsedLog.args[1]}, value=${ethers.formatEther(parsedLog.args[2])}, nonce=${parsedLog.args[3]}, deadline=${parsedLog.args[4]}, v=${parsedLog.args[5]}, r=${parsedLog.args[6]}, s=${parsedLog.args[7]}`);
                } else if (parsedLog.name === 'DebugPermitStep1') {
                    console.log(`   🔍 DebugPermitStep1: permitTypeHash=${parsedLog.args[0]}, owner=${parsedLog.args[1]}, spender=${parsedLog.args[2]}, value=${ethers.formatEther(parsedLog.args[3])}, nonce=${parsedLog.args[4]}, deadline=${parsedLog.args[5]}`);
                } else if (parsedLog.name === 'DebugPermitStep2') {
                    console.log(`   🔍 DebugPermitStep2: structHash=${parsedLog.args[0]}, domainSeparator=${parsedLog.args[1]}`);
                } else if (parsedLog.name === 'DebugPermitStep3') {
                    console.log(`   🔍 DebugPermitStep3: hash=${parsedLog.args[0]}, signer=${parsedLog.args[1]}, expectedOwner=${parsedLog.args[2]}`);
                } else if (parsedLog.name === 'DebugPermitResult') {
                    console.log(`   🔍 DebugPermitResult: hash=${parsedLog.args[0]}, signer=${parsedLog.args[1]}, expectedOwner=${parsedLog.args[2]}`);
                }
            } catch (e) {
                // 이벤트 파싱 실패는 무시
            }
        }
    } catch (error) {
        console.log(`   ❌ permit 함수 호출 실패: ${error.message}`);
        return;
    }

    // 3. permit 후 허용량 확인
    console.log("\n🔍 3단계: permit 후 허용량 확인");
    const newAllowance = await trivusExp.allowance(user1.address, await postLikeSystem.getAddress());
    console.log(`   User1의 PostLikeSystem 허용량: ${ethers.formatEther(newAllowance)} EXP\n`);

    // 4. likePostWithPermit 실행 테스트
    console.log("👍 4단계: likePostWithPermit 실행 테스트");
    try {
        const likeTx = await postLikeSystem.connect(user1).likePostWithPermit(
            1,
            owner.address, // postAuthor
            deadline,
            v, r, s
        );
        await likeTx.wait();
        console.log("   ✅ likePostWithPermit 성공!");
    } catch (error) {
        console.log(`   ❌ likePostWithPermit 실패: ${error.message}`);

        // 에러 상세 분석
        if (error.message.includes('Invalid signature')) {
            console.log("\n   🔍 'Invalid signature' 에러 분석:");
            console.log("   - permit 함수는 성공했지만 likePostWithPermit에서 실패");
            console.log("   - PostLikeSystem에서 TrivusEXP.permit 호출 시 서명 검증 실패");
            console.log("   - 가능한 원인: nonce 값, 도메인 분리자, 서명 파라미터 불일치");
        }
    }

    console.log("\n🎉 Permit 디버깅 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 디버깅 실패:", error);
        process.exit(1);
    });
