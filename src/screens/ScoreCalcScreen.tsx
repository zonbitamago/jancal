import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TileWidget } from '../components/TileWidget';
import { Badge } from '../components/Badge';
import { Tile, TileType } from '../utils/tileParser';
import { scoreHand, HandScoreResult, OpenMeldType, OpenMeldInput } from '../domain/handScorer';

// 手の内の1枚（アガリ牌フラグ付き）。ドラは牌種単位で doraKeys 管理
interface HandTile {
  id: number;
  tile: Tile;
  isWin: boolean;
}

// 副露（鳴き）1組
interface Meld {
  id: number;
  type: OpenMeldType;
  tiles: Tile[];
}

type TapMode = 'win' | 'dora' | 'aka' | 'del' | null;
type Suit = 'm' | 'p' | 's' | 'z';

// 赤ドラになれるのは 5m / 5p / 5s のみ
const isAkaCandidate = (tile: Tile): boolean =>
  tile.number === 5 &&
  (tile.type === TileType.man || tile.type === TileType.pin || tile.type === TileType.sou);

const SUIT_TABS: { suit: Suit; label: string; color: string }[] = [
  { suit: 'm', label: '萬子', color: '#E53E3E' },
  { suit: 'p', label: '筒子', color: '#2B6CB0' },
  { suit: 's', label: '索子', color: '#2F855A' },
  { suit: 'z', label: '字牌', color: '#718096' },
];

const HONOR_LABELS = ['東', '南', '西', '北', '白', '發', '中'];
const WIND_LABELS = ['東', '南', '西', '北'];

const MELD_LABELS: Record<OpenMeldType, string> = {
  chi: 'チー', pon: 'ポン', minkan: '明槓', ankan: '暗槓',
};

