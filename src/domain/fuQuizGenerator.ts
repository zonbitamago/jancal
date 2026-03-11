import { parseTiles, parseTileGroups, Tile, TileType } from '../utils/tileParser';
import { analyzeHand, analyzeHandWithOpen } from './handAnalyzer';
import { judgeYaku } from './yakuJudge';
import { calculateFu } from './fuCalculator';
import { createHand } from './models/hand';
import { Mentsu, MentsuType } from './models/mentsu';

export interface FuQuizProblem {
  id: string;
  tiles: string;
  winTile: string;
  yaku: string[];
  dora: string[];
  isTsumo: boolean;
  isMenzen: boolean;
  isParent: boolean;
  correctFu: number;
  choices: number[];
  openGroups: number[];
  fuBreakdown: string;
}

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

export class FuQuizGenerator {
  private random: SeededRandom;
  private counter = 0;

  constructor(seed?: number) {
    this.random = new SeededRandom(seed);
  }

  generate(): FuQuizProblem {
    for (let attempt = 0; attempt < 100; attempt++) {
      const problem = this.tryGenerate();
      if (problem) return problem;
    }
    // フォールバック: ピンフロン 30符固定
    return this.fallbackProblem();
  }

  private tryGenerate(): FuQuizProblem | null {
    const type = this.random.nextInt(5);
    switch (type) {
      case 0: return this.generatePinfuHand();
      case 1: return this.generateAnkoHand();
      case 2: return this.generateChitoitsuHand();
      case 3: return this.generateOpenHand();
      default: return this.generateMixedHand();
    }
  }

  // ピンフ系: 20符 or 30符
  private generatePinfuHand(): FuQuizProblem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    for (let i = 0; i < 3; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    const suitIdx = this.random.nextInt(3);
    const start = this.random.nextInt(5) + 2;
    groups.push(`${start}${start + 1}${start + 2}${suitChar(suits[suitIdx])}`);

    const pairSuit = suits[this.random.nextInt(3)];
    const pairNum = this.random.nextInt(7) + 2;
    groups.push(`${pairNum}${pairNum}${suitChar(pairSuit)}`);

    const lastS = groups[3];
    const lastStart = parseInt(lastS[0], 10);
    const lastSuitCh = lastS[lastS.length - 1];
    const winTileStr = this.random.nextBool()
      ? `${lastStart}${lastSuitCh}`
      : `${lastStart + 2}${lastSuitCh}`;

    const tilesStr = groups.join(' ');
    const isTsumo = this.random.nextBool();

    return this.buildProblem({
      tilesStr, winTileStr, isTsumo, isParent: this.random.nextInt(4) === 0,
      isRiichi: this.random.nextBool(), isMenzen: true, openGroups: [],
    });
  }

  // 暗刻を含む手: 符が変わるパターン
  private generateAnkoHand(): FuQuizProblem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    // 暗刻を1-2個
    const ankoCount = this.random.nextInt(2) + 1;
    for (let i = 0; i < ankoCount; i++) {
      const suit = suits[this.random.nextInt(3)];
      const num = this.random.nextInt(9) + 1;
      groups.push(`${num}${num}${num}${suitChar(suit)}`);
    }

    // 残りは順子
    for (let i = ankoCount; i < 4; i++) {
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

    return this.buildProblem({
      tilesStr, winTileStr, isTsumo, isParent: this.random.nextInt(4) === 0,
      isRiichi: true, isMenzen: true, openGroups: [],
    });
  }

  // 七対子: 25符固定
  private generateChitoitsuHand(): FuQuizProblem | null {
    const allTileKeys: string[] = [];
    for (const suit of ['m', 'p', 's']) {
      for (let n = 1; n <= 9; n++) allTileKeys.push(`${n}${suit}`);
    }
    for (let n = 1; n <= 7; n++) allTileKeys.push(`${n}z`);
    this.random.shuffle(allTileKeys);

    const chosen = allTileKeys.slice(0, 7);
    const groupStrs = chosen.map(k => {
      const num = k.substring(0, k.length - 1);
      const suit = k[k.length - 1];
      return `${num}${num}${suit}`;
    });

    const tilesStr = groupStrs.join(' ');
    const winTileStr = chosen[chosen.length - 1];
    const isTsumo = this.random.nextBool();

    return this.buildProblem({
      tilesStr, winTileStr, isTsumo, isParent: this.random.nextInt(4) === 0,
      isRiichi: this.random.nextBool(), isMenzen: true, openGroups: [],
    });
  }

  // 副露手: 明刻ありで符計算が複雑
  private generateOpenHand(): FuQuizProblem | null {
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

    return this.buildProblem({
      tilesStr, winTileStr, isTsumo, isParent: this.random.nextInt(4) === 0,
      isRiichi: false, isMenzen: false, openGroups: [0],
    });
  }

