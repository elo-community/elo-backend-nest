const { ethers } = require('ethers');

// Amoy 테스트넷 RPC URL
const RPC_URL = 'https://rpc-amoy.polygon.technology';

// 컨트랙트 주소들
const TRIVUS_EXP_ADDRESS = '0x5BF617D9d68868414611618336603B37f8061819';
const POST_LIKE_SYSTEM_ADDRESS = process.env.POST_LIKE_SYSTEM_AMOY || '0x...'; // 환경변수에서 가져오기

// 컨트랙트 ABI (간단한 버전)
const TRIVUS_EXP_ABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function owner() view returns (address)'
];

const POST_LIKE_SYSTEM_ABI = [
    'function likePrice() view returns (uint256)',
    'function token() view returns (address)',
    'function trustedSigner() view returns (address)',
    'function owner() view returns (address)',
    'function postLikes(uint256) view returns (uint256)',
    'function postTokens(uint256) view returns (uint256)'
];

async function checkContractStatus() {
    try {
        console.log('🔍 컨트랙트 상태 확인 중...\n');
        
        // Provider 연결
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log(`✅ RPC 연결됨: ${RPC_URL}\n`);
        
        // 1. TrivusEXP1363 컨트랙트 상태 확인
        console.log('📋 TrivusEXP1363 컨트랙트 상태:');
        console.log(`📍 주소: ${TRIVUS_EXP_ADDRESS}`);
        
        const trivusExpContract = new ethers.Contract(TRIVUS_EXP_ADDRESS, TRIVUS_EXP_ABI, provider);
        
        try {
            const name = await trivusExpContract.name();
            const symbol = await trivusExpContract.symbol();
            const decimals = await trivusExpContract.decimals();
            const totalSupply = await trivusExpContract.totalSupply();
            const owner = await trivusExpContract.owner();
            
            console.log(`✅ 이름: ${name}`);
            console.log(`✅ 심볼: ${symbol}`);
            console.log(`✅ 소수점: ${decimals}`);
            console.log(`✅ 총 공급량: ${ethers.formatEther(totalSupply)} ${symbol}`);
            console.log(`✅ 소유자: ${owner}`);
        } catch (error) {
            console.log(`❌ TrivusEXP1363 상태 확인 실패: ${error.message}`);
        }
        
        console.log('');
        
        // 2. PostLikeSystem1363 컨트랙트 상태 확인
        if (POST_LIKE_SYSTEM_ADDRESS === '0x...') {
            console.log('⚠️ POST_LIKE_SYSTEM_AMOY 환경변수가 설정되지 않았습니다.');
            return;
        }
        
        console.log('📋 PostLikeSystem1363 컨트랙트 상태:');
        console.log(`📍 주소: ${POST_LIKE_SYSTEM_ADDRESS}`);
        
        const postLikeContract = new ethers.Contract(POST_LIKE_SYSTEM_ADDRESS, POST_LIKE_SYSTEM_ABI, provider);
        
        try {
            const likePrice = await postLikeContract.likePrice();
            const tokenAddress = await postLikeContract.token();
            const trustedSigner = await postLikeContract.trustedSigner();
            const owner = await postLikeContract.owner();
            
            console.log(`✅ 좋아요 가격: ${ethers.formatEther(likePrice)} EXP`);
            console.log(`✅ 토큰 컨트랙트: ${tokenAddress}`);
            console.log(`✅ 신뢰할 수 있는 서명자: ${trustedSigner}`);
            console.log(`✅ 소유자: ${owner}`);
            
            // postId=1의 상태 확인
            try {
                const postLikes = await postLikeContract.postLikes(1);
                const postTokens = await postLikeContract.postTokens(1);
                console.log(`✅ postId=1 좋아요 수: ${postLikes}`);
                console.log(`✅ postId=1 수집된 토큰: ${ethers.formatEther(postTokens)} EXP`);
            } catch (error) {
                console.log(`⚠️ postId=1 상태 확인 실패: ${error.message}`);
            }
            
        } catch (error) {
            console.log(`❌ PostLikeSystem1363 상태 확인 실패: ${error.message}`);
        }
        
        console.log('\n🔍 컨트랙트 상태 확인 완료!');
        
    } catch (error) {
        console.error('❌ 컨트랙트 상태 확인 실패:', error.message);
    }
}

// 스크립트 실행
checkContractStatus();
