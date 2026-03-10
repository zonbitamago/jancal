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
  let winTileMarked = false;

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
            {group.tiles.map((tile, ti) => {
              let isWin = false;
              if (!winTileMarked && winTile && tile.equals(winTile)) {
                isWin = true;
                winTileMarked = true;
              }
              return (
                <TileWidget
                  key={ti}
                  tile={tile}
                  isWinTile={isWin}
                  isDora={doraTiles.some(d => d.key === tile.key)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
