import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileWidget } from '../components/TileWidget';
import { Badge } from '../components/Badge';
import { Tile, TileType } from '../utils/tileParser';
import { scoreHand, HandScoreResult } from '../domain/handScorer';

// 入力中の1枚（手牌内での役割フラグ付き）
interface HandTile {
  id: number;
  tile: Tile;
  isWin: boolean;
  isDora: boolean;
}

type TapMode = 'win' | 'dora' | 'del' | null;

const SUIT_TABS: { suit: 'm' | 'p' | 's' | 'z'; label: string; color: string }[] = [
  { suit: 'm', label: '萬子', color: '#E53E3E' },
  { suit: 'p', label: '筒子', color: '#2B6CB0' },
  { suit: 's', label: '索子', color: '#2F855A' },
  { suit: 'z', label: '字牌', color: '#718096' },
];

const HONOR_LABELS = ['東', '南', '西', '北', '白', '發', '中'];
const WIND_LABELS = ['東', '南', '西', '北'];

function makeTile(num: number, suit: 'm' | 'p' | 's' | 'z'): Tile {
  switch (suit) {
    case 'm': return new Tile(num, TileType.man, `${num}`);
    case 'p': return new Tile(num, TileType.pin, `${num}`);
    case 's': return new Tile(num, TileType.sou, `${num}`);
    case 'z':
      return num <= 4
        ? new Tile(num, TileType.wind, Tile.windChars[num])
        : new Tile(num, TileType.dragon, Tile.dragonChars[num - 4]);
  }
}

