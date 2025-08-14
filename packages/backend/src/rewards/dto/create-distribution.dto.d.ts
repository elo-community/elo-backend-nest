import { ChainType } from '../../blockchain/blockchain.service';
export declare class CreateDistributionDto {
    id: number;
    token: string;
    total: string;
    snapshotBlock: number;
    deadline: number;
    chain: ChainType;
}
