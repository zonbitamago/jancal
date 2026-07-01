import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateFu } from '../domain/fuCalculator';
import { calculateScore } from '../domain/scoreCalculator';
import { HandDecomposition, ChitoitsuDecomposition } from '../domain/models/hand';
import { Mentsu, MentsuType } from '../domain/models/mentsu';
import { WaitType, waitTypeFu } from '../domain/models/waitType';
import { Tile, TileType } from '../utils/tileParser';

const T = (n: number, t: TileType) => new Tile(n, t, '');

const MELD_OPTS: { key: string; label: string }[] = [
  { key: 'shuntsu', label: '順子' },
  { key: 'minko_c', label: '明刻(中張)' },
  { key: 'minko_y', label: '明刻(么九)' },
  { key: 'anko_c', label: '暗刻(中張)' },
  { key: 'anko_y', label: '暗刻(么九)' },
  { key: 'minkan_c', label: '明槓(中張)' },
  { key: 'minkan_y', label: '明槓(么九)' },
  { key: 'ankan_c', label: '暗槓(中張)' },
  { key: 'ankan_y', label: '暗槓(么九)' },
];

function meldToMentsu(key: string): Mentsu {
  if (key === 'shuntsu')
    return new Mentsu(MentsuType.shuntsu, [T(2, TileType.man), T(3, TileType.man), T(4, TileType.man)]);
  const yao = key.endsWith('_y');
  const n = yao ? 1 : 5;
  let type: MentsuType;
  if (key.startsWith('minko')) type = MentsuType.minko;
  else if (key.startsWith('anko')) type = MentsuType.anko;
  else if (key.startsWith('minkan')) type = MentsuType.minkan;
  else type = MentsuType.ankan;
  const count = type === MentsuType.minkan || type === MentsuType.ankan ? 4 : 3;
  return new Mentsu(type, Array.from({ length: count }, () => T(n, TileType.man)));
}

function meldLabel(m: Mentsu): string {
  return (m.isOpen ? '明' : '暗') + (m.isKantsu ? '槓' : '刻') + (m.containsTerminalOrHonor ? '(么九)' : '');
}

const WAIT_LABEL: Record<WaitType, string> = {
  [WaitType.ryanmen]: '両面',
  [WaitType.shanpon]: '双碰',
  [WaitType.kanchan]: '嵌張',
  [WaitType.penchan]: '辺張',
  [WaitType.tanki]: '単騎',
};

function fmtTsumo(s: string): string {
  return s.replace(' all', 'オール');
}

