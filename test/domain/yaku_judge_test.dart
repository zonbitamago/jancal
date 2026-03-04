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
  });
}
