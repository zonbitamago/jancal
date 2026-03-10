import React from 'react';
import { Tile, TileType } from '../utils/tileParser';

interface TileWidgetProps {
  tile: Tile;
  isWinTile?: boolean;
  isDora?: boolean;
}

const suitColors: Record<string, string> = {
  [TileType.man]: '#E53E3E',
  [TileType.pin]: '#2B6CB0',
  [TileType.sou]: '#2F855A',
};

const suitChars: Record<string, string> = {
  [TileType.man]: '萬',
  [TileType.pin]: '筒',
  [TileType.sou]: '索',
};

const windChars = ['東', '南', '西', '北'];
const dragonDisplay: Record<number, { char: string; color: string }> = {
  5: { char: '白', color: '#9E9E9E' },
  6: { char: '發', color: '#2F855A' },
  7: { char: '中', color: '#E53E3E' },
};

export const TileWidget: React.FC<TileWidgetProps> = ({ tile, isWinTile, isDora }) => {
  const bg = isWinTile
    ? 'linear-gradient(180deg, #FFF8E1, #FFECB3)'
    : '#F5F5F0';
  const border = isDora
    ? '2.5px solid #E53E3E'
    : isWinTile
      ? '1.5px solid #D4A017'
      : '1px solid #CCCCBB';

  const isHonor = tile.type === TileType.wind || tile.type === TileType.dragon;

  return (
    <div style={{
      width: 40, height: 56, borderRadius: 4,
      background: bg, border, position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box',
    }}>
      {isHonor ? renderHonor(tile) : renderSuit(tile)}
      {isDora && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 14, height: 14, borderRadius: 7,
          background: '#E53E3E', color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>D</div>
      )}
    </div>
  );
};

function renderSuit(tile: Tile) {
  const color = suitColors[tile.type] ?? '#333';
  const suitChar = suitChars[tile.type] ?? '';
  return (
    <>
      <span style={{ fontSize: 18, fontWeight: 700, color, lineHeight: 1 }}>
        {tile.number}
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color, lineHeight: 1 }}>
        {suitChar}
      </span>
    </>
  );
}

function renderHonor(tile: Tile) {
  if (tile.type === TileType.wind) {
    const char = windChars[tile.number - 1] ?? '?';
    return <span style={{ fontSize: 20, fontWeight: 700, color: '#2D3748' }}>{char}</span>;
  }
  const info = dragonDisplay[tile.number];
  if (info) {
    return <span style={{ fontSize: 20, fontWeight: 700, color: info.color }}>{info.char}</span>;
  }
  return <span style={{ fontSize: 14, color: '#333' }}>{tile.displayChar}</span>;
}
