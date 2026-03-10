import 'package:flutter_test/flutter_test.dart';
import 'package:jancal/domain/fu_calculator.dart';
import 'package:jancal/domain/models/mentsu.dart';
import 'package:jancal/domain/models/hand.dart';
import 'package:jancal/domain/models/wait_type.dart';
import 'package:jancal/utils/tile_parser.dart';

Tile _t(int n, TileType type) => Tile(number: n, type: type, displayChar: '$n');

Mentsu _shuntsu(int start, TileType type) => Mentsu(
      type: MentsuType.shuntsu,
      tiles: [_t(start, type), _t(start + 1, type), _t(start + 2, type)],
    );

Mentsu _anko(int n, TileType type) => Mentsu(
      type: MentsuType.anko,
      tiles: [_t(n, type), _t(n, type), _t(n, type)],
    );

Mentsu _minko(int n, TileType type) => Mentsu(
      type: MentsuType.minko,
      tiles: [_t(n, type), _t(n, type), _t(n, type)],
    );

void main() {
  group('FuCalculator', () {
    // TDDサイクル 2-1: ピンフロン → 30符
    test('ピンフロン → 30符', () {
      final decomp = HandDecomposition(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.ryanmen,
      );
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: true,
          isPinfu: true,
        ),
        30,
      );
    });

    // TDDサイクル 2-2: ピンフツモ → 20符
    test('ピンフツモ → 20符', () {
      final decomp = HandDecomposition(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.sou), _t(5, TileType.sou)],
        waitType: WaitType.ryanmen,
      );
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: true,
          isMenzen: true,
          isPinfu: true,
        ),
        20,
      );
    });

    // TDDサイクル 2-3: 七対子 → 25符
    test('七対子 → 25符', () {
      final decomp = ChitoitsuDecomposition(
        pairs: [
          [_t(1, TileType.man), _t(1, TileType.man)],
          [_t(3, TileType.man), _t(3, TileType.man)],
          [_t(5, TileType.pin), _t(5, TileType.pin)],
          [_t(7, TileType.pin), _t(7, TileType.pin)],
          [_t(2, TileType.sou), _t(2, TileType.sou)],
          [_t(4, TileType.sou), _t(4, TileType.sou)],
          [_t(9, TileType.sou), _t(9, TileType.sou)],
        ],
      );
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: true,
          isPinfu: false,
        ),
        25,
      );
    });

    // TDDサイクル 2-4: 暗刻の符
    test('暗刻(中張牌) → 4符', () {
      final anko = _anko(5, TileType.man);
      expect(anko.fuValue, 4);
    });

    test('暗刻(么九牌) → 8符', () {
      final anko = _anko(1, TileType.pin);
      expect(anko.fuValue, 8);
    });

    test('暗刻(字牌) → 8符', () {
      final anko = Mentsu(
        type: MentsuType.anko,
        tiles: [_t(1, TileType.wind), _t(1, TileType.wind), _t(1, TileType.wind)],
      );
      expect(anko.fuValue, 8);
    });

    test('明刻(中張牌) → 2符', () {
      final minko = _minko(5, TileType.man);
      expect(minko.fuValue, 2);
    });

    test('明刻(么九牌) → 4符', () {
      final minko = _minko(9, TileType.sou);
      expect(minko.fuValue, 4);
    });

    // TDDサイクル 2-5: 待ち符・雀頭符・ツモ符
    test('嵌張待ち → 2符', () {
      expect(WaitType.kanchan.fuValue, 2);
    });

    test('辺張待ち → 2符', () {
      expect(WaitType.penchan.fuValue, 2);
    });

    test('単騎待ち → 2符', () {
      expect(WaitType.tanki.fuValue, 2);
    });

    test('両面待ち → 0符', () {
      expect(WaitType.ryanmen.fuValue, 0);
    });

    test('双碰待ち → 0符', () {
      expect(WaitType.shanpon.fuValue, 0);
    });

    test('役牌雀頭(三元牌) → 2符', () {
      final decomp = HandDecomposition(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [_t(5, TileType.dragon), _t(5, TileType.dragon)], // 白
        waitType: WaitType.ryanmen,
      );
      // 副底20 + 門前ロン10 + 雀頭2 = 32 → 切り上げ40
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: true,
          isPinfu: false,
        ),
        40,
      );
    });

    // 面子符を含む総合テスト
    test('暗刻含み手牌の符計算', () {
      // 222m 345p 678p 99s 567s ロン
      final decomp = HandDecomposition(
        mentsuList: [
          _anko(2, TileType.man),       // 暗刻(中張) = 4符
          _shuntsu(3, TileType.pin),     // 0
          _shuntsu(6, TileType.pin),     // 0
          _shuntsu(5, TileType.sou),     // 0
        ],
        jantai: [_t(9, TileType.sou), _t(9, TileType.sou)],
        waitType: WaitType.ryanmen,
      );
      // 副底20 + 門前ロン10 + 暗刻4 = 34 → 切り上げ40
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: true,
          isPinfu: false,
        ),
        40,
      );
    });

    test('ツモ符(ピンフ以外) → 2符加算', () {
      // 暗刻含みツモ
      final decomp = HandDecomposition(
        mentsuList: [
          _anko(2, TileType.man),       // 4
          _shuntsu(3, TileType.pin),
          _shuntsu(6, TileType.pin),
          _shuntsu(5, TileType.sou),
        ],
        jantai: [_t(9, TileType.sou), _t(9, TileType.sou)],
        waitType: WaitType.ryanmen,
      );
      // 副底20 + ツモ2 + 暗刻4 = 26 → 切り上げ30
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: true,
          isMenzen: true,
          isPinfu: false,
        ),
        30,
      );
    });

    test('門前ロン加符 → 10符', () {
      final decomp = HandDecomposition(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.sou),
        ],
        jantai: [_t(5, TileType.man), _t(5, TileType.man)],
        waitType: WaitType.kanchan, // 嵌張2符
      );
      // 副底20 + 門前ロン10 + 嵌張2 = 32 → 切り上げ40
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: true,
          isPinfu: false,
        ),
        40,
      );
    });

    // Mリーグルール: 連風牌の雀頭は2符（4符ではない）
    test('連風牌雀頭(東場の東家で東の雀頭) → 2符(4符ではない)', () {
      final east = _t(1, TileType.wind);
      final decomp = HandDecomposition(
        mentsuList: [
          _anko(5, TileType.man),       // 暗刻(中張) = 4符
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _shuntsu(2, TileType.man),
        ],
        jantai: [east, east],
        waitType: WaitType.kanchan,     // 嵌張 = 2符
      );
      // 2符の場合: 副底20 + 門前ロン10 + 暗刻4 + 嵌張2 + 雀頭2 = 38 → 40
      // 4符の場合: 副底20 + 門前ロン10 + 暗刻4 + 嵌張2 + 雀頭4 = 40 → 40
      // 切り上げ後は同じ...ツモにして境界をまたがせる
      // ツモ2符の場合: 20 + 暗刻4 + 嵌張2 + 雀頭2 + ツモ2 = 30 → 30
      // ツモ4符の場合: 20 + 暗刻4 + 嵌張2 + 雀頭4 + ツモ2 = 32 → 40
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: true,
          isMenzen: true,
          isPinfu: false,
          seatWind: east,
          roundWind: east,
        ),
        30, // 連風牌2符なら30符、4符なら40符になる
      );
    });

    test('食い仕掛けロン → 門前加符なし', () {
      final decomp = HandDecomposition(
        mentsuList: [
          _shuntsu(1, TileType.man),
          _shuntsu(4, TileType.pin),
          _shuntsu(7, TileType.sou),
          _minko(5, TileType.man), // 明刻(中張) = 2
        ],
        jantai: [_t(3, TileType.sou), _t(3, TileType.sou)],
        waitType: WaitType.ryanmen,
      );
      // 副底20 + 明刻2 = 22 → 切り上げ30
      expect(
        calculateFu(
          decomposition: decomp,
          isTsumo: false,
          isMenzen: false,
          isPinfu: false,
        ),
        30,
      );
    });
  });
}
