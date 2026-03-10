import { Tile, TileType } from '../utils/tileParser';
import { Mentsu, MentsuType } from './models/mentsu';
import { Hand, HandDecomposition } from './models/hand';
import { WaitType } from './models/waitType';

export class YakuResult {
  readonly name: string;
  readonly han: number;

  constructor(name: string, han: number) {
    this.name = name;
    this.han = han;
  }

  toString(): string { return `${this.name}(${this.han}翻)`; }
}

export function judgeYaku(hand: Hand, decomposition: HandDecomposition): YakuResult[] {
  const results: YakuResult[] = [];

  // === 役満 ===
  if (decomposition.isKokushi) {
    results.push(new YakuResult('国士無双', 13));
    return results;
  }

  if (isSuanko(decomposition, hand.isTsumo)) {
    results.push(new YakuResult('四暗刻', 13));
    return results;
  }

  if (!decomposition.isChitoitsu && isDaisangen(decomposition)) {
    results.push(new YakuResult('大三元', 13));
    return results;
  }

  // === 通常役 ===
  if (decomposition.isChitoitsu) {
    results.push(new YakuResult('七対子', 2));
  }

  if (hand.isRiichi) {
    results.push(new YakuResult('リーチ', 1));
  }

  if (hand.isIppatsu) {
    results.push(new YakuResult('一発', 1));
  }

  if (hand.isTsumo && hand.isMenzen) {
    results.push(new YakuResult('ツモ', 1));
  }

  if (!decomposition.isChitoitsu && isPinfu(hand, decomposition)) {
    results.push(new YakuResult('ピンフ', 1));
  }

  if (isTanyao(hand.tiles)) {
    results.push(new YakuResult('タンヤオ', 1));
  }

  if (!decomposition.isChitoitsu) {
    addYakuhai(results, decomposition, hand);
  }

  if (hand.isMenzen && !decomposition.isChitoitsu) {
    const iiCount = countIipeiko(decomposition);
    if (iiCount >= 2) {
      results.push(new YakuResult('二盃口', 3));
    } else if (iiCount === 1) {
      results.push(new YakuResult('一盃口', 1));
    }
  }

  if (!decomposition.isChitoitsu && isSanshoku(decomposition)) {
    results.push(new YakuResult('三色同順', hand.isMenzen ? 2 : 1));
  }

  if (!decomposition.isChitoitsu && isSanshokuDouko(decomposition)) {
    results.push(new YakuResult('三色同刻', 2));
  }

  if (!decomposition.isChitoitsu && isIttsu(decomposition)) {
    results.push(new YakuResult('一気通貫', hand.isMenzen ? 2 : 1));
  }

  if (!decomposition.isChitoitsu && isToitoi(decomposition)) {
    results.push(new YakuResult('トイトイ', 2));
  }

  if (!decomposition.isChitoitsu && isSananko(decomposition)) {
    results.push(new YakuResult('三暗刻', 2));
  }

  if (!decomposition.isChitoitsu && isShousangen(decomposition)) {
    results.push(new YakuResult('小三元', 2));
  }

  if (!decomposition.isChitoitsu && isChanta(decomposition)) {
    results.push(new YakuResult('チャンタ', hand.isMenzen ? 2 : 1));
  }

  if (!decomposition.isChitoitsu && isJunchan(decomposition)) {
    results.push(new YakuResult('純チャン', hand.isMenzen ? 3 : 2));
  }

  if (isHonroutou(hand.tiles)) {
    results.push(new YakuResult('混老頭', 2));
  }

  if (isHonitsu(hand.tiles)) {
    results.push(new YakuResult('混一色', hand.isMenzen ? 3 : 2));
  }

  if (isChinitsu(hand.tiles)) {
    results.push(new YakuResult('清一色', hand.isMenzen ? 6 : 5));
  }

  return results;
}

export function countDora(handTiles: Tile[], doraTiles: Tile[]): number {
  let count = 0;
  for (const dora of doraTiles) {
    for (const tile of handTiles) {
      if (tile.equals(dora)) count++;
    }
  }
  return count;
}

function isSuanko(decomp: HandDecomposition, isTsumo: boolean): boolean {
  if (decomp.isChitoitsu || decomp.isKokushi) return false;
  const ankoCount = decomp.mentsuList.filter(m => m.type === MentsuType.anko).length;
  if (isTsumo) return ankoCount === 4;
  return ankoCount === 4 && decomp.waitType !== WaitType.shanpon;
}

