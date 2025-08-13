export declare const ELO_CONSTANTS: {
    readonly INITIAL_RATING: 1400;
    readonly K_BASE: 20;
    readonly HANDICAP_MULTIPLIER: 0.3;
    readonly RATING_DIVISOR: 400;
};
export declare const H2H_MULTIPLIERS: {
    readonly SMALL_GAP: {
        readonly threshold: 2;
        readonly multiplier: 1;
    };
    readonly MEDIUM_GAP: {
        readonly threshold: 4;
        readonly multiplier: 0.75;
    };
    readonly LARGE_GAP: {
        readonly threshold: 6;
        readonly multiplier: 0.5;
    };
    readonly HUGE_GAP: {
        readonly threshold: 7;
        readonly multiplier: 0.25;
    };
};
export declare function round2(value: number): number;
export declare function expectedScore(ratingA: number, ratingB: number): number;
export declare function h2hMultiplier(gap: number): number;
export declare function handicapMultiplier(isHandicap: boolean): number;
export declare function effectiveK(isHandicap: boolean, h2hGap: number): number;
export declare function applyEloChange(currentRating: number, expectedScore: number, actualScore: number, kEff: number): number;
