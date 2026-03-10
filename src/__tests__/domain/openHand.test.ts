import { describe, test, expect } from 'vitest';
import { analyzeHand, analyzeHandWithOpen } from '../../domain/handAnalyzer';
import { judgeYaku, countDora } from '../../domain/yakuJudge';
import { calculateFu } from '../../domain/fuCalculator';
import { calculateScore } from '../../domain/scoreCalculator';
import { createHand } from '../../domain/models/hand';
import { Mentsu, MentsuType } from '../../domain/models/mentsu';
import { HandDecomposition } from '../../domain/models/hand';
import { WaitType } from '../../domain/models/waitType';
import { parseTiles } from '../../utils/tileParser';

describe('副露対応: analyzeHandWithOpen', () => {
  test('ポン1副露 + 閉じた手牌の分解', () => {
    const openMentsu = [
      new Mentsu(MentsuType.minko, parseTiles('555z')),
    ];
    const closedTiles = parseTiles('234m 678p 456s 33p');
    const winTile = parseTiles('3p')[0];

    const decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
    expect(decomps.length).toBeGreaterThan(0);
    expect(decomps[0].mentsuList.length).toBe(4);
    expect(decomps[0].mentsuList[0].type).toBe(MentsuType.minko);
  });

  test('ポン2副露 + 閉じた手牌の分解', () => {
    const openMentsu = [
      new Mentsu(MentsuType.minko, parseTiles('222m')),
      new Mentsu(MentsuType.minko, parseTiles('555p')),
    ];
    const closedTiles = parseTiles('888s 333m 77s');
    const winTile = parseTiles('7s')[0];

    const decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
    expect(decomps.length).toBeGreaterThan(0);
    expect(decomps[0].mentsuList.length).toBe(4);
  });
});

describe('副露対応: 役判定', () => {
  test('鳴きタンヤオ (食い下がりなし)', () => {
    const tiles = parseTiles('234m 567p 345s 678s 55m');
    const winTile = parseTiles('5m')[0];
    const hand = createHand({ tiles, winTile, isTsumo: false, isMenzen: false, isParent: false });

    const decomps = analyzeHand(tiles, winTile);
    expect(decomps.length).toBeGreaterThan(0);

    const yaku = judgeYaku(hand, decomps[0]);
    const yakuNames = yaku.map(y => y.name);
    expect(yakuNames).toContain('タンヤオ');
    expect(yakuNames).not.toContain('ツモ');
  });

  test('鳴き混一色は食い下がり2翻', () => {
    const tiles = parseTiles('123p 456p 789p 11z 567p');
    const winTile = parseTiles('1z')[0];
    const hand = createHand({ tiles, winTile, isTsumo: false, isMenzen: false, isParent: false });

    const decomps = analyzeHand(tiles, winTile);
    expect(decomps.length).toBeGreaterThan(0);

    const yaku = judgeYaku(hand, decomps[0]);
    const honitsu = yaku.find(y => y.name === '混一色')!;
    expect(honitsu.han).toBe(2);
  });

  test('鳴き清一色は食い下がり5翻', () => {
    const tiles = parseTiles('123s 345s 567s 789s 22s');
    const winTile = parseTiles('2s')[0];
    const hand = createHand({ tiles, winTile, isTsumo: false, isMenzen: false, isParent: false });

    const decomps = analyzeHand(tiles, winTile);
    expect(decomps.length).toBeGreaterThan(0);

    const yaku = judgeYaku(hand, decomps[0]);
    const chinitsu = yaku.find(y => y.name === '清一色')!;
    expect(chinitsu.han).toBe(5);
  });
});

describe('副露対応: 符計算', () => {
  test('明刻の符は中張2符、么九4符', () => {
    const minko = new Mentsu(MentsuType.minko, parseTiles('555m'));
    expect(minko.fuValue).toBe(2);

    const minkoYaochu = new Mentsu(MentsuType.minko, parseTiles('111m'));
    expect(minkoYaochu.fuValue).toBe(4);

    const minkoDragon = new Mentsu(MentsuType.minko, parseTiles('555z'));
    expect(minkoDragon.fuValue).toBe(4);
  });

  test('副露手の符計算（門前ロン加符なし）', () => {
    const decomp = new HandDecomposition(
      [new Mentsu(MentsuType.minko, parseTiles('555z')),
       new Mentsu(MentsuType.shuntsu, parseTiles('234m')),
       new Mentsu(MentsuType.shuntsu, parseTiles('678p')),
       new Mentsu(MentsuType.shuntsu, parseTiles('456s'))],
      parseTiles('33p'), WaitType.tanki
    );
    const fu = calculateFu({ decomposition: decomp, isTsumo: false, isMenzen: false, isPinfu: false });
    expect(fu).toBe(30);
  });
});

describe('副露対応: 点数計算E2E (analyzeHandWithOpen)', () => {
  test('白ポン(明刻) + 閉じた手 子ロン → 30符1翻 1000', () => {
    const openMentsu = [new Mentsu(MentsuType.minko, parseTiles('555z'))];
    const closedTiles = parseTiles('234m 678p 456s 33p');
    const winTile = parseTiles('3p')[0];
    const allTiles = parseTiles('555z 234m 678p 456s 33p');
    const hand = createHand({
      tiles: allTiles, winTile, isTsumo: false, isMenzen: false, isParent: false, openMentsu,
    });

    const decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
    expect(decomps.length).toBeGreaterThan(0);
    expect(decomps[0].mentsuList[0].type).toBe(MentsuType.minko);

    const yaku = judgeYaku(hand, decomps[0]);
    expect(yaku.some(y => y.name === '役牌')).toBe(true);

    const han = yaku.reduce((sum, y) => sum + y.han, 0);
    const fu = calculateFu({ decomposition: decomps[0], isTsumo: false, isMenzen: false, isPinfu: false });
    expect(fu).toBe(30);

    const result = calculateScore({ fu, han, isParent: false, isTsumo: false });
    expect(result.toAnswerString()).toBe('1000');
  });

  test('2副露トイトイ + ドラ1 子ロン', () => {
    const openMentsu = [
      new Mentsu(MentsuType.minko, parseTiles('222m')),
      new Mentsu(MentsuType.minko, parseTiles('555p')),
    ];
    const closedTiles = parseTiles('888s 333m 77s');
    const winTile = parseTiles('7s')[0];
    const allTiles = parseTiles('222m 555p 888s 333m 77s');
    const hand = createHand({
      tiles: allTiles, winTile, isTsumo: false, isMenzen: false, isParent: false,
      openMentsu, dora: parseTiles('8s'),
    });

    const decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
    expect(decomps.length).toBeGreaterThan(0);

    const yaku = judgeYaku(hand, decomps[0]);
    const yakuNames = yaku.map(y => y.name);
    expect(yakuNames).toContain('トイトイ');

    let totalHan = yaku.reduce((sum, y) => sum + y.han, 0);
    totalHan += countDora(allTiles, hand.dora);

    const fu = calculateFu({ decomposition: decomps[0], isTsumo: false, isMenzen: false, isPinfu: false });
    expect(fu).toBe(40);
    expect(totalHan).toBeGreaterThanOrEqual(3);

    const result = calculateScore({ fu, han: totalHan, isParent: false, isTsumo: false });
    expect(result.ronPoints).toBeGreaterThan(0);
  });
});
