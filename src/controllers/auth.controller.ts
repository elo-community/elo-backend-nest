import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { UserService } from '../services/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
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
      const email = loginDto.email;

      // accounts 배열에서 evmVERY 네트워크의 주소 찾기
      const walletAddress = loginDto.accounts?.find(account => account.network === 'evmVERY').address;


      // 기존 사용자 찾기 (email 또는 walletUserId로)
      let user = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.userService.findByWalletUserId(walletUserId);
      }

      // 사용자가 없으면 새로 생성
      if (!user) {
        user = await this.userService.create({
          walletUserId: walletUserId,
          walletAddress: walletAddress,
          email: email,
        });
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
  @Post('verify')
  async verifyToken() {
    return {
      success: true,
      message: 'Token is valid',
    };
  }
}
