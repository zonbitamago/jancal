import { describe, test, expect } from 'vitest';
import { generateExplanation, ExplanationStep } from '../../domain/scoreExplanation';

describe('ScoreExplanation', () => {
  test('ピンフロンの解説が正しいステップを含む', () => {
    const steps = generateExplanation({
      yaku: ['リーチ', 'ピンフ'],
      fu: 30,
      han: 2,
      isParent: false,
      isTsumo: false,
      correctAnswer: '2000',
      doraCount: 0,
    });

    expect(steps.length).toBeGreaterThanOrEqual(3);

    // ステップ1: 役の確認
    expect(steps[0].title).toBe('役の確認');
    expect(steps[0].detail).toContain('リーチ');
    expect(steps[0].detail).toContain('ピンフ');

    // ステップ2: 符の計算
    const fuStep = steps.find(s => s.title === '符の計算');
    expect(fuStep).toBeDefined();
    expect(fuStep!.detail).toContain('30符');

    // ステップ3: 翻数の計算
    const hanStep = steps.find(s => s.title === '翻数の計算');
    expect(hanStep).toBeDefined();
    expect(hanStep!.detail).toContain('2翻');

    // 最後: 点数算出
    const scoreStep = steps.find(s => s.title === '点数の算出');
    expect(scoreStep).toBeDefined();
    expect(scoreStep!.detail).toContain('2000');
  });

  test('ツモの場合はツモ支払い形式で表示', () => {
    const steps = generateExplanation({
      yaku: ['リーチ', 'ツモ', 'ピンフ'],
      fu: 20,
      han: 3,
      isParent: false,
      isTsumo: true,
      correctAnswer: '700/1300',
      doraCount: 0,
    });

    const scoreStep = steps.find(s => s.title === '点数の算出');
    expect(scoreStep).toBeDefined();
    expect(scoreStep!.detail).toContain('700');
    expect(scoreStep!.detail).toContain('1300');
  });

  test('親の場合は親であることを明示', () => {
    const steps = generateExplanation({
      yaku: ['リーチ', 'ピンフ'],
      fu: 30,
      han: 2,
      isParent: true,
      isTsumo: false,
      correctAnswer: '2900',
      doraCount: 0,
    });

    const scoreStep = steps.find(s => s.title === '点数の算出');
    expect(scoreStep).toBeDefined();
    expect(scoreStep!.detail).toContain('親');
  });

  test('ドラがある場合はドラを翻数に含める', () => {
    const steps = generateExplanation({
      yaku: ['タンヤオ'],
      fu: 30,
      han: 2,
      isParent: false,
      isTsumo: false,
      correctAnswer: '2000',
      doraCount: 1,
    });

    const hanStep = steps.find(s => s.title === '翻数の計算');
    expect(hanStep).toBeDefined();
    expect(hanStep!.detail).toContain('ドラ');
  });

  test('満貫以上の場合は特別な説明', () => {
    const steps = generateExplanation({
      yaku: ['リーチ', 'タンヤオ', 'ピンフ'],
      fu: 30,
      han: 5,
      isParent: false,
      isTsumo: false,
      correctAnswer: '8000',
      doraCount: 2,
    });

    const scoreStep = steps.find(s => s.title === '点数の算出');
    expect(scoreStep).toBeDefined();
    expect(scoreStep!.detail).toContain('満貫');
  });

  test('七対子の場合は25符固定と説明', () => {
    const steps = generateExplanation({
      yaku: ['七対子'],
      fu: 25,
      han: 2,
      isParent: false,
      isTsumo: false,
      correctAnswer: '1600',
      doraCount: 0,
    });

    const fuStep = steps.find(s => s.title === '符の計算');
    expect(fuStep).toBeDefined();
    expect(fuStep!.detail).toContain('25符');
    expect(fuStep!.detail).toContain('固定');
  });

  test('各ステップにはtitleとdetailがある', () => {
    const steps = generateExplanation({
      yaku: ['リーチ'],
      fu: 40,
      han: 2,
      isParent: false,
      isTsumo: false,
      correctAnswer: '2600',
      doraCount: 1,
    });

    for (const step of steps) {
      expect(typeof step.title).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.detail).toBe('string');
      expect(step.detail.length).toBeGreaterThan(0);
    }
  });
});
