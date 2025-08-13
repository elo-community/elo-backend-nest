"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EloController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const preview_elo_dto_1 = require("../dtos/preview-elo.dto");
const user_elo_entity_1 = require("../entities/user-elo.entity");
const elo_service_1 = require("./elo.service");
let EloController = class EloController {
    eloService;
    userEloRepository;
    constructor(eloService, userEloRepository) {
        this.eloService = eloService;
        this.userEloRepository = userEloRepository;
    }
    async previewElo(previewDto) {
        const { sportCategoryId, aId, bId, result, isHandicap = false } = previewDto;
        try {
            const ratingA = await this.userEloRepository.findOne({
                where: { user: { id: aId }, sportCategory: { id: sportCategoryId } }
            });
            const ratingB = await this.userEloRepository.findOne({
                where: { user: { id: bId }, sportCategory: { id: sportCategoryId } }
            });
            const h2hGap = 0;
            const eloResult = this.eloService.calculateMatch(ratingA?.eloPoint || 1400, ratingB?.eloPoint || 1400, result, isHandicap, h2hGap);
            return {
                success: true,
                data: eloResult,
                message: 'Elo calculation preview completed successfully',
            };
        }
        catch (error) {
            return {
                success: false,
                data: null,
                message: `Error calculating Elo: ${error.message}`,
            };
        }
    }
};
exports.EloController = EloController;
__decorate([
    (0, common_1.Post)('preview'),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview Elo rating calculation',
        description: 'Calculate Elo rating changes without persisting them to the database',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Elo calculation preview',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'object',
                    properties: {
                        aOld: { type: 'number', format: 'decimal' },
                        aNew: { type: 'number', format: 'decimal' },
                        aDelta: { type: 'number', format: 'decimal' },
                        bOld: { type: 'number', format: 'decimal' },
                        bNew: { type: 'number', format: 'decimal' },
                        bDelta: { type: 'number', format: 'decimal' },
                        kEff: { type: 'number', format: 'decimal' },
                        h2hGap: { type: 'number' },
                        expectedA: { type: 'number', format: 'decimal' },
                        expectedB: { type: 'number', format: 'decimal' },
                    },
                },
                message: { type: 'string' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [preview_elo_dto_1.PreviewEloDto]),
    __metadata("design:returntype", Promise)
], EloController.prototype, "previewElo", null);
exports.EloController = EloController = __decorate([
    (0, swagger_1.ApiTags)('Elo'),
    (0, common_1.Controller)('elo'),
    __param(1, (0, typeorm_1.InjectRepository)(user_elo_entity_1.UserElo)),
    __metadata("design:paramtypes", [elo_service_1.EloService,
        typeorm_2.Repository])
], EloController);
//# sourceMappingURL=elo.controller.js.map