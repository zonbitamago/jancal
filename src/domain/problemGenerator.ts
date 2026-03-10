import { Problem, QuizLevel, getProblemsForLevel } from '../models/problem';
import { parseTiles, parseTileGroups, Tile, TileType } from '../utils/tileParser';
import { analyzeHand, analyzeHandWithOpen } from './handAnalyzer';
import { judgeYaku, countDora } from './yakuJudge';
import { calculateFu } from './fuCalculator';
import { calculateScore } from './scoreCalculator';
import { createHand } from './models/hand';
import { Mentsu, MentsuType } from './models/mentsu';

// シンプルな擬似乱数生成器（seed対応）
class SeededRandom {
  private state: number;

  constructor(seed?: number) {
    this.state = seed ?? Date.now();
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0x100000000;
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  nextBool(): boolean {
    return this.next() < 0.5;
  }

  shuffle<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

export class ProblemGenerator {
  private random: SeededRandom;
  private counter = 0;

  constructor(seed?: number) {
    this.random = new SeededRandom(seed);
  }

  generate(level: QuizLevel): Problem {
    for (let attempt = 0; attempt < 100; attempt++) {
      const problem = this.tryGenerate(level);
      if (problem) return problem;
    }
    // フォールバック
    const problems = getProblemsForLevel(level);
    return problems[this.random.nextInt(problems.length)];
  }

  private tryGenerate(level: QuizLevel): Problem | null {
    switch (level) {
      case QuizLevel.beginner: return this.generateBeginner();
      case QuizLevel.intermediate: return this.generateIntermediate();
      case QuizLevel.advanced: return this.generateAdvanced();
    }
  }

  private generateBeginner(): Problem | null {
    const type = this.random.nextInt(4);
    switch (type) {
      case 0: return this.generatePinfuHand();
      case 1: return this.generateTanyaoHand();
      case 2: return this.generateChitoitsuHand();
      default: return this.generatePinfuHand();
    }
  }

  private generateIntermediate(): Problem | null {
    const type = this.random.nextInt(4);
    switch (type) {
      case 0: return this.generateTanyaoPinfuRiichi();
      case 1: return this.generateYakuhaiOpenHand();
      case 2: return this.generateChitoitsuHand(true);
      default: return this.generateToitoiOpenHand();
    }
  }

  private generateAdvanced(): Problem | null {
    const type = this.random.nextInt(3);
    switch (type) {
      case 0: return this.generateHonitsuHand();
      case 1: return this.generateChinitsuHand();
      default: return this.generateMultiDoraHand();
    }
  }

  private generatePinfuHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const shuntsuList: { start: number; suitIdx: number }[] = [];

    for (let i = 0; i < 3; i++) {
      const suitIdx = this.random.nextInt(3);
      const start = this.random.nextInt(7) + 1;
      shuntsuList.push({ start, suitIdx });
    }
    // 最後の順子は両面待ち可能な範囲（2-6始まり）にする
    {
      const suitIdx = this.random.nextInt(3);
      const start = this.random.nextInt(5) + 2; // 2-6
      shuntsuList.push({ start, suitIdx });
    }

    const pairSuitIdx = this.random.nextInt(3);
    const pairNum = this.random.nextInt(7) + 2;

    const lastS = shuntsuList[shuntsuList.length - 1];
    const lastStart = lastS.start;
    const lastSuit = suits[lastS.suitIdx];
    // lastStartは2-6なので常に両面待ちが可能
    const winTileStr = this.random.nextBool()
      ? `${lastStart}${suitChar(lastSuit)}`
      : `${lastStart + 2}${suitChar(lastSuit)}`;

    const groups: string[] = [];
    for (const s of shuntsuList) {
      const sc = suitChar(suits[s.suitIdx]);
      groups.push(`${s.start}${s.start + 1}${s.start + 2}${sc}`);
    }
    groups.push(`${pairNum}${pairNum}${suitChar(suits[pairSuitIdx])}`);

    const tilesStr = groups.join(' ');
    const isRiichi = this.random.nextBool();
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi,
      isIppatsu: false, isMenzen: true, level: QuizLevel.beginner,
    });
  }

  private generateTanyaoHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    for (let i = 0; i < 4; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(5) + 2;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    const pairSuit = suits[this.random.nextInt(3)];
    const pairNum = this.random.nextInt(7) + 2;
    groups.push(`${pairNum}${pairNum}${suitChar(pairSuit)}`);

    const tilesStr = groups.join(' ');
    const lastGroup = groups[3];
    const lastStart = parseInt(lastGroup[0], 10);
    const lastSuitCh = lastGroup[lastGroup.length - 1];
    const winNum = this.random.nextBool() ? lastStart : lastStart + 2;
    const winTileStr = `${winNum}${lastSuitCh}`;

    const isMenzen = this.random.nextBool();
    const isRiichi = isMenzen && this.random.nextBool();
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi,
      isIppatsu: false, isMenzen,
      openGroups: isMenzen ? [] : [0],
      level: QuizLevel.beginner,
    });
  }

  private generateChitoitsuHand(withDora = false): Problem | null {
    const allTileKeys: string[] = [];
    for (const suit of ['m', 'p', 's']) {
      for (let n = 1; n <= 9; n++) allTileKeys.push(`${n}${suit}`);
    }
    for (let n = 1; n <= 7; n++) allTileKeys.push(`${n}z`);
    this.random.shuffle(allTileKeys);

    const chosen = allTileKeys.slice(0, 7);
    const groupStrs: string[] = [];
    for (const k of chosen) {
      const num = k.substring(0, k.length - 1);
      const suit = k[k.length - 1];
      groupStrs.push(`${num}${num}${suit}`);
    }

    const tilesStr = groupStrs.join(' ');
    const winTileStr = chosen[chosen.length - 1];
    const isRiichi = this.random.nextBool();
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    const doraStrs: string[] = [];
    if (withDora) {
      const doraCount = this.random.nextInt(2) + 1;
      const doraCandidates = [...chosen];
      this.random.shuffle(doraCandidates);
      doraStrs.push(...doraCandidates.slice(0, doraCount));
    }

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi,
      isIppatsu: false, isMenzen: true, doraStrs,
      level: withDora ? QuizLevel.intermediate : QuizLevel.beginner,
    });
  }

  private generateTanyaoPinfuRiichi(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    for (let i = 0; i < 4; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(5) + 2;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    const pairSuit = suits[this.random.nextInt(3)];
    const pairNum = this.random.nextInt(7) + 2;
    groups.push(`${pairNum}${pairNum}${suitChar(pairSuit)}`);

    const tilesStr = groups.join(' ');
    const lastGroup = groups[3];
    const lastStart = parseInt(lastGroup[0], 10);
    const lastSuitCh = lastGroup[lastGroup.length - 1];
    const winNum = this.random.nextBool() ? lastStart : lastStart + 2;
    const winTileStr = `${winNum}${lastSuitCh}`;

    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    const tiles = parseTiles(tilesStr);
    const doraCount = this.random.nextInt(2) + 1;
    const uniqueTiles = [...new Map(tiles.map(t => [t.key, t])).values()];
    this.random.shuffle(uniqueTiles);
    const doraStrs = uniqueTiles.slice(0, doraCount).map(t => t.key);

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi: true,
      isIppatsu: false, isMenzen: true, doraStrs,
      level: QuizLevel.intermediate,
    });
  }

  private generateYakuhaiOpenHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const dragons = ['5z', '6z', '7z'];
    const dragonKey = dragons[this.random.nextInt(3)];

    const groups: string[] = [];
    const dn = dragonKey.substring(0, dragonKey.length - 1);
    groups.push(`${dn}${dn}${dn}z`);

    for (let i = 0; i < 3; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    const pairSuit = suits[this.random.nextInt(3)];
    const pairNum = this.random.nextInt(9) + 1;
    groups.push(`${pairNum}${pairNum}${suitChar(pairSuit)}`);

    const tilesStr = groups.join(' ');
    const winTileStr = `${pairNum}${suitChar(pairSuit)}`;

    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi: false,
      isIppatsu: false, isMenzen: false, openGroups: [0],
      level: QuizLevel.intermediate,
    });
  }

  private generateToitoiOpenHand(): Problem | null {
    const allTileKeys: string[] = [];
    for (const suit of ['m', 'p', 's']) {
      for (let n = 1; n <= 9; n++) allTileKeys.push(`${n}${suit}`);
    }
    for (let n = 1; n <= 7; n++) allTileKeys.push(`${n}z`);
    this.random.shuffle(allTileKeys);

    const chosen = allTileKeys.slice(0, 5);
    const groups: string[] = [];
    for (let i = 0; i < 4; i++) {
      const k = chosen[i];
      const num = k.substring(0, k.length - 1);
      const suit = k[k.length - 1];
      groups.push(`${num}${num}${num}${suit}`);
    }
    const pk = chosen[4];
    const pnum = pk.substring(0, pk.length - 1);
    const psuit = pk[pk.length - 1];
    groups.push(`${pnum}${pnum}${psuit}`);

    const tilesStr = groups.join(' ');
    const winTileStr = pk;
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi: false,
      isIppatsu: false, isMenzen: false, openGroups: [0, 1],
      level: QuizLevel.intermediate,
    });
  }

  private generateHonitsuHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const suit = suits[this.random.nextInt(3)];
    const sc = suitChar(suit);

    const groups: string[] = [];
    for (let i = 0; i < 3; i++) {
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${sc}`);
    }
    const honorNum = this.random.nextInt(7) + 1;
    groups.push(`${honorNum}${honorNum}${honorNum}z`);
    const pairNum = this.random.nextInt(9) + 1;
    groups.push(`${pairNum}${pairNum}${sc}`);

    const tilesStr = groups.join(' ');
    const winTileStr = `${pairNum}${sc}`;
    const isRiichi = this.random.nextBool();
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    const tiles = parseTiles(tilesStr);
    const doraCount = this.random.nextInt(2) + 1;
    const uniqueTiles = [...new Map(tiles.map(t => [t.key, t])).values()];
    this.random.shuffle(uniqueTiles);
    const doraStrs = uniqueTiles.slice(0, doraCount).map(t => t.key);

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi,
      isIppatsu: false, isMenzen: true, doraStrs,
      level: QuizLevel.advanced,
    });
  }

  private generateChinitsuHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const suit = suits[this.random.nextInt(3)];
    const sc = suitChar(suit);

    const groups: string[] = [];
    for (let i = 0; i < 4; i++) {
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${sc}`);
    }
    const pairNum = this.random.nextInt(9) + 1;
    groups.push(`${pairNum}${pairNum}${sc}`);

    const tilesStr = groups.join(' ');
    const winTileStr = `${pairNum}${sc}`;
    const isMenzen = this.random.nextBool();
    const isRiichi = isMenzen && this.random.nextBool();
    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi,
      isIppatsu: false, isMenzen,
      openGroups: isMenzen ? [] : [0, 1],
      level: QuizLevel.advanced,
    });
  }

  private generateMultiDoraHand(): Problem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    for (let i = 0; i < 4; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    const pairSuit = suits[this.random.nextInt(3)];
    const pairNum = this.random.nextInt(9) + 1;
    groups.push(`${pairNum}${pairNum}${suitChar(pairSuit)}`);

    const tilesStr = groups.join(' ');
    const lastGroup = groups[3];
    const lastStart = parseInt(lastGroup[0], 10);
    const lastSuitCh = lastGroup[lastGroup.length - 1];
    const winTileStr = `${lastStart}${lastSuitCh}`;

    const isTsumo = this.random.nextBool();
    const isParent = this.random.nextInt(4) === 0;

    const tiles = parseTiles(tilesStr);
    const doraCount = this.random.nextInt(2) + 3;
    const uniqueTiles = [...new Map(tiles.map(t => [t.key, t])).values()];
    this.random.shuffle(uniqueTiles);
    const doraStrs = uniqueTiles.slice(0, Math.min(doraCount, uniqueTiles.length)).map(t => t.key);

    return this.buildAndVerifyProblem({
      tilesStr, winTileStr, isTsumo, isParent, isRiichi: true,
      isIppatsu: this.random.nextInt(3) === 0, isMenzen: true, doraStrs,
      level: QuizLevel.advanced,
    });
  }

  private buildAndVerifyProblem(params: {
    tilesStr: string; winTileStr: string; isTsumo: boolean; isParent: boolean;
    isRiichi: boolean; isIppatsu: boolean; isMenzen: boolean;
    doraStrs?: string[]; openGroups?: number[]; level: QuizLevel;
  }): Problem | null {
    try {
      const { tilesStr, winTileStr, isTsumo, isParent, isRiichi, isIppatsu, isMenzen,
        doraStrs = [], openGroups = [], level } = params;

      const tiles = parseTiles(tilesStr);
      if (tiles.length !== 14) return null;

      const winTile = parseTiles(winTileStr)[0];
      if (!tiles.some(t => t.equals(winTile))) return null;

      const dora = doraStrs.map(s => parseTiles(s)[0]);

      const hand = createHand({
        tiles, winTile, isTsumo, isMenzen, isParent, isRiichi, isIppatsu, dora,
      });

      let decompositions;
      if (openGroups.length > 0) {
        // 副露手: openGroupsのインデックスに対応するグループをMentsuに変換
        const tileGroups = parseTileGroups(tilesStr);
        const openMentsuList: Mentsu[] = [];
        const closedTiles: Tile[] = [];
        for (let gi = 0; gi < tileGroups.length; gi++) {
          const groupTiles = tileGroups[gi].tiles;
          if (openGroups.includes(gi)) {
            // 副露面子の種類を判定
            let mentsuType: MentsuType;
            if (groupTiles.length === 3 && groupTiles[0].equals(groupTiles[1])) {
              mentsuType = MentsuType.minko;
            } else if (groupTiles.length === 4 && groupTiles[0].equals(groupTiles[1])) {
              mentsuType = MentsuType.minkan;
            } else {
              mentsuType = MentsuType.shuntsu;
            }
            openMentsuList.push(new Mentsu(mentsuType, groupTiles));
          } else {
            closedTiles.push(...groupTiles);
          }
        }
        decompositions = analyzeHandWithOpen(closedTiles, winTile, openMentsuList);
      } else {
        decompositions = analyzeHand(tiles, winTile);
      }
      if (decompositions.length === 0) return null;

      let bestAnswer: string | null = null;
      let bestScore = -1;
      let bestHan = 0;
      let bestFu = 0;
      let bestYaku: { name: string; han: number }[] = [];
      let bestIsYakuman = false;

      for (const decomp of decompositions) {
        const yakuList = judgeYaku(hand, decomp);
        if (yakuList.length === 0) continue;

        let han = yakuList.reduce((sum, y) => sum + y.han, 0);
        const doraCountVal = countDora(tiles, dora);
        han += doraCountVal;

        const hasYakuman = yakuList.some(y => y.han >= 13);
        if (hasYakuman) han = 13;

        const isPinfu = yakuList.some(y => y.name === 'ピンフ');
        let fu: number;
        if (hasYakuman) {
          fu = 0;
        } else {
          fu = calculateFu({
            decomposition: decomp, isTsumo, isMenzen, isPinfu,
          });
        }

        const result = calculateScore({ fu, han, isParent, isTsumo, isYakuman: hasYakuman });

        const score = isTsumo
          ? (isParent
            ? result.tsumoOyaPoints * 3
            : result.tsumoKoPoints * 2 + result.tsumoOyaPoints)
          : result.ronPoints;

        if (score > bestScore) {
          bestScore = score;
          bestAnswer = result.toAnswerString();
          bestHan = han;
          bestFu = fu;
          bestYaku = yakuList;
          bestIsYakuman = hasYakuman;
        }
      }

      if (!bestAnswer || bestYaku.length === 0) return null;

      if (!this.isValidForLevel(level, bestHan, bestIsYakuman)) return null;

      const choices = this.generateChoices(bestAnswer, isTsumo, isParent);

      const yakuNames = bestYaku.map(y => y.name);
      const doraCountVal = countDora(tiles, dora);
      if (doraCountVal > 0) yakuNames.push(`ドラ${doraCountVal}`);
      const hint = this.generateHint(bestFu, bestHan, isParent, isTsumo, bestAnswer, yakuNames);

      this.counter++;
      return {
        id: `g${this.counter}`,
        tiles: tilesStr,
        winTile: winTileStr,
        yaku: bestYaku.map(y => y.name),
        dora: doraStrs,
        fu: bestFu,
        han: bestHan,
        isParent,
        isTsumo,
        correctAnswer: bestAnswer,
        choices,
        hint,
        openGroups,
      };
    } catch {
      return null;
    }
  }

  private isValidForLevel(level: QuizLevel, han: number, isYakuman: boolean): boolean {
    switch (level) {
      case QuizLevel.beginner: return han >= 1 && han <= 3 && !isYakuman;
      case QuizLevel.intermediate: return han >= 2 && han <= 5 && !isYakuman;
      case QuizLevel.advanced: return han >= 5 || isYakuman;
    }
  }

  private generateChoices(correct: string, isTsumo: boolean, _isParent: boolean): string[] {
    const choices = new Set<string>([correct]);

    if (isTsumo && correct.includes('/')) {
      const parts = correct.split('/');
      const ko = parseInt(parts[0], 10);
      const oya = parseInt(parts[1], 10);
      const multipliers = [0.5, 0.65, 1.5, 2.0, 0.75, 1.3];
      this.random.shuffle(multipliers);
      for (const m of multipliers) {
        if (choices.size >= 4) break;
        const newKo = this.roundToHundred(Math.round(ko * m));
        const newOya = this.roundToHundred(Math.round(oya * m));
        if (newKo > 0 && newOya > 0 && newKo !== ko) {
          choices.add(`${newKo}/${newOya}`);
        }
      }
    } else if (isTsumo && correct.includes(' all')) {
      const base = parseInt(correct.replace(' all', ''), 10);
      const multipliers = [0.5, 0.65, 1.5, 2.0];
      this.random.shuffle(multipliers);
      for (const m of multipliers) {
        if (choices.size >= 4) break;
        const newBase = this.roundToHundred(Math.round(base * m));
        if (newBase > 0 && newBase !== base) {
          choices.add(`${newBase} all`);
        }
      }
    } else {
      const base = parseInt(correct, 10);
      const multipliers = [0.5, 0.65, 0.75, 1.3, 1.5, 2.0];
      this.random.shuffle(multipliers);
      for (const m of multipliers) {
        if (choices.size >= 4) break;
        const newVal = this.roundToHundred(Math.round(base * m));
        if (newVal > 0 && newVal !== base) {
          choices.add(`${newVal}`);
        }
      }
    }

    while (choices.size < 4) {
      if (isTsumo && correct.includes('/')) {
        const parts = correct.split('/');
        const ko = parseInt(parts[0], 10);
        const r = this.random.nextInt(3) + 1;
        choices.add(`${ko * r}/${ko * r * 2}`);
      } else {
        choices.add(`${(this.random.nextInt(10) + 1) * 1000}`);
      }
    }

    const choiceList = [...choices];
    this.random.shuffle(choiceList);
    return choiceList;
  }

  private roundToHundred(value: number): number {
    return Math.ceil(value / 100) * 100;
  }

  private generateHint(
    fu: number, han: number, isParent: boolean, isTsumo: boolean,
    answer: string, yakuNames: string[]
  ): string {
    const position = isParent ? '親' : '子';
    const method = isTsumo ? 'ツモ' : 'ロン';
    const yakuStr = yakuNames.join('+');

    let levelName: string;
    if (han >= 13) {
      levelName = '役満';
    } else if (han >= 11) {
      levelName = '三倍満';
    } else if (han >= 8) {
      levelName = '倍満';
    } else if (han >= 6) {
      levelName = '跳満';
    } else if (han >= 5 || (han === 4 && fu >= 30) || (han === 3 && fu >= 60)) {
      levelName = '満貫';
    } else {
      levelName = `${fu}符${han}翻`;
    }

    return `${levelName} ${position}の${method} → ${answer}点。${yakuStr}。`;
  }
}

function suitChar(type: TileType): string {
  switch (type) {
    case TileType.man: return 'm';
    case TileType.pin: return 'p';
    case TileType.sou: return 's';
    case TileType.wind:
    case TileType.dragon: return 'z';
  }
}
