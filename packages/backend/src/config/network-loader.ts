import { config } from 'dotenv';
import { join } from 'path';

/**
 * 네트워크별 환경변수 로더
 * ACTIVE_NETWORK과 NODE_ENV 환경변수에 따라 해당 네트워크와 환경의 설정을 로드
 */
export class NetworkLoader {
    private static instance: NetworkLoader;
    private currentNetwork: string;
    private currentEnvironment: string;

    private constructor() {
        this.currentNetwork = process.env.ACTIVE_NETWORK || 'amoy';
        this.currentEnvironment = process.env.NODE_ENV || 'local';
    }

    public static getInstance(): NetworkLoader {
        if (!NetworkLoader.instance) {
            NetworkLoader.instance = new NetworkLoader();
        }
        return NetworkLoader.instance;
    }

    /**
     * 현재 활성화된 네트워크 반환
     */
    public getCurrentNetwork(): string {
        return this.currentNetwork;
    }

    /**
     * 현재 활성화된 환경 반환
     */
    public getCurrentEnvironment(): string {
        return this.currentEnvironment;
    }

    /**
     * 네트워크별 환경변수 파일 로드
     */
    public loadNetworkConfig(): void {
        const network = this.currentNetwork;
        const environment = this.currentEnvironment;

        // 환경별 파일 우선순위
        const envFiles = [
            `.env.${network}.${environment}`,  // 1순위: .env.amoy.local, .env.very.deploy 등
            `.env.${network}`,                // 2순위: .env.amoy, .env.very
            `.env.${environment}`,            // 3순위: .env.local, .env.deploy
            '.env'                            // 4순위: 기본 .env
        ];

        let loadedFile = '';

        for (const envFile of envFiles) {
            const envPath = join(process.cwd(), envFile);

            try {
                const result = config({ path: envPath });

                if (!result.error) {
                    loadedFile = envFile;
                    console.log(`✅ Loaded environment configuration: ${envFile}`);
                    break;
                }
            } catch (error) {
                // 파일이 없거나 읽을 수 없는 경우 다음 파일 시도
                continue;
            }
        }

        if (!loadedFile) {
            console.warn(`⚠️  No environment configuration files found`);
            console.warn(`   Tried: ${envFiles.join(', ')}`);
            console.warn(`   Using default environment variables`);
        }

        // 네트워크 정보 출력
        this.printNetworkInfo();
    }

    /**
     * 네트워크 변경 (런타임에 동적으로 변경 가능)
     */
    public switchNetwork(network: string): void {
        if (['amoy', 'very'].includes(network)) {
            this.currentNetwork = network;
            process.env.ACTIVE_NETWORK = network;
            console.log(`🔄 Switched to network: ${network.toUpperCase()}`);
            this.loadNetworkConfig(); // 새로운 네트워크 설정 로드
        } else {
            throw new Error(`Unsupported network: ${network}. Supported networks: amoy, very`);
        }
    }

    /**
     * 환경 변경 (런타임에 동적으로 변경 가능)
     */
    public switchEnvironment(environment: string): void {
        if (['local', 'deploy'].includes(environment)) {
            this.currentEnvironment = environment;
            process.env.NODE_ENV = environment;
            console.log(`🔄 Switched to environment: ${environment.toUpperCase()}`);
            this.loadNetworkConfig(); // 새로운 환경 설정 로드
        } else {
            throw new Error(`Unsupported environment: ${environment}. Supported environments: local, deploy`);
        }
    }

    /**
     * 네트워크 정보 출력
     */
    public printNetworkInfo(): void {
        const network = this.currentNetwork;
        const environment = this.currentEnvironment;

        console.log(`\n🌐 Current Configuration:`);
        console.log(`   Network: ${network.toUpperCase()}`);
        console.log(`   Environment: ${environment.toUpperCase()}`);

        // 네트워크별 설정 정보 출력
        const networkConfigs = {
            amoy: {
                name: 'Polygon Amoy Testnet',
                rpc: process.env.RPC_AMOY,
                chainId: process.env.CHAIN_AMOY_ID,
                contracts: {
                    trivusExp: process.env.TRIVUS_EXP_1363_AMOY,
                    postLikeSystem: process.env.POST_LIKE_SYSTEM_AMOY
                }
            },
            very: {
                name: 'Very Testnet',
                rpc: process.env.RPC_VERY,
                chainId: process.env.CHAIN_VERY_ID,
                contracts: {
                    trivusExp: process.env.TRIVUS_EXP_VERY,
                    postLikeSystem: process.env.POST_LIKE_SYSTEM_VERY
                }
            }
        };

        const config = networkConfigs[network];
        if (config) {
            console.log(`   Network Name: ${config.name}`);
            console.log(`   RPC URL: ${config.rpc || 'Not set'}`);
            console.log(`   Chain ID: ${config.chainId || 'Not set'}`);
            console.log(`   Contracts:`);
            console.log(`     TrivusEXP: ${config.contracts.trivusExp || 'Not set'}`);
            console.log(`     PostLikeSystem: ${config.contracts.postLikeSystem || 'Not set'}`);
        }

        console.log(`   Settings:`);
        console.log(`     Polling Interval: ${process.env.BLOCKCHAIN_POLLING_INTERVAL || '15000'}ms`);
        console.log(`     Block Range: ${process.env.BLOCKCHAIN_BLOCK_RANGE || '10'}`);
        console.log(`     Gas Price: ${process.env[`GAS_PRICE_${network.toUpperCase()}`] || 'auto'}`);
        console.log(`     Gas Limit: ${process.env[`GAS_LIMIT_${network.toUpperCase()}`] || '300000'}`);
        console.log('');
    }

    /**
     * 사용 가능한 환경 파일 목록 출력
     */
    public listAvailableEnvironments(): void {
        console.log(`\n📁 Available Environment Files:`);
        console.log(`   Local Development:`);
        console.log(`     .env.amoy.local     - Polygon Amoy 로컬 개발`);
        console.log(`     .env.very.local     - Very 로컬 개발`);
        console.log(`   Deployment:`);
        console.log(`     .env.amoy.deploy    - Polygon Amoy 배포`);
        console.log(`     .env.very.deploy    - Very 배포`);
        console.log(`   Fallback:`);
        console.log(`     .env.amoy           - Polygon Amoy 기본`);
        console.log(`     .env.very           - Very 기본`);
        console.log(`     .env                - 기본 환경변수`);
        console.log('');
    }
}

/**
 * 네트워크 로더 초기화 및 사용 예시
 */
export function initializeNetwork(): void {
    const loader = NetworkLoader.getInstance();
    loader.loadNetworkConfig();
    loader.listAvailableEnvironments();
}
