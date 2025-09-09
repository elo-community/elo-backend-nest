import { Injectable } from '@nestjs/common';
import {
  applyEloChange,
  effectiveK,
  ELO_CONSTANTS,
  expectedScore,
  h2hMultiplier,
  handicapMultiplier,
} from './constants';

export interface EloCalculationResult {
  /** Player A's old rating */
  aOld: number;
  /** Player A's new rating */
  aNew: number;
  /** Player A's rating change */
  aDelta: number;
  /** Player B's old rating */
  bOld: number;
  /** Player B's new rating */
  bNew: number;
  /** Player B's rating change */
  bDelta: number;
  /** Effective K-factor used */
  kEff: number;
  /** Head-to-head gap between players */
  h2hGap: number;
  /** Expected score for player A */
  expectedA: number;
  /** Expected score for player B */
  expectedB: number;
}

@Injectable()
export class EloService {
  /**
   * Calculate expected score for player A against player B
   * @param ratingA - Player A's rating
   * @param ratingB - Player B's rating
   * @returns Expected score (0.0 to 1.0)
   */
  expected(ratingA: number, ratingB: number): number {
    return expectedScore(ratingA, ratingB);
  }

  /**
   * Calculate H2H multiplier based on win-loss gap
   * @param gap - Absolute difference between wins and losses
   * @returns Multiplier value
   */
  h2hMultiplier(gap: number): number {
    return h2hMultiplier(gap);
  }

  /**
   * Calculate handicap multiplier
   * @param isHandicap - Whether the match has handicap
   * @returns Multiplier value (0.3 for handicap, 1.0 for normal)
   */
  handicapMultiplier(isHandicap: boolean): number {
    return handicapMultiplier(isHandicap);
  }

  /**
   * Calculate effective K-factor
   * @param isHandicap - Whether the match has handicap
   * @param gap - Head-to-head gap between players
   * @returns Effective K-factor
   */
  effectiveK(isHandicap: boolean, gap: number): number {
    return effectiveK(isHandicap, gap);
  }

  /**
   * Apply Elo rating change
   * @param currentRating - Current rating
   * @param expectedScore - Expected score (0.0 to 1.0)
   * @param actualScore - Actual score (1.0 for win, 0.5 for draw, 0.0 for loss)
   * @param kEff - Effective K-factor
   * @returns New rating rounded to 2 decimal places
   */
  apply(currentRating: number, expectedScore: number, actualScore: number, kEff: number): number {
    return applyEloChange(currentRating, expectedScore, actualScore, kEff);
  }

  /**
   * Calculate Elo rating changes for both players
   * @param ratingA - Player A's current rating
   * @param ratingB - Player B's current rating
   * @param result - Match result from A's perspective ('win', 'lose', 'draw')
   * @param isHandicap - Whether the match has handicap
   * @param h2hGap - Head-to-head gap between players
   * @returns Complete Elo calculation result
   */
  calculateMatch(
    ratingA: number,
    ratingB: number,
    result: 'win' | 'lose' | 'draw',
    isHandicap: boolean,
    h2hGap: number,
  ): EloCalculationResult {
    // Calculate expected scores
    const expectedA = this.expected(ratingA, ratingB);
    const expectedB = this.expected(ratingB, ratingA);

    // Calculate effective K-factor
    const kEff = this.effectiveK(isHandicap, h2hGap);

    // Convert result to actual scores
    const actualScoreA = this.resultToScore(result);
    const actualScoreB = this.resultToScore(this.invertResult(result));

    // Calculate new ratings
    const aNew = this.apply(ratingA, expectedA, actualScoreA, kEff);
    const bNew = this.apply(ratingB, expectedB, actualScoreB, kEff);

    // Calculate deltas
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

  /**
   * Convert match result to numerical score
   * @param result - Match result
   * @returns Numerical score (1.0 for win, 0.5 for draw, 0.0 for loss)
   */
  private resultToScore(result: 'win' | 'lose' | 'draw'): number {
    switch (result) {
      case 'win':
        return 1.0;
      case 'draw':
        return 0.5;
      case 'lose':
        return 0.0;
      default:
        throw new Error(`Invalid result: ${result}`);
    }
  }

  /**
   * Invert match result (A's result from B's perspective)
   * @param result - Match result from A's perspective
   * @returns Match result from B's perspective
   */
  private invertResult(result: 'win' | 'lose' | 'draw'): 'win' | 'lose' | 'draw' {
    switch (result) {
      case 'win':
        return 'lose';
      case 'lose':
        return 'win';
      case 'draw':
        return 'draw';
      default:
        throw new Error(`Invalid result: ${result}`);
    }
  }

  /**
   * Get initial rating for new users
   * @returns Initial rating value
   */
  getInitialRating(): number {
    return ELO_CONSTANTS.INITIAL_RATING;
  }

  /**
   * Get base K-factor
   * @returns Base K-factor value
   */
  getBaseK(): number {
    return ELO_CONSTANTS.K_BASE;
  }
}
