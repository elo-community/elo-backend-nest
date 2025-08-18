import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TokenClaimRequest, TokenClaimSignature, TrivusExpService } from '../blockchain/trivus-exp.service';

@Controller('trivus-exp')
export class TrivusExpController {
    private readonly logger = new Logger(TrivusExpController.name);

    constructor(private readonly trivusExpService: TrivusExpService) { }

    // ==================== Public APIs (Frontend-facing) ====================
    @Get('status')
    @Public()
    async getServiceStatus() {
        return await this.trivusExpService.getServiceStatus();
    }

    @Get('debug-env')
    @Public()
    async debugEnvironmentVariables() {
        const configService = this.trivusExpService['configService'];
        return {
            rpcUrl: configService.get<string>('blockchain.amoy.rpcUrl'),
            chainId: configService.get<string>('blockchain.amoy.chainId'),
            trustedSignerKey: configService.get<string>('blockchain.trustedSigner.privateKey') ? 'SET' : 'NOT SET',
            contractAddress: configService.get<string>('blockchain.contracts.trivusExp.amoy'),
            envFilePath: process.env.NODE_ENV === 'development' ? '../../.env' : '.env'
        };
    }

    @Get('debug-service')
    @Public()
    async debugServiceStatus() {
        const service = this.trivusExpService as any;
        return {
            isInitialized: service.isInitialized,
            provider: service.provider ? 'SET' : 'NOT SET',
            trustedSigner: service.trustedSigner ? 'SET' : 'NOT SET',
            contract: service.contract ? 'SET' : 'NOT SET',
            contractAddress: service.contractAddress || 'NOT SET',
            claimEventService: service.claimEventService?.getStatus() || null
        };
    }

