import { describe, test, expect } from 'vitest';
import { calculateScore } from '../../domain/scoreCalculator';

describe('ScoreCalculator', () => {
  test('30符2翻 子ロン → 2000', () => {
    const result = calculateScore({ fu: 30, han: 2, isParent: false, isTsumo: false });
    expect(result.toAnswerString()).toBe('2000');
  });

  test('30符2翻 子ツモ → 500/1000', () => {
    const result = calculateScore({ fu: 30, han: 2, isParent: false, isTsumo: true });
    expect(result.toAnswerString()).toBe('500/1000');
  });

  test('30符2翻 親ロン → 2900', () => {
    const result = calculateScore({ fu: 30, han: 2, isParent: true, isTsumo: false });
    expect(result.toAnswerString()).toBe('2900');
  });

  test('30符2翻 親ツモ → 1000 all', () => {
    const result = calculateScore({ fu: 30, han: 2, isParent: true, isTsumo: true });
    expect(result.toAnswerString()).toBe('1000 all');
  });

  describe('満貫以上', () => {
    test('30符4翻 子ロン → 8000 (切り上げ満貫)', () => {
      const result = calculateScore({ fu: 30, han: 4, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('8000');
    });

    test('60符3翻 子ロン → 8000 (切り上げ満貫)', () => {
      const result = calculateScore({ fu: 60, han: 3, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('8000');
    });

    test('30符4翻 親ロン → 12000 (切り上げ満貫)', () => {
      const result = calculateScore({ fu: 30, han: 4, isParent: true, isTsumo: false });
      expect(result.toAnswerString()).toBe('12000');
    });

    test('30符4翻 子ツモ → 2000/4000 (切り上げ満貫)', () => {
      const result = calculateScore({ fu: 30, han: 4, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('2000/4000');
    });

    test('25符4翻 子ロン → 6400 (切り上げ満貫の対象外)', () => {
      const result = calculateScore({ fu: 25, han: 4, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('6400');
    });

    test('5翻 子ロン → 8000 (満貫)', () => {
      const result = calculateScore({ fu: 30, han: 5, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('8000');
    });

    test('6翻 子ロン → 12000 (跳満)', () => {
      const result = calculateScore({ fu: 30, han: 6, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('12000');
    });

    test('7翻 子ロン → 12000 (跳満)', () => {
      const result = calculateScore({ fu: 30, han: 7, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('12000');
    });

    test('8翻 子ロン → 16000 (倍満)', () => {
      const result = calculateScore({ fu: 30, han: 8, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('16000');
    });

    test('10翻 子ロン → 16000 (倍満)', () => {
      const result = calculateScore({ fu: 30, han: 10, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('16000');
    });

    test('11翻 子ロン → 24000 (三倍満)', () => {
      const result = calculateScore({ fu: 30, han: 11, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('24000');
    });

    test('12翻 子ロン → 24000 (三倍満)', () => {
      const result = calculateScore({ fu: 30, han: 12, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('24000');
    });

    test('13翻 子ロン → 24000 (数え役満なし=三倍満)', () => {
      const result = calculateScore({ fu: 30, han: 13, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('24000');
    });
  });

  describe('満貫以上ツモ', () => {
    test('満貫 子ツモ → 2000/4000', () => {
      const result = calculateScore({ fu: 30, han: 5, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('2000/4000');
    });

    test('満貫 親ツモ → 4000 all', () => {
      const result = calculateScore({ fu: 30, han: 5, isParent: true, isTsumo: true });
      expect(result.toAnswerString()).toBe('4000 all');
    });

    test('跳満 子ツモ → 3000/6000', () => {
      const result = calculateScore({ fu: 30, han: 6, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('3000/6000');
    });

    test('跳満 親ロン → 18000', () => {
      const result = calculateScore({ fu: 40, han: 7, isParent: true, isTsumo: false });
      expect(result.toAnswerString()).toBe('18000');
    });

    test('倍満 子ツモ → 4000/8000', () => {
      const result = calculateScore({ fu: 30, han: 8, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('4000/8000');
    });

    test('三倍満 子ツモ → 6000/12000', () => {
      const result = calculateScore({ fu: 30, han: 11, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('6000/12000');
    });

    test('役満 子ロン → 32000', () => {
      const result = calculateScore({ fu: 0, han: 13, isParent: false, isTsumo: false, isYakuman: true });
      expect(result.toAnswerString()).toBe('32000');
    });

    test('役満 子ツモ → 8000/16000', () => {
      const result = calculateScore({ fu: 0, han: 13, isParent: false, isTsumo: true, isYakuman: true });
      expect(result.toAnswerString()).toBe('8000/16000');
    });
  });

  describe('各種符パターン', () => {
    test('20符3翻 子ロン → 2600', () => {
      const result = calculateScore({ fu: 20, han: 3, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('2600');
    });

    test('20符3翻 子ツモ → 700/1300', () => {
      const result = calculateScore({ fu: 20, han: 3, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('700/1300');
    });

    test('30符3翻 子ロン → 3900', () => {
      const result = calculateScore({ fu: 30, han: 3, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('3900');
    });

    test('40符4翻 子ロン → 8000 (満貫)', () => {
      const result = calculateScore({ fu: 40, han: 4, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('8000');
    });

    test('20符4翻 子ツモ → 1300/2600', () => {
      const result = calculateScore({ fu: 20, han: 4, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('1300/2600');
    });

    test('20符2翻 子ロン → 1300', () => {
      const result = calculateScore({ fu: 20, han: 2, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('1300');
    });
  });

  describe('1翻パターン', () => {
    test('30符1翻 子ロン → 1000', () => {
      const result = calculateScore({ fu: 30, han: 1, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('1000');
    });

    test('40符1翻 子ロン → 1300', () => {
      const result = calculateScore({ fu: 40, han: 1, isParent: false, isTsumo: false });
      expect(result.toAnswerString()).toBe('1300');
    });

    test('30符1翻 親ロン → 1500', () => {
      const result = calculateScore({ fu: 30, han: 1, isParent: true, isTsumo: false });
      expect(result.toAnswerString()).toBe('1500');
    });

    test('30符1翻 子ツモ → 300/500', () => {
      const result = calculateScore({ fu: 30, han: 1, isParent: false, isTsumo: true });
      expect(result.toAnswerString()).toBe('300/500');
    });

    test('40符1翻 親ツモ → 700 all', () => {
      const result = calculateScore({ fu: 40, han: 1, isParent: true, isTsumo: true });
      expect(result.toAnswerString()).toBe('700 all');
    });
  });
});
