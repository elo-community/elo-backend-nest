"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.H2H_MULTIPLIERS = exports.ELO_CONSTANTS = void 0;
exports.round2 = round2;
exports.expectedScore = expectedScore;
exports.h2hMultiplier = h2hMultiplier;
exports.handicapMultiplier = handicapMultiplier;
exports.effectiveK = effectiveK;
exports.applyEloChange = applyEloChange;
exports.ELO_CONSTANTS = {
    INITIAL_RATING: 1400,
    K_BASE: 20,
    HANDICAP_MULTIPLIER: 0.3,
    RATING_DIVISOR: 400,
};
exports.H2H_MULTIPLIERS = {
    SMALL_GAP: { threshold: 2, multiplier: 1.0 },
    MEDIUM_GAP: { threshold: 4, multiplier: 0.75 },
    LARGE_GAP: { threshold: 6, multiplier: 0.5 },
    HUGE_GAP: { threshold: 7, multiplier: 0.25 },
};
function round2(value) {
    return Math.round(value * 100) / 100;
}
function expectedScore(ratingA, ratingB) {
    const ratingDiff = ratingB - ratingA;
    const exponent = ratingDiff / exports.ELO_CONSTANTS.RATING_DIVISOR;
    return 1 / (1 + Math.pow(10, exponent));
}
function h2hMultiplier(gap) {
    if (gap <= exports.H2H_MULTIPLIERS.SMALL_GAP.threshold) {
        return exports.H2H_MULTIPLIERS.SMALL_GAP.multiplier;
    }
    else if (gap <= exports.H2H_MULTIPLIERS.MEDIUM_GAP.threshold) {
        return exports.H2H_MULTIPLIERS.MEDIUM_GAP.multiplier;
    }
    else if (gap <= exports.H2H_MULTIPLIERS.LARGE_GAP.threshold) {
        return exports.H2H_MULTIPLIERS.LARGE_GAP.multiplier;
    }
    else {
        return exports.H2H_MULTIPLIERS.HUGE_GAP.multiplier;
    }
}
function handicapMultiplier(isHandicap) {
    return isHandicap ? exports.ELO_CONSTANTS.HANDICAP_MULTIPLIER : 1.0;
}
function effectiveK(isHandicap, h2hGap) {
    const h2hMult = h2hMultiplier(h2hGap);
    const handicapMult = handicapMultiplier(isHandicap);
    return round2(exports.ELO_CONSTANTS.K_BASE * h2hMult * handicapMult);
}
function applyEloChange(currentRating, expectedScore, actualScore, kEff) {
    const ratingChange = kEff * (actualScore - expectedScore);
    const newRating = currentRating + ratingChange;
    return round2(newRating);
}
//# sourceMappingURL=constants.js.map