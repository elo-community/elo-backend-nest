/**
 * Elo Rating System Constants
 */

export const ELO_CONSTANTS = {
    /** Initial rating for new users */
    INITIAL_RATING: 1400,

    /** Base K-factor for rating changes */
    K_BASE: 20,

    /** Handicap multiplier when isHandicap = true */
    HANDICAP_MULTIPLIER: 0.3,

    /** Rating divisor for Elo calculation */
    RATING_DIVISOR: 400,
} as const;

/**
 * H2H (Head-to-Head) gap thresholds and multipliers
 */
export const H2H_MULTIPLIERS = {
    /** Gap 0-2: No reduction */
    SMALL_GAP: { threshold: 2, multiplier: 1.0 },

    /** Gap 3-4: 25% reduction */
    MEDIUM_GAP: { threshold: 4, multiplier: 0.75 },

    /** Gap 5-6: 50% reduction */
    LARGE_GAP: { threshold: 6, multiplier: 0.5 },

    /** Gap 7+: 75% reduction */
    HUGE_GAP: { threshold: 7, multiplier: 0.25 },
} as const;

/**
 * Round a number to 2 decimal places
 * @param value - The number to round
 * @returns The rounded number with 2 decimal places
 */
export function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

/**
 * Calculate the expected score for player A against player B
 * @param ratingA - Player A's rating
 * @param ratingB - Player B's rating
 * @returns Expected score (0.0 to 1.0)
 */
export function expectedScore(ratingA: number, ratingB: number): number {
    const ratingDiff = ratingB - ratingA;
    const exponent = ratingDiff / ELO_CONSTANTS.RATING_DIVISOR;
    return 1 / (1 + Math.pow(10, exponent));
}

/**
 * Calculate H2H multiplier based on win-loss gap
 * @param gap - Absolute difference between wins and losses
 * @returns Multiplier value
 */
export function h2hMultiplier(gap: number): number {
    if (gap <= H2H_MULTIPLIERS.SMALL_GAP.threshold) {
        return H2H_MULTIPLIERS.SMALL_GAP.multiplier;
    } else if (gap <= H2H_MULTIPLIERS.MEDIUM_GAP.threshold) {
        return H2H_MULTIPLIERS.MEDIUM_GAP.multiplier;
    } else if (gap <= H2H_MULTIPLIERS.LARGE_GAP.threshold) {
        return H2H_MULTIPLIERS.LARGE_GAP.multiplier;
    } else {
        return H2H_MULTIPLIERS.HUGE_GAP.multiplier;
    }
}

/**
 * Calculate handicap multiplier
 * @param isHandicap - Whether the match has handicap
 * @returns Multiplier value (0.3 for handicap, 1.0 for normal)
 */
export function handicapMultiplier(isHandicap: boolean): number {
    return isHandicap ? ELO_CONSTANTS.HANDICAP_MULTIPLIER : 1.0;
}

/**
 * Calculate effective K-factor
 * @param isHandicap - Whether the match has handicap
 * @param h2hGap - Head-to-head gap between players
 * @returns Effective K-factor
 */
export function effectiveK(isHandicap: boolean, h2hGap: number): number {
    const h2hMult = h2hMultiplier(h2hGap);
    const handicapMult = handicapMultiplier(isHandicap);
    return round2(ELO_CONSTANTS.K_BASE * h2hMult * handicapMult);
}

/**
 * Apply Elo rating change
 * @param currentRating - Current rating
 * @param expectedScore - Expected score (0.0 to 1.0)
 * @param actualScore - Actual score (1.0 for win, 0.5 for draw, 0.0 for loss)
 * @param kEff - Effective K-factor
 * @returns New rating rounded to 2 decimal places
 */
export function applyEloChange(
    currentRating: number,
    expectedScore: number,
    actualScore: number,
    kEff: number
): number {
    const ratingChange = kEff * (actualScore - expectedScore);
    const newRating = currentRating + ratingChange;
    return round2(newRating);
} 