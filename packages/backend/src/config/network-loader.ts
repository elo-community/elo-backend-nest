import { config } from 'dotenv';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * 네트워크별 환경변수 로더
 * NETWORK과 NODE_ENV 환경변수에 따라 해당 네트워크와 환경의 설정을 로드
 */
export class NetworkLoader {
  private static instance: NetworkLoader;
  private currentNetwork: string;
  private currentEnvironment: string;

  private constructor() {
    this.currentNetwork = process.env.NETWORK || 'amoy';
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
   * 환경변수 파일을 찾을 수 있는 경로들을 반환
   */
  private getPossiblePaths(): string[] {
    // 여러 가능한 경로들을 시도
    const possiblePaths = [
      process.cwd(), // 현재 작업 디렉토리
      dirname(process.argv[1]), // 스크립트 실행 디렉토리
      join(process.cwd(), '..', '..'), // 루트 디렉토리 (packages/backend에서 상위로)
      join(process.cwd(), '..'), // 상위 디렉토리
      join(process.cwd(), 'packages', 'backend'), // packages/backend
      join(process.cwd(), '..', 'packages', 'backend'), // 상위에서 packages/backend
      join(__dirname, '..', '..'), // src/config에서 상위로
      join(__dirname, '..', '..', '..'), // src/config에서 루트로
    ];

    // 중복 제거
    return [...new Set(possiblePaths)];
  }

  /**
   * 네트워크별 환경변수 파일 로드
   * NestJS ConfigModule이 로드되기 전에 호출되어야 함
   */
  public loadNetworkConfig(): void {
    const network = this.currentNetwork;
    const environment = this.currentEnvironment;

    // 환경별 파일 우선순위 (높은 우선순위부터)
    const envFiles = [
      `.env.${network}.${environment}`, // 1순위: .env.amoy.local, .env.very.deploy 등
      `.env.${network}`, // 2순위: .env.amoy, .env.very
      `.env.${environment}`, // 3순위: .env.local, .env.deploy
      '.env', // 4순위: 기본 .env
    ];

    let loadedFile = '';
    const loadedVars: string[] = [];
    const possiblePaths = this.getPossiblePaths();

    console.log(`🔍 환경변수 파일 검색 경로:`);
    possiblePaths.forEach((path, index) => {
      console.log(`   ${index + 1}. ${path}`);
    });

    // 각 환경변수 파일을 순서대로 로드
    for (const envFile of envFiles) {
      let fileFound = false;

      // 여러 경로에서 파일 찾기
      for (const basePath of possiblePaths) {
        const envPath = join(basePath, envFile);

        if (existsSync(envPath)) {
          try {
            const result = config({ path: envPath, override: true });

            if (!result.error) {
              loadedFile = envFile;
              fileFound = true;
              console.log(`✅ 환경변수 파일 로드됨: ${envFile} (경로: ${envPath})`);

              // 로드된 환경변수 키들을 수집
              if (result.parsed) {
                Object.keys(result.parsed).forEach(key => {
                  if (!loadedVars.includes(key)) {
                    loadedVars.push(key);
                  }
                });
              }
              break; // 파일을 찾았으면 다음 파일로
            }
          } catch (error) {
            console.warn(`⚠️ 환경변수 파일 로드 실패: ${envFile} (${envPath})`, error.message);
          }
        }
      }

      if (fileFound) {
        break; // 우선순위가 높은 파일을 찾았으면 중단
      }
    }

    if (!loadedFile) {
      console.warn(`⚠️ 환경변수 파일을 찾을 수 없습니다`);
      console.warn(`   시도한 파일들: ${envFiles.join(', ')}`);
      console.warn(`   시도한 경로들: ${possiblePaths.join(', ')}`);
      console.warn(`   기본 환경변수를 사용합니다`);
    } else {
      console.log(`📊 총 ${loadedVars.length}개의 환경변수가 로드되었습니다`);
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
      process.env.NETWORK = network;
      console.log(`🔄 네트워크 변경됨: ${network.toUpperCase()}`);
      this.loadNetworkConfig(); // 새로운 네트워크 설정 로드
    } else {
      throw new Error(`지원하지 않는 네트워크: ${network}. 지원 네트워크: amoy, very`);
    }
  }

  /**
   * 환경 변경 (런타임에 동적으로 변경 가능)
   */
  public switchEnvironment(environment: string): void {
    if (['local', 'production'].includes(environment)) {
      this.currentEnvironment = environment;
      process.env.NODE_ENV = environment;
      console.log(`🔄 환경 변경됨: ${environment.toUpperCase()}`);
      this.loadNetworkConfig(); // 새로운 환경 설정 로드
    } else {
      throw new Error(`지원하지 않는 환경: ${environment}. 지원 환경: local, production`);
    }
  }

  /**
   * 네트워크 정보 출력
   */
  public printNetworkInfo(): void {
    const network = this.currentNetwork;
    const environment = this.currentEnvironment;

    console.log(`\n🌐 현재 설정:`);
    console.log(`   네트워크: ${network.toUpperCase()}`);
    console.log(`   환경: ${environment.toUpperCase()}`);

    // 네트워크별 설정 정보 출력
    const networkConfigs = {
      amoy: {
        name: 'Polygon Amoy 테스트넷',
        rpc: process.env.RPC_AMOY,
        chainId: process.env.CHAIN_AMOY_ID,
        contracts: {
          trivusExp: process.env.TRIVUS_EXP_1363_AMOY,
          postLikeSystem: process.env.POST_LIKE_SYSTEM_AMOY,
        },
      },
      very: {
        name: 'Very 메인넷',
        rpc: process.env.RPC_VERY,
        chainId: process.env.CHAIN_VERY_ID,
        contracts: {
          trivusExp: process.env.TRIVUS_EXP_1363_VERY,
          postLikeSystem: process.env.POST_LIKE_SYSTEM_VERY,
        },
      },
    };

    const config = networkConfigs[network];
    if (config) {
      console.log(`   네트워크 이름: ${config.name}`);
      console.log(`   RPC URL: ${config.rpc || '설정되지 않음'}`);
      console.log(`   체인 ID: ${config.chainId || '설정되지 않음'}`);
      console.log(`   컨트랙트:`);
      console.log(`     TrivusEXP: ${config.contracts.trivusExp || '설정되지 않음'}`);
      console.log(`     PostLikeSystem: ${config.contracts.postLikeSystem || '설정되지 않음'}`);
    }

    console.log(`   설정:`);
    console.log(`     폴링 간격: ${process.env.BLOCKCHAIN_POLLING_INTERVAL || '15000'}ms`);
    console.log(`     블록 범위: ${process.env.BLOCKCHAIN_BLOCK_RANGE || '10'}`);
    console.log(`     가스 가격: ${process.env[`GAS_PRICE_${network.toUpperCase()}`] || '자동'}`);
    console.log(`     가스 한도: ${process.env[`GAS_LIMIT_${network.toUpperCase()}`] || '300000'}`);
    console.log('');
  }

  /**
   * 환경변수 파일 존재 여부 확인
   */
  public checkEnvironmentFiles(): void {
    console.log(`\n🔍 환경변수 파일 상태 확인:`);

    const network = this.currentNetwork;
    const environment = this.currentEnvironment;

    const envFiles = [
      { name: `.env.${network}.${environment}`, priority: '1순위' },
      { name: `.env.${network}`, priority: '2순위' },
      { name: `.env.${environment}`, priority: '3순위' },
      { name: '.env', priority: '4순위' },
    ];

    for (const file of envFiles) {
      const filePath = join(process.cwd(), file.name);
      const exists = existsSync(filePath);
      const status = exists ? '✅ 존재' : '❌ 없음';
      console.log(`   ${file.priority}: ${file.name} - ${status}`);
    }
    console.log('');
  }
}

/**
 * 네트워크 로더 초기화 및 사용 예시
 */
export function initializeNetwork(): void {
  const loader = NetworkLoader.getInstance();
  loader.loadNetworkConfig();
  loader.checkEnvironmentFiles();
}
