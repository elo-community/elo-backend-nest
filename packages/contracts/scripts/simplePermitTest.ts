import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("🚀 간단한 Permit 테스트 시작...\n");

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

    // 테스트용 토큰 분배
    console.log("💰 테스트용 토큰 분배 중...");
    await trivusExp.mint(user1.address, ethers.parseEther("100"));
    console.log("✅ 토큰 분배 완료\n");

    // 1. 기본 허용량 확인
    console.log("🔍 1단계: 기본 허용량 확인");
    const initialAllowance = await trivusExp.allowance(user1.address, owner.address);
    console.log(`   User1의 Owner 허용량: ${ethers.formatEther(initialAllowance)} EXP\n`);

    // 2. permit 서명 생성
    console.log("✍️ 2단계: permit 서명 생성");
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
    const value = ethers.parseEther("10");

    console.log(`   Domain: ${JSON.stringify(domain, null, 2)}`);
    console.log(`   Message: ${JSON.stringify({
        owner: user1.address,
        spender: owner.address,
        value: ethers.formatEther(value),
        nonce: nonce.toString(),
        deadline: deadline.toString()
    }, null, 2)}`);

    // 서명 생성
    const signature = await user1.signTypedData(domain, types, {
        owner: user1.address,
        spender: owner.address,
        value: value.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString()
    });
    const { v, r, s } = ethers.Signature.from(signature);
    
    console.log(`   Signature: ${signature}`);
    console.log(`   v: ${v}, r: ${r}, s: ${s}\n`);

    // 3. permit 함수 호출
    console.log("🔐 3단계: permit 함수 호출");
    try {
        const permitTx = await trivusExp.connect(user1).permit(
            user1.address,
            owner.address,
            value,
            deadline,
            v, r, s
        );
        await permitTx.wait();
        console.log("   ✅ permit 함수 호출 성공!\n");
    } catch (error) {
        console.log(`   ❌ permit 함수 호출 실패: ${error.message}`);
        return;
    }

    // 4. permit 후 허용량 확인
    console.log("🔍 4단계: permit 후 허용량 확인");
    const newAllowance = await trivusExp.allowance(user1.address, owner.address);
    console.log(`   User1의 Owner 허용량: ${ethers.formatEther(newAllowance)} EXP\n`);

    // 5. transferFrom 테스트
    console.log("💰 5단계: transferFrom 테스트");
    try {
        const transferTx = await trivusExp.connect(owner).transferFrom(
            user1.address,
            owner.address,
            ethers.parseEther("5")
        );
        await transferTx.wait();
        console.log("   ✅ transferFrom 성공!\n");
    } catch (error) {
        console.log(`   ❌ transferFrom 실패: ${error.message}`);
        return;
    }

    // 6. 최종 상태 확인
    console.log("🔍 6단계: 최종 상태 확인");
    const finalAllowance = await trivusExp.allowance(user1.address, owner.address);
    const user1Balance = await trivusExp.balanceOf(user1.address);
    const ownerBalance = await trivusExp.balanceOf(owner.address);
    
    console.log(`   User1의 Owner 허용량: ${ethers.formatEther(finalAllowance)} EXP`);
    console.log(`   User1의 토큰 잔액: ${ethers.formatEther(user1Balance)} EXP`);
    console.log(`   Owner의 토큰 잔액: ${ethers.formatEther(ownerBalance)} EXP\n`);

    console.log("🎉 간단한 Permit 테스트 완료!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 테스트 실패:", error);
        process.exit(1);
    });
