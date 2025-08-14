"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EloService = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("./constants");
let EloService = class EloService {
    expected(ratingA, ratingB) {
        return (0, constants_1.expectedScore)(ratingA, ratingB);
    }
    h2hMultiplier(gap) {
        return (0, constants_1.h2hMultiplier)(gap);
    }
    handicapMultiplier(isHandicap) {
        return (0, constants_1.handicapMultiplier)(isHandicap);
    }
    effectiveK(isHandicap, gap) {
        return (0, constants_1.effectiveK)(isHandicap, gap);
    }
    apply(currentRating, expectedScore, actualScore, kEff) {
        return (0, constants_1.applyEloChange)(currentRating, expectedScore, actualScore, kEff);
    }
    calculateMatch(ratingA, ratingB, result, isHandicap, h2hGap) {
        const expectedA = this.expected(ratingA, ratingB);
        const expectedB = this.expected(ratingB, ratingA);
        const kEff = this.effectiveK(isHandicap, h2hGap);
        const actualScoreA = this.resultToScore(result);
        const actualScoreB = this.resultToScore(this.invertResult(result));
        const aNew = this.apply(ratingA, expectedA, actualScoreA, kEff);
        const bNew = this.apply(ratingB, expectedB, actualScoreB, kEff);
        const aDelta = aNew - ratingA;
        const bDelta = bNew - ratingB;
        return {
            aOld: ratingA,
            aNew,
            aDelta,
            bOld: ratingB,
            bNew,
            bDelta,
            kEff,
            h2hGap,
            expectedA,
            expectedB,
        };
    }
    resultToScore(result) {
        switch (result) {
            case 'win': return 1.0;
            case 'draw': return 0.5;
            case 'lose': return 0.0;
            default: throw new Error(`Invalid result: ${result}`);
        }
    }
    invertResult(result) {
        switch (result) {
            case 'win': return 'lose';
            case 'lose': return 'win';
            case 'draw': return 'draw';
            default: throw new Error(`Invalid result: ${result}`);
        }
    }
    getInitialRating() {
        return constants_1.ELO_CONSTANTS.INITIAL_RATING;
    }
    getBaseK() {
        return constants_1.ELO_CONSTANTS.K_BASE;
    }
};
exports.EloService = EloService;
exports.EloService = EloService = __decorate([
    (0, common_1.Injectable)()
], EloService);
//# sourceMappingURL=elo.service.js.map