import { Module } from '@nestjs/common';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

@Module({
    imports: [BlockchainModule],
    controllers: [RewardsController],
    providers: [RewardsService],
    exports: [RewardsService],
})
export class RewardsModule { } 