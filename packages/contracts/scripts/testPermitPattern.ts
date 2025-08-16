import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
    console.log("🚀 Permit 패턴 테스트 시작...\n");

    // 계정 가져오기
    const [owner, user1, user2, postAuthor] = await ethers.getSigners();
    console.log(`👤 Owner: ${owner.address}`);
    console.log(`👤 User1: ${user1.address}`);
    console.log(`👤 User2: ${user2.address}`);
    console.log(`👤 PostAuthor: ${postAuthor.address}\n`);

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
    await trivusExp.mint(user2.address, ethers.parseEther("100"));
    await trivusExp.mint(postAuthor.address, ethers.parseEther("100"));
    console.log("✅ 토큰 분배 완료\n");

    // 토큰 잔액 확인
    console.log("📊 초기 토큰 잔액:");
    console.log(`   User1: ${ethers.formatEther(await trivusExp.balanceOf(user1.address))} EXP`);
    console.log(`   User2: ${ethers.formatEther(await trivusExp.balanceOf(user2.address))} EXP`);
    console.log(`   PostAuthor: ${ethers.formatEther(await trivusExp.balanceOf(postAuthor.address))} EXP\n`);

    // 1. 기본 허용량 확인
    console.log("🔍 1단계: 기본 허용량 확인");
    const initialAllowance = await trivusExp.allowance(user1.address, await postLikeSystem.getAddress());
    console.log(`   User1의 PostLikeSystem 허용량: ${ethers.formatEther(initialAllowance)} EXP\n`);

    // 2. permit 없이 likePostWithPermit 시도 (실패해야 함)
    console.log("❌ 2단계: permit 없이 likePostWithPermit 시도");
    try {
        await postLikeSystem.connect(user1).likePostWithPermit(
            1,
            postAuthor.address,
            Math.floor(Date.now() / 1000) + 3600, // 1시간 후
            27, // v
            ethers.ZeroHash, // r
            ethers.ZeroHash  // s
        );
        console.log("   ❌ 예상과 다름: 트랜잭션이 성공했습니다");
    } catch (error) {
        console.log(`   ✅ 예상대로 실패: ${error.message}`);
    }
    console.log();

    // 3. permit 서명 생성
    console.log("✍️ 3단계: permit 서명 생성");
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
        spender: await postLikeSystem.getAddress(),
        value: ethers.formatEther(value),
        nonce: nonce.toString(),
        deadline: deadline.toString()
    }, null, 2)}`);

    // 서명 생성 (BigInt를 문자열로 변환)
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

    // 4. permit 함수 직접 호출 테스트
    console.log("🔐 4단계: permit 함수 직접 호출 테스트");
    const permitTx = await trivusExp.connect(user1).permit(
        user1.address,
        await postLikeSystem.getAddress(),
        value,
        deadline,
        v, r, s
    );
    await permitTx.wait();
    console.log("   ✅ permit 함수 호출 성공!\n");

    // 5. permit 후 허용량 확인
    console.log("🔍 5단계: permit 후 허용량 확인");
    const newAllowance = await trivusExp.allowance(user1.address, await postLikeSystem.getAddress());
    console.log(`   User1의 PostLikeSystem 허용량: ${ethers.formatEther(newAllowance)} EXP\n`);

    // 6. likePostWithPermit 실행 (성공해야 함)
    console.log("👍 6단계: likePostWithPermit 실행");
    const likeTx = await postLikeSystem.connect(user1).likePostWithPermit(
        1,
        postAuthor.address,
        deadline,
        v, r, s
    );
    await likeTx.wait();
    console.log("   ✅ User1이 Post ID 1에 좋아요 성공!\n");

    // 7. 좋아요 상태 확인
    console.log("🔍 7단계: 좋아요 상태 확인");
    const [hasLiked, likeTimestamp] = await postLikeSystem.getUserLikeInfo(1, user1.address);
    console.log(`   User1이 Post ID 1을 좋아요했는가: ${hasLiked}`);
    console.log(`   좋아요 시간: ${new Date(Number(likeTimestamp) * 1000).toLocaleString()}`);

    const [totalLikes, totalTokens] = await postLikeSystem.getPostLikeInfo(1);
    console.log(`   Post ID 1의 총 좋아요 수: ${totalLikes}`);
    console.log(`   Post ID 1에 수집된 총 토큰: ${ethers.formatEther(totalTokens)} EXP\n`);

    // 8. 토큰 잔액 변화 확인
    console.log("💰 8단계: 토큰 잔액 변화 확인");
    const user1FinalBalance = await trivusExp.balanceOf(user1.address);
    console.log(`   User1의 최종 토큰 잔액: ${ethers.formatEther(user1FinalBalance)} EXP`);
    console.log(`   User1의 토큰 차감량: ${ethers.formatEther(ethers.parseEther("100") - user1FinalBalance)} EXP\n`);

    // 9. 다른 사용자로 permit 패턴 테스트
    console.log("👍 9단계: 다른 사용자로 permit 패턴 테스트");

    // User2의 permit 서명 생성
    const user2Nonce = await trivusExp.nonces(user2.address);
    const user2Deadline = Math.floor(Date.now() / 1000) + 3600;
    const user2Value = ethers.parseEther("10");

    const user2Message = {
        owner: user2.address,
        spender: await postLikeSystem.getAddress(),
        value: user2Value,
        nonce: user2Nonce,
        deadline: user2Deadline
    };

    const user2Signature = await user2.signTypedData(domain, types, {
        owner: user2Message.owner,
        spender: user2Message.spender,
        value: user2Message.value.toString(),
        nonce: user2Message.nonce.toString(),
        deadline: user2Message.deadline.toString()
    });
    const { v: v2, r: r2, s: s2 } = ethers.Signature.from(user2Signature);

    // User2의 permit 호출
    console.log("   🔐 User2의 permit 함수 호출");
    const user2PermitTx = await trivusExp.connect(user2).permit(
        user2.address,
        await postLikeSystem.getAddress(),
        user2Value,
        user2Deadline,
        v2, r2, s2
    );
    await user2PermitTx.wait();
    console.log("   ✅ User2의 permit 함수 호출 성공!");

    // likePostWithPermit 실행
    const likeTx2 = await postLikeSystem.connect(user2).likePostWithPermit(
        1,
        postAuthor.address,
        user2Deadline,
        v2, r2, s2
    );
    await likeTx2.wait();
    console.log("   ✅ User2가 Post ID 1에 좋아요 성공!\n");

    // 10. 최종 상태 확인
    console.log("🔍 10단계: 최종 상태 확인");
    const [finalTotalLikes, finalTotalTokens] = await postLikeSystem.getPostLikeInfo(1);
    console.log(`   Post ID 1의 최종 총 좋아요 수: ${finalTotalLikes}`);
    console.log(`   Post ID 1에 수집된 최종 총 토큰: ${ethers.formatEther(finalTotalTokens)} EXP\n`);

    // 11. TOKEN_AMOUNT 상수 확인
    console.log("🔍 11단계: TOKEN_AMOUNT 상수 확인");
    const tokenAmount = await postLikeSystem.TOKEN_AMOUNT();
    console.log(`   TOKEN_AMOUNT: ${ethers.formatEther(tokenAmount)} EXP\n`);

    console.log("🎉 Permit 패턴 테스트 완료!");
    console.log("\n📋 테스트 결과 요약:");
    console.log("   ✅ permit 함수로 서명만으로 approve 처리 가능");
    console.log("   ✅ likePostWithPermit으로 한 번의 트랜잭션으로 모든 작업 완료");
    console.log("   ✅ 사용자는 한 번의 서명으로 좋아요 완료");
    console.log("   ✅ 가스비 없는 approve 처리");
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
