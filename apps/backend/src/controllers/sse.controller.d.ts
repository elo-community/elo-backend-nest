import { OnModuleDestroy } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { SseService } from '../services/sse.service';
export declare class SseController implements OnModuleDestroy {
    private readonly sseService;
    private readonly authService;
    constructor(sseService: SseService, authService: AuthService);
    subscribeToNotifications(token: string, req: Request, res: Response): Promise<void>;
    getHealth(token: string): Promise<{
        success: boolean;
        data: {
            isConnected: boolean;
            connectedUsersCount: number;
            totalConnections: number;
            userId: any;
        };
        message: string;
    }>;
    onModuleDestroy(): void;
}