export const FuLearnScreen: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<'normal' | 'chiitoi'>('normal');
  const [isMenzen, setMenzen] = useState(true);
  const [isTsumo, setTsumo] = useState(false);
  const [wait, setWait] = useState<WaitType>(WaitType.ryanmen);
  const [yakuhaiPair, setYakuhai] = useState(false);
  const [melds, setMelds] = useState<string[]>(['shuntsu', 'shuntsu', 'shuntsu', 'shuntsu']);
  const [exHan, setExHan] = useState(3);

  function compute() {
    if (form === 'chiitoi') {
      const fu = calculateFu({ decomposition: new ChitoitsuDecomposition([]), isTsumo, isMenzen: true, isPinfu: false });
      return { fu, parts: [['七対子（固定）', 25]] as [string, number][], note: '' };
    }
    const mentsuList = melds.map(meldToMentsu);
    const jantai = yakuhaiPair
      ? [T(1, TileType.dragon), T(1, TileType.dragon)]
      : [T(5, TileType.pin), T(5, TileType.pin)];
    const decomposition = new HandDecomposition(mentsuList, jantai, wait);
    const pinfu = isMenzen && mentsuList.every(m => m.isShuntsu) && wait === WaitType.ryanmen && !yakuhaiPair;
    const fu = calculateFu({ decomposition, isTsumo, isMenzen, isPinfu: pinfu });

    if (pinfu) {
      const parts: [string, number][] = [['副底', 20]];
      if (isMenzen && !isTsumo) parts.push(['門前ロン', 10]);
      return { fu, parts, note: isTsumo ? '平和ツモ → 20符固定' : '平和ロン → 30符固定' };
    }
    const parts: [string, number][] = [['副底', 20]];
    if (!isTsumo && isMenzen) parts.push(['門前ロン', 10]);
    mentsuList.forEach(m => {
      if (m.fuValue > 0) parts.push([meldLabel(m), m.fuValue]);
    });
    const wfu = waitTypeFu(wait);
    if (wfu > 0) parts.push([WAIT_LABEL[wait], wfu]);
    if (yakuhaiPair) parts.push(['役牌の雀頭', 2]);
    if (isTsumo) parts.push(['ツモ', 2]);
    const raw = parts.reduce((a, p) => a + p[1], 0);
    const rounded = Math.ceil(raw / 10) * 10;
    if (rounded !== raw) parts.push(['切り上げ', rounded - raw]);
    const note = !isMenzen && rounded === 20 ? '喰い平和形 → 30符固定' : '';
    return { fu, parts, note };
  }

  const { fu, parts, note } = compute();
  const cr = calculateScore({ fu, han: exHan, isParent: false, isTsumo: false });
  const ct = calculateScore({ fu, han: exHan, isParent: false, isTsumo: true });
  const pr = calculateScore({ fu, han: exHan, isParent: true, isTsumo: false });
  const pt = calculateScore({ fu, han: exHan, isParent: true, isTsumo: true });

  return (
    <div className="screen-container">
      <div className="st-header">
        <button className="st-back" onClick={() => navigate('/')} aria-label="戻る">←</button>
        <h2 className="st-title">符を学ぶ</h2>
        <div style={{ width: 28 }} />
      </div>

      <p className="fl-lead">
        符は <b>20符（副底）を土台</b> に要素ごとに加算し、最後に <b>10の位へ切り上げ</b>。
        例外は平和ツモ（20符）と七対子（25符）です。
      </p>

      <div className="fl-refgrid">
        <div className="fl-refbox"><h4>副底</h4><div className="v">20<small>符</small></div><p>すべての和了に付く土台。</p></div>
        <div className="fl-refbox"><h4>門前ロン</h4><div className="v">+10<small>符</small></div><p>門前で出和了したとき。ツモには付かない。</p></div>
        <div className="fl-refbox"><h4>ツモ</h4><div className="v">+2<small>符</small></div><p>自摸和了。平和ツモには付けない。</p></div>
        <div className="fl-refbox"><h4>待ち</h4><div className="v">+2<small>符</small></div><p>嵌張・辺張・単騎。両面と双碰は0符。</p></div>
        <div className="fl-refbox"><h4>役牌の雀頭</h4><div className="v">+2<small>符</small></div><p>三元牌・場風・自風。連風牌も+2符。</p></div>
        <div className="fl-refbox"><h4>面子の符</h4><div className="v">0〜32<small>符</small></div><p>順子は0符。刻子・槓子は下表。</p></div>
      </div>

      <table className="fl-mini">
        <tbody>
          <tr><td>順子</td><td>0</td></tr>
          <tr><td>明刻（中張牌 2〜8）</td><td>2</td></tr>
          <tr><td>明刻（么九牌 1・9・字）</td><td>4</td></tr>
          <tr><td>暗刻（中張牌）</td><td>4</td></tr>
          <tr><td>暗刻（么九牌）</td><td>8</td></tr>
          <tr><td>明槓（中張 / 么九）</td><td>8 / 16</td></tr>
          <tr><td>暗槓（中張 / 么九）</td><td>16 / 32</td></tr>
        </tbody>
      </table>
      <table className="fl-mini">
        <tbody>
          <tr><td>平和ツモ</td><td>20（固定）</td></tr>
          <tr><td>平和ロン（門前）</td><td>30</td></tr>
          <tr><td>七対子</td><td>25（固定）</td></tr>
          <tr><td>喰い平和形（鳴いて20符の形）</td><td>30（固定）</td></tr>
        </tbody>
      </table>

      <div className="fl-sectitle">符計算機</div>
      <div className="fl-field">
        <div className="st-seg" style={{ maxWidth: 220 }}>
          <button className={form === 'normal' ? 'on' : ''} onClick={() => setForm('normal')}>通常手</button>
          <button className={form === 'chiitoi' ? 'on' : ''} onClick={() => setForm('chiitoi')}>七対子</button>
        </div>
      </div>

      {form === 'normal' && (
        <>
          <div className="fl-grid2">
            <div className="fl-field">
              <label>門前 / 鳴き</label>
              <div className="st-seg ko">
                <button className={isMenzen ? 'on' : ''} onClick={() => setMenzen(true)}>門前</button>
                <button className={!isMenzen ? 'on' : ''} onClick={() => setMenzen(false)}>鳴き</button>
              </div>
            </div>
            <div className="fl-field">
              <label>ロン / ツモ</label>
              <div className="st-seg tsumo">
                <button className={!isTsumo ? 'on' : ''} onClick={() => setTsumo(false)}>ロン</button>
                <button className={isTsumo ? 'on' : ''} onClick={() => setTsumo(true)}>ツモ</button>
              </div>
            </div>
            <div className="fl-field">
              <label>待ちの形</label>
              <select className="fl-select" value={wait} onChange={e => setWait(e.target.value as WaitType)}>
                <option value={WaitType.ryanmen}>両面（0符）</option>
                <option value={WaitType.shanpon}>双碰（0符）</option>
                <option value={WaitType.kanchan}>嵌張（+2符）</option>
                <option value={WaitType.penchan}>辺張（+2符）</option>
                <option value={WaitType.tanki}>単騎（+2符）</option>
              </select>
            </div>
            <div className="fl-field">
              <label>雀頭</label>
              <select className="fl-select" value={yakuhaiPair ? '1' : '0'} onChange={e => setYakuhai(e.target.value === '1')}>
                <option value="0">役牌でない（0符）</option>
                <option value="1">役牌の雀頭（+2符）</option>
              </select>
            </div>
          </div>
          <label style={{ fontSize: 11, color: '#8a94a6', display: 'block', margin: '12px 0 5px' }}>面子（4組）</label>
          <div className="fl-melds">
            {melds.map((mk, i) => (
              <select key={i} className="fl-select" value={mk} onChange={e => {
                const next = [...melds]; next[i] = e.target.value; setMelds(next);
              }}>
                {MELD_OPTS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            ))}
          </div>
        </>
      )}

      <div className="fl-out">
        <div className="fl-fu">{fu}<small>符</small></div>
        <div className="fl-parts">
          {parts.map((p, i) => (
            <span key={i} className="fl-part">{p[0]}{p[1] ? <> <b>+{p[1]}</b></> : null}</span>
          ))}
        </div>
        <div className="fl-note">{note}</div>
        <div className="fl-ex">
          <span>例：</span>
          <select className="fl-select" style={{ width: 'auto' }} value={exHan} onChange={e => setExHan(Number(e.target.value))}>
            {[1, 2, 3, 4, 5, 6].map(h => <option key={h} value={h}>{h}翻</option>)}
          </select>
          <span className="exval">
            子 {cr.ronPoints}（ツモ {fmtTsumo(ct.toAnswerString())}） ／ 親 {pr.ronPoints}（ツモ {fmtTsumo(pt.toAnswerString())}）
          </span>
        </div>
      </div>
      <p className="fl-lead" style={{ marginTop: 14 }}>
        双碰待ちは、ロンで完成した刻子が <b>明刻</b> 扱いになる点に注意（ツモなら暗刻）。
      </p>
    </div>
  );
};
