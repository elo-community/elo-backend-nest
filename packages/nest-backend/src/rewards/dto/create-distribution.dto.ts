import { IsIn, IsNumber, IsPositive, IsString } from 'class-validator';
import { ChainType } from '../../blockchain/blockchain.service';

export class CreateDistributionDto {
    @IsNumber()
    @IsPositive()
    id: number;

    @IsString()
    token: string;

    @IsString()
    total: string; // BigNumber as string

    @IsNumber()
    @IsPositive()
    snapshotBlock: number;

    @IsNumber()
    @IsPositive()
    deadline: number; // Unix timestamp

    @IsIn(['amoy', 'very'])
    chain: ChainType;
} 