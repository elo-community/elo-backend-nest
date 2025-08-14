import { IsIn, IsString } from 'class-validator';
import { ChainType } from '../../blockchain/blockchain.service';

export class ClaimTicketQueryDto {
    @IsString()
    account: string;

    @IsString()
    postId: string;

    @IsIn(['amoy', 'very'])
    chain: ChainType;
} 