import 'package:flutter/material.dart';
import '../utils/tile_parser.dart';
import 'tile_painter.dart';

class TileWidget extends StatelessWidget {
  final Tile tile;
  final bool isWinTile;
  final bool isDora;

  const TileWidget({
    super.key,
    required this.tile,
    this.isWinTile = false,
    this.isDora = false,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: const Size(TilePainter.tileWidth, TilePainter.tileHeight),
      painter: TilePainter(
        tile: tile,
        isWinTile: isWinTile,
        isDora: isDora,
      ),
    );
  }
}
