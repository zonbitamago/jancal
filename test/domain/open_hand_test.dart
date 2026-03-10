import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/hand_analyzer.dart';
import 'package:jancal/domain/yaku_judge.dart';
import 'package:jancal/domain/fu_calculator.dart';
import 'package:jancal/domain/score_calculator.dart';
import 'package:jancal/domain/models/hand.dart';
import 'package:jancal/domain/models/mentsu.dart';
import 'package:jancal/utils/tile_parser.dart';

void main() {
  group('副露対応: analyzeHandWithOpen', () {
    test('ポン1副露 + 閉じた手牌の分解', () {
      // 白ポン(明刻) + 234m 678p 456s 33p (閉じた手)
      final openMentsu = [
        Mentsu(
          type: MentsuType.minko,
          tiles: parseTiles('555z'),
        ),
      ];
      final closedTiles = parseTiles('234m 678p 456s 33p');
      final winTile = parseTiles('3p')[0];

      final decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
      expect(decomps, isNotEmpty);
      expect(decomps.first.mentsuList.length, 4);
      // 最初の面子は白の明刻
      expect(decomps.first.mentsuList[0].type, MentsuType.minko);
    });

    test('ポン2副露 + 閉じた手牌の分解', () {
      final openMentsu = [
        Mentsu(
          type: MentsuType.minko,
          tiles: parseTiles('222m'),
        ),
        Mentsu(
          type: MentsuType.minko,
          tiles: parseTiles('555p'),
        ),
      ];
      final closedTiles = parseTiles('888s 333m 77s');
      final winTile = parseTiles('7s')[0];

      final decomps = analyzeHandWithOpen(closedTiles, winTile, openMentsu);
      expect(decomps, isNotEmpty);
      expect(decomps.first.mentsuList.length, 4);
    });
  });

  group('副露対応: 役判定', () {
    test('鳴きタンヤオ (食い下がりなし)', () {
      final tiles = parseTiles('234m 567p 345s 678s 55m');
      final winTile = parseTiles('5m')[0];
      final hand = Hand(
        tiles: tiles,
        winTile: winTile,
        isTsumo: false,
        isMenzen: false,
        isParent: false,
      );

      final decomps = analyzeHand(tiles, winTile);
      expect(decomps, isNotEmpty);

      final yaku = judgeYaku(hand: hand, decomposition: decomps.first);
      final yakuNames = yaku.map((y) => y.name).toList();
      expect(yakuNames, contains('タンヤオ'));
      // 門前でないのでツモ・ピンフ・リーチは付かない
      expect(yakuNames, isNot(contains('ツモ')));
    });

    test('鳴き混一色は食い下がり2翻', () {
      final tiles = parseTiles('123p 456p 789p 11z 567p');
      final winTile = parseTiles('1z')[0];
      final hand = Hand(
        tiles: tiles,
        winTile: winTile,
        isTsumo: false,
        isMenzen: false,
        isParent: false,
      );

      final decomps = analyzeHand(tiles, winTile);
      expect(decomps, isNotEmpty);

      final yaku = judgeYaku(hand: hand, decomposition: decomps.first);
      final honitsu = yaku.firstWhere((y) => y.name == '混一色');
      expect(honitsu.han, 2); // 食い下がり
    });

    test('鳴き清一色は食い下がり5翻', () {
      final tiles = parseTiles('123s 345s 567s 789s 22s');
      final winTile = parseTiles('2s')[0];
      final hand = Hand(
        tiles: tiles,
        winTile: winTile,
        isTsumo: false,
        isMenzen: false,
        isParent: false,
      );

      final decomps = analyzeHand(tiles, winTile);
      expect(decomps, isNotEmpty);

      final yaku = judgeYaku(hand: hand, decomposition: decomps.first);
      final chinitsu = yaku.firstWhere((y) => y.name == '清一色');
      expect(chinitsu.han, 5); // 食い下がり
    });
  });

  group('副露対応: 符計算', () {
    test('明刻の符は中張2符、么九4符', () {
      final minko = Mentsu(
        type: MentsuType.minko,
        tiles: parseTiles('555m'),
      );
      expect(minko.fuValue, 2); // 中張明刻

      final minkoYaochu = Mentsu(
        type: MentsuType.minko,
        tiles: parseTiles('111m'),
      );
      expect(minkoYaochu.fuValue, 4); // 么九明刻

      final minkoDragon = Mentsu(
        type: MentsuType.minko,
        tiles: parseTiles('555z'),
      );
      expect(minkoDragon.fuValue, 4); // 字牌明刻
    });

    test('副露手の符計算（門前ロン加符なし）', () {
      final decomp = HandDecomposition(
        mentsuList: [
          Mentsu(type: MentsuType.minko, tiles: parseTiles('555z')), // 白明刻: 4
          Mentsu(type: MentsuType.shuntsu, tiles: parseTiles('234m')),
          Mentsu(type: MentsuType.shuntsu, tiles: parseTiles('678p')),
          Mentsu(type: MentsuType.shuntsu, tiles: parseTiles('456s')),
        ],
        jantai: parseTiles('33p'),
        waitType: WaitType.tanki,
      );

      final fu = calculateFu(
        decomposition: decomp,
        isTsumo: false,
        isMenzen: false,
        isPinfu: false,
      );
      // 副底20 + 明刻4 + 単騎2 = 26 → 切り上げ30
      // 門前ロン加符なし（副露なので）
      expect(fu, 30);
    });
  });

  group('副露対応: 点数計算E2E', () {
    test('白ポン + 門前外 子ロン → 40符1翻 1300', () {
      final tiles = parseTiles('555z 234m 678p 456s 33p');
      final winTile = parseTiles('3p')[0];
      final hand = Hand(
        tiles: tiles,
        winTile: winTile,
        isTsumo: false,
        isMenzen: false,
        isParent: false,
      );

      final decomps = analyzeHand(tiles, winTile);
      expect(decomps, isNotEmpty);

      final yaku = judgeYaku(hand: hand, decomposition: decomps.first);
      expect(yaku.any((y) => y.name == '役牌'), isTrue);

      final han = yaku.fold(0, (sum, y) => sum + y.han);
      final fu = calculateFu(
        decomposition: decomps.first,
        isTsumo: false,
        isMenzen: false,
        isPinfu: false,
      );

      final result = calculateScore(
        fu: fu,
        han: han,
        isParent: false,
        isTsumo: false,
      );

      expect(result.toAnswerString(), '1300');
    });
  });
}
