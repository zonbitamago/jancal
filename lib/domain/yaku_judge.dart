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

  // === 役満 ===

  // 国士無双
  if (decomposition.isKokushi) {
    results.add(const YakuResult('国士無双', 13));
    return results;
  }

  // 四暗刻
  if (_isSuanko(decomposition, hand.isTsumo)) {
    results.add(const YakuResult('四暗刻', 13));
    return results;
  }

  // 大三元
  if (!decomposition.isChitoitsu && _isDaisangen(decomposition)) {
    results.add(const YakuResult('大三元', 13));
    return results;
  }

  // === 通常役 ===

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

  // 役牌
  if (!decomposition.isChitoitsu) {
    _addYakuhai(results, decomposition, hand);
  }

  // 一盃口 / 二盃口
  if (hand.isMenzen && !decomposition.isChitoitsu) {
    final iiCount = _countIipeiko(decomposition);
    if (iiCount >= 2) {
      results.add(const YakuResult('二盃口', 3));
    } else if (iiCount == 1) {
      results.add(const YakuResult('一盃口', 1));
    }
  }

  // 三色同順
  if (!decomposition.isChitoitsu && _isSanshoku(decomposition)) {
    results.add(YakuResult('三色同順', hand.isMenzen ? 2 : 1));
  }

  // 三色同刻
  if (!decomposition.isChitoitsu && _isSanshokuDouko(decomposition)) {
    results.add(const YakuResult('三色同刻', 2));
  }

  // 一気通貫
  if (!decomposition.isChitoitsu && _isIttsu(decomposition)) {
    results.add(YakuResult('一気通貫', hand.isMenzen ? 2 : 1));
  }

  // トイトイ
  if (!decomposition.isChitoitsu && _isToitoi(decomposition)) {
    results.add(const YakuResult('トイトイ', 2));
  }

  // 三暗刻
  if (!decomposition.isChitoitsu && _isSananko(decomposition)) {
    results.add(const YakuResult('三暗刻', 2));
  }

  // 小三元
  if (!decomposition.isChitoitsu && _isShousangen(decomposition)) {
    results.add(const YakuResult('小三元', 2));
  }

  // チャンタ（混全帯么九）
  if (!decomposition.isChitoitsu && _isChanta(decomposition)) {
    results.add(YakuResult('チャンタ', hand.isMenzen ? 2 : 1));
  }

  // 純チャン（純全帯么九）
  if (!decomposition.isChitoitsu && _isJunchan(decomposition)) {
    results.add(YakuResult('純チャン', hand.isMenzen ? 3 : 2));
  }

  // 混老頭
  if (_isHonroutou(hand.tiles)) {
    results.add(const YakuResult('混老頭', 2));
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

// 役牌判定（三元牌・自風・場風の刻子/槓子ごとに1翻加算）
void _addYakuhai(List<YakuResult> results, HandDecomposition decomp, Hand hand) {
  for (final mentsu in decomp.mentsuList) {
    if (!mentsu.isKotsu && !mentsu.isKantsu) continue;
    final tile = mentsu.tiles[0];
    // 三元牌
    if (tile.type == TileType.dragon) {
      results.add(const YakuResult('役牌', 1));
    }
    // 自風
    if (tile.type == TileType.wind && hand.seatWind != null && tile == hand.seatWind) {
      results.add(const YakuResult('役牌', 1));
    }
    // 場風
    if (tile.type == TileType.wind && hand.roundWind != null && tile == hand.roundWind) {
      results.add(const YakuResult('役牌', 1));
    }
  }
}

// 一気通貫: 同じスートで123+456+789
bool _isIttsu(HandDecomposition decomp) {
  final shuntsuList = decomp.mentsuList.where((m) => m.isShuntsu).toList();
  if (shuntsuList.length < 3) return false;

  for (final suitType in [TileType.man, TileType.pin, TileType.sou]) {
    final suitShuntsu = shuntsuList.where((m) => m.tiles[0].type == suitType).toList();
    final starts = suitShuntsu.map((m) => m.tiles[0].number).toSet();
    if (starts.contains(1) && starts.contains(4) && starts.contains(7)) {
      return true;
    }
  }
  return false;
}

// チャンタ（混全帯么九）: 全面子+雀頭に么九牌or字牌を含み、字牌を含む
bool _isChanta(HandDecomposition decomp) {
  if (!_allMentsuContainTerminalOrHonor(decomp)) return false;
  if (!_jantaiContainsTerminalOrHonor(decomp)) return false;
  // 字牌を含む必要がある（純チャンと区別）
  final hasHonor = decomp.mentsuList.any((m) =>
      m.tiles.any((t) => t.type == TileType.wind || t.type == TileType.dragon)) ||
      decomp.jantai.any((t) => t.type == TileType.wind || t.type == TileType.dragon);
  // 順子を含む必要がある（混老頭と区別）
  final hasShuntsu = decomp.mentsuList.any((m) => m.isShuntsu);
  return hasHonor && hasShuntsu;
}

// 純チャン（純全帯么九）: 全面子+雀頭に1or9を含み、字牌を含まない
bool _isJunchan(HandDecomposition decomp) {
  if (!_allMentsuContainTerminal(decomp)) return false;
  if (!_jantaiContainsTerminal(decomp)) return false;
  // 字牌を含まない
  final hasHonor = decomp.mentsuList.any((m) =>
      m.tiles.any((t) => t.type == TileType.wind || t.type == TileType.dragon)) ||
      decomp.jantai.any((t) => t.type == TileType.wind || t.type == TileType.dragon);
  // 順子を含む必要がある（清老頭と区別）
  final hasShuntsu = decomp.mentsuList.any((m) => m.isShuntsu);
  return !hasHonor && hasShuntsu;
}

bool _allMentsuContainTerminalOrHonor(HandDecomposition decomp) {
  return decomp.mentsuList.every((m) => m.containsTerminalOrHonor);
}

bool _jantaiContainsTerminalOrHonor(HandDecomposition decomp) {
  if (decomp.jantai.isEmpty) return false;
  final t = decomp.jantai[0];
  return t.type == TileType.wind || t.type == TileType.dragon ||
      t.number == 1 || t.number == 9;
}

bool _allMentsuContainTerminal(HandDecomposition decomp) {
  return decomp.mentsuList.every((m) =>
      m.tiles.any((t) => (t.number == 1 || t.number == 9) &&
          t.type != TileType.wind && t.type != TileType.dragon));
}

bool _jantaiContainsTerminal(HandDecomposition decomp) {
  if (decomp.jantai.isEmpty) return false;
  final t = decomp.jantai[0];
  return (t.number == 1 || t.number == 9) &&
      t.type != TileType.wind && t.type != TileType.dragon;
}

// トイトイ: 全面子が刻子/槓子
bool _isToitoi(HandDecomposition decomp) {
  return decomp.mentsuList.every((m) => m.isKotsu || m.isKantsu);
}

// 三暗刻: 暗刻が3つ
bool _isSananko(HandDecomposition decomp) {
  final ankoCount = decomp.mentsuList.where((m) =>
      m.type == MentsuType.anko || m.type == MentsuType.ankan).length;
  return ankoCount == 3;
}

// 小三元: 三元牌のうち2つが刻子/槓子、1つが雀頭
bool _isShousangen(HandDecomposition decomp) {
  final dragonKotsu = decomp.mentsuList.where((m) =>
      (m.isKotsu || m.isKantsu) && m.tiles[0].type == TileType.dragon).length;
  final dragonJantai = decomp.jantai.isNotEmpty &&
      decomp.jantai[0].type == TileType.dragon;
  return dragonKotsu == 2 && dragonJantai;
}

// 混老頭: 全牌が么九牌+字牌のみ（中張牌なし）
bool _isHonroutou(List<Tile> tiles) {
  final allTerminalOrHonor = tiles.every((t) =>
      t.type == TileType.wind ||
      t.type == TileType.dragon ||
      t.number == 1 ||
      t.number == 9);
  final hasHonor = tiles.any((t) =>
      t.type == TileType.wind || t.type == TileType.dragon);
  final hasTerminal = tiles.any((t) =>
      (t.number == 1 || t.number == 9) &&
      t.type != TileType.wind && t.type != TileType.dragon);
  return allTerminalOrHonor && hasHonor && hasTerminal;
}

// 三色同刻: 3色で同じ数字の刻子/槓子
bool _isSanshokuDouko(HandDecomposition decomp) {
  final kotsuList = decomp.mentsuList.where((m) => m.isKotsu || m.isKantsu).toList();
  if (kotsuList.length < 3) return false;

  for (int i = 0; i < kotsuList.length; i++) {
    final tile = kotsuList[i].tiles[0];
    if (tile.type == TileType.wind || tile.type == TileType.dragon) continue;
    final types = {tile.type};
    for (int j = 0; j < kotsuList.length; j++) {
      if (i == j) continue;
      final other = kotsuList[j].tiles[0];
      if (other.number == tile.number && !types.contains(other.type) &&
          other.type != TileType.wind && other.type != TileType.dragon) {
        types.add(other.type);
      }
    }
    if (types.length >= 3) return true;
  }
  return false;
}

// 大三元: 三元牌3つの刻子/槓子
bool _isDaisangen(HandDecomposition decomp) {
  final dragonKotsu = decomp.mentsuList.where((m) =>
      (m.isKotsu || m.isKantsu) && m.tiles[0].type == TileType.dragon).length;
  return dragonKotsu == 3;
}

int _compareTiles(Tile a, Tile b) {
  final typeOrder = a.type.index - b.type.index;
  if (typeOrder != 0) return typeOrder;
  return a.number - b.number;
}
