import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TileGroupWidget } from '../components/TileGroupWidget';
import { Badge } from '../components/Badge';
import { QuizLevel, Problem } from '../models/problem';
import { ProblemGenerator } from '../domain/problemGenerator';
import { parseTiles, parseTileGroups, TileGroup } from '../utils/tileParser';
import { recordAnswer, getStats } from '../services/statsService';

export const QuizScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rawLevel = (location.state as Record<string, unknown> | null)?.level;
  const level: QuizLevel = Object.values(QuizLevel).includes(rawLevel as QuizLevel)
    ? (rawLevel as QuizLevel)
    : QuizLevel.beginner;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [generator] = useState(() => new ProblemGenerator());

  const nextProblem = useCallback(() => {
    const p = generator.generate(level);
    setProblem(p);
    setSelected(null);
    setShowHint(false);
  }, [generator, level]);

  useEffect(() => {
    const s = getStats(level);
    setCorrect(s.correct);
    setAnswered(s.total);
    nextProblem();
  }, [level, nextProblem]);

  if (!problem) return null;

  const isAnswered = selected !== null;
  const isCorrect = selected === problem.choices.indexOf(problem.correctAnswer);

  const handleChoice = (idx: number) => {
    if (isAnswered) return;
    setSelected(idx);
    const ok = problem.choices[idx] === problem.correctAnswer;
    recordAnswer(level, ok);
    setCorrect(c => c + (ok ? 1 : 0));
    setAnswered(a => a + 1);
  };

  const tileGroups = parseTileGroups(problem.tiles);
  const winTile = parseTiles(problem.winTile)[0];
  const doraTiles = problem.dora.flatMap(d => parseTiles(d));

  const levelLabel = level === QuizLevel.beginner ? '初級'
    : level === QuizLevel.intermediate ? '中級' : '上級';
  const levelColor = level === QuizLevel.beginner ? '#48BB78'
    : level === QuizLevel.intermediate ? '#ECC94B' : '#FC8181';

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => navigate('/')} style={{
          background: 'transparent', border: 'none', color: '#aaa',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>←</button>
        <Badge label={levelLabel} color={`${levelColor}33`} textColor={levelColor} />
        <span style={{ color: '#aaa', fontSize: 14 }}>{correct}/{answered}</span>
      </div>

      {/* Tiles */}
      <div style={{
        background: 'rgba(255,255,255,0.05)', borderRadius: 12,
        padding: 16, marginBottom: 16, display: 'flex',
        flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <TileGroupWidget
          groups={tileGroups}
          winTile={winTile}
          doraTiles={doraTiles}
          openGroupIndices={problem.openGroups}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#D4A017', fontSize: 12 }}>アガリ</span>
          <TileGroupWidget
            groups={[new TileGroup([winTile])]}
            winTile={winTile}
          />
          <span style={{ color: '#aaa', fontSize: 12 }}>
            {problem.isTsumo ? 'ツモ' : 'ロン'}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {problem.openGroups.length > 0 && <Badge label="副露" color="#FF980033" textColor="#FF9800" />}
        <Badge label={problem.isParent ? '親' : '子'} />
        <Badge label={problem.isTsumo ? 'ツモ' : 'ロン'} />
        {problem.fu > 0 && <Badge label={`${problem.fu}符`} />}
        <Badge label={`${problem.han}翻`} />
        {problem.yaku.map((y, i) => (
          <Badge key={i} label={y} color="#805AD533" textColor="#B794F4" />
        ))}
        {doraTiles.length > 0 && (
          <Badge label={`ドラ${doraTiles.length}`} color="#E53E3E33" textColor="#FC8181" />
        )}
      </div>

      {/* Hint */}
      {!showHint && !isAnswered && problem.hint && (
        <button onClick={() => setShowHint(true)} style={{
          background: 'transparent', border: '1px solid #ECC94B66',
          borderRadius: 8, color: '#ECC94B', fontSize: 13,
          padding: '8px 16px', cursor: 'pointer', marginBottom: 12,
          width: '100%',
        }}>
          💡 ヒントを見る
        </button>
      )}
      {showHint && problem.hint && !isAnswered && (
        <div style={{
          background: 'rgba(236,201,75,0.1)', borderRadius: 8,
          border: '1px solid #ECC94B44', padding: 12, marginBottom: 12,
          color: '#ECC94B', fontSize: 13,
        }}>
          {problem.hint}
        </div>
      )}

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {problem.choices.map((choice, i) => {
          let bg = 'rgba(255,255,255,0.08)';
          let color = '#fff';
          if (isAnswered) {
            const isThisCorrect = choice === problem.correctAnswer;
            if (isThisCorrect) {
              bg = '#48BB7833'; color = '#48BB78';
            } else if (i === selected) {
              bg = '#FC818133'; color = '#FC8181';
            } else {
              color = 'rgba(255,255,255,0.2)';
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleChoice(i)}
              style={{
                background: bg, border: 'none', borderRadius: 8,
                color, fontSize: 16, fontWeight: 600,
                padding: '14px 8px', cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {choice.includes('all') ? choice.replace('all', 'オール') : `${choice}点`}
            </button>
          );
        })}
      </div>

      {/* Result */}
      {isAnswered && (
        <div style={{
          background: isCorrect ? '#48BB7822' : '#FC818122',
          borderRadius: 8, padding: 12, marginBottom: 12,
          border: `1px solid ${isCorrect ? '#48BB7844' : '#FC818144'}`,
          textAlign: 'center',
        }}>
          <span style={{
            fontSize: 18, fontWeight: 700,
            color: isCorrect ? '#48BB78' : '#FC8181',
          }}>
            {isCorrect ? '✓ 正解！' : `✗ 不正解（正解: ${problem.correctAnswer.includes('all') ? problem.correctAnswer.replace('all', 'オール') : problem.correctAnswer + '点'}）`}
          </span>
          {problem.hint && (
            <p style={{ color: '#aaa', fontSize: 12, margin: '8px 0 0' }}>{problem.hint}</p>
          )}
        </div>
      )}

      {/* Next */}
      {isAnswered && (
        <button onClick={nextProblem} style={{
          background: '#4299E1', border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 16, fontWeight: 600,
          padding: '14px 0', cursor: 'pointer', width: '100%',
        }}>
          次の問題
        </button>
      )}
    </div>
  );
};
