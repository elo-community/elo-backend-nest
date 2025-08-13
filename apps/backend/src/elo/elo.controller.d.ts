import { Repository } from 'typeorm';
import { PreviewEloDto } from '../dtos/preview-elo.dto';
import { UserElo } from '../entities/user-elo.entity';
import { EloService } from './elo.service';
export declare class EloController {
    private readonly eloService;
    private readonly userEloRepository;
    constructor(eloService: EloService, userEloRepository: Repository<UserElo>);
    previewElo(previewDto: PreviewEloDto): Promise<{
        success: boolean;
        data: import("./elo.service").EloCalculationResult;
        message: string;
    }>;
}