function isPinfu(hand: Hand, decomp: HandDecomposition): boolean {
  if (!hand.isMenzen) return false;
  if (!decomp.mentsuList.every(m => m.isShuntsu)) return false;
  if (decomp.waitType !== WaitType.ryanmen) return false;
  if (decomp.jantai.length === 0) return false;
  const jantaiTile = decomp.jantai[0];
  if (jantaiTile.type === TileType.dragon) return false;
  if (jantaiTile.type === TileType.wind) {
    if (hand.seatWind && jantaiTile.equals(hand.seatWind)) return false;
    if (hand.roundWind && jantaiTile.equals(hand.roundWind)) return false;
  }
  return true;
}

function isTanyao(tiles: Tile[]): boolean {
  return tiles.every(t =>
    t.type !== TileType.wind &&
    t.type !== TileType.dragon &&
    t.number >= 2 &&
    t.number <= 8
  );
}

function countIipeiko(decomp: HandDecomposition): number {
  const shuntsuList = decomp.mentsuList.filter(m => m.isShuntsu);
  let count = 0;
  const used = new Set<number>();
  for (let i = 0; i < shuntsuList.length; i++) {
    if (used.has(i)) continue;
    for (let j = i + 1; j < shuntsuList.length; j++) {
      if (used.has(j)) continue;
      if (sameMentsu(shuntsuList[i], shuntsuList[j])) {
        count++;
        used.add(i);
        used.add(j);
        break;
      }
    }
  }
  return count;
}

function sameMentsu(a: Mentsu, b: Mentsu): boolean {
  if (a.tiles.length !== b.tiles.length) return false;
  const aSorted = [...a.tiles].sort(compareTilesLocal);
  const bSorted = [...b.tiles].sort(compareTilesLocal);
  for (let i = 0; i < aSorted.length; i++) {
    if (!aSorted[i].equals(bSorted[i])) return false;
  }
  return true;
}

function isSanshoku(decomp: HandDecomposition): boolean {
  const shuntsuList = decomp.mentsuList.filter(m => m.isShuntsu);
  if (shuntsuList.length < 3) return false;

  for (let i = 0; i < shuntsuList.length; i++) {
    const base = shuntsuList[i].tiles[0];
    const types = new Set([base.type]);
    for (let j = 0; j < shuntsuList.length; j++) {
      if (i === j) continue;
      const other = shuntsuList[j].tiles[0];
      if (other.number === base.number && !types.has(other.type)) {
        types.add(other.type);
      }
    }
    if (types.size >= 3) return true;
  }
  return false;
}

function isHonitsu(tiles: Tile[]): boolean {
  const suitTypes = new Set(
    tiles.filter(t => t.type === TileType.man || t.type === TileType.pin || t.type === TileType.sou)
      .map(t => t.type)
  );
  const hasHonor = tiles.some(t => t.type === TileType.wind || t.type === TileType.dragon);
  return suitTypes.size === 1 && hasHonor;
}

function isChinitsu(tiles: Tile[]): boolean {
  const suitTypes = new Set(tiles.map(t => t.type));
  return suitTypes.size === 1 &&
    (tiles[0].type === TileType.man || tiles[0].type === TileType.pin || tiles[0].type === TileType.sou);
}

function addYakuhai(results: YakuResult[], decomp: HandDecomposition, hand: Hand): void {
  for (const mentsu of decomp.mentsuList) {
    if (!mentsu.isKotsu && !mentsu.isKantsu) continue;
    const tile = mentsu.tiles[0];
    if (tile.type === TileType.dragon) {
      results.push(new YakuResult('役牌', 1));
    }
    if (tile.type === TileType.wind && hand.seatWind && tile.equals(hand.seatWind)) {
      results.push(new YakuResult('役牌', 1));
    }
    if (tile.type === TileType.wind && hand.roundWind && tile.equals(hand.roundWind)) {
      results.push(new YakuResult('役牌', 1));
    }
  }
}

function isIttsu(decomp: HandDecomposition): boolean {
  const shuntsuList = decomp.mentsuList.filter(m => m.isShuntsu);
  if (shuntsuList.length < 3) return false;

  for (const suitType of [TileType.man, TileType.pin, TileType.sou]) {
    const suitShuntsu = shuntsuList.filter(m => m.tiles[0].type === suitType);
    const starts = new Set(suitShuntsu.map(m => m.tiles[0].number));
    if (starts.has(1) && starts.has(4) && starts.has(7)) return true;
  }
  return false;
}

