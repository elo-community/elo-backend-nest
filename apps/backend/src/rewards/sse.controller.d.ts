import { Observable } from 'rxjs';
import { BlockchainService } from '../blockchain/blockchain.service';
interface MessageEvent {
    data: string | object;
}
export declare class SseController {
    private readonly blockchainService;
    private readonly logger;
    constructor(blockchainService: BlockchainService);
    stream(account?: string, chain?: string): Observable<MessageEvent>;
    distributions(): Observable<MessageEvent>;
    claims(account?: string): Observable<MessageEvent>;
}
export {};
