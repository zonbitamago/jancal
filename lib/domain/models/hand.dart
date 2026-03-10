import '../../utils/tile_parser.dart';
import 'mentsu.dart';
import 'wait_type.dart';

class HandDecomposition {
  final List<Mentsu> mentsuList;
  final List<Tile> jantai; // 雀頭 (2枚)
  final WaitType waitType;

  const HandDecomposition({
    required this.mentsuList,
    required this.jantai,
    required this.waitType,
  });

  bool get isChitoitsu => false;
  bool get isKokushi => false;
}

class ChitoitsuDecomposition extends HandDecomposition {
  final List<List<Tile>> pairs;

  ChitoitsuDecomposition({required this.pairs})
      : super(
          mentsuList: const [],
          jantai: const [],
          waitType: WaitType.tanki,
        );

  @override
  bool get isChitoitsu => true;
}

class KokushiDecomposition extends HandDecomposition {
  KokushiDecomposition()
      : super(
          mentsuList: const [],
          jantai: const [],
          waitType: WaitType.tanki,
        );

  @override
  bool get isKokushi => true;
}

class Hand {
  final List<Tile> tiles;
  final Tile winTile;
  final bool isTsumo;
  final bool isMenzen;
  final bool isParent;
  final bool isRiichi;
  final bool isIppatsu;
  final List<Tile> dora;
  final Tile? seatWind;
  final Tile? roundWind;
  final List<Mentsu> openMentsu;

  const Hand({
    required this.tiles,
    required this.winTile,
    this.isTsumo = false,
    this.isMenzen = true,
    this.isParent = false,
    this.isRiichi = false,
    this.isIppatsu = false,
    this.dora = const [],
    this.seatWind,
    this.roundWind,
    this.openMentsu = const [],
  });
}
