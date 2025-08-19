const { ethers } = require('ethers');

// Amoy 테스트넷 RPC URL
const RPC_URL = 'https://rpc-amoy.polygon.technology';

// PostLikeSystem1363 컨트랙트 주소
const POST_LIKE_SYSTEM_ADDRESS = '0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA';

// PostLiked 이벤트 ABI
const POST_LIKED_EVENT_ABI = [
    'event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp)'
];

async function checkPostLikedEvents() {
    try {
        console.log('🔍 PostLiked 이벤트 확인 중...\n');

        // Provider 연결
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log(`✅ RPC 연결됨: ${RPC_URL}\n`);

        // PostLikeSystem1363 컨트랙트
        const postLikeContract = new ethers.Contract(POST_LIKE_SYSTEM_ADDRESS, POST_LIKED_EVENT_ABI, provider);

        // 최근 블록 번호 가져오기
        const latestBlock = await provider.getBlockNumber();
        console.log(`📍 최근 블록 번호: ${latestBlock}`);

        // 최근 100개 블록에서 PostLiked 이벤트 검색
        const fromBlock = Math.max(0, latestBlock - 100);
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
                events.forEach((event, index) => {
                    console.log(`📋 이벤트 ${index + 1}:`);
                    console.log(`   블록: ${event.blockNumber}`);
                    console.log(`   트랜잭션 해시: ${event.transactionHash}`);
                    console.log(`   로그 인덱스: ${event.logIndex}`);
                    console.log(`   토픽: ${event.topics.join(', ')}`);
                    console.log(`   데이터: ${event.data}`);
                    console.log('');
                });

                // 이벤트 파싱 시도
                console.log('🔍 이벤트 파싱 시도...\n');

                for (let i = 0; i < Math.min(events.length, 3); i++) {
                    try {
                        const event = events[i];
                        const parsedEvent = postLikeContract.interface.parseLog(event);

                        console.log(`📋 파싱된 이벤트 ${i + 1}:`);
                        console.log(`   postId: ${parsedEvent.args[0]}`);
                        console.log(`   user: ${parsedEvent.args[1]}`);
                        console.log(`   amount: ${ethers.formatEther(parsedEvent.args[2])} EXP`);
                        console.log(`   timestamp: ${parsedEvent.args[3]}`);
                        console.log('');

                    } catch (parseError) {
                        console.log(`❌ 이벤트 ${i + 1} 파싱 실패: ${parseError.message}\n`);
                    }
                }
            } else {
                console.log('⚠️ 최근 100개 블록에서 PostLiked 이벤트를 찾을 수 없습니다.');
                console.log('   - 이벤트가 발생하지 않았거나');
                console.log('   - ABI가 잘못되었거나');
                console.log('   - 컨트랙트에서 이벤트를 emit하지 않았을 수 있습니다.');
            }

        } catch (error) {
            console.log(`❌ PostLiked 이벤트 검색 실패: ${error.message}`);
        }

        console.log('\n🔍 PostLiked 이벤트 확인 완료!');

    } catch (error) {
        console.error('❌ PostLiked 이벤트 확인 실패:', error.message);
    }
}

// 스크립트 실행
checkPostLikedEvents();
