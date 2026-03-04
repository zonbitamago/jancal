import '../utils/tile_parser.dart';
import 'models/mentsu.dart';
import 'models/hand.dart';
import 'models/wait_type.dart';

class YakuResult {
  final String name;
  final int han;

  const YakuResult(this.name, this.han);

  @override
  String toString() => '$name($han翻)';
}

List<YakuResult> judgeYaku({
  required Hand hand,
  required HandDecomposition decomposition,
}) {
  final results = <YakuResult>[];

  // 国士無双 (役満)
  if (decomposition.isKokushi) {
    results.add(const YakuResult('国士無双', 13));
    return results;
  }

  // 四暗刻 (役満)
  if (_isSuanko(decomposition, hand.isTsumo)) {
    results.add(const YakuResult('四暗刻', 13));
    return results;
  }

  // 七対子
  if (decomposition.isChitoitsu) {
    results.add(const YakuResult('七対子', 2));
  }

  // リーチ
  if (hand.isRiichi) {
    results.add(const YakuResult('リーチ', 1));
  }

  // 一発
  if (hand.isIppatsu) {
    results.add(const YakuResult('一発', 1));
  }

  // ツモ（門前ツモ）
  if (hand.isTsumo && hand.isMenzen) {
    results.add(const YakuResult('ツモ', 1));
  }

  // ピンフ
  if (!decomposition.isChitoitsu && _isPinfu(hand, decomposition)) {
    results.add(const YakuResult('ピンフ', 1));
  }

  // タンヤオ
  if (_isTanyao(hand.tiles)) {
    results.add(const YakuResult('タンヤオ', 1));
  }

  // 一盃口
  if (hand.isMenzen && !decomposition.isChitoitsu) {
    final iipeiko = _countIipeiko(decomposition);
    if (iipeiko >= 1) {
      results.add(const YakuResult('一盃口', 1));
    }
  }

  // 三色同順
  if (!decomposition.isChitoitsu && _isSanshoku(decomposition)) {
    results.add(YakuResult('三色同順', hand.isMenzen ? 2 : 1));
  }

  // 混一色
  if (_isHonitsu(hand.tiles)) {
    results.add(YakuResult('混一色', hand.isMenzen ? 3 : 2));
  }

  // 清一色
  if (_isChinitsu(hand.tiles)) {
    results.add(YakuResult('清一色', hand.isMenzen ? 6 : 5));
  }

  return results;
}

int countDora(List<Tile> handTiles, List<Tile> doraTiles) {
  int count = 0;
  for (final dora in doraTiles) {
    for (final tile in handTiles) {
      if (tile == dora) count++;
    }
  }
  return count;
}

bool _isSuanko(HandDecomposition decomp, bool isTsumo) {
  if (decomp.isChitoitsu || decomp.isKokushi) return false;
  final ankoCount =
      decomp.mentsuList.where((m) => m.type == MentsuType.anko).length;
  // ツモの場合: 4つの暗刻
  // ロンの場合: 双碰待ちだと最後の面子は明刻扱い
  if (isTsumo) return ankoCount == 4;
  return ankoCount == 4 && decomp.waitType != WaitType.shanpon;
}

bool _isPinfu(Hand hand, HandDecomposition decomp) {
  if (!hand.isMenzen) return false;
  // 全面子が順子
  if (!decomp.mentsuList.every((m) => m.isShuntsu)) return false;
  // 両面待ち
  if (decomp.waitType != WaitType.ryanmen) return false;
  // 雀頭が役牌でない
  if (decomp.jantai.isEmpty) return false;
  final jantaiTile = decomp.jantai[0];
  if (jantaiTile.type == TileType.dragon) return false;
  if (jantaiTile.type == TileType.wind) {
    if (hand.seatWind != null && jantaiTile == hand.seatWind) return false;
    if (hand.roundWind != null && jantaiTile == hand.roundWind) return false;
  }
  return true;
}

bool _isTanyao(List<Tile> tiles) {
  return tiles.every((t) =>
      t.type != TileType.wind &&
      t.type != TileType.dragon &&
      t.number >= 2 &&
      t.number <= 8);
}

int _countIipeiko(HandDecomposition decomp) {
  final shuntsuList =
      decomp.mentsuList.where((m) => m.isShuntsu).toList();
  int count = 0;
  final used = <int>{};
  for (int i = 0; i < shuntsuList.length; i++) {
    if (used.contains(i)) continue;
    for (int j = i + 1; j < shuntsuList.length; j++) {
      if (used.contains(j)) continue;
      if (_sameMentsu(shuntsuList[i], shuntsuList[j])) {
        count++;
        used.addAll([i, j]);
        break;
      }
    }
  }
  return count;
}

bool _sameMentsu(Mentsu a, Mentsu b) {
  if (a.tiles.length != b.tiles.length) return false;
  final aSorted = List<Tile>.from(a.tiles)..sort(_compareTiles);
  final bSorted = List<Tile>.from(b.tiles)..sort(_compareTiles);
  for (int i = 0; i < aSorted.length; i++) {
    if (aSorted[i] != bSorted[i]) return false;
  }
  return true;
}

bool _isSanshoku(HandDecomposition decomp) {
  final shuntsuList = decomp.mentsuList.where((m) => m.isShuntsu).toList();
  if (shuntsuList.length < 3) return false;

  for (int i = 0; i < shuntsuList.length; i++) {
    final base = shuntsuList[i].tiles[0];
    final types = {base.type};
    for (int j = 0; j < shuntsuList.length; j++) {
      if (i == j) continue;
      final other = shuntsuList[j].tiles[0];
      if (other.number == base.number && !types.contains(other.type)) {
        types.add(other.type);
      }
    }
    if (types.length >= 3) return true;
  }
  return false;
}

bool _isHonitsu(List<Tile> tiles) {
  final suitTypes = tiles
      .where(
          (t) => t.type == TileType.man || t.type == TileType.pin || t.type == TileType.sou)
      .map((t) => t.type)
      .toSet();
  final hasHonor =
      tiles.any((t) => t.type == TileType.wind || t.type == TileType.dragon);
  return suitTypes.length == 1 && hasHonor;
}

bool _isChinitsu(List<Tile> tiles) {
  final suitTypes = tiles.map((t) => t.type).toSet();
  return suitTypes.length == 1 &&
      (suitTypes.first == TileType.man ||
          suitTypes.first == TileType.pin ||
          suitTypes.first == TileType.sou);
}

int _compareTiles(Tile a, Tile b) {
  final typeOrder = a.type.index - b.type.index;
  if (typeOrder != 0) return typeOrder;
  return a.number - b.number;
}
