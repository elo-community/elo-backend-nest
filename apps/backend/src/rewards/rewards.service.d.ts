import { BlockchainService, ChainType } from '../blockchain/blockchain.service';
import { ClaimTicketQueryDto } from './dto/claim-ticket-query.dto';
import { ClaimTicketResponseDto } from './dto/claim-ticket-response.dto';
import { CreateDistributionDto } from './dto/create-distribution.dto';
export declare class RewardsService {
    private readonly blockchainService;
    private readonly logger;
    constructor(blockchainService: BlockchainService);
    createDistribution(dto: CreateDistributionDto): Promise<{
        txHash: string;
        blockNumber: number;
    }>;
    generateClaimTicket(distributionId: number, query: ClaimTicketQueryDto): Promise<ClaimTicketResponseDto>;
    private calculateAuthorizedAmount;
    getDistribution(distributionId: number, chain: ChainType): Promise<{
        token: any;
        total: any;
        remaining: any;
        snapshotBlock: any;
        deadline: any;
        active: any;
    }>;
}
