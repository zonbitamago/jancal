import { describe, test, expect } from 'vitest';
import { calculateScore } from '../../domain/scoreCalculator';
import { calculateFu } from '../../domain/fuCalculator';
import { analyzeHand } from '../../domain/handAnalyzer';
import { judgeYaku, countDora } from '../../domain/yakuJudge';
import { createHand } from '../../domain/models/hand';
import { parseTiles } from '../../utils/tileParser';

function calculateScoreFromProblem(params: {
  fu: number; han: number; isParent: boolean; isTsumo: boolean; isYakuman?: boolean;
}): string {
  return calculateScore(params).toAnswerString();
}

function calculateScoreFromHand(params: {
  tilesStr: string; winTileStr: string; isTsumo: boolean; isParent: boolean;
  yakuNames: string[]; doraStrs?: string[];
}): string {
  const { tilesStr, winTileStr, isTsumo, isParent, yakuNames, doraStrs = [] } = params;
  const tiles = parseTiles(tilesStr);
  const winTile = parseTiles(winTileStr)[0];
  const dora = doraStrs.map(s => parseTiles(s)[0]);

  const hand = createHand({
    tiles, winTile, isTsumo, isMenzen: true, isParent,
    isRiichi: yakuNames.includes('リーチ'),
    isIppatsu: yakuNames.includes('一発'),
    dora,
  });

  const decompositions = analyzeHand(tiles, winTile);
  if (decompositions.length === 0) return 'ERROR: no decomposition';

  let bestAnswer: string | null = null;
  let bestScore = -1;

  for (const decomp of decompositions) {
    const yakuList = judgeYaku(hand, decomp);
    if (yakuList.length === 0) continue;

    let han = yakuList.reduce((sum, y) => sum + y.han, 0);
    const doraCount = countDora(tiles, hand.dora);
    han += doraCount;

    const hasYakuman = yakuList.some(y => y.han >= 13);
    if (hasYakuman) han = 13;

    const isPinfu = yakuList.some(y => y.name === 'ピンフ');
    let fu: number;
    if (hasYakuman) {
      fu = 0;
    } else {
      fu = calculateFu({ decomposition: decomp, isTsumo, isMenzen: hand.isMenzen, isPinfu });
    }

    const result = calculateScore({ fu, han, isParent, isTsumo, isYakuman: hasYakuman });

    const score = isTsumo
      ? (isParent ? result.tsumoOyaPoints * 3 : result.tsumoKoPoints * 2 + result.tsumoOyaPoints)
      : result.ronPoints;
    if (score > bestScore) {
      bestScore = score;
      bestAnswer = result.toAnswerString();
    }
  }

  return bestAnswer ?? 'ERROR: no yaku';
}

describe('統合テスト: score_calculator直接', () => {
  const directTests = [
    { id: 'b1', fu: 30, han: 2, isP: false, isT: false, ym: false, ans: '2000' },
    { id: 'b2', fu: 30, han: 2, isP: false, isT: true, ym: false, ans: '500/1000' },
    { id: 'b3', fu: 30, han: 1, isP: false, isT: false, ym: false, ans: '1000' },
    { id: 'b4', fu: 20, han: 3, isP: false, isT: true, ym: false, ans: '700/1300' },
    { id: 'b5', fu: 30, han: 2, isP: true, isT: false, ym: false, ans: '2900' },
    { id: 'b6', fu: 40, han: 1, isP: false, isT: false, ym: false, ans: '1300' },
    { id: 'b7', fu: 20, han: 2, isP: false, isT: false, ym: false, ans: '1300' },
    { id: 'b8', fu: 30, han: 3, isP: false, isT: false, ym: false, ans: '3900' },
    { id: 'i1', fu: 30, han: 4, isP: false, isT: false, ym: false, ans: '8000' },
    { id: 'i2', fu: 30, han: 3, isP: false, isT: false, ym: false, ans: '3900' },
    { id: 'i3', fu: 30, han: 4, isP: false, isT: false, ym: false, ans: '8000' },
    { id: 'i4', fu: 20, han: 4, isP: false, isT: true, ym: false, ans: '1300/2600' },
    { id: 'i5', fu: 40, han: 4, isP: false, isT: false, ym: false, ans: '8000' },
    { id: 'i6', fu: 30, han: 4, isP: true, isT: true, ym: false, ans: '4000 all' },
    { id: 'i7', fu: 30, han: 4, isP: false, isT: true, ym: false, ans: '2000/4000' },
    { id: 'i8', fu: 25, han: 4, isP: false, isT: false, ym: false, ans: '6400' },
    { id: 'a1', fu: 20, han: 6, isP: false, isT: true, ym: false, ans: '3000/6000' },
    { id: 'a2', fu: 30, han: 7, isP: false, isT: true, ym: false, ans: '3000/6000' },
    { id: 'a3', fu: 20, han: 8, isP: false, isT: true, ym: false, ans: '4000/8000' },
    { id: 'a4', fu: 30, han: 10, isP: false, isT: true, ym: false, ans: '4000/8000' },
    { id: 'a5', fu: 20, han: 11, isP: false, isT: true, ym: false, ans: '6000/12000' },
    { id: 'a6', fu: 0, han: 13, isP: false, isT: false, ym: true, ans: '32000' },
    { id: 'a7', fu: 40, han: 7, isP: true, isT: false, ym: false, ans: '18000' },
    { id: 'a8', fu: 0, han: 13, isP: false, isT: true, ym: true, ans: '8000/16000' },
  ];

  for (const tc of directTests) {
    test(`${tc.id}: ${tc.fu}符${tc.han}翻 → ${tc.ans}`, () => {
      const answer = calculateScoreFromProblem({
        fu: tc.fu, han: tc.han, isParent: tc.isP, isTsumo: tc.isT, isYakuman: tc.ym,
      });
      expect(answer).toBe(tc.ans);
    });
  }
});

