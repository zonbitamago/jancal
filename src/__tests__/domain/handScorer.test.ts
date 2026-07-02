import { describe, test, expect } from 'vitest';
import { scoreHand } from '../../domain/handScorer';
import { parseTiles, Tile } from '../../utils/tileParser';

function t(notation: string): Tile {
  return parseTiles(notation)[0];
}

describe('scoreHand: 正常系', () => {
  test('タンヤオ+ピンフ 30符2翻 子ロン → 2000', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 234s 678s 55p'),
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.scoreText).toBe('2000');
    expect(r.fu).toBe(30);
    expect(r.han).toBe(2);
    expect(r.yaku.map(y => y.name)).toEqual(expect.arrayContaining(['タンヤオ', 'ピンフ']));
  });

  test('リーチ+タンヤオ+ピンフ 30符3翻 子ロン → 3900', () => {
    const r = scoreHand({
      tiles: parseTiles('234p 567p 345s 678s 22m'),
      winTile: t('4p'),
      isTsumo: false, isParent: false, isRiichi: true, isIppatsu: false, dora: [],
    });
    expect(r.scoreText).toBe('3900');
    expect(r.han).toBe(3);
  });

  test('ドラを加算する（タンヤオ+ドラ2 40符3翻 子ロン → 5200）', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 345m 678p 55s 456s'),
      winTile: t('5s'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [t('4m')],
    });
    expect(r.doraCount).toBe(2);
    expect(r.scoreText).toBe('5200');
  });

  test('七対子 25符固定 子ロン', () => {
    const r = scoreHand({
      tiles: parseTiles('22m 44p 66p 33s 77s 88s 99m'),
      winTile: t('9m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [t('9m')],
    });
    expect(r.ok).toBe(true);
    expect(r.fu).toBe(25);
    expect(r.scoreText).toBe('6400');
  });

  test('親のツモ（リーチ+ツモ 30符2翻 → 1000 all）', () => {
    const r = scoreHand({
      tiles: parseTiles('222m 345p 678p 99s 567s'),
      winTile: t('9s'),
      isTsumo: true, isParent: true, isRiichi: true, isIppatsu: false,
      dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.fu).toBe(30);
    expect(r.han).toBe(2);
    expect(r.scoreText).toBe('1000 all');
  });

  test('ドラは実際の枚数分だけ加算される（跳満 親ツモ 6000 all）', () => {
    // 2mが3枚・9sが2枚で計5ドラ → リーチ+ツモ+ドラ5 = 7翻 跳満
    const r = scoreHand({
      tiles: parseTiles('222m 345p 678p 99s 567s'),
      winTile: t('9s'),
      isTsumo: true, isParent: true, isRiichi: true, isIppatsu: false,
      dora: [t('9s'), t('2m')],
    });
    expect(r.doraCount).toBe(5);
    expect(r.scoreText).toBe('6000 all');
  });

  test('役満: 国士無双 子ロン → 32000', () => {
    const r = scoreHand({
      tiles: parseTiles('19m 19p 19s 12345677z'),
      winTile: t('7z'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.isYakuman).toBe(true);
    expect(r.scoreText).toBe('32000');
  });

  test('役牌: 自風・場風を反映（發の刻子は常に役牌）', () => {
    const r = scoreHand({
      tiles: parseTiles('666z 234m 678p 456s 33s'),
      winTile: t('3s'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.yaku.some(y => y.name === '役牌')).toBe(true);
  });
});

describe('scoreHand: 赤ドラ', () => {
  test('赤ドラ1枚で1翻増える（タンヤオ+ピンフ+赤1 → 30符3翻 3900）', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 234s 678s 55p'),
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [], akaDora: 1,
    });
    expect(r.ok).toBe(true);
    expect(r.akaDora).toBe(1);
    expect(r.han).toBe(3); // タンヤオ1+ピンフ1+赤1
    expect(r.scoreText).toBe('3900');
  });

  test('赤ドラは通常ドラと独立して加算される', () => {
    // 2mが通常ドラ（234mの1枚）+ 赤1枚 = ドラ1+赤1
    const r = scoreHand({
      tiles: parseTiles('234m 567p 234s 678s 55p'),
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [t('2m')], akaDora: 1,
    });
    expect(r.doraCount).toBe(1);
    expect(r.akaDora).toBe(1);
    expect(r.han).toBe(4); // タンヤオ1+ピンフ1+ドラ1+赤1 → 満貫
    expect(r.scoreText).toBe('8000');
  });

  test('赤ドラ未指定時は0', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 234s 678s 55p'),
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [],
    });
    expect(r.akaDora).toBe(0);
  });
});

