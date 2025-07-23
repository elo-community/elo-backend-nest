import { Body, Controller, HttpStatus, Inject, Logger, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../services/user.service';

// NOTE: 앞으로 생성할 컨트롤러는 모두 복수형 경로로 작성 (예: users, posts, comments, auths)
@Controller('auth')
export class AuthController {

    private readonly logger = new Logger(AuthController.name);

    constructor(
        @Inject(UserService) private readonly userService: UserService,
        private readonly authService: AuthService,
    ) { }

    @Post('login')
    async login(
        @Body() body: { email?: string; accounts?: any[]; idToken: string },
        @Res() res: Response,
    ) {
        const { email, accounts, idToken } = body;
        let decoded: any;
        try {
            // decoded = jwt.verify(idToken, process.env.ID_TOKEN_PUBLIC_KEY as string);
            decoded = jwt.decode(idToken);
        } catch (e) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ status: 'error', error: 'Invalid idToken' });
        }
        this.logger.log(decoded);
        const userEmail = decoded.email || email;
        const userId = decoded.user_id;
        let user = userEmail ? await this.userService.findByEmail(userEmail) : null;
        if (!user && userId) {
            user = await this.userService.findByWalletUserId(userId);
        }
        if (!user) {
            const evmVeryAccount = (accounts || []).find(acc => acc.network === 'evmVERY');
            const walletAddress = evmVeryAccount ? evmVeryAccount.address : undefined;
            user = await this.userService.create({
                email: userEmail,
                walletUserId: userId, // 반드시 할당!
                addresses: accounts,
                walletAddress,
            });
        }
        // JWT 발급을 AuthService로 위임
        const { access_token } = await this.authService.login({
            id: user.id,
            username: user.email ?? '',
            walletAddress: user.walletAddress,
        });
        return res.json({ status: 'success', accessToken: access_token });
    }
} 