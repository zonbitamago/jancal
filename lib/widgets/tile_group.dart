import 'package:flutter/material.dart';
import '../utils/tile_parser.dart' as parser;
import 'tile_widget.dart';

class TileGroupWidget extends StatelessWidget {
  final String tilesNotation;
  final String winTile;
  final List<String> dora;

  const TileGroupWidget({
    super.key,
    required this.tilesNotation,
    required this.winTile,
    this.dora = const [],
  });

  @override
  Widget build(BuildContext context) {
    final groups = parser.parseTileGroups(tilesNotation);
    final winTiles = parser.parseTiles(winTile);
    final doraTiles = <String>{};
    for (final d in dora) {
      final tiles = parser.parseTiles(d);
      for (final t in tiles) {
        doraTiles.add(t.key);
      }
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          for (int gi = 0; gi < groups.length; gi++) ...[
            if (gi > 0) const SizedBox(width: 6),
            ...groups[gi].tiles.map((tile) {
              final isWin = winTiles.isNotEmpty && tile.key == winTiles.first.key;
              final isDora = doraTiles.contains(tile.key);
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 1),
                child: TileWidget(
                  tile: tile,
                  isWinTile: isWin,
                  isDora: isDora,
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}
