import * as dotenv from "dotenv";
import { ethers } from "hardhat";

// 환경 변수 로드
dotenv.config({ path: "../../.env" });

async function main() {
    console.log("🔐 User1을 위한 claimWithSignature 서명 생성 시작...\n");

    // 환경 변수 확인
    const privateKey = process.env.ADMIN_PRIV_KEY;

    if (!privateKey) {
        throw new Error("환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.");
    }

    // 네트워크 정보
    const network = await ethers.provider.getNetwork();
    console.log(`🌐 네트워크: ${network.name} (Chain ID: ${network.chainId})`);

    // Deployer 설정 (백엔드 역할)
    const deployer = new ethers.Wallet(privateKey, ethers.provider);
    console.log(`👤 백엔드 (Deployer): ${deployer.address}\n`);

    // PostLikeSystem1363 주소
    const postLikeSystem1363Address = process.env.POST_LIKE_SYSTEM_AMOY;

    if (!postLikeSystem1363Address) {
        throw new Error("환경 변수 POST_LIKE_SYSTEM_AMOY가 설정되지 않았습니다.");
    }

    console.log(`✅ PostLikeSystem1363: ${postLikeSystem1363Address}\n`);

    try {
        // 1. PostLikeSystem1363 컨트랙트 연결
        console.log("🔍 1단계: PostLikeSystem1363 컨트랙트 연결 중...");

        const PostLikeSystem1363 = await ethers.getContractFactory("PostLikeSystem1363");
        const postLikeSystem1363 = PostLikeSystem1363.attach(postLikeSystem1363Address).connect(deployer);

        // 2. Post ID 1 상태 확인
        console.log("🔍 2단계: Post ID 1 상태 확인 중...");

        const postExists = await (postLikeSystem1363 as any).postExists(1);
        const postLikes = await (postLikeSystem1363 as any).postLikes(1);
        const postTokens = await (postLikeSystem1363 as any).postTokens(1);

        console.log(`   📊 Post ID 1 상태:`);
        console.log(`      - 존재 여부: ${postExists}`);
        console.log(`      - 좋아요 수: ${postLikes}`);
        console.log(`      - 수집된 토큰: ${ethers.formatEther(postTokens)} EXP\n`);

        // 3. EIP-712 서명 데이터 생성
        console.log("🔍 3단계: EIP-712 서명 데이터 생성 중...");

        const user1Address = "0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348";
        const postId = 1;
        const amount = postTokens; // 수집된 토큰만큼
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간 후 만료
        const nonce = ethers.randomBytes(32); // 랜덤 nonce

        console.log(`   📝 서명 데이터:`);
        console.log(`      - postId: ${postId}`);
        console.log(`      - author: ${user1Address}`);
        console.log(`      - amount: ${ethers.formatEther(amount)} EXP`);
        console.log(`      - deadline: ${deadline} (${new Date(deadline * 1000).toISOString()})`);
        console.log(`      - nonce: ${ethers.hexlify(nonce)}\n`);

        // 4. EIP-712 타입 정의
        const types = {
            Claim: [
                { name: "postId", type: "uint256" },
                { name: "author", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "deadline", type: "uint256" },
                { name: "nonce", type: "bytes32" }
            ]
        };

        const message = {
            postId: postId,
            author: user1Address,
            amount: amount,
            deadline: deadline,
            nonce: nonce
        };

        // 5. EIP-712 서명 생성
        console.log("🔍 4단계: EIP-712 서명 생성 중...");

        const signature = await deployer.signTypedData(
            {
                name: "PostLikeSystem1363",
                version: "1",
                chainId: network.chainId,
                verifyingContract: postLikeSystem1363Address
            },
            types,
            message
        );

        console.log(`   ✅ 서명 생성 완료!`);
        console.log(`   🔐 서명: ${signature}`);

        // 6. 서명 검증 테스트
        console.log("\n🔍 5단계: 서명 검증 테스트 중...");

        try {
            const isValid = await (postLikeSystem1363 as any).claimWithSignature(
                postId,
                signature,
                deadline,
                nonce
            );
            console.log(`   ✅ 서명 검증 성공!`);
        } catch (error: any) {
            console.log(`   ❌ 서명 검증 실패: ${error.message}`);
        }

        // 7. Remix에서 사용할 정보 출력
        console.log("\n🎯 Remix에서 claimWithSignature 호출할 정보:");
        console.log(`\n📝 함수: claimWithSignature`);
        console.log(`   - postId: ${postId}`);
        console.log(`   - signature: ${signature}`);
        console.log(`   - deadline: ${deadline}`);
        console.log(`   - nonce: ${ethers.hexlify(nonce)}`);

        console.log(`\n🔗 PostLikeSystem1363 주소: ${postLikeSystem1363Address}`);
        console.log(`👤 User1 주소: ${user1Address}`);
        console.log(`💰 수집된 토큰: ${ethers.formatEther(amount)} EXP`);

        console.log("\n📖 사용법:");
        console.log("1. Remix에서 PostLikeSystem1363 컨트랙트 선택");
        console.log("2. claimWithSignature 함수 호출");
        console.log("3. 위의 파라미터들을 입력");
        console.log("4. User1 계정으로 트랜잭션 전송");

    } catch (error: any) {
        console.error("❌ 서명 생성 중 오류 발생:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
