import { Tile, TileType } from '../utils/tileParser';
import { Mentsu, MentsuType } from './models/mentsu';
import { HandDecomposition, ChitoitsuDecomposition, KokushiDecomposition } from './models/hand';
import { WaitType } from './models/waitType';

export function analyzeHand(tiles: Tile[], winTile: Tile): HandDecomposition[] {
  const results: HandDecomposition[] = [];

  // 標準形（4面子+1雀頭）
  findDecompositions(tiles, winTile, results);

  // 七対子
  const chitoitsu = checkChitoitsu(tiles);
  if (chitoitsu) results.push(chitoitsu);

  // 国士無双
  if (checkKokushi(tiles)) {
    results.push(new KokushiDecomposition());
  }

  return results;
}

export function analyzeHandWithOpen(
  closedTiles: Tile[], winTile: Tile, openMentsu: Mentsu[]
): HandDecomposition[] {
  const results: HandDecomposition[] = [];
  const neededMentsu = 4 - openMentsu.length;

  if (neededMentsu < 0) return results;

  const sorted = [...closedTiles].sort(compareTiles);
  const counts = new Map<string, number>();
  for (const t of sorted) {
    counts.set(t.key, (counts.get(t.key) ?? 0) + 1);
  }

  const triedJantai = new Set<string>();
  for (const tile of sorted) {
    if (triedJantai.has(tile.key)) continue;
    if ((counts.get(tile.key) ?? 0) < 2) continue;
    triedJantai.add(tile.key);

    const remaining = new Map(counts);
    remaining.set(tile.key, remaining.get(tile.key)! - 2);

    const closedMentsuList: Mentsu[] = [];
    const allZero = [...remaining.values()].every(v => v === 0);

    if (neededMentsu === 0
      ? allZero
      : extractMentsu(remaining, sorted, closedMentsuList)) {
      if (closedMentsuList.length === neededMentsu) {
        const allMentsu = [...openMentsu, ...closedMentsuList];
        const waitType = determineWaitType(allMentsu, [tile, tile], winTile);
        results.push(new HandDecomposition(allMentsu, [tile, tile], waitType));
      }
    }
  }

  return results;
}

function findDecompositions(
  tiles: Tile[], winTile: Tile, results: HandDecomposition[]
): void {
  const sorted = [...tiles].sort(compareTiles);

  const counts = new Map<string, number>();
  for (const t of sorted) {
    counts.set(t.key, (counts.get(t.key) ?? 0) + 1);
  }

  const triedJantai = new Set<string>();
  for (const tile of sorted) {
    if (triedJantai.has(tile.key)) continue;
    if ((counts.get(tile.key) ?? 0) < 2) continue;
    triedJantai.add(tile.key);

    const remaining = new Map(counts);
    remaining.set(tile.key, remaining.get(tile.key)! - 2);

    const mentsuList: Mentsu[] = [];
    if (extractMentsu(remaining, sorted, mentsuList)) {
      const waitType = determineWaitType(mentsuList, [tile, tile], winTile);
      results.push(new HandDecomposition([...mentsuList], [tile, tile], waitType));
    }
  }
}