function makeTile(num: number, suit: Suit): Tile {
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

const suitColor = (suit: Suit) => SUIT_TABS.find(s => s.suit === suit)!.color;

export const ScoreCalcScreen: React.FC = () => {
  const navigate = useNavigate();

  const [hand, setHand] = useState<HandTile[]>([]);
  const [melds, setMelds] = useState<Meld[]>([]);
  const [doraKeys, setDoraKeys] = useState<Set<string>>(new Set());
  // 赤ドラは牌インスタンス単位（手の内: "c{id}" / 副露: "m{meldId}-{index}"）
  const [akaSet, setAkaSet] = useState<Set<string>>(new Set());
  const [curSuit, setCurSuit] = useState<Suit>('m');
  const [tapMode, setTapMode] = useState<TapMode>(null);
  const [meldMode, setMeldMode] = useState<OpenMeldType | null>(null);
  const [nextId, setNextId] = useState(1);

  const [isParent, setIsParent] = useState(false);
  const [isTsumo, setIsTsumo] = useState(false);
  const [isRiichi, setIsRiichi] = useState(false);
  const [isIppatsu, setIsIppatsu] = useState(false);
  const [roundWind, setRoundWind] = useState(1); // 場風 1z東
  const [seatWind, setSeatWind] = useState(1);    // 自風 1z東

  const [result, setResult] = useState<HandScoreResult | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const neededConcealed = 14 - 3 * melds.length;
  // 暗槓のみ・副露なしなら門前
  const isMenzen = melds.length === 0 || melds.every(m => m.type === 'ankan');

  const reset = () => { setResult(null); setInputError(null); };
  const takeId = () => { const id = nextId; setNextId(v => v + 1); return id; };

  // キーパッドの牌タップ
  const onKeypad = (num: number) => {
    reset();
    if (meldMode) { createMeld(num); return; }
    if (hand.length >= neededConcealed) return;
    setHand(h => [...h, { id: takeId(), tile: makeTile(num, curSuit), isWin: false }]);
  };

  const createMeld = (num: number) => {
    let tiles: Tile[];
    if (meldMode === 'chi') {
      if (curSuit === 'z' || num > 7) {
        setInputError('チーは数牌の1〜7から始まる順子で指定してください');
        setMeldMode(null);
        return;
      }
      tiles = [makeTile(num, curSuit), makeTile(num + 1, curSuit), makeTile(num + 2, curSuit)];
    } else if (meldMode === 'pon') {
      tiles = [makeTile(num, curSuit), makeTile(num, curSuit), makeTile(num, curSuit)];
    } else {
      // minkan / ankan
      tiles = [makeTile(num, curSuit), makeTile(num, curSuit), makeTile(num, curSuit), makeTile(num, curSuit)];
    }
    const type = meldMode!;
    setMelds(ms => [...ms, { id: takeId(), type, tiles }]);
    setMeldMode(null);
    // 副露で門前が崩れる場合はリーチ・一発を解除
    if (type !== 'ankan') { setIsRiichi(false); setIsIppatsu(false); }
  };

  // 手の内の牌タップ
  const onHandTap = (ht: HandTile) => {
    reset();
    if (tapMode === 'del') {
      setHand(h => h.filter(x => x.id !== ht.id));
      setAkaSet(prev => { const n = new Set(prev); n.delete(`c${ht.id}`); return n; });
    } else if (tapMode === 'win') {
      setHand(h => h.map(x => ({ ...x, isWin: x.id === ht.id })));
    } else if (tapMode === 'dora') {
      toggleDora(ht.tile.key);
    } else if (tapMode === 'aka') {
      if (isAkaCandidate(ht.tile)) toggleAka(`c${ht.id}`);
    }
  };

  // ドラは牌種単位でトグル（手の内・副露を通じて同種はすべて連動）
  const toggleDora = (key: string) => {
    setDoraKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  // 赤ドラはインスタンス単位でトグル
  const toggleAka = (instanceId: string) => {
    setAkaSet(prev => {
      const next = new Set(prev);
      if (next.has(instanceId)) next.delete(instanceId); else next.add(instanceId);
      return next;
    });
  };

  const delMeld = (id: number) => {
    reset();
    setMelds(ms => ms.filter(m => m.id !== id));
    setAkaSet(prev => {
      const n = new Set(prev);
      for (const key of prev) if (key.startsWith(`m${id}-`)) n.delete(key);
      return n;
    });
  };

  const clearAll = () => {
    setHand([]); setMelds([]); setDoraKeys(new Set()); setAkaSet(new Set());
    setTapMode(null); setMeldMode(null);
    setIsRiichi(false); setIsIppatsu(false);
    reset();
  };

  const winCount = hand.filter(h => h.isWin).length;
  const canCalc = hand.length === neededConcealed && winCount === 1 && melds.length <= 4;

  const handleCalc = () => {
    if (hand.length !== neededConcealed) {
      setInputError(`手の内は${neededConcealed}枚にしてください（現在 ${hand.length}枚）`);
      return;
    }
    if (winCount !== 1) {
      setInputError('「アガリ牌」を1枚だけ指定してください');
      return;
    }
    const winTile = hand.find(h => h.isWin)!.tile;

    // ドラ牌種 → 代表牌1枚ずつ（handScorerが枚数を数える）
    const doraTiles: Tile[] = [...doraKeys].map(k => {
      const fromHand = hand.find(h => h.tile.key === k)?.tile;
      const fromMeld = melds.flatMap(m => m.tiles).find(t => t.key === k);
      return fromHand ?? fromMeld!;
    }).filter(Boolean);

    const openMelds: OpenMeldInput[] = melds.map(m => ({ type: m.type, tiles: m.tiles }));

    // 赤ドラ枚数（実在する牌インスタンスのみ数える）
    const akaCount =
      hand.filter(h => akaSet.has(`c${h.id}`)).length +
      melds.reduce((s, m) => s + m.tiles.filter((_, i) => akaSet.has(`m${m.id}-${i}`)).length, 0);

    const r = scoreHand({
      tiles: hand.map(h => h.tile),
      openMelds,
      winTile,
      isTsumo,
      isParent,
      isRiichi: isMenzen && isRiichi,
      isIppatsu: isMenzen && isIppatsu,
      dora: doraTiles,
      akaDora: akaCount,
      roundWind: makeTile(roundWind, 'z'),
      seatWind: makeTile(seatWind, 'z'),
    });
    setInputError(null);
    setResult(r);
  };

  const sortedHand = useMemo(() => {
    return [...hand].sort((a, b) => {
      if (a.tile.type !== b.tile.type) return a.tile.type - b.tile.type;
      return a.tile.number - b.tile.number;
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
        手の内をタップ入力し、副露・アガリ牌・条件を指定して計算します。
      </p>

      {/* 手の内 */}
      <div style={{ color: '#9F7AEA', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        手の内 <span style={{ color: '#8a94a6', fontWeight: 400 }}>{hand.length}/{neededConcealed}</span>
        {!isMenzen && <span style={{ color: '#FF9800', fontWeight: 600, marginLeft: 8, fontSize: 12 }}>鳴きあり</span>}
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
          <div key={ht.id} onClick={() => onHandTap(ht)} style={{ cursor: tapMode ? 'pointer' : 'default' }}>
            <TileWidget tile={ht.tile} isWinTile={ht.isWin} isDora={doraKeys.has(ht.tile.key)} isAka={akaSet.has(`c${ht.id}`)} />
          </div>
        ))}
      </div>

      {/* 副露表示 */}
      {melds.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {melds.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.25)',
              borderRadius: 10, padding: '6px 10px',
            }}>
              <span style={{ color: '#FF9800', fontSize: 12, fontWeight: 700, minWidth: 34 }}>{MELD_LABELS[m.type]}</span>
              <div style={{ display: 'flex', gap: 1 }}>
                {m.tiles.map((t, i) => {
                  const tappable = tapMode === 'dora' || (tapMode === 'aka' && isAkaCandidate(t));
                  return (
                    <div key={i}
                      onClick={() => {
                        if (tapMode === 'dora') { reset(); toggleDora(t.key); }
                        else if (tapMode === 'aka' && isAkaCandidate(t)) { reset(); toggleAka(`m${m.id}-${i}`); }
                      }}
                      style={{ transform: 'scale(0.82)', transformOrigin: 'left center', cursor: tappable ? 'pointer' : 'default' }}>
                      <TileWidget tile={t} isDora={doraKeys.has(t.key)} isAka={akaSet.has(`m${m.id}-${i}`)} />
                    </div>
                  );
                })}
              </div>
              <button onClick={() => delMeld(m.id)} style={{
                marginLeft: 'auto', background: 'transparent', border: 'none',
                color: '#FF9800', fontSize: 16, cursor: 'pointer', padding: '0 4px',
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* タップモード（手の内の牌を編集） */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {([
          { m: 'win' as TapMode, label: 'アガリ牌', color: '#D4A017' },
          { m: 'dora' as TapMode, label: 'ドラ', color: '#E53E3E' },
          { m: 'aka' as TapMode, label: '赤ドラ', color: '#D32F2F' },
          { m: 'del' as TapMode, label: '削除', color: '#718096' },
        ]).map(({ m, label, color }) => (
          <button key={m} onClick={() => { setMeldMode(null); setTapMode(tapMode === m ? null : m); }} style={{
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
          牌をタップして「{tapMode === 'win' ? 'アガリ牌' : tapMode === 'dora' ? 'ドラ' : tapMode === 'aka' ? '赤ドラ' : '削除'}」を設定
          {tapMode === 'dora' && '（同じ牌はすべてドラになります）'}
          {tapMode === 'aka' && '（赤5m/5p/5sのみ・1枚ずつ指定）'}
        </p>
      )}

      {/* 副露を追加 */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#8a94a6', fontSize: 11, alignSelf: 'center', marginRight: 2 }}>鳴きを追加:</span>
        {(['chi', 'pon', 'minkan', 'ankan'] as OpenMeldType[]).map(type => {
          const on = meldMode === type;
          const disabled = melds.length >= 4;
          return (
            <button key={type} disabled={disabled}
              onClick={() => { setTapMode(null); setMeldMode(on ? null : type); reset(); }}
              style={{
                background: on ? 'rgba(255,152,0,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${on ? '#FF9800' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 999, color: on ? '#FF9800' : (disabled ? '#4a5568' : '#aab3c2'),
                fontSize: 12, fontWeight: 600, padding: '6px 12px',
                cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
              }}>
              {MELD_LABELS[type]}
            </button>
          );
        })}
      </div>
      {meldMode && (
        <p style={{ color: '#FF9800', fontSize: 11, margin: '8px 2px 0' }}>
          下のキーパッドで{MELD_LABELS[meldMode]}の牌を選択
          {meldMode === 'chi' ? '（順子の一番小さい牌をタップ）' : 'をタップ'}
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
        {Array.from({ length: curSuit === 'z' ? 7 : 9 }, (_, i) => i + 1).map(num => {
          const keypadDisabled = !meldMode && hand.length >= neededConcealed;
          return (
            <button key={num} onClick={() => onKeypad(num)} disabled={keypadDisabled} style={{
              aspectRatio: '3 / 4', background: '#F5F5F0', border: '1px solid #CCCCBB',
              borderRadius: 5, cursor: keypadDisabled ? 'not-allowed' : 'pointer',
              opacity: keypadDisabled ? 0.4 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
              {curSuit === 'z'
                ? <span style={{ fontSize: 16, fontWeight: 700, color: '#2D3748' }}>{HONOR_LABELS[num - 1]}</span>
                : <span style={{ fontSize: 15, fontWeight: 700, color: suitColor(curSuit) }}>{num}</span>}
            </button>
          );
        })}
      </div>

      {/* 条件 */}
      <div style={{ color: '#9F7AEA', fontSize: 13, fontWeight: 700, margin: '20px 0 8px' }}>アガリの条件</div>

      <Segmented
        label="親 / 子"
        options={[{ v: false, label: '子' }, { v: true, label: '親' }]}
        value={isParent}
        onChange={v => { setIsParent(v); reset(); }}
        activeBg="#ECC94B" activeColor="#2a1e00"
      />
      <Segmented
        label="アガリ方"
        options={[{ v: false, label: 'ロン' }, { v: true, label: 'ツモ' }]}
        value={isTsumo}
        onChange={v => { setIsTsumo(v); reset(); }}
        activeBg="#68D391" activeColor="#06210f"
      />

      {/* 状況役（門前のみ） */}
      <div style={{ margin: '4px 0 12px' }}>
        <label style={{ fontSize: 11, color: '#8a94a6', display: 'block', marginBottom: 6 }}>
          状況役 {!isMenzen && <span style={{ color: '#6b7688' }}>（鳴きありのため無効）</span>}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ToggleChip label="リーチ" on={isMenzen && isRiichi} disabled={!isMenzen}
            onClick={() => { setIsRiichi(v => !v); if (isRiichi) setIsIppatsu(false); reset(); }} />
          <ToggleChip label="一発" on={isMenzen && isIppatsu} disabled={!isMenzen}
            onClick={() => { setIsIppatsu(v => { const nv = !v; if (nv) setIsRiichi(true); return nv; }); reset(); }} />
        </div>
      </div>

      {/* 場風・自風 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <WindSelect label="場風" value={roundWind} onChange={v => { setRoundWind(v); reset(); }} />
        <WindSelect label="自風" value={seatWind} onChange={v => { setSeatWind(v); reset(); }} />
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
          {hand.length !== neededConcealed
            ? `手の内をあと ${neededConcealed - hand.length} 枚（${neededConcealed}枚で計算できます）`
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
      {result && <ResultView result={result} isParent={isParent} isTsumo={isTsumo} />}

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

const ToggleChip: React.FC<{ label: string; on: boolean; disabled?: boolean; onClick: () => void }> = ({ label, on, disabled, onClick }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: on ? 'rgba(236,201,75,0.16)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${on ? 'rgba(236,201,75,0.4)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 999, color: on ? '#ECC94B' : (disabled ? '#4a5568' : '#aab3c2'),
    fontSize: 13, fontWeight: 600, padding: '7px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
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
}> = ({ result, isParent, isTsumo }) => {
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
        {!result.isMenzen && ' ・ 鳴き'}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
        {result.yaku.map((y, i) => (
          <Badge key={i} label={`${y.name} ${y.han}翻`} color="#805AD533" textColor="#B794F4" />
        ))}
        {result.doraCount > 0 && (
          <Badge label={`ドラ ${result.doraCount}翻`} color="#E53E3E33" textColor="#FC8181" />
        )}
        {result.akaDora > 0 && (
          <Badge label={`赤ドラ ${result.akaDora}翻`} color="#D32F2F33" textColor="#EF9A9A" />
        )}
      </div>
    </div>
  );
};
