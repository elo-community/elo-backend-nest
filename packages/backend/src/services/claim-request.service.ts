import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimRequest, ClaimStatus } from '../entities/claim-request.entity';

@Injectable()
export class ClaimRequestService {
    private readonly logger = new Logger(ClaimRequestService.name);

    constructor(
        @InjectRepository(ClaimRequest)
        private claimRequestRepository: Repository<ClaimRequest>
    ) { }

    /**
     * 새로운 claim 요청 저장
     */
    async createClaimRequest(
        walletAddress: string,
        nonce: bigint,
        amount: string,
        deadline: bigint,
        signature: string,
        reason?: string
    ): Promise<ClaimRequest> {
        try {
            const claimRequest = this.claimRequestRepository.create({
                walletAddress,
                nonce,
                amount,
                deadline,
                signature,
                reason,
                status: ClaimStatus.PENDING
            });

            const savedRequest = await this.claimRequestRepository.save(claimRequest);
            this.logger.log(`Created claim request for ${walletAddress} with nonce ${nonce}`);
            return savedRequest;
        } catch (error) {
            this.logger.error(`Failed to create claim request: ${error.message}`);
            throw error;
        }
    }

    /**
     * claim 요청 상태 업데이트
     */
    async updateClaimStatus(
        walletAddress: string,
        nonce: bigint,
        status: ClaimStatus,
        transactionHash?: string
    ): Promise<void> {
        try {
            await this.claimRequestRepository.update(
                { walletAddress, nonce },
                {
                    status,
                    transactionHash,
                    updatedAt: new Date()
                }
            );

            this.logger.log(`Updated claim request status for ${walletAddress} nonce ${nonce} to ${status}`);
        } catch (error) {
            this.logger.error(`Failed to update claim request status: ${error.message}`);
            throw error;
        }
    }

    /**
     * 사용자의 claim 요청 조회
     */
    async getClaimRequests(walletAddress: string): Promise<ClaimRequest[]> {
        try {
            return await this.claimRequestRepository.find({
                where: { walletAddress },
                order: { createdAt: 'DESC' }
            });
        } catch (error) {
            this.logger.error(`Failed to get claim requests for ${walletAddress}: ${error.message}`);
            return [];
        }
    }

    /**
     * 만료된 claim 요청들 조회
     */
    async getExpiredClaimRequests(): Promise<ClaimRequest[]> {
        try {
            const currentTime = BigInt(Math.floor(Date.now() / 1000));
            return await this.claimRequestRepository.find({
                where: {
                    status: ClaimStatus.PENDING,
                    deadline: currentTime
                }
            });
        } catch (error) {
            this.logger.error(`Failed to get expired claim requests: ${error.message}`);
            return [];
        }
    }

    /**
     * 특정 nonce의 claim 요청 조회
     */
    async getClaimRequestByNonce(walletAddress: string, nonce: bigint): Promise<ClaimRequest | null> {
        try {
            return await this.claimRequestRepository.findOne({
                where: { walletAddress, nonce }
            });
        } catch (error) {
            this.logger.error(`Failed to get claim request by nonce: ${error.message}`);
            return null;
        }
    }
}
