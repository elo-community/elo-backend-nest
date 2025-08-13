import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { BlockchainService, ChainType } from '../blockchain/blockchain.service';
import { claimTypes, domainFor } from '../shared/eip712';
import { ClaimTicketQueryDto } from './dto/claim-ticket-query.dto';
import { ClaimTicketResponseDto } from './dto/claim-ticket-response.dto';
import { CreateDistributionDto } from './dto/create-distribution.dto';

@Injectable()
export class RewardsService {
    private readonly logger = new Logger(RewardsService.name);

    constructor(private readonly blockchainService: BlockchainService) { }

    /**
     * Create a new distribution on-chain
     */
    async createDistribution(dto: CreateDistributionDto): Promise<{ txHash: string; blockNumber: number }> {
        try {
            const { chain, id, token, total, snapshotBlock, deadline } = dto;

            // Get admin wallet and provider for the chain
            const adminWallet = this.blockchainService.adminWallet(chain);
            const provider = this.blockchainService.getProvider(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);

            // Create contract instance
            const distributor = new ethers.Contract(
                distributorAddress,
                [
                    'function createDistribution(uint256 id, address token, uint256 total, uint256 snapshotBlock, uint256 deadline) external',
                ],
                adminWallet
            );

            // Call createDistribution
            const tx = await distributor.createDistribution(id, token, total, snapshotBlock, deadline);
            const receipt = await tx.wait();

            this.logger.log(`Distribution ${id} created on ${chain} with tx: ${receipt.hash}`);

            return {
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber || 0,
            };
        } catch (error) {
            this.logger.error(`Failed to create distribution on ${dto.chain}:`, error);
            throw error;
        }
    }

    /**
     * Generate a signed claim ticket
     */
    async generateClaimTicket(
        distributionId: number,
        query: ClaimTicketQueryDto
    ): Promise<ClaimTicketResponseDto> {
        try {
            const { chain, account, postId } = query;

            // Get chain configuration
            const chainId = this.blockchainService.getChainId(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);
            const signerWallet = this.blockchainService.signer();

            // Build EIP-712 domain
            const domain = domainFor(chainId, distributorAddress);

            // Build claim message
            const message = {
                distributionId,
                postId: postId as `0x${string}`,
                account: account as `0x${string}`,
                authorizedAmount: await this.calculateAuthorizedAmount(distributionId, account, chain),
                deadline: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
            };

            // Sign the message
            const signature = await signerWallet.signTypedData(domain, claimTypes, message);

            this.logger.log(`Claim ticket generated for distribution ${distributionId}, account ${account} on ${chain}`);

            return {
                domain,
                types: claimTypes,
                message,
                signature,
            };
        } catch (error) {
            this.logger.error(`Failed to generate claim ticket:`, error);
            throw error;
        }
    }

    /**
     * Calculate authorized amount for a user (placeholder - implement your snapshot logic)
     */
    private async calculateAuthorizedAmount(
        distributionId: number,
        account: string,
        chain: ChainType
    ): Promise<string> {
        // TODO: Implement your off-chain snapshot logic here
        // This should calculate the user's eligible amount based on:
        // - Distribution snapshot block
        // - User's activity/engagement metrics
        // - Distribution rules

        // For now, return a placeholder amount
        return ethers.parseEther('100').toString();
    }

    /**
     * Get distribution info from chain
     */
    async getDistribution(distributionId: number, chain: ChainType) {
        try {
            const provider = this.blockchainService.getProvider(chain);
            const distributorAddress = this.blockchainService.getDistributorAddress(chain);

            const distributor = new ethers.Contract(
                distributorAddress,
                [
                    'function getDistribution(uint256 id) external view returns (tuple(address token, uint256 total, uint256 remaining, uint256 snapshotBlock, uint256 deadline, bool active))',
                ],
                provider
            );

            const distribution = await distributor.getDistribution(distributionId);

            return {
                token: distribution[0],
                total: distribution[1].toString(),
                remaining: distribution[2].toString(),
                snapshotBlock: distribution[3].toString(),
                deadline: distribution[4].toString(),
                active: distribution[5],
            };
        } catch (error) {
            this.logger.error(`Failed to get distribution ${distributionId} on ${chain}:`, error);
            throw error;
        }
    }
} 