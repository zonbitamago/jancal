import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TileGroupWidget } from '../components/TileGroupWidget';
import { Badge } from '../components/Badge';
import { QuizLevel, Problem } from '../models/problem';
import { ProblemGenerator } from '../domain/problemGenerator';
import { FuQuizGenerator, FuQuizProblem } from '../domain/fuQuizGenerator';
import { parseTiles, parseTileGroups, TileGroup } from '../utils/tileParser';
import { recordAnswer, getStats } from '../services/statsService';
import { generateExplanation } from '../domain/scoreExplanation';

export const QuizScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const rawLevel = (location.state as Record<string, unknown> | null)?.level;
  const level: QuizLevel = Object.values(QuizLevel).includes(rawLevel as QuizLevel)
    ? (rawLevel as QuizLevel)
    : QuizLevel.beginner;

  const isFuMode = level === QuizLevel.fuPractice;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [fuProblem, setFuProblem] = useState<FuQuizProblem | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [generator] = useState(() => new ProblemGenerator());
  const [fuGenerator] = useState(() => new FuQuizGenerator());

  const nextProblem = useCallback(() => {
    if (isFuMode) {
      setFuProblem(fuGenerator.generate());
      setProblem(null);
    } else {
      setProblem(generator.generate(level));
      setFuProblem(null);
    }
    setSelected(null);
    setShowHint(false);
  }, [generator, fuGenerator, level, isFuMode]);

  useEffect(() => {
    const s = getStats(level);
    setCorrect(s.correct);
    setAnswered(s.total);
    nextProblem();
  }, [level, nextProblem]);

  if (isFuMode) {
    return <FuQuizView
      fuProblem={fuProblem}
      selected={selected}
      showHint={showHint}
      correct={correct}
      answered={answered}
      level={level}
      onChoice={(idx) => {
        if (selected !== null || !fuProblem) return;
        setSelected(idx);
        const ok = fuProblem.choices[idx] === fuProblem.correctFu;
        recordAnswer(level, ok);
        setCorrect(c => c + (ok ? 1 : 0));
        setAnswered(a => a + 1);
      }}
      onShowHint={() => setShowHint(true)}
      onNext={nextProblem}
      onBack={() => navigate('/')}
    />;
  }

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
          ヒントを見る
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
          {isCorrect && problem.hint && (
            <p style={{ color: '#aaa', fontSize: 12, margin: '8px 0 0' }}>{problem.hint}</p>
          )}
        </div>
      )}

      {/* 不正解時のステップバイステップ解説 */}
      {isAnswered && !isCorrect && (
        <ExplanationView
          yaku={problem.yaku}
          fu={problem.fu}
          han={problem.han}
          isParent={problem.isParent}
          isTsumo={problem.isTsumo}
          correctAnswer={problem.correctAnswer}
          doraCount={doraTiles.length}
        />
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

// ステップバイステップ解説コンポーネント
const ExplanationView: React.FC<{
  yaku: string[];
  fu: number;
  han: number;
  isParent: boolean;
  isTsumo: boolean;
  correctAnswer: string;
  doraCount: number;
}> = (props) => {
  const steps = generateExplanation(props);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.08)',
      padding: 12, marginBottom: 12,
    }}>
      <div style={{ color: '#B794F4', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
        解説
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, marginBottom: i < steps.length - 1 ? 10 : 0,
          alignItems: 'flex-start',
        }}>
          <div style={{
            minWidth: 22, height: 22, borderRadius: '50%',
            background: '#B794F433', color: '#B794F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>
            {i + 1}
          </div>
          <div>
            <div style={{ color: '#ddd', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
              {step.title}
            </div>
            <div style={{ color: '#aaa', fontSize: 12, lineHeight: 1.5 }}>
              {step.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 符計算モード専用ビュー
const FuQuizView: React.FC<{
  fuProblem: FuQuizProblem | null;
  selected: number | null;
  showHint: boolean;
  correct: number;
  answered: number;
  level: QuizLevel;
  onChoice: (idx: number) => void;
  onShowHint: () => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ fuProblem, selected, showHint, correct, answered, onChoice, onShowHint, onNext, onBack }) => {
  if (!fuProblem) return null;

  const isAnswered = selected !== null;
  const correctIdx = fuProblem.choices.indexOf(fuProblem.correctFu);
  const isCorrect = selected === correctIdx;

  const tileGroups = parseTileGroups(fuProblem.tiles);
  const winTile = parseTiles(fuProblem.winTile)[0];

  return (
    <div className="screen-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', color: '#aaa',
          fontSize: 20, cursor: 'pointer', padding: 4,
        }}>←</button>
        <Badge label="符計算" color="#9F7AEA33" textColor="#9F7AEA" />
        <span style={{ color: '#aaa', fontSize: 14 }}>{correct}/{answered}</span>
      </div>

      {/* 質問 */}
      <div style={{
        textAlign: 'center', marginBottom: 12,
        color: '#9F7AEA', fontSize: 15, fontWeight: 600,
      }}>
        この手牌は何符？
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
          openGroupIndices={fuProblem.openGroups}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#D4A017', fontSize: 12 }}>アガリ</span>
          <TileGroupWidget
            groups={[new TileGroup([winTile])]}
            winTile={winTile}
          />
          <span style={{ color: '#aaa', fontSize: 12 }}>
            {fuProblem.isTsumo ? 'ツモ' : 'ロン'}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {fuProblem.openGroups.length > 0 && <Badge label="副露" color="#FF980033" textColor="#FF9800" />}
        <Badge label={fuProblem.isMenzen ? '門前' : '鳴き'} />
        <Badge label={fuProblem.isTsumo ? 'ツモ' : 'ロン'} />
        {fuProblem.yaku.map((y, i) => (
          <Badge key={i} label={y} color="#805AD533" textColor="#B794F4" />
        ))}
      </div>

      {/* Hint */}
      {!showHint && !isAnswered && (
        <button onClick={onShowHint} style={{
          background: 'transparent', border: '1px solid #ECC94B66',
          borderRadius: 8, color: '#ECC94B', fontSize: 13,
          padding: '8px 16px', cursor: 'pointer', marginBottom: 12,
          width: '100%',
        }}>
          ヒントを見る
        </button>
      )}
      {showHint && !isAnswered && (
        <div style={{
          background: 'rgba(236,201,75,0.1)', borderRadius: 8,
          border: '1px solid #ECC94B44', padding: 12, marginBottom: 12,
          color: '#ECC94B', fontSize: 13,
        }}>
          {fuProblem.fuBreakdown}
        </div>
      )}

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {fuProblem.choices.map((choice, i) => {
          let bg = 'rgba(255,255,255,0.08)';
          let color = '#fff';
          if (isAnswered) {
            const isThisCorrect = choice === fuProblem.correctFu;
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
              onClick={() => onChoice(i)}
              style={{
                background: bg, border: 'none', borderRadius: 8,
                color, fontSize: 16, fontWeight: 600,
                padding: '14px 8px', cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.3s',
              }}
            >
              {choice}符
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
            {isCorrect ? '✓ 正解！' : `✗ 不正解（正解: ${fuProblem.correctFu}符）`}
          </span>
          <p style={{ color: '#aaa', fontSize: 12, margin: '8px 0 0' }}>
            {fuProblem.fuBreakdown}
          </p>
        </div>
      )}

      {/* Next */}
      {isAnswered && (
        <button onClick={onNext} style={{
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
