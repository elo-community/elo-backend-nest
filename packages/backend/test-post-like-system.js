const { ethers } = require('ethers');

// 환경 변수 설정 (실제 .env 파일에서 읽어와야 함)
const RPC_URL = 'https://rpc-amoy.polygon.technology/';
const POST_LIKE_SYSTEM_ADDRESS = '0x7d135Ab9464c0b101735ADf0942EeF5Fe525dF22';
const TRUSTED_SIGNER_PRIV_KEY = '07e5c54e6bf552a6c08a05c6c6c6da800d0720a30d4e781a87906731a2137de6';

async function testPostLikeSystem() {
    try {
        console.log('🧪 PostLikeSystem 컨트랙트 테스트 시작...\n');

        // 1. Provider 생성
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log('✅ Provider 생성 완료');

        // 2. 컨트랙트 ABI (PostLikeSystemService와 동일)
        const postLikeContractABI = [
            'function likePrice() view returns (uint256)',
            'function trustedSigner() view returns (address)',
            'function getPostInfo(uint256 postId, address user) view returns (uint256 totalLikes, uint256 totalTokens, bool isLikedByUser)',
            'function hasLiked(uint256 postId, address user) view returns (bool)',
            'function postLikes(uint256 postId) view returns (uint256)',
            'function postTokens(uint256 postId) view returns (uint256)'
        ];

        // 3. 컨트랙트 인스턴스 생성
        const postLikeContract = new ethers.Contract(
            POST_LIKE_SYSTEM_ADDRESS,
            postLikeContractABI,
            provider
        );
        console.log('✅ 컨트랙트 인스턴스 생성 완료');

        // 4. 네트워크 정보 확인
        const network = await provider.getNetwork();
        console.log(`🌐 네트워크 체인 ID: ${network.chainId}`);

        // 5. 컨트랙트 주소 확인
        console.log(`📝 컨트랙트 주소: ${POST_LIKE_SYSTEM_ADDRESS}`);

        // 6. likePrice 함수 호출 테스트
        console.log('\n💰 likePrice 함수 테스트...');
        try {
            const likePrice = await postLikeContract.likePrice();
            console.log(`✅ likePrice: ${likePrice.toString()} wei`);
            console.log(`✅ likePrice: ${ethers.formatEther(likePrice)} EXP`);
        } catch (error) {
            console.error(`❌ likePrice 호출 실패: ${error.message}`);
        }

        // 7. trustedSigner 함수 호출 테스트
        console.log('\n🔐 trustedSigner 함수 테스트...');
        try {
            const trustedSigner = await postLikeContract.trustedSigner();
            console.log(`✅ trustedSigner: ${trustedSigner}`);
        } catch (error) {
            console.error(`❌ trustedSigner 호출 실패: ${error.message}`);
        }

        // 8. getPostInfo 함수 호출 테스트
        console.log('\n📊 getPostInfo 함수 테스트...');
        try {
            const testUser = '0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348';
            const postInfo = await postLikeContract.getPostInfo(1, testUser);
            console.log(`✅ getPostInfo 결과:`);
            console.log(`   - totalLikes: ${postInfo[0].toString()}`);
            console.log(`   - totalTokens: ${postInfo[1].toString()} wei`);
            console.log(`   - isLikedByUser: ${postInfo[2]}`);
        } catch (error) {
            console.error(`❌ getPostInfo 호출 실패: ${error.message}`);
        }

        // 9. hasLiked 함수 호출 테스트
        console.log('\n❤️ hasLiked 함수 테스트...');
        try {
            const testUser = '0x46AAb404E4B7C8335Be7BF111dcc11Df2eD4d348';
            const hasLiked = await postLikeContract.hasLiked(1, testUser);
            console.log(`✅ hasLiked(1, ${testUser}): ${hasLiked}`);
        } catch (error) {
            console.error(`❌ hasLiked 호출 실패: ${error.message}`);
        }

        console.log('\n🎉 테스트 완료!');

    } catch (error) {
        console.error('❌ 테스트 실패:', error);
    }
}

// 테스트 실행
testPostLikeSystem();
