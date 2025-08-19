const { ethers } = require('ethers');

// Amoy 테스트넷 RPC URL
const RPC_URL = 'https://rpc-amoy.polygon.technology';

// PostLikeSystem1363 컨트랙트 주소
const POST_LIKE_SYSTEM_ADDRESS = '0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA';

// PostLiked 이벤트 ABI
const POST_LIKED_EVENT_ABI = [
    'event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp)'
];

async function checkPostLikedEventsWide() {
    try {
        console.log('🔍 PostLiked 이벤트 넓은 범위 확인 중...\n');

        // Provider 연결
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log(`✅ RPC 연결됨: ${RPC_URL}\n`);

        // PostLikeSystem1363 컨트랙트
        const postLikeContract = new ethers.Contract(POST_LIKE_SYSTEM_ADDRESS, POST_LIKED_EVENT_ABI, provider);

        // 최근 블록 번호 가져오기
        const latestBlock = await provider.getBlockNumber();
        console.log(`📍 최근 블록 번호: ${latestBlock}`);

        // 최근 1000개 블록에서 PostLiked 이벤트 검색
        const fromBlock = Math.max(0, latestBlock - 1000);
        const toBlock = latestBlock;

        console.log(`🔍 블록 범위: ${fromBlock} ~ ${toBlock} (${toBlock - fromBlock}개 블록)\n`);

        try {
            const events = await provider.getLogs({
                address: POST_LIKE_SYSTEM_ADDRESS,
                topics: [
                    ethers.id('PostLiked(uint256,address,uint256,uint256)')
                ],
                fromBlock: fromBlock,
                toBlock: toBlock
            });

            console.log(`📊 PostLiked 이벤트 발견: ${events.length}개\n`);

            if (events.length > 0) {
                console.log(`✅ PostLiked 이벤트가 발견되었습니다!`);
                console.log(`   마지막 이벤트 블록: ${events[events.length - 1].blockNumber}`);
                console.log(`   현재 블록과의 차이: ${latestBlock - events[events.length - 1].blockNumber}개 블록\n`);

                // 최근 3개 이벤트만 상세 출력
                const recentEvents = events.slice(-3);
                recentEvents.forEach((event, index) => {
                    console.log(`📋 최근 이벤트 ${index + 1}:`);
                    console.log(`   블록: ${event.blockNumber}`);
                    console.log(`   트랜잭션 해시: ${event.transactionHash}`);
                    console.log(`   로그 인덱스: ${event.logIndex}`);
                    console.log('');
                });

            } else {
                console.log('⚠️ 최근 1000개 블록에서도 PostLiked 이벤트를 찾을 수 없습니다.');
                console.log('   이는 다음 중 하나를 의미합니다:');
                console.log('   1. PostLiked 이벤트가 실제로 emit되지 않음');
                console.log('   2. onTransferReceived 함수가 실행되지 않음');
                console.log('   3. 컨트랙트 배포 시 문제가 있었음');
                console.log('   4. ABI가 잘못됨');
            }

        } catch (error) {
            console.log(`❌ PostLiked 이벤트 검색 실패: ${error.message}`);
        }

        console.log('\n🔍 PostLiked 이벤트 넓은 범위 확인 완료!');

    } catch (error) {
        console.error('❌ PostLiked 이벤트 확인 실패:', error.message);
    }
}

// 스크립트 실행
checkPostLikedEventsWide();
