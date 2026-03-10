import { describe, test, expect } from 'vitest';
import { ProblemGenerator } from '../../domain/problemGenerator';
import { QuizLevel } from '../../models/problem';

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
});
