import { Observable } from 'rxjs';
export interface NotificationEvent {
    type: string;
    data: any;
    userId: number;
}
export declare class SseService {
    private readonly logger;
    private readonly userConnections;
    registerUser(userId: number): Observable<NotificationEvent>;
    unregisterUser(userId: number): void;
    sendNotificationToUser(userId: number, event: Omit<NotificationEvent, 'userId'>): void;
    sendMatchResultNotification(opponentUserId: number, matchResultId: number, sportCategory: string): void;
    sendMatchResultStatusNotification(userId: number, matchResultId: number, status: string, sportCategory: string): void;
    getConnectedUsersCount(): number;
    isUserConnected(userId: number): boolean;
    cleanupAllConnections(): void;
}