  // 暗刻+待ち種類が混在する手
  private generateMixedHand(): FuQuizProblem | null {
    const suits = [TileType.man, TileType.pin, TileType.sou];
    const groups: string[] = [];

    // 暗刻1個
    const ankoSuit = suits[this.random.nextInt(3)];
    const ankoNum = this.random.nextInt(9) + 1;
    groups.push(`${ankoNum}${ankoNum}${ankoNum}${suitChar(ankoSuit)}`);

    // 順子3個
    for (let i = 0; i < 3; i++) {
      const suit = suits[this.random.nextInt(3)];
      const start = this.random.nextInt(7) + 1;
      groups.push(`${start}${start + 1}${start + 2}${suitChar(suit)}`);
    }

    // 字牌雀頭（三元牌で符が付く）
    const dragonNum = this.random.nextInt(3) + 5; // 5=白, 6=發, 7=中
    groups.push(`${dragonNum}${dragonNum}z`);

    const tilesStr = groups.join(' ');
    const winTileStr = `${dragonNum}z`;
    const isTsumo = this.random.nextBool();

    return this.buildProblem({
      tilesStr, winTileStr, isTsumo, isParent: this.random.nextInt(4) === 0,
      isRiichi: true, isMenzen: true, openGroups: [],
    });
  }

  private buildProblem(params: {
    tilesStr: string; winTileStr: string; isTsumo: boolean; isParent: boolean;
    isRiichi: boolean; isMenzen: boolean; openGroups: number[];
  }): FuQuizProblem | null {
    try {
      const { tilesStr, winTileStr, isTsumo, isParent, isRiichi, isMenzen, openGroups } = params;

      const tiles = parseTiles(tilesStr);
      if (tiles.length !== 14) return null;

      const winTile = parseTiles(winTileStr)[0];
      if (!tiles.some(t => t.equals(winTile))) return null;

      const hand = createHand({
        tiles, winTile, isTsumo, isMenzen, isParent, isRiichi,
      });

      let decompositions;
      if (openGroups.length > 0) {
        const tileGroups = parseTileGroups(tilesStr);
        const openMentsuList: Mentsu[] = [];
        const closedTiles: Tile[] = [];
        for (let gi = 0; gi < tileGroups.length; gi++) {
          const groupTiles = tileGroups[gi].tiles;
          if (openGroups.includes(gi)) {
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

      // 最良の分解を選択
      let bestFu = 0;
      let bestYaku: { name: string; han: number }[] = [];

      for (const decomp of decompositions) {
        const yakuList = judgeYaku(hand, decomp);
        if (yakuList.length === 0) continue;

        const isPinfu = yakuList.some(y => y.name === 'ピンフ');
        const hasYakuman = yakuList.some(y => y.han >= 13);
        if (hasYakuman) continue; // 役満は符計算なし

        const fu = calculateFu({
          decomposition: decomp, isTsumo, isMenzen, isPinfu,
        });

        if (fu > bestFu || bestYaku.length === 0) {
          bestFu = fu;
          bestYaku = yakuList;
        }
      }

      if (bestFu === 0 || bestYaku.length === 0) return null;

      const choices = this.generateFuChoices(bestFu);
      const yakuNames = bestYaku.map(y => y.name);

      // 符の内訳を生成
      const breakdown = this.generateFuBreakdownText(bestFu, isTsumo, isMenzen, bestYaku);

      this.counter++;
      return {
        id: `fu${this.counter}`,
        tiles: tilesStr,
        winTile: winTileStr,
        yaku: yakuNames,
        dora: [],
        isTsumo,
        isMenzen,
        isParent,
        correctFu: bestFu,
        choices,
        openGroups,
        fuBreakdown: breakdown,
      };
    } catch {
      return null;
    }
  }

  private generateFuChoices(correct: number): number[] {
    const allFuValues = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
    const choices = new Set<number>([correct]);

    // 正解の近くの値を候補に
    const nearValues = allFuValues.filter(v => v !== correct);
    this.random.shuffle(nearValues);
    for (const v of nearValues) {
      if (choices.size >= 4) break;
      choices.add(v);
    }

    const choiceList = [...choices];
    this.random.shuffle(choiceList);
    return choiceList;
  }

  private generateFuBreakdownText(
    fu: number, isTsumo: boolean, isMenzen: boolean,
    yakuList: { name: string; han: number }[],
  ): string {
    const isPinfu = yakuList.some(y => y.name === 'ピンフ');
    const isChitoitsu = yakuList.some(y => y.name === '七対子');

    if (isChitoitsu) return '七対子は25符固定です。';
    if (isPinfu && isTsumo) return 'ピンフツモは20符固定です。';
    if (isPinfu && !isTsumo) return 'ピンフロンは30符固定です。';

    const parts: string[] = ['副底20符'];
    if (!isTsumo && isMenzen) parts.push('門前ロン加符10符');
    if (isTsumo) parts.push('ツモ符2符');
    parts.push(`→ 合計${fu}符`);

    return parts.join(' + ');
  }

  private fallbackProblem(): FuQuizProblem {
    this.counter++;
    return {
      id: `fu${this.counter}`,
      tiles: '123m 456p 789s 234m 55s',
      winTile: '5s',
      yaku: ['リーチ', 'ピンフ'],
      dora: [],
      isTsumo: false,
      isMenzen: true,
      isParent: false,
      correctFu: 30,
      choices: [20, 25, 30, 40],
      openGroups: [],
      fuBreakdown: 'ピンフロンは30符固定です。',
    };
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
