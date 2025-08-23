const { ethers } = require('hardhat');

async function testPostSpecificNonce() {
    console.log('🚀 Post-specific Nonce 시스템 테스트 시작...\n');

    // 계정들 가져오기
    const [user1, user2] = await ethers.getSigners();
    
    // 컨트랙트 배포
    const TrivusEXP = await ethers.getContractFactory('TrivusEXP1363');
    const trivusEXP = await TrivusEXP.deploy();
    await trivusEXP.waitForDeployment();
    
    const PostLikeSystem = await ethers.getContractFactory('PostLikeSystem1363');
    const postLikeSystem = await PostLikeSystem.deploy(await trivusEXP.getAddress());
    await postLikeSystem.waitForDeployment();
    
    console.log('📋 컨트랙트 배포 완료:');
    console.log(`   TrivusEXP: ${await trivusEXP.getAddress()}`);
    console.log(`   PostLikeSystem: ${await postLikeSystem.getAddress()}\n`);

    // 사용자들에게 토큰 지급
    const likePrice = await postLikeSystem.likePrice();
    await trivusEXP.mint(user1.address, likePrice * 10n);
    await trivusEXP.mint(user2.address, likePrice * 10n);
    
    // PostLikeSystem에 토큰 전송 허용
    await trivusEXP.connect(user1).approve(await postLikeSystem.getAddress(), likePrice * 10n);
    await trivusEXP.connect(user2).approve(await postLikeSystem.getAddress(), likePrice * 10n);
    
    console.log('💰 토큰 지급 및 승인 완료\n');

    // 테스트 1: user1이 post1에 좋아요 (nonce = 0)
    console.log('🧪 테스트 1: user1이 post1에 좋아요 (nonce = 0)');
    const post1 = 1;
    const nonce1 = 0;
    
    // 백엔드 API 형식과 동일한 데이터 구조
    const payload1 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [post1]);
    const encodedData1 = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'bytes'],
        [nonce1, payload1]
    );
    
    console.log(`   postId: ${post1}`);
    console.log(`   nonce: ${nonce1}`);
    console.log(`   encodedData: ${encodedData1}`);
    
    try {
        await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
            await postLikeSystem.getAddress(),
            likePrice,
            encodedData1
        );
        console.log('   ✅ 성공!\n');
    } catch (error) {
        console.log(`   ❌ 실패: ${error.message}\n`);
        return;
    }

    // 테스트 2: user1이 post2에 좋아요 (nonce = 0)
    console.log('🧪 테스트 2: user1이 post2에 좋아요 (nonce = 0)');
    const post2 = 2;
    const nonce2 = 0;
    
    const payload2 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [post2]);
    const encodedData2 = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'bytes'],
        [nonce2, payload2]
    );
    
    console.log(`   postId: ${post2}`);
    console.log(`   nonce: ${nonce2}`);
    console.log(`   encodedData: ${encodedData2}`);
    
    try {
        await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
            await postLikeSystem.getAddress(),
            likePrice,
            encodedData2
        );
        console.log('   ✅ 성공!\n');
    } catch (error) {
        console.log(`   ❌ 실패: ${error.message}\n`);
        return;
    }

    // 테스트 3: user1이 post1에 또 좋아요 시도 (nonce = 1이어야 함)
    console.log('🧪 테스트 3: user1이 post1에 또 좋아요 시도 (nonce = 1이어야 함)');
    const nonce3 = 0; // 잘못된 nonce (1이어야 함)
    
    const payload3 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [post1]);
    const encodedData3 = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'bytes'],
        [nonce3, payload3]
    );
    
    console.log(`   postId: ${post1}`);
    console.log(`   nonce: ${nonce3} (잘못된 값)`);
    console.log(`   encodedData: ${encodedData3}`);
    
    try {
        await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
            await postLikeSystem.getAddress(),
            likePrice,
            encodedData3
        );
        console.log('   ❌ 예상과 다름: 성공했지만 실패해야 함\n');
    } catch (error) {
        if (error.message.includes('BAD_NONCE')) {
            console.log('   ✅ 예상대로 BAD_NONCE 에러 발생\n');
        } else {
            console.log(`   ❌ 예상과 다른 에러: ${error.message}\n`);
        }
    }

    // 테스트 4: user1이 post1에 올바른 nonce로 좋아요 (nonce = 1)
    console.log('🧪 테스트 4: user1이 post1에 올바른 nonce로 좋아요 (nonce = 1)');
    const nonce4 = 1; // 올바른 nonce
    
    const payload4 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [post1]);
    const encodedData4 = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'bytes'],
        [nonce4, payload4]
    );
    
    console.log(`   postId: ${post1}`);
    console.log(`   nonce: ${nonce4} (올바른 값)`);
    console.log(`   encodedData: ${encodedData4}`);
    
    try {
        await trivusEXP.connect(user1)["transferAndCall(address,uint256,bytes)"](
            await postLikeSystem.getAddress(),
            likePrice,
            encodedData4
        );
        console.log('   ✅ 성공!\n');
    } catch (error) {
        if (error.message.includes('ALREADY_LIKED')) {
            console.log('   ✅ 예상대로 ALREADY_LIKED 에러 발생 (이미 좋아요를 눌렀음)\n');
        } else {
            console.log(`   ❌ 예상과 다른 에러: ${error.message}\n`);
        }
    }

    // 테스트 5: user2가 post1에 좋아요 (nonce = 0)
    console.log('🧪 테스트 5: user2가 post1에 좋아요 (nonce = 0)');
    const nonce5 = 0;
    
    const payload5 = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [post1]);
    const encodedData5 = ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'bytes'],
        [nonce5, payload5]
    );
    
    console.log(`   postId: ${post1}`);
    console.log(`   nonce: ${nonce5}`);
    console.log(`   encodedData: ${encodedData5}`);
    
    try {
        await trivusEXP.connect(user2)["transferAndCall(address,uint256,bytes)"](
            await postLikeSystem.getAddress(),
            likePrice,
            encodedData5
        );
        console.log('   ✅ 성공!\n');
    } catch (error) {
        console.log(`   ❌ 실패: ${error.message}\n`);
        return;
    }

    // 현재 nonce 상태 확인
    console.log('📊 현재 nonce 상태:');
    console.log(`   user1의 post1 nonce: ${await trivusEXP.userPostNonces(user1.address, post1)}`);
    console.log(`   user1의 post2 nonce: ${await trivusEXP.userPostNonces(user1.address, post2)}`);
    console.log(`   user2의 post1 nonce: ${await trivusEXP.userPostNonces(user2.address, post1)}`);
    
    console.log('\n🎉 모든 테스트 완료!');
}

testPostSpecificNonce()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ 테스트 실패:', error);
        process.exit(1);
    });
