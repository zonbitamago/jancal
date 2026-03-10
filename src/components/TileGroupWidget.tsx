import React from 'react';
import { TileWidget } from './TileWidget';
import { TileGroup, Tile } from '../utils/tileParser';

interface TileGroupWidgetProps {
  groups: TileGroup[];
  winTile?: Tile;
  doraTiles?: Tile[];
  openGroupIndices?: number[];
}

export const TileGroupWidget: React.FC<TileGroupWidgetProps> = ({
  groups, winTile, doraTiles = [], openGroupIndices = [],
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'flex-end' }}>
      {groups.map((group, gi) => {
        const isOpen = openGroupIndices.includes(gi);
        return (
          <div key={gi} style={{
            display: 'flex', gap: 1,
            borderBottom: isOpen ? '2px solid #FF9800' : 'none',
            paddingBottom: isOpen ? 2 : 0,
          }}>
            {group.tiles.map((tile, ti) => (
              <TileWidget
                key={ti}
                tile={tile}
                isWinTile={winTile !== undefined && tile.key === winTile.key && tile.number === winTile.number && tile.type === winTile.type}
                isDora={doraTiles.some(d => d.key === tile.key)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};
