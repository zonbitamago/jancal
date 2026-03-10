import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/yaku_judge.dart';
import 'package:jancal/domain/models/hand.dart';
import 'package:jancal/domain/models/mentsu.dart';
import 'package:jancal/domain/models/wait_type.dart';
import 'package:jancal/utils/tile_parser.dart';

Tile _t(int n, TileType type) => Tile(number: n, type: type, displayChar: '$n');

HandDecomposition _makeDecomp({
  required List<Mentsu> mentsuList,
  required List<Tile> jantai,
  required WaitType waitType,
}) {
  return HandDecomposition(
    mentsuList: mentsuList,
    jantai: jantai,
    waitType: waitType,
  );
}

Mentsu _shuntsu(int start, TileType type) => Mentsu(
      type: MentsuType.shuntsu,
      tiles: [_t(start, type), _t(start + 1, type), _t(start + 2, type)],
    );

Mentsu _anko(int n, TileType type) => Mentsu(
      type: MentsuType.anko,
      tiles: [_t(n, type), _t(n, type), _t(n, type)],
    );

void main() {
  group('YakuJudge', () {
    // TDDサイクル 3-4: 役判定

    // タンヤオ
    test('タンヤオ: 全牌2-8 → 成立', () {
      final tiles = parseTiles('234m 567p 234s 678s 55p');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.pin));
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(2, TileType.man),
          _shuntsu(5, TileType.pin),
          _shuntsu(2, TileType.sou),
          _shuntsu(6, TileType.sou),
        ],
        jantai: [_t(5, TileType.pin), _t(5, TileType.pin)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'タンヤオ'), true);
    });

    test('タンヤオ: 1含み → 不成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55p');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.pin));
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.pin), _t(5, TileType.pin)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'タンヤオ'), false);
    });

    // ピンフ
    test('ピンフ: 門前+全順子+両面+非役牌雀頭 → 成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(3, TileType.man),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.ryanmen,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'ピンフ'), true);
    });

    test('ピンフ: 嵌張待ち → 不成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(2, TileType.man),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.kanchan,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'ピンフ'), false);
    });

    // ツモ（門前ツモ）
    test('ツモ: 門前ツモ → 成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.sou),
        isTsumo: true,
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'ツモ'), true);
    });

    // リーチ・一発
    test('リーチ → 成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.sou),
        isRiichi: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'リーチ'), true);
    });

    test('一発 → 成立', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.sou),
        isRiichi: true,
        isIppatsu: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '一発'), true);
    });

    // 一盃口
    test('一盃口: 同一順子2組 → 成立', () {
      final tiles = parseTiles('112233m 456p 789s 55z');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.dragon),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '一盃口'), true);
    });

    // 三色同順
    test('三色同順: 3色で同じ数字の順子 → 成立', () {
      final tiles = parseTiles('234m 234p 234s 678m 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.sou),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(2, TileType.man),
          _shuntsu(2, TileType.pin),
          _shuntsu(2, TileType.sou),
          _shuntsu(6, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '三色同順'), true);
      expect(yaku.firstWhere((y) => y.name == '三色同順').han, 2); // 門前2翻
    });

    // 混一色
    test('混一色: 1色+字牌のみ → 成立', () {
      final tiles = parseTiles('123p 345p 789p 11z 567p');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(1, TileType.wind),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.pin),
          _shuntsu(3, TileType.pin),
          _shuntsu(7, TileType.pin),
          _shuntsu(5, TileType.pin),
        ],
        jantai: [_t(1, TileType.wind), _t(1, TileType.wind)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '混一色'), true);
      expect(yaku.firstWhere((y) => y.name == '混一色').han, 3); // 門前3翻
    });

    // 清一色
    test('清一色: 1色のみ → 成立', () {
      final tiles = parseTiles('111p 234p 567p 899p 9p');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(9, TileType.pin),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.pin),
          _shuntsu(2, TileType.pin),
          _shuntsu(5, TileType.pin),
          _shuntsu(7, TileType.pin),
        ],
        jantai: [_t(9, TileType.pin), _t(9, TileType.pin)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '清一色'), true);
      expect(yaku.firstWhere((y) => y.name == '清一色').han, 6); // 門前6翻
    });

    test('清一色があれば混一色は判定されない', () {
      final tiles = parseTiles('111p 234p 567p 899p 9p');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(9, TileType.pin),
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.pin),
          _shuntsu(2, TileType.pin),
          _shuntsu(5, TileType.pin),
          _shuntsu(7, TileType.pin),
        ],
        jantai: [_t(9, TileType.pin), _t(9, TileType.pin)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '混一色'), false);
    });

    // 七対子
    test('七対子 → 成立', () {
      final tiles = parseTiles('22m 44p 66p 33s 77s 88s 99m');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(9, TileType.man),
        isMenzen: true,
      );
      final decomp = ChitoitsuDecomposition(
        pairs: [],
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '七対子'), true);
      expect(yaku.firstWhere((y) => y.name == '七対子').han, 2);
    });

    // 国士無双
    test('国士無双 → 成立 (役満)', () {
      final tiles = parseTiles('19m 19p 19s 1234567z');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(7, TileType.dragon),
        isMenzen: true,
      );
      final decomp = KokushiDecomposition();

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '国士無双'), true);
      expect(yaku.firstWhere((y) => y.name == '国士無双').han, 13);
      expect(yaku.length, 1); // 役満のみ
    });

    // 四暗刻
    test('四暗刻 ツモ → 成立 (役満)', () {
      final tiles = parseTiles('111m 444p 777s 222m 55z');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.dragon),
        isTsumo: true,
        isMenzen: true,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.man),
          _anko(4, TileType.pin),
          _anko(7, TileType.sou),
          _anko(2, TileType.man),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );

      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '四暗刻'), true);
      expect(yaku.firstWhere((y) => y.name == '四暗刻').han, 13);
      expect(yaku.length, 1); // 役満のみ
    });

    // ドラカウント
    test('ドラカウント', () {
      final tiles = parseTiles('234m 567p 234s 678s 55p');
      final dora = [_t(5, TileType.pin)]; // 5p がドラ
      final count = countDora(tiles, dora);
      expect(count, 3); // 567pに1枚 + 55pに2枚 = 3枚
    });

    test('ドラなし', () {
      final tiles = parseTiles('123m 456p 789s 234m 55s');
      final dora = [_t(1, TileType.pin)];
      final count = countDora(tiles, dora);
      expect(count, 0);
    });

    // === Mリーグ準拠: 不足役の追加テスト ===

    // 役牌（三元牌）
    test('役牌: 白の刻子 → 成立(1翻)', () {
      final tiles = parseTiles('123m 456p 789s 555z 11z');
      final hand = Hand(tiles: tiles, winTile: _t(1, TileType.wind));
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _anko(5, TileType.dragon),
        ],
        jantai: [_t(1, TileType.wind), _t(1, TileType.wind)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '役牌'), true);
      expect(yaku.where((y) => y.name == '役牌').first.han, 1);
    });

    // 役牌（自風）
    test('役牌: 自風(東)の刻子 → 成立(1翻)', () {
      final tiles = parseTiles('123m 456p 789s 111z 55z');
      final east = _t(1, TileType.wind);
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.dragon),
        seatWind: east,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _anko(1, TileType.wind),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '役牌'), true);
    });

    // 役牌（場風）
    test('役牌: 場風(東)の刻子 → 成立(1翻)', () {
      final tiles = parseTiles('123m 456p 789s 111z 55z');
      final east = _t(1, TileType.wind);
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.dragon),
        roundWind: east,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _anko(1, TileType.wind),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '役牌'), true);
    });

    // 役牌（連風牌 = 2回カウント）
    test('役牌: 連風牌(自風+場風)の刻子 → 2翻', () {
      final tiles = parseTiles('123m 456p 789s 111z 55z');
      final east = _t(1, TileType.wind);
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.dragon),
        seatWind: east,
        roundWind: east,
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _anko(1, TileType.wind),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      final yakuhaiList = yaku.where((y) => y.name == '役牌').toList();
      final totalHan = yakuhaiList.fold(0, (sum, y) => sum + y.han);
      expect(totalHan, 2);
    });

    // 役牌でない風牌
    test('役牌: 場風でも自風でもない風牌の刻子 → 不成立', () {
      final tiles = parseTiles('123m 456p 789s 333z 55s');
      final hand = Hand(
        tiles: tiles,
        winTile: _t(5, TileType.sou),
        seatWind: _t(1, TileType.wind), // 東
        roundWind: _t(1, TileType.wind), // 東
      );
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _anko(3, TileType.wind), // 西
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '役牌'), false);
    });

    // 一気通貫
    test('一気通貫: 門前 → 成立(2翻)', () {
      final tiles = parseTiles('123m 456m 789m 234p 55s');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.sou), isMenzen: true);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.man),
          _shuntsu(7, TileType.man),
          _shuntsu(2, TileType.pin),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '一気通貫'), true);
      expect(yaku.firstWhere((y) => y.name == '一気通貫').han, 2);
    });

    // 一気通貫（食い下がり）
    test('一気通貫: 副露 → 食い下がり(1翻)', () {
      final tiles = parseTiles('123m 456m 789m 234p 55s');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.sou), isMenzen: false);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.man),
          _shuntsu(7, TileType.man),
          _shuntsu(2, TileType.pin),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.firstWhere((y) => y.name == '一気通貫').han, 1);
    });

    // チャンタ（混全帯么九）
    test('チャンタ: 門前 → 成立(2翻)', () {
      final tiles = parseTiles('123m 789p 123s 111z 99s');
      final hand = Hand(tiles: tiles, winTile: _t(9, TileType.sou), isMenzen: true);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(7, TileType.pin),
          _shuntsu(1, TileType.sou),
          _anko(1, TileType.wind),
        ],
        jantai: [_t(9, TileType.sou), _t(9, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'チャンタ'), true);
      expect(yaku.firstWhere((y) => y.name == 'チャンタ').han, 2);
    });

    // チャンタ（食い下がり）
    test('チャンタ: 副露 → 食い下がり(1翻)', () {
      final tiles = parseTiles('123m 789p 123s 111z 99s');
      final hand = Hand(tiles: tiles, winTile: _t(9, TileType.sou), isMenzen: false);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(7, TileType.pin),
          _shuntsu(1, TileType.sou),
          Mentsu(type: MentsuType.minko, tiles: [_t(1, TileType.wind), _t(1, TileType.wind), _t(1, TileType.wind)]),
        ],
        jantai: [_t(9, TileType.sou), _t(9, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.firstWhere((y) => y.name == 'チャンタ').han, 1);
    });

    // トイトイ
    test('トイトイ: 刻子4つ → 成立(2翻)', () {
      final tiles = parseTiles('111m 333p 555s 777z 22m');
      final hand = Hand(tiles: tiles, winTile: _t(2, TileType.man), isMenzen: false);
      final decomp = _makeDecomp(
        mentsuList: [
          Mentsu(type: MentsuType.minko, tiles: [_t(1, TileType.man), _t(1, TileType.man), _t(1, TileType.man)]),
          Mentsu(type: MentsuType.minko, tiles: [_t(3, TileType.pin), _t(3, TileType.pin), _t(3, TileType.pin)]),
          Mentsu(type: MentsuType.minko, tiles: [_t(5, TileType.sou), _t(5, TileType.sou), _t(5, TileType.sou)]),
          _anko(7, TileType.dragon),
        ],
        jantai: [_t(2, TileType.man), _t(2, TileType.man)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == 'トイトイ'), true);
      expect(yaku.firstWhere((y) => y.name == 'トイトイ').han, 2);
    });

    // 三暗刻
    test('三暗刻: 暗刻3つ → 成立(2翻)', () {
      final tiles = parseTiles('111m 333p 555s 234m 22z');
      final hand = Hand(tiles: tiles, winTile: _t(2, TileType.wind), isMenzen: true);
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.man),
          _anko(3, TileType.pin),
          _anko(5, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(2, TileType.wind), _t(2, TileType.wind)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '三暗刻'), true);
      expect(yaku.firstWhere((y) => y.name == '三暗刻').han, 2);
    });

    // 小三元
    test('小三元: 三元牌2刻子+1雀頭 → 成立(2翻)', () {
      final tiles = parseTiles('123m 555z 666z 77z 456p');
      final hand = Hand(tiles: tiles, winTile: _t(7, TileType.dragon));
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _anko(5, TileType.dragon),
          _anko(6, TileType.dragon),
          _shuntsu(4, TileType.pin),
        ],
        jantai: [_t(7, TileType.dragon), _t(7, TileType.dragon)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '小三元'), true);
      expect(yaku.firstWhere((y) => y.name == '小三元').han, 2);
    });

    // 混老頭
    test('混老頭: 么九牌+字牌のみ → 成立(2翻)', () {
      final tiles = parseTiles('111m 999p 111z 77z 99s');
      final hand = Hand(tiles: tiles, winTile: _t(9, TileType.sou));
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.man),
          _anko(9, TileType.pin),
          _anko(1, TileType.wind),
          Mentsu(type: MentsuType.minko, tiles: [_t(9, TileType.sou), _t(9, TileType.sou), _t(9, TileType.sou)]),
        ],
        jantai: [_t(7, TileType.dragon), _t(7, TileType.dragon)],
        waitType: WaitType.shanpon,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '混老頭'), true);
      expect(yaku.firstWhere((y) => y.name == '混老頭').han, 2);
    });

    // 純チャン（純全帯么九）
    test('純チャン: 門前 → 成立(3翻)', () {
      final tiles = parseTiles('123m 789p 123s 789s 11m');
      final hand = Hand(tiles: tiles, winTile: _t(1, TileType.man), isMenzen: true);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(7, TileType.pin),
          _shuntsu(1, TileType.sou),
          _shuntsu(7, TileType.sou),
        ],
        jantai: [_t(1, TileType.man), _t(1, TileType.man)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '純チャン'), true);
      expect(yaku.firstWhere((y) => y.name == '純チャン').han, 3);
    });

    // 純チャン（食い下がり）
    test('純チャン: 副露 → 食い下がり(2翻)', () {
      final tiles = parseTiles('123m 789p 123s 789s 11m');
      final hand = Hand(tiles: tiles, winTile: _t(1, TileType.man), isMenzen: false);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(7, TileType.pin),
          _shuntsu(1, TileType.sou),
          _shuntsu(7, TileType.sou),
        ],
        jantai: [_t(1, TileType.man), _t(1, TileType.man)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.firstWhere((y) => y.name == '純チャン').han, 2);
    });

    // 二盃口
    test('二盃口: 同一順子ペア2組 → 成立(3翻)', () {
      final tiles = parseTiles('112233m 778899p 55s');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.sou), isMenzen: true);
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(1, TileType.man),
          _shuntsu(7, TileType.pin),
          _shuntsu(7, TileType.pin),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '二盃口'), true);
      expect(yaku.firstWhere((y) => y.name == '二盃口').han, 3);
      // 二盃口がある場合、一盃口は判定されない
      expect(yaku.any((y) => y.name == '一盃口'), false);
    });

    // 三色同刻
    test('三色同刻: 3色で同じ数字の刻子 → 成立(2翻)', () {
      final tiles = parseTiles('111m 111p 111s 234m 55z');
      final hand = Hand(tiles: tiles, winTile: _t(5, TileType.dragon));
      final decomp = _makeDecomp(
        mentsuList: [
          _anko(1, TileType.man),
          _anko(1, TileType.pin),
          _anko(1, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '三色同刻'), true);
      expect(yaku.firstWhere((y) => y.name == '三色同刻').han, 2);
    });

    // 大三元（役満）
    test('大三元: 三元牌3刻子 → 成立(役満)', () {
      final tiles = parseTiles('123m 555z 666z 777z 22p');
      final hand = Hand(tiles: tiles, winTile: _t(2, TileType.pin));
      final decomp = _makeDecomp(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _anko(5, TileType.dragon),
          _anko(6, TileType.dragon),
          _anko(7, TileType.dragon),
        ],
        jantai: [_t(2, TileType.pin), _t(2, TileType.pin)],
        waitType: WaitType.tanki,
      );
      final yaku = judgeYaku(hand: hand, decomposition: decomp);
      expect(yaku.any((y) => y.name == '大三元'), true);
      expect(yaku.firstWhere((y) => y.name == '大三元').han, 13);
      expect(yaku.length, 1); // 役満のみ
    });
  });
}
