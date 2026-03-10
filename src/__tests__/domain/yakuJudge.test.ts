import { describe, test, expect } from 'vitest';
import { judgeYaku, countDora } from '../../domain/yakuJudge';
import { createHand, HandDecomposition, ChitoitsuDecomposition, KokushiDecomposition } from '../../domain/models/hand';
import { Mentsu, MentsuType } from '../../domain/models/mentsu';
import { WaitType } from '../../domain/models/waitType';
import { Tile, TileType, parseTiles } from '../../utils/tileParser';

const _t = (n: number, type: TileType) => new Tile(n, type, `${n}`);

const _shuntsu = (start: number, type: TileType) =>
  new Mentsu(MentsuType.shuntsu, [_t(start, type), _t(start + 1, type), _t(start + 2, type)]);

const _anko = (n: number, type: TileType) =>
  new Mentsu(MentsuType.anko, [_t(n, type), _t(n, type), _t(n, type)]);

describe('YakuJudge', () => {
  test('タンヤオ: 全牌2-8 → 成立', () => {
    const tiles = parseTiles('234m 567p 234s 678s 55p');
    const hand = createHand({ tiles, winTile: _t(5, TileType.pin) });
    const decomp = new HandDecomposition(
      [_shuntsu(2, TileType.man), _shuntsu(5, TileType.pin), _shuntsu(2, TileType.sou), _shuntsu(6, TileType.sou)],
      [_t(5, TileType.pin), _t(5, TileType.pin)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'タンヤオ')).toBe(true);
  });

  test('タンヤオ: 1含み → 不成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55p');
    const hand = createHand({ tiles, winTile: _t(5, TileType.pin) });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.pin), _t(5, TileType.pin)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'タンヤオ')).toBe(false);
  });

  test('ピンフ: 門前+全順子+両面+非役牌雀頭 → 成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const hand = createHand({ tiles, winTile: _t(3, TileType.man), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.ryanmen
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'ピンフ')).toBe(true);
  });

  test('ピンフ: 嵌張待ち → 不成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const hand = createHand({ tiles, winTile: _t(2, TileType.man), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.kanchan
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'ピンフ')).toBe(false);
  });

  test('ツモ: 門前ツモ → 成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isTsumo: true, isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'ツモ')).toBe(true);
  });

  test('リーチ → 成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isRiichi: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'リーチ')).toBe(true);
  });

  test('一発 → 成立', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isRiichi: true, isIppatsu: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '一発')).toBe(true);
  });

  test('一盃口: 同一順子2組 → 成立', () => {
    const tiles = parseTiles('112233m 456p 789s 55z');
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '一盃口')).toBe(true);
  });

  test('三色同順: 3色で同じ数字の順子 → 成立', () => {
    const tiles = parseTiles('234m 234p 234s 678m 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(2, TileType.man), _shuntsu(2, TileType.pin), _shuntsu(2, TileType.sou), _shuntsu(6, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '三色同順')).toBe(true);
    expect(yaku.find(y => y.name === '三色同順')!.han).toBe(2);
  });

  test('混一色: 1色+字牌のみ → 成立', () => {
    const tiles = parseTiles('123p 345p 789p 11z 567p');
    const hand = createHand({ tiles, winTile: _t(1, TileType.wind), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.pin), _shuntsu(3, TileType.pin), _shuntsu(7, TileType.pin), _shuntsu(5, TileType.pin)],
      [_t(1, TileType.wind), _t(1, TileType.wind)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '混一色')).toBe(true);
    expect(yaku.find(y => y.name === '混一色')!.han).toBe(3);
  });

  test('清一色: 1色のみ → 成立', () => {
    const tiles = parseTiles('111p 234p 567p 899p 9p');
    const hand = createHand({ tiles, winTile: _t(9, TileType.pin), isMenzen: true });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.pin), _shuntsu(2, TileType.pin), _shuntsu(5, TileType.pin), _shuntsu(7, TileType.pin)],
      [_t(9, TileType.pin), _t(9, TileType.pin)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '清一色')).toBe(true);
    expect(yaku.find(y => y.name === '清一色')!.han).toBe(6);
  });

  test('清一色があれば混一色は判定されない', () => {
    const tiles = parseTiles('111p 234p 567p 899p 9p');
    const hand = createHand({ tiles, winTile: _t(9, TileType.pin), isMenzen: true });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.pin), _shuntsu(2, TileType.pin), _shuntsu(5, TileType.pin), _shuntsu(7, TileType.pin)],
      [_t(9, TileType.pin), _t(9, TileType.pin)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '混一色')).toBe(false);
  });

  test('七対子 → 成立', () => {
    const tiles = parseTiles('22m 44p 66p 33s 77s 88s 99m');
    const hand = createHand({ tiles, winTile: _t(9, TileType.man), isMenzen: true });
    const decomp = new ChitoitsuDecomposition([]);
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '七対子')).toBe(true);
    expect(yaku.find(y => y.name === '七対子')!.han).toBe(2);
  });

  test('国士無双 → 成立 (役満)', () => {
    const tiles = parseTiles('19m 19p 19s 1234567z');
    const hand = createHand({ tiles, winTile: _t(7, TileType.dragon), isMenzen: true });
    const decomp = new KokushiDecomposition();
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '国士無双')).toBe(true);
    expect(yaku.find(y => y.name === '国士無双')!.han).toBe(13);
    expect(yaku.length).toBe(1);
  });

  test('四暗刻 ツモ → 成立 (役満)', () => {
    const tiles = parseTiles('111m 444p 777s 222m 55z');
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon), isTsumo: true, isMenzen: true });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.man), _anko(4, TileType.pin), _anko(7, TileType.sou), _anko(2, TileType.man)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '四暗刻')).toBe(true);
    expect(yaku.find(y => y.name === '四暗刻')!.han).toBe(13);
    expect(yaku.length).toBe(1);
  });

  test('ドラカウント', () => {
    const tiles = parseTiles('234m 567p 234s 678s 55p');
    const dora = [_t(5, TileType.pin)];
    const count = countDora(tiles, dora);
    expect(count).toBe(3);
  });

  test('ドラなし', () => {
    const tiles = parseTiles('123m 456p 789s 234m 55s');
    const dora = [_t(1, TileType.pin)];
    const count = countDora(tiles, dora);
    expect(count).toBe(0);
  });

  test('役牌: 白の刻子 → 成立(1翻)', () => {
    const tiles = parseTiles('123m 456p 789s 555z 11z');
    const hand = createHand({ tiles, winTile: _t(1, TileType.wind) });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _anko(5, TileType.dragon)],
      [_t(1, TileType.wind), _t(1, TileType.wind)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '役牌')).toBe(true);
    expect(yaku.filter(y => y.name === '役牌')[0].han).toBe(1);
  });

  test('役牌: 自風(東)の刻子 → 成立(1翻)', () => {
    const tiles = parseTiles('123m 456p 789s 111z 55z');
    const east = _t(1, TileType.wind);
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon), seatWind: east });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _anko(1, TileType.wind)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '役牌')).toBe(true);
  });

  test('役牌: 場風(東)の刻子 → 成立(1翻)', () => {
    const tiles = parseTiles('123m 456p 789s 111z 55z');
    const east = _t(1, TileType.wind);
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon), roundWind: east });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _anko(1, TileType.wind)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '役牌')).toBe(true);
  });

  test('役牌: 連風牌(自風+場風)の刻子 → 2翻', () => {
    const tiles = parseTiles('123m 456p 789s 111z 55z');
    const east = _t(1, TileType.wind);
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon), seatWind: east, roundWind: east });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _anko(1, TileType.wind)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    const yakuhaiList = yaku.filter(y => y.name === '役牌');
    const totalHan = yakuhaiList.reduce((sum, y) => sum + y.han, 0);
    expect(totalHan).toBe(2);
  });

  test('役牌: 場風でも自風でもない風牌の刻子 → 不成立', () => {
    const tiles = parseTiles('123m 456p 789s 333z 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), seatWind: _t(1, TileType.wind), roundWind: _t(1, TileType.wind) });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _anko(3, TileType.wind)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '役牌')).toBe(false);
  });

  test('一気通貫: 門前 → 成立(2翻)', () => {
    const tiles = parseTiles('123m 456m 789m 234p 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.man), _shuntsu(7, TileType.man), _shuntsu(2, TileType.pin)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '一気通貫')).toBe(true);
    expect(yaku.find(y => y.name === '一気通貫')!.han).toBe(2);
  });

  test('一気通貫: 副露 → 食い下がり(1翻)', () => {
    const tiles = parseTiles('123m 456m 789m 234p 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isMenzen: false });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.man), _shuntsu(7, TileType.man), _shuntsu(2, TileType.pin)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.find(y => y.name === '一気通貫')!.han).toBe(1);
  });

  test('チャンタ: 門前 → 成立(2翻)', () => {
    const tiles = parseTiles('123m 789p 123s 111z 99s');
    const hand = createHand({ tiles, winTile: _t(9, TileType.sou), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(7, TileType.pin), _shuntsu(1, TileType.sou), _anko(1, TileType.wind)],
      [_t(9, TileType.sou), _t(9, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'チャンタ')).toBe(true);
    expect(yaku.find(y => y.name === 'チャンタ')!.han).toBe(2);
  });

  test('チャンタ: 副露 → 食い下がり(1翻)', () => {
    const tiles = parseTiles('123m 789p 123s 111z 99s');
    const hand = createHand({ tiles, winTile: _t(9, TileType.sou), isMenzen: false });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(7, TileType.pin), _shuntsu(1, TileType.sou),
       new Mentsu(MentsuType.minko, [_t(1, TileType.wind), _t(1, TileType.wind), _t(1, TileType.wind)])],
      [_t(9, TileType.sou), _t(9, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.find(y => y.name === 'チャンタ')!.han).toBe(1);
  });

  test('トイトイ: 刻子4つ → 成立(2翻)', () => {
    const tiles = parseTiles('111m 333p 555s 777z 22m');
    const hand = createHand({ tiles, winTile: _t(2, TileType.man), isMenzen: false });
    const decomp = new HandDecomposition(
      [new Mentsu(MentsuType.minko, [_t(1, TileType.man), _t(1, TileType.man), _t(1, TileType.man)]),
       new Mentsu(MentsuType.minko, [_t(3, TileType.pin), _t(3, TileType.pin), _t(3, TileType.pin)]),
       new Mentsu(MentsuType.minko, [_t(5, TileType.sou), _t(5, TileType.sou), _t(5, TileType.sou)]),
       _anko(7, TileType.dragon)],
      [_t(2, TileType.man), _t(2, TileType.man)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === 'トイトイ')).toBe(true);
    expect(yaku.find(y => y.name === 'トイトイ')!.han).toBe(2);
  });

  test('三暗刻: 暗刻3つ → 成立(2翻)', () => {
    const tiles = parseTiles('111m 333p 555s 234m 22z');
    const hand = createHand({ tiles, winTile: _t(2, TileType.wind), isMenzen: true });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.man), _anko(3, TileType.pin), _anko(5, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(2, TileType.wind), _t(2, TileType.wind)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '三暗刻')).toBe(true);
    expect(yaku.find(y => y.name === '三暗刻')!.han).toBe(2);
  });

  test('小三元: 三元牌2刻子+1雀頭 → 成立(2翻)', () => {
    const tiles = parseTiles('123m 555z 666z 77z 456p');
    const hand = createHand({ tiles, winTile: _t(7, TileType.dragon) });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _anko(5, TileType.dragon), _anko(6, TileType.dragon), _shuntsu(4, TileType.pin)],
      [_t(7, TileType.dragon), _t(7, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '小三元')).toBe(true);
    expect(yaku.find(y => y.name === '小三元')!.han).toBe(2);
  });

  test('混老頭: 么九牌+字牌のみ → 成立(2翻)', () => {
    const tiles = parseTiles('111m 999p 111z 77z 99s');
    const hand = createHand({ tiles, winTile: _t(9, TileType.sou) });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.man), _anko(9, TileType.pin), _anko(1, TileType.wind),
       new Mentsu(MentsuType.minko, [_t(9, TileType.sou), _t(9, TileType.sou), _t(9, TileType.sou)])],
      [_t(7, TileType.dragon), _t(7, TileType.dragon)], WaitType.shanpon
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '混老頭')).toBe(true);
    expect(yaku.find(y => y.name === '混老頭')!.han).toBe(2);
  });

  test('純チャン: 門前 → 成立(3翻)', () => {
    const tiles = parseTiles('123m 789p 123s 789s 11m');
    const hand = createHand({ tiles, winTile: _t(1, TileType.man), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(7, TileType.pin), _shuntsu(1, TileType.sou), _shuntsu(7, TileType.sou)],
      [_t(1, TileType.man), _t(1, TileType.man)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '純チャン')).toBe(true);
    expect(yaku.find(y => y.name === '純チャン')!.han).toBe(3);
  });

  test('純チャン: 副露 → 食い下がり(2翻)', () => {
    const tiles = parseTiles('123m 789p 123s 789s 11m');
    const hand = createHand({ tiles, winTile: _t(1, TileType.man), isMenzen: false });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(7, TileType.pin), _shuntsu(1, TileType.sou), _shuntsu(7, TileType.sou)],
      [_t(1, TileType.man), _t(1, TileType.man)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.find(y => y.name === '純チャン')!.han).toBe(2);
  });

  test('二盃口: 同一順子ペア2組 → 成立(3翻)', () => {
    const tiles = parseTiles('112233m 778899p 55s');
    const hand = createHand({ tiles, winTile: _t(5, TileType.sou), isMenzen: true });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(1, TileType.man), _shuntsu(7, TileType.pin), _shuntsu(7, TileType.pin)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '二盃口')).toBe(true);
    expect(yaku.find(y => y.name === '二盃口')!.han).toBe(3);
    expect(yaku.some(y => y.name === '一盃口')).toBe(false);
  });

  test('三色同刻: 3色で同じ数字の刻子 → 成立(2翻)', () => {
    const tiles = parseTiles('111m 111p 111s 234m 55z');
    const hand = createHand({ tiles, winTile: _t(5, TileType.dragon) });
    const decomp = new HandDecomposition(
      [_anko(1, TileType.man), _anko(1, TileType.pin), _anko(1, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '三色同刻')).toBe(true);
    expect(yaku.find(y => y.name === '三色同刻')!.han).toBe(2);
  });

  test('大三元: 三元牌3刻子 → 成立(役満)', () => {
    const tiles = parseTiles('123m 555z 666z 777z 22p');
    const hand = createHand({ tiles, winTile: _t(2, TileType.pin) });
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _anko(5, TileType.dragon), _anko(6, TileType.dragon), _anko(7, TileType.dragon)],
      [_t(2, TileType.pin), _t(2, TileType.pin)], WaitType.tanki
    );
    const yaku = judgeYaku(hand, decomp);
    expect(yaku.some(y => y.name === '大三元')).toBe(true);
    expect(yaku.find(y => y.name === '大三元')!.han).toBe(13);
    expect(yaku.length).toBe(1);
  });
});