describe('scoreHand: 副露（鳴き）', () => {
  test('鳴きタンヤオ 30符1翻 子ロン → 1000（ポン）', () => {
    // 手の内: 234m 567p 345s 55m（11枚）+ ポン678s。アガリ4m
    const r = scoreHand({
      tiles: parseTiles('234m 567p 345s 55m'),
      openMelds: [{ type: 'pon', tiles: parseTiles('678s') }],
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.isMenzen).toBe(false);
    expect(r.yaku.some(y => y.name === 'タンヤオ')).toBe(true);
    expect(r.scoreText).toBe('1000');
  });

  test('鳴き混一色は食い下がり2翻（ポン）', () => {
    // 筒子+字牌の混一色。手の内: 123p 456p 789p 11z（11枚）+ ポン567p。アガリ1z
    const r = scoreHand({
      tiles: parseTiles('123p 456p 789p 11z'),
      openMelds: [{ type: 'pon', tiles: parseTiles('567p') }],
      winTile: t('1z'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    const honitsu = r.yaku.find(y => y.name === '混一色');
    expect(honitsu?.han).toBe(2); // 門前3翻→鳴き2翻
  });

  test('役牌ポン（發）30符1翻 子ロン → 1000', () => {
    // 手の内: 234m 678p 456s 33p（11枚）+ ポン發。アガリ3p
    const r = scoreHand({
      tiles: parseTiles('234m 678p 456s 33p'),
      openMelds: [{ type: 'pon', tiles: parseTiles('666z') }],
      winTile: t('3p'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.yaku.some(y => y.name === '役牌')).toBe(true);
    expect(r.scoreText).toBe('1000');
  });

  test('暗槓は門前を維持する（リーチ可）', () => {
    // 手の内: 234m 567p 345s 55m（11枚）+ 暗槓1111s相当。アガリ4m、リーチ
    const r = scoreHand({
      tiles: parseTiles('234m 567p 55m 345s'),
      openMelds: [{ type: 'ankan', tiles: parseTiles('1111z') }],
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: true, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.isMenzen).toBe(true);
    expect(r.yaku.some(y => y.name === 'リーチ')).toBe(true);
  });

  test('鳴き手は門前役（ツモ・ピンフ）が付かない', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 345s 55m'),
      openMelds: [{ type: 'chi', tiles: parseTiles('678s') }],
      winTile: t('4m'),
      isTsumo: true, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(true);
    expect(r.isMenzen).toBe(false);
    expect(r.yaku.some(y => y.name === 'ツモ')).toBe(false);
    expect(r.yaku.some(y => y.name === 'ピンフ')).toBe(false);
  });

  test('手の内の枚数が合わないとエラー', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 345s 678s 55m'), // 14枚（副露1つなら11枚のはず）
      openMelds: [{ type: 'pon', tiles: parseTiles('111z') }],
      winTile: t('4m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('11枚');
  });
});

describe('scoreHand: 異常系', () => {
  test('14枚でない → エラー', () => {
    const r = scoreHand({
      tiles: parseTiles('123m'),
      winTile: t('1m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('14枚');
  });

  test('アガリ牌が手牌にない → エラー', () => {
    const r = scoreHand({
      tiles: parseTiles('234m 567p 234s 678s 55p'),
      winTile: t('9z'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('アガリ牌');
  });

  test('アガリ形でない → エラー', () => {
    const r = scoreHand({
      tiles: parseTiles('129m 349p 155s 678s 22z'),
      winTile: t('2z'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false, dora: [],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('アガリの形');
  });

  test('役なし（リーチ等なしの門前手・ドラのみ）→ エラー', () => {
    // 234m 567m 234p 678s 99p、6m嵌張待ちロン。ピンフも崩れ役が付かない形
    const r = scoreHand({
      tiles: parseTiles('234m 567m 234p 678s 99p'),
      winTile: t('6m'),
      isTsumo: false, isParent: false, isRiichi: false, isIppatsu: false,
      dora: [t('9p')],
    });
    expect(r.ok).toBe(false);
    expect(r.error).toContain('役');
  });
});
