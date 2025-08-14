import { BlockchainService } from '../blockchain/blockchain.service';
import { ClaimTicketQueryDto } from './dto/claim-ticket-query.dto';
import { ClaimTicketResponseDto } from './dto/claim-ticket-response.dto';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { RewardsService } from './rewards.service';
export declare class RewardsController {
    private readonly rewardsService;
    private readonly blockchainService;
    private readonly logger;
    constructor(rewardsService: RewardsService, blockchainService: BlockchainService);
    createDistribution(dto: CreateDistributionDto): Promise<{
        success: boolean;
        distributionId: number;
        chain: "amoy";
        txHash: string;
        blockNumber: number;
    }>;
    getClaimTicket(id: string, query: ClaimTicketQueryDto): Promise<ClaimTicketResponseDto>;
    getDistribution(id: string, chain: string): Promise<{
        token: any;
        total: any;
        remaining: any;
        snapshotBlock: any;
        deadline: any;
        active: any;
    }>;
}
