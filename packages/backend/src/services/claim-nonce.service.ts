import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimNonce } from '../entities/claim-nonce.entity';

@Injectable()
export class ClaimNonceService {
    private readonly logger = new Logger(ClaimNonceService.name);

    constructor(
        @InjectRepository(ClaimNonce)
        private claimNonceRepository: Repository<ClaimNonce>
    ) { }

    /**
     * 사용자의 다음 nonce를 가져오거나 생성
     */
    async getNextNonce(walletAddress: string): Promise<bigint> {
        try {
            // 기존 nonce 레코드 조회
            let nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (!nonceRecord) {
                // 새로운 사용자: nonce 0부터 시작
                nonceRecord = this.claimNonceRepository.create({
                    walletAddress,
                    currentNonce: BigInt(0),
                    lastUsedNonce: BigInt(0)
                });
            }

            // 다음 nonce 계산
            const nextNonce = nonceRecord.currentNonce + BigInt(1);

            // nonce 업데이트
            nonceRecord.currentNonce = nextNonce;
            await this.claimNonceRepository.save(nonceRecord);

            this.logger.log(`Generated next nonce for ${walletAddress}: ${nextNonce}`);
            return nextNonce;
        } catch (error) {
            this.logger.error(`Failed to get next nonce for ${walletAddress}: ${error.message}`);
            throw error;
        }
    }

    /**
     * nonce 사용 완료 표시
     */
    async markNonceAsUsed(walletAddress: string, nonce: bigint): Promise<void> {
        try {
            const nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (nonceRecord) {
                nonceRecord.lastUsedNonce = nonce;
                await this.claimNonceRepository.save(nonceRecord);
                this.logger.log(`Marked nonce ${nonce} as used for ${walletAddress}`);
            }
        } catch (error) {
            this.logger.error(`Failed to mark nonce as used: ${error.message}`);
        }
    }

    /**
     * 사용자의 nonce 상태 조회
     */
    async getNonceStatus(walletAddress: string): Promise<{ current: bigint; lastUsed: bigint } | null> {
        try {
            const nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (!nonceRecord) {
                return null;
            }

            return {
                current: nonceRecord.currentNonce,
                lastUsed: nonceRecord.lastUsedNonce
            };
        } catch (error) {
            this.logger.error(`Failed to get nonce status for ${walletAddress}: ${error.message}`);
            return null;
        }
    }
}
