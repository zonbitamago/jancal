import { describe, test, expect } from 'vitest';
import { analyzeHand } from '../../domain/handAnalyzer';
import { WaitType } from '../../domain/models/waitType';
import { parseTiles } from '../../utils/tileParser';

describe('HandAnalyzer', () => {
  test('123m 456p 789s 234s 11z → 4面子+1雀頭', () => {
    const tiles = parseTiles('123m 456p 789s 234s 11z');
    const winTile = parseTiles('1z')[0];
    const results = analyzeHand(tiles, winTile);

    expect(results.length).toBeGreaterThan(0);
    const decomp = results[0];
    expect(decomp.mentsuList.length).toBe(4);
    expect(decomp.jantai.length).toBe(2);
    expect(decomp.jantai[0].key).toBe('1z');
  });

  test('234m 567m 345p 678s 55p → 面子分解', () => {
    const tiles = parseTiles('234m 567m 345p 678s 55p');
    const winTile = parseTiles('5p')[0];
    const results = analyzeHand(tiles, winTile);
    expect(results.length).toBeGreaterThan(0);
  });

  test('七対子手牌 → isChitoitsu=true', () => {
    const tiles = parseTiles('22m 44p 66p 33s 77s 88s 99m');
    const winTile = parseTiles('9m')[0];
    const results = analyzeHand(tiles, winTile);

    const chitoitsu = results.filter(d => d.isChitoitsu);
    expect(chitoitsu.length).toBe(1);
    expect(chitoitsu[0].isChitoitsu).toBe(true);
  });

  test('国士無双手牌 → isKokushi=true', () => {
    const tiles = parseTiles('19m 19p 19s 12345677z');
    const winTile = parseTiles('7z')[0];
    const results = analyzeHand(tiles, winTile);

    const kokushi = results.filter(d => d.isKokushi);
    expect(kokushi.length).toBe(1);
    expect(kokushi[0].isKokushi).toBe(true);
  });

  describe('待ち判定', () => {
    test('両面待ち: 23m + 4m アガリ', () => {
      const tiles = parseTiles('234m 456p 789s 123s 55m');
      const winTile = parseTiles('4m')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.ryanmen)).toBe(true);
    });

    test('嵌張待ち: 13m + 2m アガリ', () => {
      const tiles = parseTiles('123m 456p 789s 234s 55p');
      const winTile = parseTiles('2m')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.kanchan)).toBe(true);
    });

    test('辺張待ち: 89s + 7s アガリ', () => {
      const tiles = parseTiles('123m 456p 789s 234m 55p');
      const winTile = parseTiles('7s')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.penchan)).toBe(true);
    });

    test('辺張待ち: 12m + 3m アガリ', () => {
      const tiles = parseTiles('123m 456p 789s 234s 55p');
      const winTile = parseTiles('3m')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.penchan)).toBe(true);
    });

    test('単騎待ち: 雀頭のアガリ牌', () => {
      const tiles = parseTiles('123m 456p 789s 234m 55p');
      const winTile = parseTiles('5p')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.tanki)).toBe(true);
    });

    test('双碰待ち: 暗刻のアガリ牌', () => {
      const tiles = parseTiles('111m 999p 456s 789s 55z');
      const winTile = parseTiles('1m')[0];
      const results = analyzeHand(tiles, winTile);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.waitType === WaitType.shanpon)).toBe(true);
    });
  });

  test('複数の面子分解が見つかる', () => {
    const tiles = parseTiles('112233m 456p 789s 55z');
    const winTile = parseTiles('5z')[0];
    const results = analyzeHand(tiles, winTile);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
});