describe('統合テスト: 手牌→点数 E2E', () => {
  test('b3相当: タンヤオ+ピンフ 30符2翻 子ロン 2000', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '234m 567p 234s 678s 55p', winTileStr: '4m',
      isTsumo: false, isParent: false, yakuNames: ['タンヤオ', 'ピンフ'],
    });
    expect(answer).toBe('2000');
  });

  test('b8相当: リーチ+タンヤオ+ピンフ 30符3翻 子ロン 3900', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '234p 567p 345s 678s 22m', winTileStr: '4p',
      isTsumo: false, isParent: false, yakuNames: ['リーチ', 'タンヤオ', 'ピンフ'],
    });
    expect(answer).toBe('3900');
  });

  test('b7相当: リーチ+ピンフ 30符2翻 子ロン 2000', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '123m 456m 789p 33s 678s', winTileStr: '6m',
      isTsumo: false, isParent: false, yakuNames: ['リーチ', 'ピンフ'],
    });
    expect(answer).toBe('2000');
  });

  test('i8: 七対子+ドラ2 25符4翻 子ロン 6400', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '22m 44p 66p 33s 77s 88s 99m', winTileStr: '9m',
      isTsumo: false, isParent: false, yakuNames: ['七対子'],
      doraStrs: ['9m'],
    });
    expect(answer).toBe('6400');
  });

  test('i1: リーチ+タンヤオ+ピンフ+ドラ 満貫', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '234m 456m 234p 678s 55p', winTileStr: '5p',
      isTsumo: false, isParent: false, yakuNames: ['リーチ', 'タンヤオ', 'ピンフ'],
      doraStrs: ['5p'],
    });
    expect(answer).toBe('8000');
  });

  test('i3: タンヤオ+三色同順+ドラ1 子ロン', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '234m 234p 234s 678m 55s', winTileStr: '5s',
      isTsumo: false, isParent: false, yakuNames: ['タンヤオ', '三色同順'],
      doraStrs: ['5s'],
    });
    expect(answer).toBe('8000');
  });

  test('a6: 国士無双 子ロン 32000', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '19m 19p 19s 12345677z', winTileStr: '7z',
      isTsumo: false, isParent: false, yakuNames: ['国士無双'],
    });
    expect(answer).toBe('32000');
  });

  test('a8: 四暗刻ツモ 子ツモ 8000/16000', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '111m 444p 777s 222m 55z', winTileStr: '5z',
      isTsumo: true, isParent: false, yakuNames: ['四暗刻'],
    });
    expect(answer).toBe('8000/16000');
  });

  test('i7: リーチ+ツモ+一盃口 子ツモ', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '112233m 456p 789s 55z', winTileStr: '5z',
      isTsumo: true, isParent: false, yakuNames: ['リーチ', 'ツモ', '一盃口'],
    });
    expect(answer).toBe('1000/2000');
  });

  test('b6: タンヤオ+ドラ2 40符3翻 子ロン 5200', () => {
    const answer = calculateScoreFromHand({
      tilesStr: '234m 345m 678p 55s 456s', winTileStr: '5s',
      isTsumo: false, isParent: false, yakuNames: ['タンヤオ'],
      doraStrs: ['4m'],
    });
    expect(answer).toBe('5200');
  });
});
