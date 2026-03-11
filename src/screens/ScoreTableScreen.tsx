import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateScoreTable, ScoreTableEntry } from '../domain/scoreTable';

type PlayerType = 'ko' | 'oya';

export const ScoreTableScreen: React.FC = () => {
  const navigate = useNavigate();
  const [playerType, setPlayerType] = useState<PlayerType>('ko');
  const table = useMemo(() => generateScoreTable(), []);

  // 通常エントリ（符×翻）と特殊エントリ（満貫以上）を分離
  const normalEntries = table.filter(e => !e.label);
  const specialEntries = table.filter(e => e.label);

  // 翻ごとにグループ化
  const hanValues = [...new Set(normalEntries.map(e => e.han))].sort((a, b) => a - b);

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: 'none', color: '#aaa',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>←</button>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>点数早見表</h2>
        <div style={{ width: 28 }} />
      </div>

      {/* 親/子切り替え */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setPlayerType('ko')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: playerType === 'ko' ? '#4299E133' : 'rgba(255,255,255,0.05)',
            color: playerType === 'ko' ? '#4299E1' : '#888',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          子
        </button>
        <button
          onClick={() => setPlayerType('oya')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
            background: playerType === 'oya' ? '#ECC94B33' : 'rgba(255,255,255,0.05)',
            color: playerType === 'oya' ? '#ECC94B' : '#888',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          親
        </button>
      </div>

      {/* 通常テーブル */}
      {hanValues.map(han => {
        const entries = normalEntries.filter(e => e.han === han);
        return (
          <div key={han} style={{ marginBottom: 16 }}>
            <h3 style={{ color: '#B794F4', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              {han}翻
            </h3>
            <div style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: 8,
              overflow: 'hidden',
            }}>
              {/* ヘッダー */}
              <div style={{
                display: 'grid', gridTemplateColumns: '50px 1fr 1fr',
                background: 'rgba(255,255,255,0.08)', padding: '8px 12px',
              }}>
                <span style={{ color: '#888', fontSize: 12 }}>符</span>
                <span style={{ color: '#888', fontSize: 12, textAlign: 'right' }}>ロン</span>
                <span style={{ color: '#888', fontSize: 12, textAlign: 'right' }}>ツモ</span>
              </div>
              {/* 行 */}
              {entries.map(entry => (
                <div key={`${entry.fu}-${entry.han}`} style={{
                  display: 'grid', gridTemplateColumns: '50px 1fr 1fr',
                  padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <span style={{ color: '#aaa', fontSize: 13 }}>{entry.fu}</span>
                  <span style={{ color: '#fff', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                    {formatPoints(playerType === 'ko' ? entry.koRon : entry.oyaRon)}
                  </span>
                  <span style={{ color: '#fff', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                    {playerType === 'ko' ? entry.koTsumo : entry.oyaTsumo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* 満貫以上 */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: '#FC8181', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
          満貫以上
        </h3>
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '80px 1fr 1fr',
            background: 'rgba(255,255,255,0.08)', padding: '8px 12px',
          }}>
            <span style={{ color: '#888', fontSize: 12 }}></span>
            <span style={{ color: '#888', fontSize: 12, textAlign: 'right' }}>ロン</span>
            <span style={{ color: '#888', fontSize: 12, textAlign: 'right' }}>ツモ</span>
          </div>
          {specialEntries.map(entry => (
            <div key={entry.label} style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 1fr',
              padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <span style={{ color: '#ECC94B', fontSize: 13, fontWeight: 600 }}>{entry.label}</span>
              <span style={{ color: '#fff', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                {formatPoints(playerType === 'ko' ? entry.koRon : entry.oyaRon)}
              </span>
              <span style={{ color: '#fff', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                {playerType === 'ko' ? entry.koTsumo : entry.oyaTsumo}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function formatPoints(points: number): string {
  return points.toLocaleString();
}
