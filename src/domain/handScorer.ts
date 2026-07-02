import { Tile } from '../utils/tileParser';
import { analyzeHand, analyzeHandWithOpen } from './handAnalyzer';
import { judgeYaku, countDora, YakuResult } from './yakuJudge';
import { calculateFu } from './fuCalculator';
import { calculateScore } from './scoreCalculator';
import { createHand } from './models/hand';
import { Mentsu, MentsuType } from './models/mentsu';

export type OpenMeldType = 'chi' | 'pon' | 'minkan' | 'ankan';

export interface OpenMeldInput {
  type: OpenMeldType;
  /** チー: 連続する3枚 / ポン: 同じ3枚 / カン: 同じ4枚 */
  tiles: Tile[];
}

export interface HandScoreInput {
  /** 手の内の牌（アガリ牌を含む。副露を除いた部分）。枚数は 14 - 3×副露数。 */
  tiles: Tile[];
  /** 副露（鳴き）。省略時は門前手として扱う。 */
  openMelds?: OpenMeldInput[];
  /** アガリ牌 */
  winTile: Tile;
  isTsumo: boolean;
  isParent: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  /** ドラの牌種（1種につき1エントリ。手牌内の該当枚数だけ翻が増える） */
  dora: Tile[];
  /** 赤ドラの枚数（赤5m/5p/5s。1枚につき1翻。ドラ表示牌とは独立に加算） */
  akaDora?: number;
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
  akaDora: number;
  isMenzen: boolean;
}

const EMPTY: HandScoreResult = {
  ok: false, scoreText: '', totalPoints: 0,
  han: 0, fu: 0, isYakuman: false, yaku: [], doraCount: 0, akaDora: 0, isMenzen: true,
};

const MELD_TYPE_MAP: Record<OpenMeldType, MentsuType> = {
  chi: MentsuType.shuntsu,
  pon: MentsuType.minko,
  minkan: MentsuType.minkan,
  ankan: MentsuType.ankan,
};

/**
 * 手牌から点数を計算する。門前・副露の両方に対応。
 * 複数の面子分解が可能な場合は最も高い点数になる分解を採用する（高点法）。
 * 役が一つも無い場合や、アガリの形になっていない場合は ok=false を返す。
 */
export function scoreHand(input: HandScoreInput): HandScoreResult {
  const { tiles: concealed, winTile, isTsumo, isParent, isRiichi, isIppatsu, dora, roundWind, seatWind } = input;
  const openMelds = input.openMelds ?? [];
  const akaDora = input.akaDora ?? 0;

  // 暗槓のみ、または副露なしの場合は門前
  const isMenzen = openMelds.length === 0 || openMelds.every(m => m.type === 'ankan');

  const expectedConcealed = 14 - 3 * openMelds.length;
  if (openMelds.length > 4) {
    return { ...EMPTY, isMenzen, error: '副露は4つまでです' };
  }
  if (concealed.length !== expectedConcealed) {
    return {
      ...EMPTY, isMenzen,
      error: `手の内は${expectedConcealed}枚にしてください（アガリ牌を含む・現在${concealed.length}枚）`,
    };
  }
  if (!concealed.some(t => t.equals(winTile))) {
    return { ...EMPTY, isMenzen, error: 'アガリ牌が手の内に含まれていません' };
  }

  const openMentsu = openMelds.map(m => new Mentsu(MELD_TYPE_MAP[m.type], m.tiles));

  const decompositions = openMelds.length > 0
    ? analyzeHandWithOpen(concealed, winTile, openMentsu)
    : analyzeHand(concealed, winTile);

  if (decompositions.length === 0) {
    return { ...EMPTY, isMenzen, error: 'アガリの形になっていません（4面子1雀頭・七対子・国士無双のいずれか）' };
  }

  // 役判定・タンヤオ・混一色などは副露牌も含めた全体で判定する
  const allTiles = [...concealed, ...openMelds.flatMap(m => m.tiles)];

  const hand = createHand({
    tiles: allTiles, winTile, isTsumo, isMenzen, isParent,
    isRiichi, isIppatsu, dora, roundWind, seatWind, openMentsu,
  });

  const doraCount = countDora(allTiles, dora);

  let best: HandScoreResult | null = null;

  for (const decomp of decompositions) {
    const yakuList = judgeYaku(hand, decomp);
    if (yakuList.length === 0) continue; // 役なしの分解は不採用（ドラのみでは和了れない）

    const hasYakuman = yakuList.some(y => y.han >= 13);
    const han = hasYakuman ? 13 : yakuList.reduce((sum, y) => sum + y.han, 0) + doraCount + akaDora;

    const isPinfu = yakuList.some(y => y.name === 'ピンフ');
    const fu = hasYakuman
      ? 0
      : calculateFu({ decomposition: decomp, isTsumo, isMenzen, isPinfu, seatWind, roundWind });

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
        akaDora,
        isMenzen,
      };
    }
  }

  if (!best) {
    return { ...EMPTY, isMenzen, error: '役がありません（リーチ・タンヤオ・役牌など役が1つ以上必要です）' };
  }

  return best;
}
