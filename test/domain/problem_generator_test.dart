import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/problem_generator.dart';
import 'package:jancal/models/problem.dart';

void main() {
  group('ProblemGenerator', () {
    late ProblemGenerator generator;

    setUp(() {
      generator = ProblemGenerator(seed: 42);
    });

    test('初級の問題を生成できる', () {
      final problem = generator.generate(QuizLevel.beginner);
      expect(problem.han, inInclusiveRange(1, 3));
      expect(problem.choices.length, 4);
      expect(problem.choices.contains(problem.correctAnswer), isTrue);
    });

    test('中級の問題を生成できる', () {
      final problem = generator.generate(QuizLevel.intermediate);
      expect(problem.han, inInclusiveRange(2, 5));
      expect(problem.choices.length, 4);
      expect(problem.choices.contains(problem.correctAnswer), isTrue);
    });

    test('上級の問題を生成できる', () {
      final problem = generator.generate(QuizLevel.advanced);
      expect(problem.han, greaterThanOrEqualTo(5));
      expect(problem.choices.length, 4);
      expect(problem.choices.contains(problem.correctAnswer), isTrue);
    });

    test('複数の問題を連続生成できる', () {
      final problems = <Problem>[];
      for (int i = 0; i < 10; i++) {
        problems.add(generator.generate(QuizLevel.beginner));
      }
      expect(problems.length, 10);
    });

    test('生成問題の選択肢に正解が含まれる', () {
      for (final level in QuizLevel.values) {
        for (int i = 0; i < 5; i++) {
          final problem = generator.generate(level);
          expect(
            problem.choices.contains(problem.correctAnswer),
            isTrue,
            reason: '${problem.id}: correctAnswer=${problem.correctAnswer} '
                'not in choices=${problem.choices}',
          );
        }
      }
    });
  });
}
