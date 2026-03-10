import { Tile, TileType } from '../../utils/tileParser';

export enum MentsuType {
  shuntsu = 'shuntsu', // 順子
  minko = 'minko',     // 明刻
  anko = 'anko',       // 暗刻
  minkan = 'minkan',   // 明槓
  ankan = 'ankan',     // 暗槓
}

export class Mentsu {
  readonly type: MentsuType;
  readonly tiles: Tile[];

  constructor(type: MentsuType, tiles: Tile[]) {
    this.type = type;
    this.tiles = tiles;
  }

  get isShuntsu(): boolean { return this.type === MentsuType.shuntsu; }
  get isKotsu(): boolean { return this.type === MentsuType.minko || this.type === MentsuType.anko; }
  get isKantsu(): boolean { return this.type === MentsuType.minkan || this.type === MentsuType.ankan; }
  get isOpen(): boolean { return this.type === MentsuType.minko || this.type === MentsuType.minkan; }
  get isClosed(): boolean { return !this.isOpen; }

  get containsTerminalOrHonor(): boolean {
    return this.tiles.some(t =>
      t.type === TileType.wind ||
      t.type === TileType.dragon ||
      t.number === 1 ||
      t.number === 9
    );
  }

  get fuValue(): number {
    if (this.isShuntsu) return 0;
    const isYaochu = this.containsTerminalOrHonor;
    switch (this.type) {
      case MentsuType.minko:  return isYaochu ? 4 : 2;
      case MentsuType.anko:   return isYaochu ? 8 : 4;
      case MentsuType.minkan: return isYaochu ? 16 : 8;
      case MentsuType.ankan:  return isYaochu ? 32 : 16;
      default: return 0;
    }
  }
}
