import { describe, test, expect } from 'vitest';
import { FuQuizGenerator, FuQuizProblem } from '../../domain/fuQuizGenerator';

describe('FuQuizGenerator', () => {
  const generator = new FuQuizGenerator(42);

  test('生成された問題はFuQuizProblemの構造を持つ', () => {
    const problem = generator.generate();
    expect(problem).toBeDefined();
    expect(problem.tiles).toBeTruthy();
    expect(problem.winTile).toBeTruthy();
    expect(typeof problem.isTsumo).toBe('boolean');
    expect(typeof problem.isMenzen).toBe('boolean');
    expect(typeof problem.correctFu).toBe('number');
    expect(problem.choices).toHaveLength(4);
    expect(problem.choices).toContain(problem.correctFu);
  });

  test('正解の符は有効な値（20, 25, 30, 40, 50, 60, 70, ...）', () => {
    for (let i = 0; i < 20; i++) {
      const problem = generator.generate();
      const validFuValues = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
      expect(validFuValues).toContain(problem.correctFu);
    }
  });

  test('選択肢は4つでユニーク', () => {
    for (let i = 0; i < 20; i++) {
      const problem = generator.generate();
      const unique = new Set(problem.choices);
      expect(unique.size).toBe(4);
    }
  });

  test('問題には役名リストが含まれる', () => {
    const problem = generator.generate();
    expect(Array.isArray(problem.yaku)).toBe(true);
    expect(problem.yaku.length).toBeGreaterThan(0);
  });

  test('問題にはドラ情報が含まれる', () => {
    const problem = generator.generate();
    expect(Array.isArray(problem.dora)).toBe(true);
  });

  test('問題には親/子情報が含まれる', () => {
    const problem = generator.generate();
    expect(typeof problem.isParent).toBe('boolean');
  });

  test('問題にはopenGroupsが含まれる', () => {
    const problem = generator.generate();
    expect(Array.isArray(problem.openGroups)).toBe(true);
  });

  test('符の内訳説明が含まれる', () => {
    const problem = generator.generate();
    expect(typeof problem.fuBreakdown).toBe('string');
    expect(problem.fuBreakdown.length).toBeGreaterThan(0);
  });
});
