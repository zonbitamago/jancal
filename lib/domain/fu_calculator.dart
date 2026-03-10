import '../utils/tile_parser.dart';
import 'models/hand.dart';
import 'models/wait_type.dart';

int calculateFu({
  required HandDecomposition decomposition,
  required bool isTsumo,
  required bool isMenzen,
  required bool isPinfu,
  Tile? seatWind,
  Tile? roundWind,
}) {
  // 七対子 → 25符固定
  if (decomposition.isChitoitsu) return 25;

  // ピンフツモ → 20符固定
  if (isPinfu && isTsumo) return 20;

  // ピンフロン → 30符固定
  if (isPinfu && !isTsumo) return 30;

  // 副底
  int fu = isTsumo ? 20 : 20;

  // 門前ロン加符
  if (!isTsumo && isMenzen) {
    fu += 10;
  }

  // 面子符
  for (final mentsu in decomposition.mentsuList) {
    fu += mentsu.fuValue;
  }

  // 待ち符
  fu += decomposition.waitType.fuValue;

  // 雀頭符（役牌=2）
  fu += _jantaiFu(decomposition.jantai, seatWind, roundWind);

  // ツモ符（ピンフ以外）
  if (isTsumo) {
    fu += 2;
  }

  // 10符単位切上
  return ((fu + 9) ~/ 10) * 10;
}

int _jantaiFu(List<Tile> jantai, Tile? seatWind, Tile? roundWind) {
  if (jantai.isEmpty) return 0;
  final tile = jantai[0];

  // 三元牌（白=5, 發=6, 中=7）
  if (tile.type == TileType.dragon) return 2;

  // 場風・自風（Mリーグルール: 連風牌でも2符）
  if (tile.type == TileType.wind) {
    if (seatWind != null && tile == seatWind) return 2;
    if (roundWind != null && tile == roundWind) return 2;
    return 0;
  }

  return 0;
}
