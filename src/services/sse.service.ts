import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

export interface NotificationEvent {
    type: string;
    data: any;
    userId: number;
}

@Injectable()
export class SseService {
    private readonly logger = new Logger(SseService.name);
    private readonly userConnections = new Map<number, Subject<NotificationEvent>>();

    /**
     * 사용자 연결 등록
     */
    registerUser(userId: number): Observable<NotificationEvent> {
        const subject = new Subject<NotificationEvent>();
        this.userConnections.set(userId, subject);
        this.logger.log(`User ${userId} connected to SSE`);
        return subject.asObservable();
    }

    /**
     * 사용자 연결 해제
     */
    unregisterUser(userId: number): void {
        const subject = this.userConnections.get(userId);
        if (subject) {
            subject.complete();
            this.userConnections.delete(userId);
            this.logger.log(`User ${userId} disconnected from SSE`);
        }
    }

    /**
     * 특정 사용자에게 알림 전송
     */
    sendNotificationToUser(userId: number, event: Omit<NotificationEvent, 'userId'>): void {
        const subject = this.userConnections.get(userId);
        if (subject) {
            const notificationEvent: NotificationEvent = {
                ...event,
                userId,
            };
            subject.next(notificationEvent);
            this.logger.log(`Notification sent to user ${userId}: ${event.type}`);
            console.log(`[SSEService] Notification sent to user ${userId}:`, notificationEvent);
        } else {
            this.logger.warn(`User ${userId} is not connected to SSE`);
            console.log(`[SSEService] User ${userId} is not connected to SSE. Connected users:`, Array.from(this.userConnections.keys()));
        }
    }

    /**
     * 경기 결과 등록 알림 전송
     */
    sendMatchResultNotification(opponentUserId: number, matchResultId: number, sportCategory: string): void {
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

    /**
     * 경기 결과 상태 변경 알림 전송
     */
    sendMatchResultStatusNotification(userId: number, matchResultId: number, status: string, sportCategory: string): void {
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

    /**
     * 연결된 사용자 수 반환
     */
    getConnectedUsersCount(): number {
        return this.userConnections.size;
    }

    /**
     * 특정 사용자가 연결되어 있는지 확인
     */
    isUserConnected(userId: number): boolean {
        return this.userConnections.has(userId);
    }

    /**
     * 모든 연결 정리
     */
    cleanupAllConnections(): void {
        for (const [userId, subject] of this.userConnections.entries()) {
            subject.complete();
            this.logger.log(`Cleaned up connection for user ${userId}`);
        }
        this.userConnections.clear();
        this.logger.log('All SSE connections cleaned up');
    }
} 