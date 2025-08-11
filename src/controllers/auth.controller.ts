import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { SportCategoryService } from '../services/sport-category.service';
import { UserService } from '../services/user.service';

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
        const categories = await this.sportCategoryService.findAll();
        user = await this.userService.createWithDefaultElos({
          walletUserId: walletUserId,
          walletAddress: walletAddress,
          email: email,
        }, categories);
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
        walletAddress = 'sample-user-wallet';
        nickname = '샘플유저';
      } else if (loginDto.userType === 'table-tennis-user') {
        walletAddress = 'table-tennis-user-wallet';
        nickname = '탁구왕민수';
      } else {
        return {
          success: false,
          message: 'Invalid user type. Use "sample-user" or "table-tennis-user"',
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
}
