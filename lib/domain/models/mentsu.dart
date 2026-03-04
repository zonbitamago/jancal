import '../../utils/tile_parser.dart';

enum MentsuType {
  shuntsu, // 順子
  minko,   // 明刻
  anko,    // 暗刻
  minkan,  // 明槓
  ankan,   // 暗槓
}

class Mentsu {
  final MentsuType type;
  final List<Tile> tiles;

  const Mentsu({required this.type, required this.tiles});

  bool get isShuntsu => type == MentsuType.shuntsu;
  bool get isKotsu => type == MentsuType.minko || type == MentsuType.anko;
  bool get isKantsu => type == MentsuType.minkan || type == MentsuType.ankan;
  bool get isOpen => type == MentsuType.minko || type == MentsuType.minkan;
  bool get isClosed => !isOpen;

  bool get containsTerminalOrHonor {
    return tiles.any((t) =>
        t.type == TileType.wind ||
        t.type == TileType.dragon ||
        t.number == 1 ||
        t.number == 9);
  }

  int get fuValue {
    if (isShuntsu) return 0;
    final isYaochu = containsTerminalOrHonor;
    switch (type) {
      case MentsuType.minko:
        return isYaochu ? 4 : 2;
      case MentsuType.anko:
        return isYaochu ? 8 : 4;
      case MentsuType.minkan:
        return isYaochu ? 16 : 8;
      case MentsuType.ankan:
        return isYaochu ? 32 : 16;
      default:
        return 0;
    }
  }
}
