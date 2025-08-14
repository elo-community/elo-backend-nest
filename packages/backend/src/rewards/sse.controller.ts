import { Controller, Logger, Query, Sse } from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { BlockchainService } from '../blockchain/blockchain.service';

interface MessageEvent {
    data: string | object;
}

@Controller('sse')
export class SseController {
    private readonly logger = new Logger(SseController.name);

    constructor(private readonly blockchainService: BlockchainService) { }

    /**
     * SSE stream for real-time blockchain events
     */
    @Sse('stream')
    stream(@Query('account') account?: string, @Query('chain') chain?: string): Observable<MessageEvent> {
        this.logger.log(`SSE stream started for account: ${account}, chain: ${chain}`);

        // For now, return a heartbeat every 15 seconds
        // In production, this should be connected to actual blockchain event listeners
        return interval(15000).pipe(
            map(() => ({
                data: {
                    type: 'heartbeat',
                    timestamp: new Date().toISOString(),
                    message: 'SSE connection alive',
                },
            })),
        );
    }

    /**
     * SSE stream for distribution events
     */
    @Sse('distributions')
    distributions(): Observable<MessageEvent> {
        this.logger.log('Distribution SSE stream started');

        return interval(30000).pipe(
            map(() => ({
                data: {
                    type: 'distribution.status',
                    timestamp: new Date().toISOString(),
                    message: 'Distribution events stream active',
                },
            })),
        );
    }

    /**
     * SSE stream for claim events
     */
    @Sse('claims')
    claims(@Query('account') account?: string): Observable<MessageEvent> {
        this.logger.log(`Claims SSE stream started for account: ${account}`);

        return interval(20000).pipe(
            map(() => ({
                data: {
                    type: 'claim.status',
                    timestamp: new Date().toISOString(),
                    message: 'Claim events stream active',
                    account: account || 'all',
                },
            })),
        );
    }
} 