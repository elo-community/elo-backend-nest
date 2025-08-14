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
var SseController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SseController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const blockchain_service_1 = require("../blockchain/blockchain.service");
let SseController = SseController_1 = class SseController {
    blockchainService;
    logger = new common_1.Logger(SseController_1.name);
    constructor(blockchainService) {
        this.blockchainService = blockchainService;
    }
    stream(account, chain) {
        this.logger.log(`SSE stream started for account: ${account}, chain: ${chain}`);
        return (0, rxjs_1.interval)(15000).pipe((0, rxjs_1.map)(() => ({
            data: {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                message: 'SSE connection alive',
            },
        })));
    }
    distributions() {
        this.logger.log('Distribution SSE stream started');
        return (0, rxjs_1.interval)(30000).pipe((0, rxjs_1.map)(() => ({
            data: {
                type: 'distribution.status',
                timestamp: new Date().toISOString(),
                message: 'Distribution events stream active',
            },
        })));
    }
    claims(account) {
        this.logger.log(`Claims SSE stream started for account: ${account}`);
        return (0, rxjs_1.interval)(20000).pipe((0, rxjs_1.map)(() => ({
            data: {
                type: 'claim.status',
                timestamp: new Date().toISOString(),
                message: 'Claim events stream active',
                account: account || 'all',
            },
        })));
    }
};
exports.SseController = SseController;
__decorate([
    (0, common_1.Sse)('stream'),
    __param(0, (0, common_1.Query)('account')),
    __param(1, (0, common_1.Query)('chain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], SseController.prototype, "stream", null);
__decorate([
    (0, common_1.Sse)('distributions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", rxjs_1.Observable)
], SseController.prototype, "distributions", null);
__decorate([
    (0, common_1.Sse)('claims'),
    __param(0, (0, common_1.Query)('account')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], SseController.prototype, "claims", null);
exports.SseController = SseController = SseController_1 = __decorate([
    (0, common_1.Controller)('sse'),
    __metadata("design:paramtypes", [blockchain_service_1.BlockchainService])
], SseController);
//# sourceMappingURL=sse.controller.js.map