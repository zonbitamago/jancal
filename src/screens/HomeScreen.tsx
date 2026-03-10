import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizLevel } from '../models/problem';
import { getStats, getTotalStats, resetStats, LevelStats } from '../services/statsService';

const levelConfig = [
  { level: QuizLevel.beginner, label: '初級', sub: '符・翻から点数を計算', color: '#48BB78' },
  { level: QuizLevel.intermediate, label: '中級', sub: '手牌から点数を計算', color: '#ECC94B' },
  { level: QuizLevel.advanced, label: '上級', sub: '副露・複合役を含む', color: '#FC8181' },
];

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [total, setTotal] = useState<LevelStats>({ correct: 0, total: 0 });
  const [levelStats, setLevelStats] = useState<Record<string, LevelStats>>({});

  const refresh = useCallback(() => {
    setTotal(getTotalStats());
    const ls: Record<string, LevelStats> = {};
    for (const lc of levelConfig) {
      ls[lc.level] = getStats(lc.level);
    }
    setLevelStats(ls);
  }, []);

  useEffect(refresh, [refresh]);

  const pct = total.total > 0 ? Math.round((total.correct / total.total) * 100) : 0;
  const barColor = pct >= 80 ? '#48BB78' : pct >= 50 ? '#ECC94B' : '#FC8181';

  const handleReset = () => {
    if (window.confirm('統計データをリセットしますか？')) {
      resetStats();
      refresh();
    }
  };

  return (
    <div className="screen-container">
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px' }}>
          <span style={{ color: '#ECC94B' }}>雀</span>
          <span style={{ color: '#fff' }}>カル</span>
        </h1>
        <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>麻雀点数計算トレーニング</p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
        padding: 16, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#aaa', fontSize: 14 }}>成績</span>
          <span style={{ color: '#fff', fontSize: 14 }}>
            {total.correct}/{total.total} ({pct}%)
          </span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, height: 8 }}>
          <div style={{
            width: `${pct}%`, height: '100%', borderRadius: 4,
            background: barColor, transition: 'width 0.3s',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {levelConfig.map(lc => {
          const s = levelStats[lc.level] ?? { correct: 0, total: 0 };
          return (
            <button
              key={lc.level}
              onClick={() => navigate('/quiz', { state: { level: lc.level } })}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${lc.color}66`,
                borderRadius: 12, padding: '16px 20px',
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: lc.color, fontSize: 18, fontWeight: 700 }}>{lc.label}</div>
                <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>{lc.sub}</div>
              </div>
              <span style={{ color: '#888', fontSize: 13 }}>{s.correct}/{s.total}</span>
            </button>
          );
        })}
      </div>

      <button onClick={handleReset} style={{
        background: 'transparent', border: 'none', color: '#666',
        fontSize: 13, cursor: 'pointer', width: '100%', textAlign: 'center',
      }}>
        統計リセット
      </button>
    </div>
  );
};
