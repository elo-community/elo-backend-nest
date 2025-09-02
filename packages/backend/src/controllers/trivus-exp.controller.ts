import { Controller, Get, Logger, Param } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TrivusExpService } from '../blockchain/trivus-exp.service';

@Controller('trivus-exp')
export class TrivusExpController {
    private readonly logger = new Logger(TrivusExpController.name);

    constructor(private readonly trivusExpService: TrivusExpService) { }

    @Get('status')
    @Public()
    async getServiceStatus() {
        return await this.trivusExpService.getServiceStatus();
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

} 