import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateScoreTable, ScoreTableEntry } from '../domain/scoreTable';

type Player = 'ko' | 'oya';
type WinBy = 'ron' | 'tsumo';

const FU_ROWS = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
const HAN_COLS = [1, 2, 3, 4];
const LIMITS = ['満貫', '跳満', '倍満', '三倍満', '役満'];

function fmtTsumo(s: string | null): string | null {
  if (s == null) return null;
  return s.replace(' all', 'オール');
}

export const ScoreTableScreen: React.FC = () => {
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player>('ko');
  const [winBy, setWinBy] = useState<WinBy>('ron');
  const table = useMemo(() => generateScoreTable(), []);

  const lookup = useMemo(() => {
    const m = new Map<string, ScoreTableEntry>();
    for (const e of table) if (!e.label) m.set(`${e.fu}-${e.han}`, e);
    return m;
  }, [table]);
  const limitEntries = useMemo(() => table.filter(e => e.label), [table]);

  function cellFor(entry: ScoreTableEntry | undefined): { text: string; kiri: boolean; split: boolean } {
    if (!entry) return { text: '—', kiri: false, split: false };
    let val: string | null;
    if (winBy === 'ron') {
      const n = player === 'ko' ? entry.koRon : entry.oyaRon;
      val = n != null ? String(n) : null;
    } else {
      val = fmtTsumo(player === 'ko' ? entry.koTsumo : entry.oyaTsumo);
    }
    if (val == null) return { text: '—', kiri: false, split: false };
    return { text: val, kiri: !!entry.isKiriage, split: val.includes('/') };
  }

  return (
    <div className="screen-container">
      <div className="st-header">
        <button className="st-back" onClick={() => navigate('/')} aria-label="戻る">←</button>
        <h2 className="st-title">点数早見表</h2>
        <div style={{ width: 28 }} />
      </div>

      <div className="st-toggles">
        <div className={`st-seg ${player}`}>
          <button className={player === 'ko' ? 'on' : ''} onClick={() => setPlayer('ko')}>子</button>
          <button className={player === 'oya' ? 'on' : ''} onClick={() => setPlayer('oya')}>親</button>
        </div>
        <div className={`st-seg ${winBy}`}>
          <button className={winBy === 'ron' ? 'on' : ''} onClick={() => setWinBy('ron')}>ロン</button>
          <button className={winBy === 'tsumo' ? 'on' : ''} onClick={() => setWinBy('tsumo')}>ツモ</button>
        </div>
      </div>

      <div className="st-table">
        <div className="st-row st-head">
          <div className="st-cell">符＼翻</div>
          {HAN_COLS.map(h => <div key={h} className="st-cell">{h}翻</div>)}
        </div>
        {FU_ROWS.map(fu => {
          const note = fu === 20 ? 'ピンフツモ' : fu === 25 ? '七対子' : null;
          return (
            <div key={fu} className="st-row">
              <div className="st-cell st-fucell">
                <span>{fu}符</span>
                {note && <small>{note}</small>}
              </div>
              {HAN_COLS.map(h => {
                const c = cellFor(lookup.get(`${fu}-${h}`));
                const cls =
                  'st-cell' +
                  (c.kiri ? ' st-kiri' : '') +
                  (c.text === '—' ? ' st-na' : '') +
                  (c.split ? ' st-split' : '');
                return (
                  <div key={h} className={cls}>
                    {c.text}
                    {c.kiri && <sup>満</sup>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="st-legend">
        <span className="gold">■</span> 切り上げ満貫（30符4翻・60符3翻はMリーグルールで満貫）<br />
        20符はツモのみ（平和ツモ）・2翻以上、25符は七対子で2翻以上。
      </div>

      <div className="st-sectitle" style={{ color: '#FC8181' }}>満貫以上</div>
      <div className="st-table">
        <div className="st-row lim st-head">
          <div className="st-cell">役</div>
          <div className="st-cell">{player === 'ko' ? '子' : '親'}・{winBy === 'ron' ? 'ロン' : 'ツモ'}</div>
        </div>
        {LIMITS.map(label => {
          const e = limitEntries.find(x => x.label === label)!;
          let val: string;
          if (winBy === 'ron') val = String(player === 'ko' ? e.koRon : e.oyaRon);
          else val = fmtTsumo(player === 'ko' ? e.koTsumo : e.oyaTsumo)!;
          const split = val.includes('/');
          return (
            <div key={label} className="st-row lim">
              <div className="st-cell">{label}</div>
              <div className={'st-cell' + (split ? ' st-split' : '')}>{val}</div>
            </div>
          );
        })}
      </div>
      <div className="st-legend">数え役満なし ── 11翻以上は実役満でない限りすべて三倍満。</div>
    </div>
  );
};
