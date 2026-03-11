import { describe, test, expect } from 'vitest';
import { generateScoreTable, ScoreTableEntry } from '../../domain/scoreTable';

describe('ScoreTable', () => {
  const table = generateScoreTable();

  test('テーブルにエントリが存在する', () => {
    expect(table.length).toBeGreaterThan(0);
  });

  test('各エントリに必要なフィールドがある', () => {
    for (const entry of table) {
      expect(typeof entry.fu).toBe('number');
      expect(typeof entry.han).toBe('number');
      // 20符はピンフツモ専用のためロンはnull
      if (entry.fu === 20) {
        expect(entry.koRon).toBeNull();
        expect(entry.oyaRon).toBeNull();
      } else if (entry.label === undefined) {
        expect(typeof entry.koRon).toBe('number');
        expect(typeof entry.oyaRon).toBe('number');
      }
      expect(typeof entry.koTsumo === 'string' || entry.koTsumo === null).toBe(true);
      expect(typeof entry.oyaTsumo === 'string' || entry.oyaTsumo === null).toBe(true);
    }
  });

  test('30符1翻のエントリが正しい', () => {
    const entry = table.find(e => e.fu === 30 && e.han === 1);
    expect(entry).toBeDefined();
    expect(entry!.koRon).toBe(1000);
    expect(entry!.oyaRon).toBe(1500);
    expect(entry!.koTsumo).toBe('300/500');
    expect(entry!.oyaTsumo).toBe('500 all');
  });

  test('30符2翻のエントリが正しい', () => {
    const entry = table.find(e => e.fu === 30 && e.han === 2);
    expect(entry).toBeDefined();
    expect(entry!.koRon).toBe(2000);
    expect(entry!.oyaRon).toBe(2900);
    // ツモ: 子=500, 親=1000
    expect(entry!.koTsumo).toBe('500/1000');
    expect(entry!.oyaTsumo).toBe('1000 all');
  });

  test('25符は七対子用（1翻なし、2翻〜、ロン・ツモあり）', () => {
    const fu25entries = table.filter(e => e.fu === 25);
    expect(fu25entries.length).toBeGreaterThan(0);
    // 25符1翻は存在しない
    expect(fu25entries.find(e => e.han === 1)).toBeUndefined();
    // 全ての25符エントリにnoteラベルがある
    for (const entry of fu25entries) {
      expect(entry.note).toBe('七対子');
    }
    // 25符2翻は存在する（ロン・ツモどちらも）
    const entry25h2 = fu25entries.find(e => e.han === 2);
    expect(entry25h2).toBeDefined();
    expect(entry25h2!.koRon).toBe(1600);
    expect(entry25h2!.koTsumo).toBeDefined();
  });

  test('20符はピンフツモ専用（1翻なし、ロンなし）', () => {
    const fu20entries = table.filter(e => e.fu === 20);
    expect(fu20entries.length).toBeGreaterThan(0);
    // 20符1翻は存在しない
    expect(fu20entries.find(e => e.han === 1)).toBeUndefined();
    // 全ての20符エントリでロンがnull
    for (const entry of fu20entries) {
      expect(entry.koRon).toBeNull();
      expect(entry.oyaRon).toBeNull();
      expect(entry.note).toBe('ピンフツモ');
    }
    // ツモは存在する
    const entry20h2 = fu20entries.find(e => e.han === 2);
    expect(entry20h2).toBeDefined();
    expect(entry20h2!.koTsumo).toBe('400/700');
    expect(entry20h2!.oyaTsumo).toBe('700 all');
  });

  test('満貫以上のエントリがある', () => {
    const manganEntries = table.filter(e => e.label !== undefined);
    expect(manganEntries.length).toBeGreaterThan(0);
    expect(manganEntries.some(e => e.label === '満貫')).toBe(true);
    expect(manganEntries.some(e => e.label === '跳満')).toBe(true);
    expect(manganEntries.some(e => e.label === '倍満')).toBe(true);
    expect(manganEntries.some(e => e.label === '三倍満')).toBe(true);
    expect(manganEntries.some(e => e.label === '役満')).toBe(true);
  });

  test('切り上げ満貫: 30符4翻は満貫', () => {
    const entry = table.find(e => e.fu === 30 && e.han === 4);
    expect(entry).toBeDefined();
    expect(entry!.koRon).toBe(8000);
    expect(entry!.oyaRon).toBe(12000);
  });
});
