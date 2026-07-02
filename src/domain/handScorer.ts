import { Tile } from '../utils/tileParser';
import { analyzeHand } from './handAnalyzer';
import { judgeYaku, countDora, YakuResult } from './yakuJudge';
import { calculateFu } from './fuCalculator';
import { calculateScore } from './scoreCalculator';
import { createHand } from './models/hand';

export interface HandScoreInput {
  /** 手牌14枚（アガリ牌を含む）。門前手のみ対応。 */
  tiles: Tile[];
  /** アガリ牌 */
  winTile: Tile;
  isTsumo: boolean;
  isParent: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  /** ドラ（手牌内でドラに該当する牌。重複分だけ翻が増える） */
  dora: Tile[];
  /** 場風（1z東〜4z北）。役牌・ピンフ判定に使用 */
  roundWind?: Tile;
  /** 自風（1z東〜4z北）。役牌・ピンフ判定に使用 */
  seatWind?: Tile;
}

export interface HandScoreResult {
  ok: boolean;
  /** 失敗理由（ok=false のとき） */
  error?: string;
  /** 表示用点数文字列（例: "2000", "500/1000", "4000 all"） */
  scoreText: string;
  /** 実収支の合計点（複数分解の比較・表示用） */
  totalPoints: number;
  han: number;
  fu: number;
  isYakuman: boolean;
  yaku: YakuResult[];
  doraCount: number;
}

const EMPTY: HandScoreResult = {
  ok: false, scoreText: '', totalPoints: 0,
  han: 0, fu: 0, isYakuman: false, yaku: [], doraCount: 0,
};

/**
 * 手牌（門前）から点数を計算する。
 * 複数の面子分解が可能な場合は最も高い点数になる分解を採用する（高点法）。
 * 役が一つも無い場合や、アガリの形になっていない場合は ok=false を返す。
 */
export function scoreHand(input: HandScoreInput): HandScoreResult {
  const { tiles, winTile, isTsumo, isParent, isRiichi, isIppatsu, dora, roundWind, seatWind } = input;

  if (tiles.length !== 14) {
    return { ...EMPTY, error: '手牌はアガリ牌を含めて14枚にしてください' };
  }
  if (!tiles.some(t => t.equals(winTile))) {
    return { ...EMPTY, error: 'アガリ牌が手牌に含まれていません' };
  }

  const decompositions = analyzeHand(tiles, winTile);
  if (decompositions.length === 0) {
    return { ...EMPTY, error: 'アガリの形になっていません（4面子1雀頭・七対子・国士無双のいずれか）' };
  }

  const hand = createHand({
    tiles, winTile, isTsumo, isMenzen: true, isParent,
    isRiichi, isIppatsu, dora, roundWind, seatWind,
  });

  const doraCount = countDora(tiles, dora);

  let best: HandScoreResult | null = null;

  for (const decomp of decompositions) {
    const yakuList = judgeYaku(hand, decomp);
    if (yakuList.length === 0) continue; // 役なしの分解は不採用（ドラのみでは和了れない）

    const hasYakuman = yakuList.some(y => y.han >= 13);
    let han = hasYakuman ? 13 : yakuList.reduce((sum, y) => sum + y.han, 0) + doraCount;

    const isPinfu = yakuList.some(y => y.name === 'ピンフ');
    const fu = hasYakuman
      ? 0
      : calculateFu({ decomposition: decomp, isTsumo, isMenzen: true, isPinfu, seatWind, roundWind });

    const result = calculateScore({ fu, han, isParent, isTsumo, isYakuman: hasYakuman });

    const totalPoints = isTsumo
      ? (isParent ? result.tsumoOyaPoints * 3 : result.tsumoKoPoints * 2 + result.tsumoOyaPoints)
      : result.ronPoints;

    if (!best || totalPoints > best.totalPoints) {
      best = {
        ok: true,
        scoreText: result.toAnswerString(),
        totalPoints,
        han,
        fu,
        isYakuman: hasYakuman,
        yaku: yakuList,
        doraCount,
      };
    }
  }

  if (!best) {
    return { ...EMPTY, error: '役がありません（リーチ・タンヤオなど役が1つ以上必要です）' };
  }

  return best;
}
