import { describe, test, expect } from 'vitest';
import { calculateFu } from '../../domain/fuCalculator';
import { HandDecomposition, ChitoitsuDecomposition } from '../../domain/models/hand';
import { Mentsu, MentsuType } from '../../domain/models/mentsu';
import { WaitType, waitTypeFu } from '../../domain/models/waitType';
import { Tile, TileType } from '../../utils/tileParser';

const _t = (n: number, type: TileType) => new Tile(n, type, `${n}`);
const _shuntsu = (start: number, type: TileType) =>
  new Mentsu(MentsuType.shuntsu, [_t(start, type), _t(start + 1, type), _t(start + 2, type)]);
const _anko = (n: number, type: TileType) =>
  new Mentsu(MentsuType.anko, [_t(n, type), _t(n, type), _t(n, type)]);
const _minko = (n: number, type: TileType) =>
  new Mentsu(MentsuType.minko, [_t(n, type), _t(n, type), _t(n, type)]);

describe('FuCalculator', () => {
  test('ピンフロン → 30符', () => {
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: true, isPinfu: true })).toBe(30);
  });

  test('ピンフツモ → 20符', () => {
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.sou), _t(5, TileType.sou)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: true, isMenzen: true, isPinfu: true })).toBe(20);
  });

  test('七対子 → 25符', () => {
    const decomp = new ChitoitsuDecomposition([
      [_t(1, TileType.man), _t(1, TileType.man)],
      [_t(3, TileType.man), _t(3, TileType.man)],
      [_t(5, TileType.pin), _t(5, TileType.pin)],
      [_t(7, TileType.pin), _t(7, TileType.pin)],
      [_t(2, TileType.sou), _t(2, TileType.sou)],
      [_t(4, TileType.sou), _t(4, TileType.sou)],
      [_t(9, TileType.sou), _t(9, TileType.sou)],
    ]);
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: true, isPinfu: false })).toBe(25);
  });

  test('暗刻(中張牌) → 4符', () => {
    expect(_anko(5, TileType.man).fuValue).toBe(4);
  });

  test('暗刻(么九牌) → 8符', () => {
    expect(_anko(1, TileType.pin).fuValue).toBe(8);
  });

  test('暗刻(字牌) → 8符', () => {
    const anko = new Mentsu(MentsuType.anko, [_t(1, TileType.wind), _t(1, TileType.wind), _t(1, TileType.wind)]);
    expect(anko.fuValue).toBe(8);
  });

  test('明刻(中張牌) → 2符', () => {
    expect(_minko(5, TileType.man).fuValue).toBe(2);
  });

  test('明刻(么九牌) → 4符', () => {
    expect(_minko(9, TileType.sou).fuValue).toBe(4);
  });

  test('嵌張待ち → 2符', () => { expect(waitTypeFu(WaitType.kanchan)).toBe(2); });
  test('辺張待ち → 2符', () => { expect(waitTypeFu(WaitType.penchan)).toBe(2); });
  test('単騎待ち → 2符', () => { expect(waitTypeFu(WaitType.tanki)).toBe(2); });
  test('両面待ち → 0符', () => { expect(waitTypeFu(WaitType.ryanmen)).toBe(0); });
  test('双碰待ち → 0符', () => { expect(waitTypeFu(WaitType.shanpon)).toBe(0); });

  test('役牌雀頭(三元牌) → 2符', () => {
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [_t(5, TileType.dragon), _t(5, TileType.dragon)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: true, isPinfu: false })).toBe(40);
  });

  test('暗刻含み手牌の符計算', () => {
    const decomp = new HandDecomposition(
      [_anko(2, TileType.man), _shuntsu(3, TileType.pin), _shuntsu(6, TileType.pin), _shuntsu(5, TileType.sou)],
      [_t(9, TileType.sou), _t(9, TileType.sou)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: true, isPinfu: false })).toBe(40);
  });

  test('ツモ符(ピンフ以外) → 2符加算', () => {
    const decomp = new HandDecomposition(
      [_anko(2, TileType.man), _shuntsu(3, TileType.pin), _shuntsu(6, TileType.pin), _shuntsu(5, TileType.sou)],
      [_t(9, TileType.sou), _t(9, TileType.sou)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: true, isMenzen: true, isPinfu: false })).toBe(30);
  });

  test('門前ロン加符 → 10符', () => {
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.sou)],
      [_t(5, TileType.man), _t(5, TileType.man)], WaitType.kanchan
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: true, isPinfu: false })).toBe(40);
  });

  test('連風牌雀頭(東場の東家で東の雀頭) → 2符(4符ではない)', () => {
    const east = _t(1, TileType.wind);
    const decomp = new HandDecomposition(
      [_anko(5, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _shuntsu(2, TileType.man)],
      [east, east], WaitType.kanchan
    );
    expect(calculateFu({
      decomposition: decomp, isTsumo: true, isMenzen: true, isPinfu: false,
      seatWind: east, roundWind: east,
    })).toBe(30);
  });

  test('食い仕掛けロン → 門前加符なし', () => {
    const decomp = new HandDecomposition(
      [_shuntsu(1, TileType.man), _shuntsu(4, TileType.pin), _shuntsu(7, TileType.sou), _minko(5, TileType.man)],
      [_t(3, TileType.sou), _t(3, TileType.sou)], WaitType.ryanmen
    );
    expect(calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: false, isPinfu: false })).toBe(30);
  });
});
