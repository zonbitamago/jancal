enum TileType { man, pin, sou, wind, dragon }

class Tile {
  final int number;
  final TileType type;
  final String displayChar;

  const Tile({required this.number, required this.type, required this.displayChar});

  String get key => '$number$_typeSuffix';

  String get _typeSuffix {
    switch (type) {
      case TileType.man:
        return 'm';
      case TileType.pin:
        return 'p';
      case TileType.sou:
        return 's';
      case TileType.wind:
      case TileType.dragon:
        return 'z';
    }
  }

  static const _windChars = ['', '東', '南', '西', '北'];
  static const _dragonChars = ['', '白', '發', '中'];

  String get label {
    switch (type) {
      case TileType.man:
        return '$number萬';
      case TileType.pin:
        return '$number筒';
      case TileType.sou:
        return '$number索';
      case TileType.wind:
        return _windChars[number];
      case TileType.dragon:
        return _dragonChars[number];
    }
  }
}

class TileGroup {
  final List<Tile> tiles;
  final bool isPair;

  const TileGroup({required this.tiles, this.isPair = false});
}

List<TileGroup> parseTileGroups(String notation) {
  final groups = <TileGroup>[];
  final parts = notation.trim().split(RegExp(r'\s+'));

  for (final part in parts) {
    if (part.isEmpty) continue;
    final tiles = _parsePart(part);
    groups.add(TileGroup(tiles: tiles, isPair: tiles.length == 2));
  }

  return groups;
}

List<Tile> parseTiles(String notation) {
  final tiles = <Tile>[];
  final parts = notation.trim().split(RegExp(r'\s+'));
  for (final part in parts) {
    if (part.isEmpty) continue;
    tiles.addAll(_parsePart(part));
  }
  return tiles;
}

List<Tile> _parsePart(String part) {
  final suffix = part[part.length - 1];
  final numbers = part.substring(0, part.length - 1);
  final tiles = <Tile>[];

  for (final ch in numbers.split('')) {
    final num = int.parse(ch);
    tiles.add(_createTile(num, suffix));
  }

  return tiles;
}

Tile _createTile(int number, String suffix) {
  switch (suffix) {
    case 'm':
      return Tile(number: number, type: TileType.man, displayChar: '$number');
    case 'p':
      return Tile(number: number, type: TileType.pin, displayChar: '$number');
    case 's':
      return Tile(number: number, type: TileType.sou, displayChar: '$number');
    case 'z':
      if (number <= 4) {
        return Tile(
          number: number,
          type: TileType.wind,
          displayChar: Tile._windChars[number],
        );
      } else {
        return Tile(
          number: number,
          type: TileType.dragon,
          displayChar: Tile._dragonChars[number - 4],
        );
      }
    default:
      throw ArgumentError('Unknown tile suffix: $suffix');
  }
}