function isChanta(decomp: HandDecomposition): boolean {
  if (!allMentsuContainTerminalOrHonor(decomp)) return false;
  if (!jantaiContainsTerminalOrHonor(decomp)) return false;
  const hasHonor = decomp.mentsuList.some(m =>
    m.tiles.some(t => t.type === TileType.wind || t.type === TileType.dragon)) ||
    decomp.jantai.some(t => t.type === TileType.wind || t.type === TileType.dragon);
  const hasShuntsu = decomp.mentsuList.some(m => m.isShuntsu);
  return hasHonor && hasShuntsu;
}

function isJunchan(decomp: HandDecomposition): boolean {
  if (!allMentsuContainTerminal(decomp)) return false;
  if (!jantaiContainsTerminal(decomp)) return false;
  const hasHonor = decomp.mentsuList.some(m =>
    m.tiles.some(t => t.type === TileType.wind || t.type === TileType.dragon)) ||
    decomp.jantai.some(t => t.type === TileType.wind || t.type === TileType.dragon);
  const hasShuntsu = decomp.mentsuList.some(m => m.isShuntsu);
  return !hasHonor && hasShuntsu;
}

function allMentsuContainTerminalOrHonor(decomp: HandDecomposition): boolean {
  return decomp.mentsuList.every(m => m.containsTerminalOrHonor);
}

function jantaiContainsTerminalOrHonor(decomp: HandDecomposition): boolean {
  if (decomp.jantai.length === 0) return false;
  const t = decomp.jantai[0];
  return t.type === TileType.wind || t.type === TileType.dragon ||
    t.number === 1 || t.number === 9;
}

function allMentsuContainTerminal(decomp: HandDecomposition): boolean {
  return decomp.mentsuList.every(m =>
    m.tiles.some(t => (t.number === 1 || t.number === 9) &&
      t.type !== TileType.wind && t.type !== TileType.dragon));
}

function jantaiContainsTerminal(decomp: HandDecomposition): boolean {
  if (decomp.jantai.length === 0) return false;
  const t = decomp.jantai[0];
  return (t.number === 1 || t.number === 9) &&
    t.type !== TileType.wind && t.type !== TileType.dragon;
}

function isToitoi(decomp: HandDecomposition): boolean {
  return decomp.mentsuList.every(m => m.isKotsu || m.isKantsu);
}

function isSananko(decomp: HandDecomposition): boolean {
  const ankoCount = decomp.mentsuList.filter(m =>
    m.type === MentsuType.anko || m.type === MentsuType.ankan).length;
  return ankoCount === 3;
}

function isShousangen(decomp: HandDecomposition): boolean {
  const dragonKotsu = decomp.mentsuList.filter(m =>
    (m.isKotsu || m.isKantsu) && m.tiles[0].type === TileType.dragon).length;
  const dragonJantai = decomp.jantai.length > 0 && decomp.jantai[0].type === TileType.dragon;
  return dragonKotsu === 2 && dragonJantai;
}

function isHonroutou(tiles: Tile[]): boolean {
  const allTerminalOrHonor = tiles.every(t =>
    t.type === TileType.wind ||
    t.type === TileType.dragon ||
    t.number === 1 ||
    t.number === 9);
  const hasHonor = tiles.some(t =>
    t.type === TileType.wind || t.type === TileType.dragon);
  const hasTerminal = tiles.some(t =>
    (t.number === 1 || t.number === 9) &&
    t.type !== TileType.wind && t.type !== TileType.dragon);
  return allTerminalOrHonor && hasHonor && hasTerminal;
}

function isSanshokuDouko(decomp: HandDecomposition): boolean {
  const kotsuList = decomp.mentsuList.filter(m => m.isKotsu || m.isKantsu);
  if (kotsuList.length < 3) return false;

  for (let i = 0; i < kotsuList.length; i++) {
    const tile = kotsuList[i].tiles[0];
    if (tile.type === TileType.wind || tile.type === TileType.dragon) continue;
    const types = new Set<TileType>([tile.type]);
    for (let j = 0; j < kotsuList.length; j++) {
      if (i === j) continue;
      const other = kotsuList[j].tiles[0];
      if (other.number === tile.number && !types.has(other.type) &&
        other.type !== TileType.wind && other.type !== TileType.dragon) {
        types.add(other.type);
      }
    }
    if (types.size >= 3) return true;
  }
  return false;
}

function isDaisangen(decomp: HandDecomposition): boolean {
  const dragonKotsu = decomp.mentsuList.filter(m =>
    (m.isKotsu || m.isKantsu) && m.tiles[0].type === TileType.dragon).length;
  return dragonKotsu === 3;
}

function compareTilesLocal(a: Tile, b: Tile): number {
  const typeOrder = a.type - b.type;
  if (typeOrder !== 0) return typeOrder;
  return a.number - b.number;
}
