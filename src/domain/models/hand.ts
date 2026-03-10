import { Tile } from '../../utils/tileParser';
import { Mentsu } from './mentsu';
import { WaitType } from './waitType';

export class HandDecomposition {
  readonly mentsuList: Mentsu[];
  readonly jantai: Tile[]; // 雀頭 (2枚)
  readonly waitType: WaitType;

  constructor(mentsuList: Mentsu[], jantai: Tile[], waitType: WaitType) {
    this.mentsuList = mentsuList;
    this.jantai = jantai;
    this.waitType = waitType;
  }

  get isChitoitsu(): boolean { return false; }
  get isKokushi(): boolean { return false; }
}

export class ChitoitsuDecomposition extends HandDecomposition {
  readonly pairs: Tile[][];

  constructor(pairs: Tile[][]) {
    super([], [], WaitType.tanki);
    this.pairs = pairs;
  }

  override get isChitoitsu(): boolean { return true; }
}

export class KokushiDecomposition extends HandDecomposition {
  constructor() {
    super([], [], WaitType.tanki);
  }

  override get isKokushi(): boolean { return true; }
}

export interface Hand {
  tiles: Tile[];
  winTile: Tile;
  isTsumo: boolean;
  isMenzen: boolean;
  isParent: boolean;
  isRiichi: boolean;
  isIppatsu: boolean;
  dora: Tile[];
  seatWind?: Tile;
  roundWind?: Tile;
  openMentsu: Mentsu[];
}

export function createHand(params: {
  tiles: Tile[];
  winTile: Tile;
  isTsumo?: boolean;
  isMenzen?: boolean;
  isParent?: boolean;
  isRiichi?: boolean;
  isIppatsu?: boolean;
  dora?: Tile[];
  seatWind?: Tile;
  roundWind?: Tile;
  openMentsu?: Mentsu[];
}): Hand {
  return {
    tiles: params.tiles,
    winTile: params.winTile,
    isTsumo: params.isTsumo ?? false,
    isMenzen: params.isMenzen ?? true,
    isParent: params.isParent ?? false,
    isRiichi: params.isRiichi ?? false,
    isIppatsu: params.isIppatsu ?? false,
    dora: params.dora ?? [],
    seatWind: params.seatWind,
    roundWind: params.roundWind,
    openMentsu: params.openMentsu ?? [],
  };
}
