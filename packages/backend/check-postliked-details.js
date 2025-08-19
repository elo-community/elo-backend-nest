const { ethers } = require('ethers');

// Amoy 테스트넷 RPC URL
const RPC_URL = 'https://rpc-amoy.polygon.technology';

// PostLikeSystem1363 컨트랙트 주소
const POST_LIKE_SYSTEM_ADDRESS = '0xc5acB89285F9F0417A8172cd5530C5Ad15Cf41AA';

// PostLiked 이벤트 ABI
const POST_LIKED_EVENT_ABI = [
    'event PostLiked(uint256 indexed postId, address indexed user, uint256 amount, uint256 timestamp)'
];

async function checkPostLikedDetails() {
    try {
        console.log('🔍 PostLiked 이벤트 상세 확인 중...\n');

        // Provider 연결
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        console.log(`✅ RPC 연결됨: ${RPC_URL}\n`);

        // PostLikeSystem1363 컨트랙트
        const postLikeContract = new ethers.Contract(POST_LIKE_SYSTEM_ADDRESS, POST_LIKED_EVENT_ABI, provider);

        // 최근 1000개 블록에서 PostLiked 이벤트 검색
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latestBlock - 1000);
        const toBlock = latestBlock;

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
                // 각 이벤트를 파싱하여 postId 확인
                const postIdCounts = {};
                const userPostIds = {};

                for (let i = 0; i < events.length; i++) {
                    try {
                        const event = events[i];
                        const parsedEvent = postLikeContract.interface.parseLog(event);

                        const postId = Number(parsedEvent.args[0]);
                        const user = parsedEvent.args[1];
                        const amount = ethers.formatEther(parsedEvent.args[2]);
                        const timestamp = Number(parsedEvent.args[3]);

                        // postId별 카운트
                        postIdCounts[postId] = (postIdCounts[postId] || 0) + 1;

                        // 사용자별 postId 기록
                        if (!userPostIds[user]) {
                            userPostIds[user] = [];
                        }
                        userPostIds[user].push(postId);

                        console.log(`📋 이벤트 ${i + 1}:`);
                        console.log(`   블록: ${event.blockNumber}`);
                        console.log(`   트랜잭션: ${event.transactionHash}`);
                        console.log(`   postId: ${postId}`);
                        console.log(`   user: ${user}`);
                        console.log(`   amount: ${amount} EXP`);
                        console.log(`   timestamp: ${timestamp}`);
                        console.log('');

                    } catch (parseError) {
                        console.log(`❌ 이벤트 ${i + 1} 파싱 실패: ${parseError.message}\n`);
                    }
                }

                // postId별 통계
                console.log('📊 PostId별 좋아요 통계:');
                Object.keys(postIdCounts).sort((a, b) => Number(a) - Number(b)).forEach(postId => {
                    console.log(`   postId ${postId}: ${postIdCounts[postId]}개 좋아요`);
                });

                console.log('\n👥 사용자별 좋아요한 postId:');
                Object.keys(userPostIds).forEach(user => {
                    console.log(`   ${user}: postId [${userPostIds[user].join(', ')}]`);
                });

            } else {
                console.log('⚠️ PostLiked 이벤트를 찾을 수 없습니다.');
            }

        } catch (error) {
            console.log(`❌ PostLiked 이벤트 검색 실패: ${error.message}`);
        }

        console.log('\n🔍 PostLiked 이벤트 상세 확인 완료!');

    } catch (error) {
        console.error('❌ PostLiked 이벤트 확인 실패:', error.message);
    }
}

// 스크립트 실행
checkPostLikedDetails();
