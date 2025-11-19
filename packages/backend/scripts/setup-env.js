#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 환경변수 파일 자동 설정 스크립트
 * 사용법: node scripts/setup-env.js [network] [environment]
 * 예시: node scripts/setup-env.js amoy local
 */

const NETWORKS = ['amoy', 'very'];
const ENVIRONMENTS = ['local', 'production'];

function printUsage() {
    console.log('\n🔧 환경변수 파일 자동 설정 스크립트');
    console.log('\n사용법:');
    console.log('  node scripts/setup-env.js [network] [environment]');
    console.log('\n예시:');
    console.log('  node scripts/setup-env.js amoy local      # Polygon Amoy 로컬 개발용');
    console.log('  node scripts/setup-env.js amoy production # Polygon Amoy 배포용');
    console.log('  node scripts/setup-env.js very local      # Very 로컬 개발용');
    console.log('  node scripts/setup-env.js very production # Very 배포용');
    console.log('\n지원 네트워크:', NETWORKS.join(', '));
    console.log('지원 환경:', ENVIRONMENTS.join(', '));
}

function createEnvFile(network, environment) {
    const fileName = `.env.${network}.${environment}`;

    // 루트 디렉토리에 파일 생성
    const filePath = path.join(process.cwd(), '..', '..', fileName);

    // 템플릿 파일 경로 (docs 폴더의 예제 파일 사용)
    const templatePath = path.join(process.cwd(), '..', '..', 'docs', `env.example.${network}`);

    if (fs.existsSync(templatePath)) {
        // 템플릿 파일이 있으면 복사
        try {
            fs.copyFileSync(templatePath, filePath);
            console.log(`✅ ${fileName} 파일이 생성되었습니다 (템플릿에서 복사)`);
            console.log(`   위치: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ ${fileName} 파일 생성 실패:`, error.message);
            return false;
        }
    } else {
        // 템플릿 파일이 없으면 기본 내용으로 생성
        const defaultContent = generateDefaultEnvContent(network, environment);
        try {
            fs.writeFileSync(filePath, defaultContent);
            console.log(`✅ ${fileName} 파일이 생성되었습니다 (기본 템플릿)`);
            console.log(`   위치: ${filePath}`);
            return true;
        } catch (error) {
            console.error(`❌ ${fileName} 파일 생성 실패:`, error.message);
            return false;
        }
    }
}

function generateDefaultEnvContent(network, environment) {
    const networkUpper = network.toUpperCase();
    const envUpper = environment.toUpperCase();

    return `# ${networkUpper} ${envUpper} 환경 설정
# 이 파일을 편집하여 실제 값으로 변경하세요

# 네트워크 및 환경 설정
NETWORK=${network}
NODE_ENV=${environment}

# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
DB_DATABASE=elo_community

# JWT 설정
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# AWS 설정
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# ${networkUpper} 네트워크 설정
RPC_${networkUpper}=https://rpc-${network}.example.com
CHAIN_${networkUpper}_ID=80002
GAS_PRICE_${networkUpper}=auto
GAS_LIMIT_${networkUpper}=300000

# ${networkUpper} 컨트랙트 주소
TRIVUS_EXP_1363_${networkUpper}=0x0000000000000000000000000000000000000000
POST_LIKE_SYSTEM_${networkUpper}=0x0000000000000000000000000000000000000000
DISTRIBUTOR_${networkUpper}=0x0000000000000000000000000000000000000000
REWARD_POOL_${networkUpper}=0x0000000000000000000000000000000000000000

# 계정 설정
ADMIN_PRIV_KEY=your_admin_private_key_here
ADMIN_ADDRESS=your_admin_address_here
SIGNER_PRIV_KEY=your_signer_private_key_here
SIGNER_ADDRESS=your_signer_address_here
TRUSTED_SIGNER_PRIV_KEY=your_trusted_signer_private_key_here
TRUSTED_SIGNER_ADDRESS=your_trusted_signer_address_here

# 블록체인 설정
BLOCKCHAIN_POLLING_INTERVAL=15000
BLOCKCHAIN_BLOCK_RANGE=10

# 앱 설정
PORT=3000
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
LOG_LEVEL=log
`;
}

function setupAllEnvironments() {
    console.log('\n🔧 모든 환경변수 파일 설정 중...\n');

    let successCount = 0;
    let totalCount = 0;

    for (const network of NETWORKS) {
        for (const environment of ENVIRONMENTS) {
            totalCount++;
            if (createEnvFile(network, environment)) {
                successCount++;
            }
            console.log(''); // 빈 줄 추가
        }
    }

    console.log(`\n📊 설정 완료: ${successCount}/${totalCount} 파일 생성됨`);

    if (successCount === totalCount) {
        console.log('\n✅ 모든 환경변수 파일이 성공적으로 생성되었습니다!');
        console.log('\n다음 단계:');
        console.log('1. 각 .env 파일을 편집하여 실제 값으로 변경하세요');
        console.log('2. 애플리케이션을 실행하세요: npm run start:dev');
    } else {
        console.log('\n⚠️ 일부 파일 생성에 실패했습니다. 수동으로 확인해주세요.');
    }
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        // 인자가 없으면 모든 환경 설정
        setupAllEnvironments();
        return;
    }

    if (args.length !== 2) {
        console.error('❌ 잘못된 인자 개수');
        printUsage();
        process.exit(1);
    }

    const [network, environment] = args;

    if (!NETWORKS.includes(network)) {
        console.error(`❌ 지원하지 않는 네트워크: ${network}`);
        console.error(`지원 네트워크: ${NETWORKS.join(', ')}`);
        process.exit(1);
    }

    if (!ENVIRONMENTS.includes(environment)) {
        console.error(`❌ 지원하지 않는 환경: ${environment}`);
        console.error(`지원 환경: ${ENVIRONMENTS.join(', ')}`);
        process.exit(1);
    }

    console.log(`\n🔧 ${network.toUpperCase()} ${environment.toUpperCase()} 환경 설정 중...\n`);
    createEnvFile(network, environment);

    console.log('\n✅ 설정 완료!');
    console.log('\n다음 단계:');
    console.log(`1. .env.${network}.${environment} 파일을 편집하여 실제 값으로 변경하세요`);
    console.log('2. 애플리케이션을 실행하세요: npm run start:dev');
}

if (require.main === module) {
    main();
}

module.exports = { createEnvFile, setupAllEnvironments };