    @Get('balance/:address')
    @Public()
    async getBalance(@Param('address') address: string) {
        try {
            const balance = await this.trivusExpService.getBalance(address);
            return { success: true, data: { balance } };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * 총 토큰 공급량 조회
     */
    @Get('total-supply')
    @Public()
    async getTotalSupply() {
        try {
            const totalSupply = await this.trivusExpService.getTotalSupply();
            return {
                success: true,
                data: {
                    totalSupply,
                    symbol: 'EXP'
                }
            };
        } catch (error) {
            this.logger.error(`Failed to get total supply: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * TrustedSigner 주소 조회
     */
    @Get('trusted-signer')
    @Public()
    async getTrustedSigner() {
        try {
            const trustedSigner = await this.trivusExpService.getTrustedSigner();
            return {
                success: true,
                data: {
                    trustedSigner
                }
            };
        } catch (error) {
            this.logger.error(`Failed to get trusted signer: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== 프론트엔드용 API ====================

    /**
     * 토큰 지급 요청 및 서명 생성 (프론트엔드에서 호출)
     * 사용자는 이 API로 서명을 받아서 직접 블록체인에서 클레임
     */
    @Post('request-claim')
    @Public()
    async requestTokenClaim(@Body() request: { address: string; amount: string; reason?: string }) {
        try {
            this.logger.log(`Token claim request from ${request.address}: ${request.amount} EXP`);

            // 서명 생성
            const signature = await this.trivusExpService.createTokenClaimSignature({
                address: request.address,
                amount: request.amount,
                reason: request.reason
            });

            // 프론트엔드에서 사용할 수 있도록 필요한 정보만 반환
            return {
                success: true,
                data: {
                    message: 'Token claim signature generated successfully',
                    claimData: {
                        to: signature.to,
                        amount: signature.amount,
                        nonce: signature.nonce,
                        deadline: signature.deadline,
                        signature: signature.signature
                    },
                    instructions: 'Use this signature to claim tokens directly on the blockchain',
                    contractAddress: await this.trivusExpService.getContractAddress()
                }
            };
        } catch (error) {
            this.logger.error(`Failed to process token claim request: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // ==================== 백엔드 테스트용 API ====================

    /**
     * 백엔드 테스트용: 토큰 지급 서명 생성
     */
    @Post('test/create-signature')
    @Public()
    async testCreateTokenClaimSignature(@Body() request: TokenClaimRequest) {
        try {
            this.logger.log(`[TEST] Creating signature for ${request.address}: ${request.amount} EXP`);
            const signature = await this.trivusExpService.createTokenClaimSignature(request);
            return {
                success: true,
                data: {
                    message: '[TEST] Signature created successfully',
                    signature: {
                        to: signature.to,
                        amount: signature.amount,
                        deadline: signature.deadline,
                        signature: signature.signature, // 전체 서명 표시
                        nonce: signature.nonce
                    }
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Failed to create signature: ${(error as Error).message}`);
            return { success: false, error: (error as Error).message };
        }
    }

    @Post('test/simple-verify')
    @Public()
    async testSimpleVerify(@Body() data: { to: string; amount: string; nonce: string; deadline: number; signature: string }) {
        try {
            this.logger.log(`[TEST] Simple verification test for ${data.to}`);
            const isValid = await this.trivusExpService.verifySignature(data);
            return {
                success: true,
                data: {
                    message: '[TEST] Simple verification completed',
                    isValid,
                    verifiedData: data
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Simple verification failed: ${(error as Error).message}`);
            return { success: false, error: (error as Error).message };
        }
    }

    @Post('test/signature-verification')
    @Public()
    async testSignatureVerification(@Body() request: { address: string; amount: string; reason?: string }) {
        try {
            this.logger.log(`[TEST] Testing signature verification for ${request.address}: ${request.amount} EXP`);

            // Step 1: Create signature
            const signature = await this.trivusExpService.createTokenClaimSignature({
                address: request.address,
                amount: request.amount,
                reason: request.reason
            });

            this.logger.log(`[TEST] ✅ Signature created: ${signature.signature.substring(0, 66)}...`);

            // Step 2: Verify signature off-chain (backend verification)
            const isValidBackend = await this.trivusExpService.verifySignature({
                to: signature.to,
                amount: signature.amount,
                nonce: signature.nonce,
                deadline: signature.deadline,
                signature: signature.signature
            });

            this.logger.log(`[TEST] Backend verification result: ${isValidBackend}`);

            // Step 3: Get contract status for comparison
            const contractStatus = await this.trivusExpService.getServiceStatus();
            const trustedSigner = await this.trivusExpService.getTrustedSigner();

            return {
                success: true,
                data: {
                    message: '[TEST] Signature verification test completed',
                    signature: {
                        to: signature.to,
                        amount: signature.amount,
                        deadline: signature.deadline,
                        signature: signature.signature,
                        nonce: signature.nonce
                    },
                    verification: {
                        backend: isValidBackend,
                        contractAddress: contractStatus.contractAddress,
                        trustedSigner: trustedSigner
                    },
                    testData: {
                        recipient: request.address,
                        amount: request.amount,
                        reason: request.reason
                    }
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Signature verification test failed: ${(error as Error).message}`);
            return { success: false, error: (error as Error).message };
        }
    }

    @Post('test/full-process-new')
    @Public()
    async testFullProcessNew(@Body() request: { address: string; amount: string; reason?: string }) {
        try {
            this.logger.log(`[TEST] 🚀 Starting NEW full token claim process for ${request.address}: ${request.amount} EXP`);

            // Step 1: Check initial balances
            this.logger.log(`[TEST] 📊 Step 1: Checking initial balances...`);
            const initialBalance = await this.trivusExpService.getBalance(request.address);
            const contractStatus = await this.trivusExpService.getServiceStatus();

            this.logger.log(`[TEST] ✅ Initial balance: ${initialBalance} EXP`);
            this.logger.log(`[TEST] ✅ Contract address: ${contractStatus.contractAddress}`);
            this.logger.log(`[TEST] ✅ TrustedSigner: ${contractStatus.trustedSigner}`);

            // Step 2: Create signature
            this.logger.log(`[TEST] 🔐 Step 2: Creating EIP-712 signature...`);
            const signature = await this.trivusExpService.createTokenClaimSignature({
                address: request.address,
                amount: request.amount,
                reason: request.reason
            });

            this.logger.log(`[TEST] ✅ Signature created successfully`);
            this.logger.log(`[TEST] 📝 Signature details:`);
            this.logger.log(`   - To: ${signature.to}`);
            this.logger.log(`   - Amount: ${signature.amount} EXP`);
            this.logger.log(`   - Deadline: ${signature.deadline} (${new Date(signature.deadline * 1000).toISOString()})`);
            this.logger.log(`   - Nonce: ${signature.nonce}`);
            this.logger.log(`   - Signature: ${signature.signature.substring(0, 66)}...`);

            // Step 3: Verify signature off-chain
            this.logger.log(`[TEST] 🔍 Step 3: Verifying signature off-chain...`);
            const isValidBackend = await this.trivusExpService.verifySignature({
                to: signature.to,
                amount: signature.amount,
                nonce: signature.nonce,
                deadline: signature.deadline,
                signature: signature.signature
            });

            if (!isValidBackend) {
                throw new Error('Backend signature verification failed');
            }
            this.logger.log(`[TEST] ✅ Backend signature verification successful`);

            // Step 4: Execute token claim on blockchain
            this.logger.log(`[TEST] ⚡ Step 4: Executing token claim on blockchain...`);
            const txHash = await this.trivusExpService.executeTokenClaim(signature);
            this.logger.log(`[TEST] ✅ Token claim transaction executed: ${txHash}`);

            // Step 5: Verify final result
            this.logger.log(`[TEST] 📊 Step 5: Verifying final result...`);
            const finalBalance = await this.trivusExpService.getBalance(request.address);
            const balanceChange = parseFloat(finalBalance) - parseFloat(initialBalance);

            this.logger.log(`[TEST] 📊 Balance Summary:`);
            this.logger.log(`   - Initial: ${initialBalance} EXP`);
            this.logger.log(`   - Final: ${finalBalance} EXP`);
            this.logger.log(`   - Change: +${balanceChange} EXP`);

            if (balanceChange === parseFloat(request.amount)) {
                this.logger.log(`[TEST] ✅ Token claim successful! Balance increased by ${request.amount} EXP`);
            } else {
                this.logger.log(`[TEST] ⚠️  Balance change mismatch. Expected: +${request.amount}, Got: +${balanceChange}`);
            }

            // Step 6: Get contract balance
            this.logger.log(`[TEST] 📊 Step 6: Checking contract balance...`);
            try {
                const totalSupply = await this.trivusExpService.getTotalSupply();
                this.logger.log(`[TEST] ✅ Total supply: ${totalSupply} EXP`);
            } catch (error) {
                this.logger.log(`[TEST] ⚠️  Could not get total supply: ${(error as Error).message}`);
            }

            return {
                success: true,
                data: {
                    message: '[TEST] 🎉 NEW Full token claim process completed successfully!',
                    processSteps: [
                        '✅ Initial balances checked',
                        '✅ EIP-712 signature created',
                        '✅ Backend signature verification passed',
                        '✅ Token claim executed on blockchain',
                        '✅ Final balances verified',
                        '✅ Contract status confirmed'
                    ],
                    transaction: {
                        hash: txHash,
                        recipient: request.address,
                        amount: request.amount,
                        reason: request.reason
                    },
                    signature: {
                        to: signature.to,
                        amount: signature.amount,
                        deadline: signature.deadline,
                        signature: signature.signature,
                        nonce: signature.nonce
                    },
                    balances: {
                        initial: initialBalance,
                        final: finalBalance,
                        change: balanceChange,
                        expected: parseFloat(request.amount)
                    },
                    contract: {
                        address: contractStatus.contractAddress,
                        trustedSigner: contractStatus.trustedSigner,
                        network: contractStatus.network
                    }
                }
            };

        } catch (error) {
            this.logger.error(`[TEST] ❌ NEW Full token claim process failed: ${(error as Error).message}`);
            return {
                success: false,
                error: (error as Error).message,
                step: 'Process failed during execution',
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 백엔드 테스트용: 서명 유효성 검증
     */
    @Post('test/verify-signature')
    @Public()
    async testVerifySignature(@Body() data: { to: string; amount: string; nonce: string; deadline: number; signature: string }) {
        try {
            this.logger.log(`[TEST] Verifying signature for ${data.to}`);

            const isValid = await this.trivusExpService.verifySignature(data);

            return {
                success: true,
                data: {
                    message: '[TEST] Signature verification completed',
                    isValid,
                    verifiedData: data
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Signature verification failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 백엔드 테스트용: 토큰 지급 실행 (백엔드에서 직접 실행)
     */
    @Post('test/execute-claim')
    @Public()
    async testExecuteTokenClaim(@Body() claimSignature: TokenClaimSignature) {
        try {
            this.logger.log(`[TEST] Executing token claim for ${claimSignature.to}: ${claimSignature.amount} EXP`);

            const txHash = await this.trivusExpService.executeTokenClaim(claimSignature);

            return {
                success: true,
                data: {
                    message: '[TEST] Token claim executed successfully',
                    transactionHash: txHash,
                    claimedAmount: claimSignature.amount,
                    recipient: claimSignature.to
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Token claim execution failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 백엔드 테스트용: 전체 토큰 지급 프로세스 테스트
     */
    @Post('test/full-process')
    @Public()
    async testFullTokenClaimProcess(@Body() request: { address: string; amount: string; reason?: string }) {
        try {
            this.logger.log(`[TEST] Starting full token claim process for ${request.address}: ${request.amount} EXP`);

            // Step 1: Create signature
            this.logger.log(`[TEST] Step 1: Creating signature...`);
            const signature = await this.trivusExpService.createTokenClaimSignature({
                address: request.address,
                amount: request.amount,
                reason: request.reason
            });
            this.logger.log(`[TEST] ✅ Signature created: ${signature.signature.substring(0, 66)}...`);
            this.logger.log(`[TEST] Signature details: to=${signature.to}, amount=${signature.amount}, deadline=${signature.deadline}`);

            // Step 2: Verify signature
            this.logger.log(`[TEST] Step 2: Verifying signature...`);
            const isValid = await this.trivusExpService.verifySignature({
                to: signature.to,
                amount: signature.amount,
                nonce: signature.nonce,
                deadline: signature.deadline,
                signature: signature.signature
            });
            this.logger.log(`[TEST] Signature verification result: ${isValid}`);

            if (!isValid) {
                throw new Error('Signature verification failed');
            }
            this.logger.log(`[TEST] ✅ Signature verified successfully`);

            // Step 3: Execute token claim
            this.logger.log(`[TEST] Step 3: Executing token claim...`);
            const txHash = await this.trivusExpService.executeTokenClaim(signature);
            this.logger.log(`[TEST] ✅ Token claim executed: ${txHash}`);

            // Step 4: Verify result
            this.logger.log(`[TEST] Step 4: Verifying result...`);
            const balanceAfter = await this.trivusExpService.getBalance(request.address);

            return {
                success: true,
                data: {
                    message: '[TEST] Full token claim process completed successfully',
                    processSteps: ['✅ Signature created', '✅ Signature verified', '✅ Token claim executed', '✅ Result verified'],
                    transactionHash: txHash,
                    recipient: request.address,
                    amount: request.amount,
                    finalBalance: balanceAfter,
                    signature: {
                        to: signature.to,
                        amount: signature.amount,
                        deadline: signature.deadline,
                        signature: signature.signature // 전체 서명 표시
                    }
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Full token claim process failed: ${(error as Error).message}`);
            return { success: false, error: (error as Error).message, step: 'Process failed during execution' };
        }
    }

    /**
     * 백엔드 테스트용: 여러 주소에 동시 토큰 지급 테스트
     */
    @Post('test/bulk-claim')
    @Public()
    async testBulkTokenClaim(@Body() request: { claims: Array<{ address: string; amount: string; reason?: string }> }) {
        try {
            this.logger.log(`[TEST] Starting bulk token claim for ${request.claims.length} addresses`);

            const results: Array<{
                address: string;
                amount: string;
                status: string;
                transactionHash?: string;
                error?: string;
            }> = [];

            for (let i = 0; i < request.claims.length; i++) {
                const claim = request.claims[i];
                this.logger.log(`[TEST] Processing claim ${i + 1}/${request.claims.length}: ${claim.address} -> ${claim.amount} EXP`);

                try {
                    // 서명 생성
                    const signature = await this.trivusExpService.createTokenClaimSignature({
                        address: claim.address,
                        amount: claim.amount,
                        reason: claim.reason
                    });

                    // 토큰 지급 실행
                    const txHash = await this.trivusExpService.executeTokenClaim(signature);

                    results.push({
                        address: claim.address,
                        amount: claim.amount,
                        status: 'success',
                        transactionHash: txHash
                    });

                    this.logger.log(`[TEST] ✅ Claim ${i + 1} successful: ${txHash}`);
                } catch (error) {
                    results.push({
                        address: claim.address,
                        amount: claim.amount,
                        status: 'failed',
                        error: (error as Error).message
                    });

                    this.logger.error(`[TEST] ❌ Claim ${i + 1} failed: ${(error as Error).message}`);
                }
            }

            const successCount = results.filter(r => r.status === 'success').length;
            const failureCount = results.filter(r => r.status === 'failed').length;

            return {
                success: true,
                data: {
                    message: '[TEST] Bulk token claim process completed',
                    summary: {
                        total: request.claims.length,
                        successful: successCount,
                        failed: failureCount
                    },
                    results
                }
            };
        } catch (error) {
            this.logger.error(`[TEST] Bulk token claim process failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }
} 