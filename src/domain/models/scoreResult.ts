export class ScoreResult {
  readonly basePoints: number;
  readonly isParent: boolean;
  readonly isTsumo: boolean;

  constructor(basePoints: number, isParent: boolean, isTsumo: boolean) {
    this.basePoints = basePoints;
    this.isParent = isParent;
    this.isTsumo = isTsumo;
  }

  get ronPoints(): number {
    const multiplier = this.isParent ? 6 : 4;
    return ScoreResult.roundUp(this.basePoints * multiplier, 100);
  }

  get tsumoKoPoints(): number {
    return ScoreResult.roundUp(this.basePoints, 100);
  }

  get tsumoOyaPoints(): number {
    return ScoreResult.roundUp(this.basePoints * 2, 100);
  }

  toAnswerString(): string {
    if (this.isTsumo) {
      if (this.isParent) {
        return `${this.tsumoOyaPoints} all`;
      } else {
        return `${this.tsumoKoPoints}/${this.tsumoOyaPoints}`;
      }
    } else {
      return `${this.ronPoints}`;
    }
  }

  static roundUp(value: number, unit: number): number {
    return Math.ceil(value / unit) * unit;
  }
}
