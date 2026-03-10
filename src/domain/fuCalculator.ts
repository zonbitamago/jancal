import { Tile, TileType } from '../utils/tileParser';
import { HandDecomposition } from './models/hand';
import { waitTypeFu } from './models/waitType';

export function calculateFu(params: {
  decomposition: HandDecomposition;
  isTsumo: boolean;
  isMenzen: boolean;
  isPinfu: boolean;
  seatWind?: Tile;
  roundWind?: Tile;
}): number {
  const { decomposition, isTsumo, isMenzen, isPinfu, seatWind, roundWind } = params;

  // 七対子 → 25符固定
  if (decomposition.isChitoitsu) return 25;

  // ピンフツモ → 20符固定
  if (isPinfu && isTsumo) return 20;

  // ピンフロン → 30符固定
  if (isPinfu && !isTsumo) return 30;

  // 副底
  let fu = 20;

  // 門前ロン加符
  if (!isTsumo && isMenzen) {
    fu += 10;
  }

  // 面子符
  for (const mentsu of decomposition.mentsuList) {
    fu += mentsu.fuValue;
  }

  // 待ち符
  fu += waitTypeFu(decomposition.waitType);

  // 雀頭符（役牌=2）
  fu += jantaiFu(decomposition.jantai, seatWind, roundWind);

  // ツモ符（ピンフ以外）
  if (isTsumo) {
    fu += 2;
  }

  // 10符単位切上
  return Math.ceil(fu / 10) * 10;
}

function jantaiFu(jantai: Tile[], seatWind?: Tile, roundWind?: Tile): number {
  if (jantai.length === 0) return 0;
  const tile = jantai[0];

  // 三元牌
  if (tile.type === TileType.dragon) return 2;

  // 場風・自風（Mリーグルール: 連風牌でも2符）
  if (tile.type === TileType.wind) {
    if (seatWind && tile.equals(seatWind)) return 2;
    if (roundWind && tile.equals(roundWind)) return 2;
    return 0;
  }

  return 0;
}
