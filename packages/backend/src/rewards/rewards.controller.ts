import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { BlockchainService, ChainType } from '../blockchain/blockchain.service';
import { ClaimTicketQueryDto } from './dto/claim-ticket-query.dto';
import { ClaimTicketResponseDto } from './dto/claim-ticket-response.dto';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  constructor(
    private readonly rewardsService: RewardsService,
    private readonly blockchainService: BlockchainService,
  ) {}

  /**
   * Create a new distribution (admin only)
   */
  @Post('admin/distributions')
  async createDistribution(@Body() dto: CreateDistributionDto) {
    this.logger.log(`Creating distribution ${dto.id} on ${dto.chain}`);

    const result = await this.rewardsService.createDistribution(dto);

    return {
      success: true,
      distributionId: dto.id,
      chain: dto.chain,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
    };
  }

  /**
   * Get a signed claim ticket for a user
   */
  @Get(':id/ticket')
  async getClaimTicket(
    @Param('id') id: string,
    @Query() query: ClaimTicketQueryDto,
  ): Promise<ClaimTicketResponseDto> {
    const distributionId = parseInt(id);
    if (isNaN(distributionId)) {
      throw new Error('Invalid distribution ID');
    }

    // Validate chain parameter
    if (!this.blockchainService.isValidChain(query.chain)) {
      throw new Error('Invalid chain parameter');
    }

    this.logger.log(
      `Generating claim ticket for distribution ${distributionId}, account ${query.account} on ${query.chain}`,
    );

    return await this.rewardsService.generateClaimTicket(distributionId, query);
  }

  /**
   * Get distribution info
   */
  @Get(':id')
  async getDistribution(@Param('id') id: string, @Query('chain') chain: string) {
    const distributionId = parseInt(id);
    if (isNaN(distributionId)) {
      throw new Error('Invalid distribution ID');
    }

    if (!this.blockchainService.isValidChain(chain)) {
      throw new Error('Invalid chain parameter');
    }

    return await this.rewardsService.getDistribution(distributionId, chain as ChainType);
  }
}
