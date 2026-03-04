import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/score_calculator.dart';

void main() {
  group('ScoreCalculator', () {
    // TDDサイクル 1-1: 最もシンプルなケース
    test('30符2翻 子ロン → 2000', () {
      final result = calculateScore(fu: 30, han: 2, isParent: false, isTsumo: false);
      expect(result.toAnswerString(), '2000');
    });

    // TDDサイクル 1-2: ツモのケース
    test('30符2翻 子ツモ → 500/1000', () {
      final result = calculateScore(fu: 30, han: 2, isParent: false, isTsumo: true);
      expect(result.toAnswerString(), '500/1000');
    });

    // TDDサイクル 1-3: 親のケース
    test('30符2翻 親ロン → 2900', () {
      final result = calculateScore(fu: 30, han: 2, isParent: true, isTsumo: false);
      expect(result.toAnswerString(), '2900');
    });

    test('30符2翻 親ツモ → 1000 all', () {
      final result = calculateScore(fu: 30, han: 2, isParent: true, isTsumo: true);
      expect(result.toAnswerString(), '1000 all');
    });

    // TDDサイクル 1-4: 満貫以上
    group('満貫以上', () {
      test('30符4翻 子ロン → 7700 (切り上げ満貫なし)', () {
        final result = calculateScore(fu: 30, han: 4, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '7700');
      });

      test('25符4翻 子ロン → 6400 (切り上げ満貫ではない)', () {
        final result = calculateScore(fu: 25, han: 4, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '6400');
      });

      test('5翻 子ロン → 8000 (満貫)', () {
        final result = calculateScore(fu: 30, han: 5, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '8000');
      });

      test('6翻 子ロン → 12000 (跳満)', () {
        final result = calculateScore(fu: 30, han: 6, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '12000');
      });

      test('7翻 子ロン → 12000 (跳満)', () {
        final result = calculateScore(fu: 30, han: 7, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '12000');
      });

      test('8翻 子ロン → 16000 (倍満)', () {
        final result = calculateScore(fu: 30, han: 8, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '16000');
      });

      test('10翻 子ロン → 16000 (倍満)', () {
        final result = calculateScore(fu: 30, han: 10, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '16000');
      });

      test('11翻 子ロン → 24000 (三倍満)', () {
        final result = calculateScore(fu: 30, han: 11, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '24000');
      });

      test('12翻 子ロン → 24000 (三倍満)', () {
        final result = calculateScore(fu: 30, han: 12, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '24000');
      });

      test('13翻 子ロン → 32000 (役満)', () {
        final result = calculateScore(fu: 30, han: 13, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '32000');
      });
    });

    // 満貫以上のツモ
    group('満貫以上ツモ', () {
      test('満貫 子ツモ → 2000/4000', () {
        final result = calculateScore(fu: 30, han: 5, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '2000/4000');
      });

      test('満貫 親ツモ → 4000 all', () {
        final result = calculateScore(fu: 30, han: 5, isParent: true, isTsumo: true);
        expect(result.toAnswerString(), '4000 all');
      });

      test('跳満 子ツモ → 3000/6000', () {
        final result = calculateScore(fu: 30, han: 6, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '3000/6000');
      });

      test('跳満 親ロン → 18000', () {
        final result = calculateScore(fu: 40, han: 7, isParent: true, isTsumo: false);
        expect(result.toAnswerString(), '18000');
      });

      test('倍満 子ツモ → 4000/8000', () {
        final result = calculateScore(fu: 30, han: 8, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '4000/8000');
      });

      test('三倍満 子ツモ → 6000/12000', () {
        final result = calculateScore(fu: 30, han: 11, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '6000/12000');
      });

      test('役満 子ロン → 32000', () {
        final result = calculateScore(fu: 0, han: 13, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '32000');
      });

      test('役満 子ツモ → 8000/16000', () {
        final result = calculateScore(fu: 0, han: 13, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '8000/16000');
      });
    });

    // 各種符のパターン
    group('各種符パターン', () {
      test('20符3翻 子ロン → 2600', () {
        final result = calculateScore(fu: 20, han: 3, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '2600');
      });

      test('20符3翻 子ツモ → 700/1300', () {
        final result = calculateScore(fu: 20, han: 3, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '700/1300');
      });

      test('30符3翻 子ロン → 3900', () {
        final result = calculateScore(fu: 30, han: 3, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '3900');
      });

      test('40符4翻 子ロン → 8000 (満貫)', () {
        final result = calculateScore(fu: 40, han: 4, isParent: false, isTsumo: false);
        expect(result.toAnswerString(), '8000');
      });

      test('20符4翻 子ツモ → 1300/2600', () {
        final result = calculateScore(fu: 20, han: 4, isParent: false, isTsumo: true);
        expect(result.toAnswerString(), '1300/2600');
      });
    });
  });
}