export const ScoreCalcScreen: React.FC = () => {
  const navigate = useNavigate();

  const [hand, setHand] = useState<HandTile[]>([]);
  const [curSuit, setCurSuit] = useState<'m' | 'p' | 's' | 'z'>('m');
  const [tapMode, setTapMode] = useState<TapMode>(null);
  const [nextId, setNextId] = useState(1);

  const [isParent, setIsParent] = useState(false);
  const [isTsumo, setIsTsumo] = useState(false);
  const [isRiichi, setIsRiichi] = useState(false);
  const [isIppatsu, setIsIppatsu] = useState(false);
  const [roundWind, setRoundWind] = useState(1); // 場風 1z東
  const [seatWind, setSeatWind] = useState(1);    // 自風 1z東

  const [result, setResult] = useState<HandScoreResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const addTile = (num: number) => {
    if (hand.length >= 14) return;
    setHand(h => [...h, { id: nextId, tile: makeTile(num, curSuit), isWin: false, isDora: false }]);
    setNextId(id => id + 1);
    setResult(null);
    setInputError(null);
  };

  const onTileTap = (id: number) => {
    setResult(null);
    setInputError(null);
    if (tapMode === 'del') {
      setHand(h => h.filter(x => x.id !== id));
    } else if (tapMode === 'win') {
      setHand(h => h.map(x => ({ ...x, isWin: x.id === id })));
    } else if (tapMode === 'dora') {
      setHand(h => h.map(x => x.id === id ? { ...x, isDora: !x.isDora } : x));
    }
  };

  const clearAll = () => {
    setHand([]);
    setResult(null);
    setInputError(null);
    setTapMode(null);
  };

  const winCount = hand.filter(h => h.isWin).length;
  const doraCount = hand.filter(h => h.isDora).length;
  const canCalc = hand.length === 14 && winCount === 1;

  const handleCalc = () => {
    if (hand.length !== 14) {
      setInputError('手牌はアガリ牌を含めて14枚にしてください（現在 ' + hand.length + '枚）');
      return;
    }
    if (winCount !== 1) {
      setInputError('「アガリ牌」を1枚だけ指定してください');
      return;
    }
    const winTile = hand.find(h => h.isWin)!.tile;
    const r = scoreHand({
      tiles: hand.map(h => h.tile),
      winTile,
      isTsumo,
      isParent,
      isRiichi,
      isIppatsu,
      dora: hand.filter(h => h.isDora).map(h => h.tile),
      roundWind: makeTile(roundWind, 'z'),
      seatWind: makeTile(seatWind, 'z'),
    });
    setInputError(null);
    setResult(r);
  };

  // 表示用にソートした手牌
  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => {
      const ta = a.tile, tb = b.tile;
      if (ta.type !== tb.type) return ta.type - tb.type;
      return ta.number - tb.number;
    });
  }, [hand]);

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: 'none', color: '#aaa',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>←</button>
        <span style={{ fontSize: 18, fontWeight: 700 }}>点数を計算する</span>
        <button onClick={clearAll} style={{
          background: 'transparent', border: 'none', color: '#888',
          fontSize: 13, cursor: 'pointer', padding: 4,
        }}>クリア</button>
      </div>
      <p style={{ color: '#8a94a6', fontSize: 12, lineHeight: 1.6, margin: '4px 0 16px' }}>
        牌をタップして手牌（門前）を入力し、アガリ牌・条件を指定して計算します。
      </p>

      {/* 手牌表示 */}
      <div style={{ color: '#9F7AEA', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        手牌 <span style={{ color: '#8a94a6', fontWeight: 400 }}>{hand.length}/14</span>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: 12, minHeight: 72,
        display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center',
      }}>
        {sortedHand.length === 0 && (
          <span style={{ color: '#4a5568', fontSize: 12 }}>下のキーパッドから牌を追加してください</span>
        )}
        {sortedHand.map(ht => (
          <div key={ht.id} onClick={() => onTileTap(ht.id)} style={{ cursor: tapMode ? 'pointer' : 'default' }}>
            <TileWidget tile={ht.tile} isWinTile={ht.isWin} isDora={ht.isDora} />
          </div>
        ))}
      </div>

      {/* タップモード */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {([
          { m: 'win' as TapMode, label: 'アガリ牌に指定', color: '#D4A017' },
          { m: 'dora' as TapMode, label: 'ドラに指定', color: '#E53E3E' },
          { m: 'del' as TapMode, label: '削除', color: '#718096' },
        ]).map(({ m, label, color }) => (
          <button key={m} onClick={() => setTapMode(tapMode === m ? null : m)} style={{
            background: tapMode === m ? `${color}33` : 'rgba(255,255,255,0.06)',
            border: `1px solid ${tapMode === m ? color : 'rgba(255,255,255,0.12)'}`,
            borderRadius: 999, color: tapMode === m ? color : '#aab3c2',
            fontSize: 12, fontWeight: 600, padding: '6px 12px', cursor: 'pointer',
          }}>
            {label}
          </button>
        ))}
      </div>
      {tapMode && (
        <p style={{ color: '#8a94a6', fontSize: 11, margin: '8px 2px 0' }}>
          手牌の牌をタップして「{tapMode === 'win' ? 'アガリ牌' : tapMode === 'dora' ? 'ドラ' : '削除'}」を設定
        </p>
      )}

      {/* キーパッド */}
      <div style={{ display: 'flex', gap: 6, margin: '16px 0 8px' }}>
        {SUIT_TABS.map(tab => (
          <button key={tab.suit} onClick={() => setCurSuit(tab.suit)} style={{
            flex: 1, background: curSuit === tab.suit ? tab.color : 'rgba(255,255,255,0.05)',
            border: `1px solid ${curSuit === tab.suit ? tab.color : 'rgba(255,255,255,0.1)'}`,
            color: curSuit === tab.suit ? '#fff' : '#8a94a6',
            fontWeight: 700, fontSize: 14, padding: '9px 0', borderRadius: 9, cursor: 'pointer',
          }}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: curSuit === 'z' ? 'repeat(7,1fr)' : 'repeat(9,1fr)',
        gap: 5,
      }}>
        {Array.from({ length: curSuit === 'z' ? 7 : 9 }, (_, i) => i + 1).map(num => (
          <button key={num} onClick={() => addTile(num)} disabled={hand.length >= 14} style={{
            aspectRatio: '3 / 4', background: '#F5F5F0', border: '1px solid #CCCCBB',
            borderRadius: 5, cursor: hand.length >= 14 ? 'not-allowed' : 'pointer',
            opacity: hand.length >= 14 ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
            {curSuit === 'z'
              ? <span style={{ fontSize: 16, fontWeight: 700, color: '#2D3748' }}>{HONOR_LABELS[num - 1]}</span>
              : <span style={{ fontSize: 15, fontWeight: 700, color: SUIT_TABS.find(s => s.suit === curSuit)!.color }}>{num}</span>}
          </button>
        ))}
      </div>

      {/* 条件 */}
      <div style={{ color: '#9F7AEA', fontSize: 13, fontWeight: 700, margin: '20px 0 8px' }}>アガリの条件</div>

      <Segmented
        label="親 / 子"
        options={[{ v: false, label: '子' }, { v: true, label: '親' }]}
        value={isParent}
        onChange={v => { setIsParent(v); setResult(null); }}
        activeBg="#ECC94B" activeColor="#2a1e00"
      />
      <Segmented
        label="アガリ方"
        options={[{ v: false, label: 'ロン' }, { v: true, label: 'ツモ' }]}
        value={isTsumo}
        onChange={v => { setIsTsumo(v); setResult(null); }}
        activeBg="#68D391" activeColor="#06210f"
      />

      {/* 状況役 */}
      <div style={{ margin: '4px 0 12px' }}>
        <label style={{ fontSize: 11, color: '#8a94a6', display: 'block', marginBottom: 6 }}>状況役</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ToggleChip label="リーチ" on={isRiichi} onClick={() => { setIsRiichi(v => !v); setResult(null); }} />
          <ToggleChip label="一発" on={isIppatsu} onClick={() => {
            setIsIppatsu(v => {
              const nv = !v;
              if (nv) setIsRiichi(true); // 一発はリーチ前提
              return nv;
            });
            setResult(null);
          }} />
        </div>
      </div>

      {/* 場風・自風 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <WindSelect label="場風" value={roundWind} onChange={v => { setRoundWind(v); setResult(null); }} />
        <WindSelect label="自風" value={seatWind} onChange={v => { setSeatWind(v); setResult(null); }} />
      </div>
      <p style={{ color: '#6b7688', fontSize: 11, lineHeight: 1.6, margin: '2px 2px 0' }}>
        ※ 場風・自風は役牌（風牌の刻子）とピンフ判定に使われます。
      </p>

      {/* 計算ボタン */}
      <button onClick={handleCalc} disabled={!canCalc} style={{
        width: '100%', marginTop: 18,
        background: canCalc ? 'linear-gradient(180deg,#9F7AEA,#7c5cd6)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', fontWeight: 700, fontSize: 16,
        padding: '15px 0', borderRadius: 12, cursor: canCalc ? 'pointer' : 'not-allowed',
        opacity: canCalc ? 1 : 0.5,
      }}>
        計算する
      </button>
      {!canCalc && (
        <p style={{ color: '#6b7688', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
          {hand.length !== 14
            ? `あと ${14 - hand.length} 枚（14枚で計算できます）`
            : 'アガリ牌を1枚指定してください'}
        </p>
      )}

      {/* 入力エラー */}
      {inputError && (
        <div style={{
          marginTop: 14, background: '#FC818122', border: '1px solid #FC818144',
          borderRadius: 10, padding: 12, color: '#FC8181', fontSize: 13, textAlign: 'center',
        }}>
          {inputError}
        </div>
      )}

      {/* 結果 */}
      {result && <ResultView result={result} isParent={isParent} isTsumo={isTsumo} doraCount={doraCount} />}

      <div style={{ height: 40 }} />
    </div>
  );
};

// ===== サブコンポーネント =====

const Segmented: React.FC<{
  label: string;
  options: { v: boolean; label: string }[];
  value: boolean;
  onChange: (v: boolean) => void;
  activeBg: string;
  activeColor: string;
}> = ({ label, options, value, onChange, activeBg, activeColor }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ fontSize: 11, color: '#8a94a6', display: 'block', marginBottom: 6 }}>{label}</label>
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map(opt => {
        const on = opt.v === value;
        return (
          <button key={opt.label} onClick={() => onChange(opt.v)} style={{
            flex: 1, border: 'none',
            background: on ? activeBg : 'transparent',
            color: on ? activeColor : '#8a94a6',
            fontWeight: 600, fontSize: 13, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
          }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const ToggleChip: React.FC<{ label: string; on: boolean; onClick: () => void }> = ({ label, on, onClick }) => (
  <button onClick={onClick} style={{
    background: on ? 'rgba(236,201,75,0.16)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${on ? 'rgba(236,201,75,0.4)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 999, color: on ? '#ECC94B' : '#aab3c2',
    fontSize: 13, fontWeight: 600, padding: '7px 16px', cursor: 'pointer',
  }}>
    {label}
  </button>
);

const WindSelect: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div>
    <label style={{ fontSize: 11, color: '#8a94a6', display: 'block', marginBottom: 6 }}>{label}</label>
    <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 3 }}>
      {WIND_LABELS.map((w, i) => {
        const on = value === i + 1;
        return (
          <button key={w} onClick={() => onChange(i + 1)} style={{
            flex: 1, border: 'none',
            background: on ? '#4299E1' : 'transparent',
            color: on ? '#08111f' : '#8a94a6',
            fontWeight: 700, fontSize: 14, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
          }}>
            {w}
          </button>
        );
      })}
    </div>
  </div>
);

const ResultView: React.FC<{
  result: HandScoreResult;
  isParent: boolean;
  isTsumo: boolean;
  doraCount: number;
}> = ({ result, isParent, isTsumo, doraCount }) => {
  if (!result.ok) {
    return (
      <div style={{
        marginTop: 16, background: '#FC818122', border: '1px solid #FC818144',
        borderRadius: 14, padding: 16, textAlign: 'center',
      }}>
        <div style={{ color: '#FC8181', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>計算できません</div>
        <div style={{ color: '#e0a0a0', fontSize: 13, lineHeight: 1.6 }}>{result.error}</div>
      </div>
    );
  }

  const scoreDisplay = result.scoreText.includes('all')
    ? result.scoreText.replace('all', 'オール')
    : `${result.scoreText}点`;

  return (
    <div style={{
      marginTop: 16,
      background: 'linear-gradient(180deg, rgba(104,211,145,0.10), rgba(255,255,255,0.03))',
      border: '1px solid rgba(104,211,145,0.3)', borderRadius: 14, padding: 18, textAlign: 'center',
    }}>
      <div style={{ fontFamily: "'Shippori Mincho', serif", fontSize: 40, fontWeight: 800, color: '#68D391', lineHeight: 1 }}>
        {scoreDisplay}
      </div>
      <div style={{ color: '#cbd3df', fontSize: 13, marginTop: 8 }}>
        {result.isYakuman
          ? `役満 ・ ${isParent ? '親' : '子'}の${isTsumo ? 'ツモ' : 'ロン'}`
          : `${result.fu}符 ${result.han}翻 ・ ${isParent ? '親' : '子'}の${isTsumo ? 'ツモ' : 'ロン'}`}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        {result.yaku.map((y, i) => (
          <Badge key={i} label={`${y.name} ${y.han}翻`} color="#805AD533" textColor="#B794F4" />
        ))}
        {doraCount > 0 && (
          <Badge label={`ドラ ${doraCount}翻`} color="#E53E3E33" textColor="#FC8181" />
        )}
      </div>
    </div>
  );
};
