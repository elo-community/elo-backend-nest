"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("../auth/auth.service");
const sse_service_1 = require("../services/sse.service");
let SseController = class SseController {
    sseService;
    authService;
    constructor(sseService, authService) {
        this.sseService = sseService;
        this.authService = authService;
    }
    async subscribeToNotifications(token, req, res) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token is required');
        }
        try {
            const payload = this.authService.verifyToken(token);
            const user = {
                id: payload.sub,
                email: payload.email,
                walletUserId: payload.walletUserId || '',
                tokenAmount: payload.tokenAmount || 0,
                availableToken: payload.availableToken || 0,
                createdAt: new Date()
            };
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control, Last-Event-ID',
                'X-Accel-Buffering': 'no',
            });
            res.flushHeaders?.();
            res.socket?.setKeepAlive(true);
            res.write(`data: ${JSON.stringify({
                type: 'CONNECTION_ESTABLISHED',
                data: {
                    message: 'SSE 연결이 설정되었습니다.',
                    userId: user.id,
                    userEmail: user.email
                },
                timestamp: new Date().toISOString(),
            })}\n\n`);
            const heartbeat = setInterval(() => {
                res.write(`: ping ${Date.now()}\n\n`);
            }, 15000);
            const notificationStream = this.sseService.registerUser(user.id);
            let closed = false;
            const cleanup = () => {
                if (closed)
                    return;
                closed = true;
                clearInterval(heartbeat);
                try {
                    this.sseService.unregisterUser(user.id);
                }
                catch { }
                try {
                    res.end();
                }
                catch { }
                subscription.unsubscribe();
                req.removeListener('aborted', cleanup);
                res.removeListener('close', cleanup);
                res.removeListener('error', cleanup);
            };
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
            res.on('close', () => {
                subscription.unsubscribe();
            });
            res.on('close', cleanup);
            res.on('error', cleanup);
            req.on('aborted', cleanup);
        }
        catch (error) {
            console.error('JWT verification failed:', error);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token' }));
        }
    }
    async getHealth(token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Token is required');
        }
        try {
            const payload = this.authService.verifyToken(token);
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
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
    onModuleDestroy() {
        this.sseService.cleanupAllConnections();
    }
};
exports.SseController = SseController;
__decorate([
    (0, common_1.Get)('subscribe'),
    __param(0, (0, common_1.Query)('token')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Request, Object]),
    __metadata("design:returntype", Promise)
], SseController.prototype, "subscribeToNotifications", null);
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SseController.prototype, "getHealth", null);
exports.SseController = SseController = __decorate([
    (0, common_1.Controller)('sse'),
    __metadata("design:paramtypes", [sse_service_1.SseService,
        auth_service_1.AuthService])
], SseController);
//# sourceMappingURL=sse.controller.js.map