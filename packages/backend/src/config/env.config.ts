import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'elo_community',
}));

export const jwtConfig = registerAs('jwt', () => ({
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));

export const awsConfig = registerAs('aws', () => ({
    region: process.env.AWS_REGION || 'ap-northeast-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3BucketName: process.env.AWS_S3_BUCKET_NAME,
}));

export const blockchainConfig = registerAs('blockchain', () => ({
    // 현재 활성화된 네트워크 (기본값: amoy)
    activeNetwork: process.env.NETWORK || 'amoy',

    // Polygon Amoy Testnet
    amoy: {
        name: 'Polygon Amoy Testnet',
        rpcUrl: process.env.RPC_AMOY || 'https://rpc-amoy.polygon.technology',
        chainId: parseInt(process.env.CHAIN_AMOY_ID || '80002', 10),
        explorer: 'https://www.oklink.com/amoy',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        }
    },

    // Very Testnet
    very: {
        name: 'Very Testnet',
        rpcUrl: process.env.RPC_VERY || 'https://rpc.very.network',
        chainId: parseInt(process.env.CHAIN_VERY_ID || '80002', 10),
        explorer: 'https://explorer.very.network',
        nativeCurrency: {
            name: 'VERY',
            symbol: 'VERY',
            decimals: 18
        }
    },

    // 관리자 계정
    admin: {
        privateKey: process.env.ADMIN_PRIV_KEY,
        address: process.env.ADMIN_ADDRESS,
    },

    // 서명자 계정
    signer: {
        privateKey: process.env.SIGNER_PRIV_KEY,
        address: process.env.SIGNER_ADDRESS,
    },

    // 신뢰할 수 있는 서명자
    trustedSigner: {
        privateKey: process.env.TRUSTED_SIGNER_PRIV_KEY,
        address: process.env.TRUSTED_SIGNER_ADDRESS,
    },

    // 컨트랙트 주소들
    contracts: {
        // 토큰 컨트랙트
        trivusExp: {
            amoy: process.env.TRIVUS_EXP_1363_AMOY,
            very: process.env.TRIVUS_EXP_VERY,
        },

        // 좋아요 시스템 컨트랙트
        postLikeSystem: {
            amoy: process.env.POST_LIKE_SYSTEM_AMOY,
            very: process.env.POST_LIKE_SYSTEM_VERY,
        },

        // 분배자 컨트랙트
        distributor: {
            amoy: process.env.DISTRIBUTOR_AMOY,
            very: process.env.DISTRIBUTOR_VERY,
        },

        // 리워드 풀 컨트랙트
        rewardPool: {
            amoy: process.env.REWARD_POOL_AMOY,
            very: process.env.REWARD_POOL_VERY,
        },
    },

    // 네트워크별 설정
    networkSettings: {
        // 폴링 간격 (밀리초)
        pollingInterval: parseInt(process.env.BLOCKCHAIN_POLLING_INTERVAL || '15000', 10),

        // 블록 확인 범위
        blockRange: parseInt(process.env.BLOCKCHAIN_BLOCK_RANGE || '10', 10),

        // 가스 가격 설정
        gasPrice: {
            amoy: process.env.GAS_PRICE_AMOY || 'auto',
            very: process.env.GAS_PRICE_VERY || 'auto',
        },

        // 가스 한도 설정
        gasLimit: {
            amoy: parseInt(process.env.GAS_LIMIT_AMOY || '300000', 10),
            very: parseInt(process.env.GAS_LIMIT_VERY || '300000', 10),
        }
    }
}));

export const appConfig = registerAs('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
        'https://www.trivus.net',
        'https://trivus.net',
        'http://localhost:3009'
    ],
})); 