import { describe, test, expect } from 'vitest';
import { ProblemGenerator } from '../../domain/problemGenerator';
import { QuizLevel } from '../../models/problem';
import { parseTiles } from '../../utils/tileParser';
import { analyzeHand } from '../../domain/handAnalyzer';
import { judgeYaku, countDora } from '../../domain/yakuJudge';
import { calculateFu } from '../../domain/fuCalculator';
import { calculateScore } from '../../domain/scoreCalculator';
import { createHand } from '../../domain/models/hand';

describe('ProblemGenerator', () => {
  const generator = new ProblemGenerator(42);

  test('初級の問題を生成できる', () => {
    const problem = generator.generate(QuizLevel.beginner);
    expect(problem.han).toBeGreaterThanOrEqual(1);
    expect(problem.han).toBeLessThanOrEqual(3);
    expect(problem.choices.length).toBe(4);
    expect(problem.choices).toContain(problem.correctAnswer);
  });

  test('中級の問題を生成できる', () => {
    const problem = generator.generate(QuizLevel.intermediate);
    expect(problem.han).toBeGreaterThanOrEqual(2);
    expect(problem.han).toBeLessThanOrEqual(5);
    expect(problem.choices.length).toBe(4);
    expect(problem.choices).toContain(problem.correctAnswer);
  });

  test('上級の問題を生成できる', () => {
    const problem = generator.generate(QuizLevel.advanced);
    expect(problem.han).toBeGreaterThanOrEqual(5);
    expect(problem.choices.length).toBe(4);
    expect(problem.choices).toContain(problem.correctAnswer);
  });

  test('複数の問題を連続生成できる', () => {
    const gen = new ProblemGenerator(42);
    const problems = [];
    for (let i = 0; i < 10; i++) {
      problems.push(gen.generate(QuizLevel.beginner));
    }
    expect(problems.length).toBe(10);
  });

  test('生成問題の選択肢に正解が含まれる', () => {
    const gen = new ProblemGenerator(42);
    for (const level of [QuizLevel.beginner, QuizLevel.intermediate, QuizLevel.advanced]) {
      for (let i = 0; i < 5; i++) {
        const problem = gen.generate(level);
        expect(problem.choices).toContain(problem.correctAnswer);
      }
    }
  });

  test('選択肢に重複がない', () => {
    const gen = new ProblemGenerator(123);
    for (let i = 0; i < 10; i++) {
      const problem = gen.generate(QuizLevel.beginner);
      const unique = new Set(problem.choices);
      expect(unique.size).toBe(problem.choices.length);
    }
  });

  test('correctAnswerがパイプライン計算結果と一致する（初級）', () => {
    const gen = new ProblemGenerator(99);
    // 初級は符・翻から直接計算するため、手牌解析の差異に影響されない
    for (const level of [QuizLevel.beginner]) {
      for (let i = 0; i < 5; i++) {
        const problem = gen.generate(level);
        const tiles = parseTiles(problem.tiles);
        const winTile = parseTiles(problem.winTile)[0];
        const dora = problem.dora.flatMap(d => parseTiles(d));

        const isRiichi = problem.yaku.includes('リーチ');
        const isIppatsu = problem.yaku.includes('一発');
        const hand = createHand({
          tiles, winTile, isTsumo: problem.isTsumo, isMenzen: problem.openGroups.length === 0,
          isParent: problem.isParent, isRiichi, isIppatsu, dora,
        });

        const decompositions = analyzeHand(tiles, winTile);
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
          const fu = hasYakuman ? 0 : calculateFu({
            decomposition: decomp, isTsumo: problem.isTsumo,
            isMenzen: hand.isMenzen, isPinfu,
          });

          const result = calculateScore({
            fu, han, isParent: problem.isParent,
            isTsumo: problem.isTsumo, isYakuman: hasYakuman,
          });

          const score = problem.isTsumo
            ? (problem.isParent
              ? result.tsumoOyaPoints * 3
              : result.tsumoKoPoints * 2 + result.tsumoOyaPoints)
            : result.ronPoints;

          if (score > bestScore) {
            bestScore = score;
            bestAnswer = result.toAnswerString();
          }
        }

        expect(bestAnswer).toBe(problem.correctAnswer);
      }
    }
  });
});
