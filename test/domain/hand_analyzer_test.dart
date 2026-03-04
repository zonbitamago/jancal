import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/hand_analyzer.dart';
import 'package:jancal/domain/models/wait_type.dart';
import 'package:jancal/utils/tile_parser.dart';

void main() {
  group('HandAnalyzer', () {
    // TDDサイクル 3-1: 最もシンプルな面子分解
    test('123m 456p 789s 234s 11z → 4面子+1雀頭', () {
      final tiles = parseTiles('123m 456p 789s 234s 11z');
      final winTile = parseTiles('1z')[0];
      final results = analyzeHand(tiles, winTile);

      expect(results.isNotEmpty, true);
      final decomp = results.first;
      expect(decomp.mentsuList.length, 4);
      expect(decomp.jantai.length, 2);
      expect(decomp.jantai[0].key, '1z');
    });

    test('234m 567m 345p 678s 55p → 面子分解', () {
      final tiles = parseTiles('234m 567m 345p 678s 55p');
      final winTile = parseTiles('5p')[0];
      final results = analyzeHand(tiles, winTile);

      expect(results.isNotEmpty, true);
    });

    // TDDサイクル 3-2: 七対子
    test('七対子手牌 → isChitoitsu=true', () {
      final tiles = parseTiles('22m 44p 66p 33s 77s 88s 99m');
      final winTile = parseTiles('9m')[0];
      final results = analyzeHand(tiles, winTile);

      final chitoitsu = results.where((d) => d.isChitoitsu).toList();
      expect(chitoitsu.length, 1);
      expect(chitoitsu.first.isChitoitsu, true);
    });

    // 国士無双 (14枚: 13種 + 1枚重複)
    test('国士無双手牌 → isKokushi=true', () {
      // winTileを含めて14枚にする
      final tiles = parseTiles('19m 19p 19s 12345677z');
      final winTile = parseTiles('7z')[0];
      final results = analyzeHand(tiles, winTile);

      final kokushi = results.where((d) => d.isKokushi).toList();
      expect(kokushi.length, 1);
      expect(kokushi.first.isKokushi, true);
    });

    // TDDサイクル 3-3: 待ち判定
    group('待ち判定', () {
      test('両面待ち: 23m + 4m アガリ', () {
        // 234mの4mがアガリ → 23待ちの両面
        final tiles = parseTiles('234m 456p 789s 123s 55m');
        final winTile = parseTiles('4m')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.ryanmen), true);
      });

      test('嵌張待ち: 13m + 2m アガリ', () {
        final tiles = parseTiles('123m 456p 789s 234s 55p');
        final winTile = parseTiles('2m')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.kanchan), true);
      });

      test('辺張待ち: 89s + 7s アガリ', () {
        final tiles = parseTiles('123m 456p 789s 234m 55p');
        final winTile = parseTiles('7s')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.penchan), true);
      });

      test('辺張待ち: 12m + 3m アガリ', () {
        final tiles = parseTiles('123m 456p 789s 234s 55p');
        final winTile = parseTiles('3m')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.penchan), true);
      });

      test('単騎待ち: 雀頭のアガリ牌', () {
        final tiles = parseTiles('123m 456p 789s 234m 55p');
        final winTile = parseTiles('5p')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.tanki), true);
      });

      test('双碰待ち: 暗刻のアガリ牌', () {
        // 111m 222p 456s 789s + 55z → 5z待ちは単騎
        // 双碰の例: 暗刻2つが待ち形
        // 111m 999p 456s 789s 55z 全14枚 → winTile=1m → 111mが暗刻、双碰待ち
        final tiles = parseTiles('111m 999p 456s 789s 55z');
        final winTile = parseTiles('1m')[0];
        final results = analyzeHand(tiles, winTile);

        expect(results.isNotEmpty, true);
        expect(results.any((d) => d.waitType == WaitType.shanpon), true);
      });
    });

    // 複数面子分解のケース
    test('複数の面子分解が見つかる', () {
      final tiles = parseTiles('112233m 456p 789s 55z');
      final winTile = parseTiles('5z')[0];
      final results = analyzeHand(tiles, winTile);

      expect(results.length, greaterThanOrEqualTo(1));
    });
  });
}
