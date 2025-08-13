export interface EloCalculationResult {
    aOld: number;
    aNew: number;
    aDelta: number;
    bOld: number;
    bNew: number;
    bDelta: number;
    kEff: number;
    h2hGap: number;
    expectedA: number;
    expectedB: number;
}
export declare class EloService {
    expected(ratingA: number, ratingB: number): number;
    h2hMultiplier(gap: number): number;
    handicapMultiplier(isHandicap: boolean): number;
    effectiveK(isHandicap: boolean, gap: number): number;
    apply(currentRating: number, expectedScore: number, actualScore: number, kEff: number): number;
    calculateMatch(ratingA: number, ratingB: number, result: 'win' | 'lose' | 'draw', isHandicap: boolean, h2hGap: number): EloCalculationResult;
    private resultToScore;
    private invertResult;
    getInitialRating(): number;
    getBaseK(): number;
}
