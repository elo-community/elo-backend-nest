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
    amoy: {
        rpcUrl: process.env.RPC_AMOY,
        chainId: parseInt(process.env.CHAIN_AMOY_ID || '80002', 10),
    },
    very: {
        rpcUrl: process.env.RPC_VERY,
        chainId: parseInt(process.env.CHAIN_VERY_ID || '80002', 10),
    },
    admin: {
        privateKey: process.env.ADMIN_PRIV_KEY,
    },
    signer: {
        privateKey: process.env.SIGNER_PRIV_KEY,
    },
    contracts: {
        distributor: {
            amoy: process.env.DISTRIBUTOR_AMOY,
            very: process.env.DISTRIBUTOR_VERY,
        },
        rewardPool: {
            amoy: process.env.REWARD_POOL_AMOY,
            very: process.env.REWARD_POOL_VERY,
        },
    },
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