function extractMentsu(
  counts: Map<string, number>, allTiles: Tile[], result: Mentsu[]
): boolean {
  if ([...counts.values()].every(v => v === 0)) return true;

  let firstKey: string | null = null;
  let firstTile: Tile | null = null;
  for (const t of allTiles) {
    if ((counts.get(t.key) ?? 0) > 0) {
      firstKey = t.key;
      firstTile = t;
      break;
    }
  }
  if (!firstKey || !firstTile) return false;

  // 刻子を試す
  if ((counts.get(firstKey) ?? 0) >= 3) {
    counts.set(firstKey, counts.get(firstKey)! - 3);
    result.push(new Mentsu(MentsuType.anko, [firstTile, firstTile, firstTile]));
    if (extractMentsu(counts, allTiles, result)) return true;
    result.pop();
    counts.set(firstKey, counts.get(firstKey)! + 3);
  }

  // 順子を試す（数牌のみ）
  if (firstTile.type === TileType.man ||
      firstTile.type === TileType.pin ||
      firstTile.type === TileType.sou) {
    if (firstTile.number <= 7) {
      const suffix = firstKey[firstKey.length - 1];
      const key2 = `${firstTile.number + 1}${suffix}`;
      const key3 = `${firstTile.number + 2}${suffix}`;

      if ((counts.get(key2) ?? 0) > 0 && (counts.get(key3) ?? 0) > 0) {
        counts.set(firstKey, counts.get(firstKey)! - 1);
        counts.set(key2, counts.get(key2)! - 1);
        counts.set(key3, counts.get(key3)! - 1);

        const tile2 = findTile(allTiles, key2)!;
        const tile3 = findTile(allTiles, key3)!;

        result.push(new Mentsu(MentsuType.shuntsu, [firstTile, tile2, tile3]));
        if (extractMentsu(counts, allTiles, result)) return true;
        result.pop();
        counts.set(firstKey, counts.get(firstKey)! + 1);
        counts.set(key2, counts.get(key2)! + 1);
        counts.set(key3, counts.get(key3)! + 1);
      }
    }
  }

  return false;
}

function findTile(tiles: Tile[], key: string): Tile | null {
  for (const t of tiles) {
    if (t.key === key) return t;
  }
  return null;
}

function determineWaitType(
  mentsuList: Mentsu[], jantai: Tile[], winTile: Tile
): WaitType {
  // 単騎待ち: アガリ牌が雀頭
  if (jantai.length > 0 && jantai[0].equals(winTile)) {
    return WaitType.tanki;
  }

  // アガリ牌を含む面子を探す
  for (const mentsu of mentsuList) {
    if (!mentsu.tiles.some(t => t.equals(winTile))) continue;

    // 刻子 → 双碰待ち
    if (mentsu.isKotsu) {
      return WaitType.shanpon;
    }

    // 順子の場合
    if (mentsu.isShuntsu) {
      const sorted = [...mentsu.tiles].sort(compareTiles);
      const pos = sorted.findIndex(t => t.equals(winTile));

      // 嵌張: 真ん中の牌がアガリ牌
      if (pos === 1) return WaitType.kanchan;

      // 辺張: 12X or X89
      if (sorted[0].number === 1 && pos === 2) return WaitType.penchan;
      if (sorted[2].number === 9 && pos === 0) return WaitType.penchan;

      // 両面
      return WaitType.ryanmen;
    }
  }

  return WaitType.ryanmen;
}

function checkChitoitsu(tiles: Tile[]): ChitoitsuDecomposition | null {
  if (tiles.length !== 14) return null;

  const counts = new Map<string, number>();
  for (const t of tiles) {
    counts.set(t.key, (counts.get(t.key) ?? 0) + 1);
  }

  if (counts.size !== 7) return null;
  if (![...counts.values()].every(v => v === 2)) return null;

  const pairs: Tile[][] = [];
  const seen = new Set<string>();
  for (const t of tiles) {
    if (!seen.has(t.key)) {
      seen.add(t.key);
      pairs.push([t, t]);
    }
  }

  return new ChitoitsuDecomposition(pairs);
}

function checkKokushi(tiles: Tile[]): boolean {
  if (tiles.length !== 14) return false;

  const required = new Set([
    '1m', '9m', '1p', '9p', '1s', '9s',
    '1z', '2z', '3z', '4z', '5z', '6z', '7z',
  ]);

  const tileKeys = new Set(tiles.map(t => t.key));
  return [...required].every(k => tileKeys.has(k));
}

export function compareTiles(a: Tile, b: Tile): number {
  const typeOrder = a.type - b.type;
  if (typeOrder !== 0) return typeOrder;
  return a.number - b.number;
}
