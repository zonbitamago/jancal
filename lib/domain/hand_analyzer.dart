import '../utils/tile_parser.dart';
import 'models/mentsu.dart';
import 'models/hand.dart';
import 'models/wait_type.dart';

List<HandDecomposition> analyzeHand(List<Tile> tiles, Tile winTile) {
  final results = <HandDecomposition>[];

  // 標準形（4面子+1雀頭）
  _findDecompositions(tiles, winTile, results);

  // 七対子
  final chitoitsu = _checkChitoitsu(tiles);
  if (chitoitsu != null) results.add(chitoitsu);

  // 国士無双
  if (_checkKokushi(tiles)) {
    results.add(KokushiDecomposition());
  }

  return results;
}

void _findDecompositions(
    List<Tile> tiles, Tile winTile, List<HandDecomposition> results) {
  final sorted = List<Tile>.from(tiles)..sort(_compareTiles);

  // 牌カウントマップ
  final counts = <String, int>{};
  for (final t in sorted) {
    counts[t.key] = (counts[t.key] ?? 0) + 1;
  }

  // 雀頭候補を試す
  final triedJantai = <String>{};
  for (final tile in sorted) {
    if (triedJantai.contains(tile.key)) continue;
    if ((counts[tile.key] ?? 0) < 2) continue;
    triedJantai.add(tile.key);

    final remaining = Map<String, int>.from(counts);
    remaining[tile.key] = remaining[tile.key]! - 2;

    final mentsuList = <Mentsu>[];
    if (_extractMentsu(remaining, sorted, mentsuList)) {
      final waitType = _determineWaitType(
          mentsuList, [tile, tile], winTile);
      results.add(HandDecomposition(
        mentsuList: List.from(mentsuList),
        jantai: [tile, tile],
        waitType: waitType,
      ));
    }
  }
}

bool _extractMentsu(
    Map<String, int> counts, List<Tile> allTiles, List<Mentsu> result) {
  // 残り牌がなければ成功
  if (counts.values.every((v) => v == 0)) return true;

  // 最小の牌から処理
  String? firstKey;
  Tile? firstTile;
  for (final t in allTiles) {
    if ((counts[t.key] ?? 0) > 0) {
      firstKey = t.key;
      firstTile = t;
      break;
    }
  }
  if (firstKey == null || firstTile == null) return false;

  // 刻子を試す
  if ((counts[firstKey] ?? 0) >= 3) {
    counts[firstKey] = counts[firstKey]! - 3;
    result.add(Mentsu(
      type: MentsuType.anko,
      tiles: [firstTile, firstTile, firstTile],
    ));
    if (_extractMentsu(counts, allTiles, result)) return true;
    result.removeLast();
    counts[firstKey] = counts[firstKey]! + 3;
  }

  // 順子を試す（数牌のみ）
  if (firstTile.type == TileType.man ||
      firstTile.type == TileType.pin ||
      firstTile.type == TileType.sou) {
    if (firstTile.number <= 7) {
      final key2 = '${firstTile.number + 1}${firstTile.key[firstTile.key.length - 1]}';
      final key3 = '${firstTile.number + 2}${firstTile.key[firstTile.key.length - 1]}';

      if ((counts[key2] ?? 0) > 0 && (counts[key3] ?? 0) > 0) {
        counts[firstKey] = counts[firstKey]! - 1;
        counts[key2] = counts[key2]! - 1;
        counts[key3] = counts[key3]! - 1;

        final tile2 = _findTile(allTiles, key2)!;
        final tile3 = _findTile(allTiles, key3)!;

        result.add(Mentsu(
          type: MentsuType.shuntsu,
          tiles: [firstTile, tile2, tile3],
        ));
        if (_extractMentsu(counts, allTiles, result)) return true;
        result.removeLast();
        counts[firstKey] = counts[firstKey]! + 1;
        counts[key2] = counts[key2]! + 1;
        counts[key3] = counts[key3]! + 1;
      }
    }
  }

  return false;
}

Tile? _findTile(List<Tile> tiles, String key) {
  for (final t in tiles) {
    if (t.key == key) return t;
  }
  return null;
}

WaitType _determineWaitType(
    List<Mentsu> mentsuList, List<Tile> jantai, Tile winTile) {
  // 単騎待ち: アガリ牌が雀頭
  if (jantai.isNotEmpty && jantai[0] == winTile) {
    return WaitType.tanki;
  }

  // アガリ牌を含む面子を探す
  for (final mentsu in mentsuList) {
    if (!mentsu.tiles.contains(winTile)) continue;

    // 刻子 → 双碰待ち
    if (mentsu.isKotsu) {
      return WaitType.shanpon;
    }

    // 順子の場合
    if (mentsu.isShuntsu) {
      final sorted = List<Tile>.from(mentsu.tiles)..sort(_compareTiles);
      final pos = sorted.indexWhere((t) => t == winTile);

      // 嵌張: 真ん中の牌がアガリ牌
      if (pos == 1) return WaitType.kanchan;

      // 辺張: 12X or X89
      if (sorted[0].number == 1 && pos == 2) return WaitType.penchan;
      if (sorted[2].number == 9 && pos == 0) return WaitType.penchan;

      // 両面
      return WaitType.ryanmen;
    }
  }

  return WaitType.ryanmen;
}

ChitoitsuDecomposition? _checkChitoitsu(List<Tile> tiles) {
  if (tiles.length != 14) return null;

  final counts = <String, int>{};
  for (final t in tiles) {
    counts[t.key] = (counts[t.key] ?? 0) + 1;
  }

  if (counts.length != 7) return null;
  if (!counts.values.every((v) => v == 2)) return null;

  final pairs = <List<Tile>>[];
  final seen = <String>{};
  for (final t in tiles) {
    if (!seen.contains(t.key)) {
      seen.add(t.key);
      pairs.add([t, t]);
    }
  }

  return ChitoitsuDecomposition(pairs: pairs);
}

bool _checkKokushi(List<Tile> tiles) {
  if (tiles.length != 14) return false;

  final required = {
    '1m', '9m', '1p', '9p', '1s', '9s',
    '1z', '2z', '3z', '4z', '5z', '6z', '7z',
  };

  final tileKeys = tiles.map((t) => t.key).toSet();
  return required.every((k) => tileKeys.contains(k));
}

int _compareTiles(Tile a, Tile b) {
  final typeOrder = a.type.index - b.type.index;
  if (typeOrder != 0) return typeOrder;
  return a.number - b.number;
}
