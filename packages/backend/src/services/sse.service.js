"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let SseService = SseService_1 = class SseService {
    logger = new common_1.Logger(SseService_1.name);
    userConnections = new Map();
    registerUser(userId) {
        const subject = new rxjs_1.Subject();
        this.userConnections.set(userId, subject);
        this.logger.log(`User ${userId} connected to SSE`);
        return subject.asObservable();
    }
    unregisterUser(userId) {
        const subject = this.userConnections.get(userId);
        if (subject) {
            subject.complete();
            this.userConnections.delete(userId);
            this.logger.log(`User ${userId} disconnected from SSE`);
        }
    }
    sendNotificationToUser(userId, event) {
        const subject = this.userConnections.get(userId);
        if (subject) {
            const notificationEvent = {
                ...event,
                userId,
            };
            subject.next(notificationEvent);
            this.logger.log(`Notification sent to user ${userId}: ${event.type}`);
        }
        else {
            this.logger.warn(`User ${userId} is not connected to SSE`);
        }
    }
    sendMatchResultNotification(opponentUserId, matchResultId, sportCategory) {
        this.logger.log(`Sending MATCH_RESULT_REQUEST notification to user ${opponentUserId} for match ${matchResultId} in ${sportCategory}`);
        this.sendNotificationToUser(opponentUserId, {
            type: 'MATCH_RESULT_REQUEST',
            data: {
                matchResultId,
                sportCategory,
                message: '새로운 경기 결과 승인 요청이 있습니다.',
                timestamp: new Date().toISOString(),
            },
        });
    }
    sendMatchResultStatusNotification(userId, matchResultId, status, sportCategory) {
        this.logger.log(`Sending MATCH_RESULT_STATUS_CHANGED notification to user ${userId} for match ${matchResultId} with status ${status} in ${sportCategory}`);
        this.sendNotificationToUser(userId, {
            type: 'MATCH_RESULT_STATUS_CHANGED',
            data: {
                matchResultId,
                status,
                sportCategory,
                message: `경기 결과가 ${status === 'approved' ? '승인' : '거부'}되었습니다.`,
                timestamp: new Date().toISOString(),
            },
        });
    }
    getConnectedUsersCount() {
        return this.userConnections.size;
    }
    isUserConnected(userId) {
        return this.userConnections.has(userId);
    }
    cleanupAllConnections() {
        for (const [userId, subject] of this.userConnections.entries()) {
            subject.complete();
            this.logger.log(`Cleaned up connection for user ${userId}`);
        }
        this.userConnections.clear();
        this.logger.log('All SSE connections cleaned up');
    }
};
exports.SseService = SseService;
exports.SseService = SseService = SseService_1 = __decorate([
    (0, common_1.Injectable)()
], SseService);
//# sourceMappingURL=sse.service.js.map