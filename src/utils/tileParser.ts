export enum TileType {
  man = 0,
  pin = 1,
  sou = 2,
  wind = 3,
  dragon = 4,
}

const WIND_CHARS = ['', '東', '南', '西', '北'];
const DRAGON_CHARS = ['', '白', '發', '中'];

export class Tile {
  readonly number: number;
  readonly type: TileType;
  readonly displayChar: string;

  constructor(number: number, type: TileType, displayChar: string) {
    this.number = number;
    this.type = type;
    this.displayChar = displayChar;
  }

  equals(other: Tile): boolean {
    return this.number === other.number && this.type === other.type;
  }

  get key(): string {
    return `${this.number}${this.typeSuffix}`;
  }

  private get typeSuffix(): string {
    switch (this.type) {
      case TileType.man: return 'm';
      case TileType.pin: return 'p';
      case TileType.sou: return 's';
      case TileType.wind:
      case TileType.dragon: return 'z';
      default: throw new Error(`Unknown tile type: ${this.type}`);
    }
  }

  get label(): string {
    switch (this.type) {
      case TileType.man: return `${this.number}萬`;
      case TileType.pin: return `${this.number}筒`;
      case TileType.sou: return `${this.number}索`;
      case TileType.wind: return WIND_CHARS[this.number];
      case TileType.dragon: return DRAGON_CHARS[this.number];
      default: throw new Error(`Unknown tile type: ${this.type}`);
    }
  }

  static windChars = WIND_CHARS;
  static dragonChars = DRAGON_CHARS;
}

export class TileGroup {
  readonly tiles: Tile[];
  readonly isPair: boolean;

  constructor(tiles: Tile[], isPair = false) {
    this.tiles = tiles;
    this.isPair = isPair;
  }
}

export function parseTileGroups(notation: string): TileGroup[] {
  const groups: TileGroup[] = [];
  const parts = notation.trim().split(/\s+/);

  for (const part of parts) {
    if (!part) continue;
    const tiles = parsePart(part);
    groups.push(new TileGroup(tiles, tiles.length === 2));
  }

  return groups;
}

export function parseTiles(notation: string): Tile[] {
  const tiles: Tile[] = [];
  const parts = notation.trim().split(/\s+/);
  for (const part of parts) {
    if (!part) continue;
    tiles.push(...parsePart(part));
  }
  return tiles;
}

function parsePart(part: string): Tile[] {
  const suffix = part[part.length - 1];
  const numbers = part.substring(0, part.length - 1);
  const tiles: Tile[] = [];

  for (const ch of numbers.split('')) {
    const num = parseInt(ch, 10);
    if (isNaN(num)) throw new Error(`Invalid tile number: '${ch}' in '${part}'`);
    tiles.push(createTile(num, suffix));
  }

  return tiles;
}

function createTile(number: number, suffix: string): Tile {
  switch (suffix) {
    case 'm':
      return new Tile(number, TileType.man, `${number}`);
    case 'p':
      return new Tile(number, TileType.pin, `${number}`);
    case 's':
      return new Tile(number, TileType.sou, `${number}`);
    case 'z':
      if (number <= 4) {
        return new Tile(number, TileType.wind, Tile.windChars[number]);
      } else {
        return new Tile(number, TileType.dragon, Tile.dragonChars[number - 4]);
      }
    default:
      throw new Error(`Unknown tile suffix: ${suffix}`);
  }
}
