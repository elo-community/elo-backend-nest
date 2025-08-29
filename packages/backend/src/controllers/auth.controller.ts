import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly sportCategoryService: SportCategoryService,
  ) { }

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: { accounts: any[]; email: string; idToken: string },
  ) {
    try {
      // Google ID Token 디코드
      const decodedToken = jwtDecode(loginDto.idToken) as any;

      // 디코드된 토큰에서 정보 추출
      const walletUserId = decodedToken.user_id || `user_${Date.now()}`;
      const email = decodedToken.email;

      // accounts 배열에서 evmVERY 네트워크의 주소 찾기
      const walletAddress = loginDto.accounts?.find(account => account.network === 'evmVERY').address;


      // 기존 사용자 찾기 (email 또는 walletUserId로)
      let user = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.userService.findByWalletUserId(walletUserId);
      }

      // 이메일 인증 여부 확인
      if (decodedToken.email !== loginDto.email) {
        return {
          success: false,
          message: 'Login failed',
        };
      }

      // 사용자가 없으면 새로 생성
      if (!user) {
        user = await this.userService.create({
          walletUserId: walletUserId,
          walletAddress: walletAddress,
          email: email,
        });

        // 새로 생성된 사용자는 첫 로그인으로 간주
        console.log(`[AuthController] New user created: ${walletAddress}, performing initial token sync`);
      }

      // 첫 로그인 여부 확인 및 토큰 동기화
      const isFirstLogin = await this.userService.isFirstLogin(walletAddress);
      if (isFirstLogin) {
        try {
          console.log(`[AuthController] First login detected for ${walletAddress}, syncing token balance from blockchain`);

          // 블록체인에서 토큰 잔액 동기화
          user = await this.userService.syncTokenBalanceFromBlockchain(walletAddress);

          console.log(`[AuthController] Token balance synced for ${walletAddress}: ${user.tokenAmount} EXP`);
        } catch (syncError) {
          console.warn(`[AuthController] Token sync failed for ${walletAddress}: ${syncError.message}`);
          // 토큰 동기화 실패 시에도 로그인은 계속 진행
        }
      }

      return this.authService.login({
        id: user.id,
        username: user.email || user.walletUserId,
        walletAddress: user.walletAddress,
      });
    } catch (error) {
      return {
        success: false,
        message: 'Failed to process Google login',
        error: error.message
      };
    }
  }

  @Public()
  @Post('sample-login')

  async sampleLogin(
    @Body() loginDto: { userType: 'sample-user' | 'table-tennis-user' },
  ) {
    try {
      let walletAddress: string;
      let nickname: string;

      if (loginDto.userType === 'sample-user') {
        walletAddress = process.env.SAMPLE_USER_ADDRESS || 'sample-user-wallet';
        nickname = '샘플유저';
      } else if (loginDto.userType === 'table-tennis-user') {
        walletAddress = process.env.TABLE_TENNIS_USER_ADDRESS || '0x8313F74e78a2E1D7D6Bb27176100d88EE4028516';
        nickname = '탁구왕민수';
      } else {
        return {
          success: false,
          message: 'Invalid user type. Use "sample-user" or "table-tennis-user"',
        };
      }

      // 환경변수 확인
      if (!process.env.SAMPLE_USER_ADDRESS || !process.env.TABLE_TENNIS_USER_ADDRESS) {
        return {
          success: false,
          message: 'Sample user addresses not configured. Please check environment variables.',
        };
      }

      // 기존 사용자 찾기
      let user = await this.userService.findByWalletAddress(walletAddress);

      if (!user) {
        return {
          success: false,
          message: 'Sample user not found. Please start the application first to create sample users.',
        };
      }

      const loginResponse = await this.authService.login({
        id: user.id,
        username: user.email || user.walletUserId,
        walletAddress: user.walletAddress,
      });

      return {
        success: true,
        data: {
          user: {
            id: user.id,
            walletUserId: user.walletUserId,
            walletAddress: user.walletAddress,
            nickname: user.nickname,
            email: user.email,
            tokenAmount: user.tokenAmount,
            availableToken: user.availableToken,
          },
          accessToken: loginResponse.data?.accessToken,
        },
        message: `Logged in as ${nickname}`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to login with sample user',
        error: error.message
      };
    }
  }

  @Public()
  @Post('test-user')
  async createTestUser() {
    // 테스트용 사용자 생성
    const testUser = {
      walletUserId: `test-user-${Date.now()}`,
      walletAddress: `0x${Date.now().toString(16)}`,
      nickname: `TestUser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
    };

    const user = await this.userService.create(testUser);
    const loginResponse = await this.authService.login({
      id: user.id,
      username: user.email || user.walletUserId,
      walletAddress: user.walletAddress,
    });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          walletUserId: user.walletUserId,
          walletAddress: user.walletAddress,
          nickname: user.nickname,
          email: user.email,
        },
        accessToken: loginResponse.data?.accessToken,
        message: 'Test user created successfully',
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyToken() {
    return {
      success: true,
      message: 'Token is valid',
    };
  }

  /**
   * 사용자의 토큰 잔액을 블록체인에서 동기화 (수동)
   * @param walletAddress 지갑 주소
   * @returns 동기화 결과
   */
  @Public()
  @Post('sync-tokens')
  async syncUserTokens(@Body() body: { walletAddress: string }) {
    try {
      const { walletAddress } = body;

      if (!walletAddress) {
        return {
          success: false,
          message: 'Wallet address is required',
        };
      }

      // 사용자 존재 여부 확인
      const user = await this.userService.findByWalletAddress(walletAddress);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // 토큰 동기화 전 잔액
      const balanceBefore = user.tokenAmount || 0;

      // 블록체인에서 토큰 잔액 동기화
      const updatedUser = await this.userService.syncTokenBalanceFromBlockchain(walletAddress);

      // 동기화 후 잔액
      const balanceAfter = updatedUser.tokenAmount || 0;
      const balanceDifference = balanceAfter - balanceBefore;

      return {
        success: true,
        data: {
          walletAddress,
          balanceBefore,
          balanceAfter,
          balanceDifference,
          lastSyncAt: updatedUser.lastTokenSyncAt,
          message: balanceDifference !== 0
            ? `Token balance synced: ${balanceBefore} → ${balanceAfter} (${balanceDifference > 0 ? '+' : ''}${balanceDifference})`
            : 'Token balance already in sync'
        },
        message: 'Token synchronization completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sync tokens',
        error: error.message
      };
    }
  }

  /**
   * 사용자의 토큰 동기화 상태 확인
   * @param walletAddress 지갑 주소
   * @returns 동기화 상태 정보
   */
  @Public()
  @Post('token-sync-status')
  async getTokenSyncStatus(@Body() body: { walletAddress: string }) {
    try {
      const { walletAddress } = body;

      if (!walletAddress) {
        return {
          success: false,
          message: 'Wallet address is required',
        };
      }

      // 사용자 존재 여부 확인
      const user = await this.userService.findByWalletAddress(walletAddress);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // 첫 로그인 여부 확인
      const isFirstLogin = await this.userService.isFirstLogin(walletAddress);

      // 토큰 정보 조회
      const tokenInfo = await this.userService.getUserTokenInfo(walletAddress);

      return {
        success: true,
        data: {
          walletAddress,
          isFirstLogin,
          lastTokenSyncAt: user.lastTokenSyncAt,
          tokenInfo,
          syncStatus: isFirstLogin ? 'NEVER_SYNCED' : 'SYNCED',
          message: isFirstLogin
            ? 'User has never synced tokens from blockchain'
            : `Last synced at: ${user.lastTokenSyncAt}`
        },
        message: 'Token sync status retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get token sync status',
        error: error.message
      };
    }
  }
}
