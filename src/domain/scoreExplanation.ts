export interface ExplanationStep {
  title: string;
  detail: string;
}

export interface ExplanationParams {
  yaku: string[];
  fu: number;
  han: number;
  isParent: boolean;
  isTsumo: boolean;
  correctAnswer: string;
  doraCount: number;
}

export function generateExplanation(params: ExplanationParams): ExplanationStep[] {
  const { yaku, fu, han, isParent, isTsumo, correctAnswer, doraCount } = params;
  const steps: ExplanationStep[] = [];

  // ステップ1: 役の確認
  const yakuWithoutDora = yaku.filter(y => !y.startsWith('ドラ'));
  steps.push({
    title: '役の確認',
    detail: yakuWithoutDora.join('・'),
  });

  // ステップ2: 符の計算
  const isChitoitsu = yaku.includes('七対子');
  const isPinfu = yaku.includes('ピンフ');

  if (isChitoitsu) {
    steps.push({
      title: '符の計算',
      detail: '七対子は25符固定です。',
    });
  } else if (isPinfu && isTsumo) {
    steps.push({
      title: '符の計算',
      detail: 'ピンフツモは20符固定です。',
    });
  } else if (isPinfu && !isTsumo) {
    steps.push({
      title: '符の計算',
      detail: 'ピンフロンは30符固定です。',
    });
  } else {
    steps.push({
      title: '符の計算',
      detail: `${fu}符（副底20符 + 各種加符を合計し、10符単位に切り上げ）`,
    });
  }

  // ステップ3: 翻数の計算
  const yakuHanDetails: string[] = [];
  for (const y of yakuWithoutDora) {
    yakuHanDetails.push(y);
  }
  if (doraCount > 0) {
    yakuHanDetails.push(`ドラ${doraCount}`);
  }
  steps.push({
    title: '翻数の計算',
    detail: `${yakuHanDetails.join(' + ')} = ${han}翻`,
  });

  // ステップ4: 点数算出
  const position = isParent ? '親' : '子';
  const method = isTsumo ? 'ツモ' : 'ロン';
  const levelName = getScoreLevelName(han, fu);

  let scoreDetail: string;
  if (levelName) {
    scoreDetail = `${han}翻は${levelName}。${position}の${method} → ${formatAnswer(correctAnswer)}`;
  } else {
    scoreDetail = `${fu}符${han}翻 ${position}の${method} → ${formatAnswer(correctAnswer)}`;
  }

  steps.push({
    title: '点数の算出',
    detail: scoreDetail,
  });

  return steps;
}

function getScoreLevelName(han: number, fu: number): string | null {
  if (han >= 13) return '三倍満';
  if (han >= 11) return '三倍満';
  if (han >= 8) return '倍満';
  if (han >= 6) return '跳満';
  if (han >= 5) return '満貫';
  if ((han === 4 && fu >= 30) || (han === 3 && fu >= 60)) return '満貫';
  return null;
}

function formatAnswer(answer: string): string {
  if (answer.includes('all')) {
    return answer.replace('all', 'オール') + '点';
  }
  if (answer.includes('/')) {
    return answer + '点';
  }
  return answer + '点';
}
