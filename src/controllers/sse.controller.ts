import { Controller, Get, OnModuleDestroy, Query, Res, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { JwtUser } from '../auth/jwt-user.interface';
import { SseService } from '../services/sse.service';

@Controller('sse')
export class SseController implements OnModuleDestroy {
    constructor(
        private readonly sseService: SseService,
        private readonly authService: AuthService,
    ) { }

    @Get('subscribe')
    async subscribeToNotifications(
        @Query('token') token: string,
        @Res() res: Response,
    ): Promise<void> {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        try {
            // JWT 토큰 검증 - AuthService를 통해 검증
            const payload = this.authService.verifyToken(token) as any;
            const user: JwtUser = {
                id: payload.sub,
                email: payload.email,
                walletUserId: payload.walletUserId || '',
                tokenAmount: payload.tokenAmount || 0,
                availableToken: payload.availableToken || 0,
                createdAt: new Date()
            };

            // SSE 헤더 설정
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
            });

            // 연결 확인 메시지 전송
            res.write(`data: ${JSON.stringify({
                type: 'CONNECTION_ESTABLISHED',
                data: {
                    message: 'SSE 연결이 설정되었습니다.',
                    userId: user.id,
                    userEmail: user.email
                },
                timestamp: new Date().toISOString(),
            })}\n\n`);

            // 사용자 등록 및 알림 구독
            const notificationStream = this.sseService.registerUser(user.id);

            // 클라이언트 연결 해제 감지
            const cleanup = () => {
                this.sseService.unregisterUser(user.id);
                res.end();
            };

            // 클라이언트 연결 해제 이벤트 리스너
            res.on('close', cleanup);
            res.on('error', cleanup);

            // 알림 스트림 구독
            const subscription = notificationStream.subscribe({
                next: (event) => {
                    const sseData = `data: ${JSON.stringify(event)}\n\n`;
                    res.write(sseData);
                },
                error: (error) => {
                    console.error('SSE subscription error:', error);
                    cleanup();
                },
                complete: () => {
                    cleanup();
                },
            });

            // 클라이언트 연결 해제 시 구독 해제
            res.on('close', () => {
                subscription.unsubscribe();
            });

        } catch (error) {
            console.error('JWT verification failed:', error);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
        }
    }

    @Get('health')
    async getHealth(@Query('token') token: string) {
        if (!token) {
            throw new UnauthorizedException('Token is required');
        }

        try {
            const payload = this.authService.verifyToken(token) as any;
            const userId = payload.sub;

            const isConnected = this.sseService.isUserConnected(userId);
            const totalConnections = this.sseService.getConnectedUsersCount();

            return {
                success: true,
                data: {
                    isConnected,
                    connectedUsersCount: totalConnections,
                    totalConnections,
                    userId: userId,
                },
                message: 'SSE health check completed',
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }

    onModuleDestroy() {
        // 모듈이 파괴될 때 모든 SSE 연결 정리
        this.sseService.cleanupAllConnections();
    }
} 