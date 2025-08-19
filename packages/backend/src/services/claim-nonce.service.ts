import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
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
     * 예측 불가능한 32바이트 랜덤 nonce 생성
     */
    async getNextNonce(walletAddress: string): Promise<string> {
        try {
            // 기존 nonce 레코드 조회
            let nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (!nonceRecord) {
                // 새로운 사용자: 빈 배열로 시작
                nonceRecord = this.claimNonceRepository.create({
                    walletAddress,
                    currentNonce: BigInt(0),
                    lastUsedNonce: BigInt(0)
                });
            }

            // 예측 불가능한 32바이트 랜덤 nonce 생성
            const randomNonce = randomBytes(32);
            const nonceHex = '0x' + randomNonce.toString('hex');

            // nonce 업데이트 (사용된 nonce 개수 증가)
            nonceRecord.currentNonce = nonceRecord.currentNonce + BigInt(1);
            await this.claimNonceRepository.save(nonceRecord);

            this.logger.log(`Generated random nonce for ${walletAddress}: ${nonceHex} (count: ${nonceRecord.currentNonce.toString()})`);
            return nonceHex;
        } catch (error) {
            this.logger.error(`Failed to get next nonce for ${walletAddress}: ${error.message}`);
            throw error;
        }
    }

    /**
     * nonce 사용 완료 표시
     */
    async markNonceAsUsed(walletAddress: string, nonce: string): Promise<void> {
        try {
            const nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (nonceRecord) {
                // lastUsedNonce는 사용된 nonce 개수를 추적
                nonceRecord.lastUsedNonce = nonceRecord.lastUsedNonce + BigInt(1);
                await this.claimNonceRepository.save(nonceRecord);
                this.logger.log(`Marked nonce ${nonce} as used for ${walletAddress} (total used: ${nonceRecord.lastUsedNonce.toString()})`);
            }
        } catch (error) {
            this.logger.error(`Failed to mark nonce as used: ${error.message}`);
        }
    }

    /**
     * 사용자의 nonce 상태 조회
     */
    async getNonceStatus(walletAddress: string): Promise<{ generated: string; used: string } | null> {
        try {
            const nonceRecord = await this.claimNonceRepository.findOne({
                where: { walletAddress }
            });

            if (!nonceRecord) {
                return null;
            }

            return {
                generated: nonceRecord.currentNonce.toString(),  // 생성된 nonce 개수
                used: nonceRecord.lastUsedNonce.toString()      // 사용된 nonce 개수
            };
        } catch (error) {
            this.logger.error(`Failed to get nonce status for ${walletAddress}: ${error.message}`);
            return null;
        }
    }

    /**
     * 사용된 nonce 중복 확인
     * @param nonce 확인할 nonce 값
     * @returns 이미 사용된 nonce인지 여부
     */
    async isNonceUsed(nonce: string): Promise<boolean> {
        try {
            // ClaimRequest 테이블에서 해당 nonce가 이미 사용되었는지 확인
            // 이는 ClaimEventService에서 claim 실행 후 호출됨
            return false; // 기본적으로 false, 실제 구현은 ClaimRequest 테이블과 연동
        } catch (error) {
            this.logger.error(`Failed to check nonce usage: ${error.message}`);
            return false;
        }
    }
}
