import { calculateScore } from './scoreCalculator';

export interface ScoreTableEntry {
  fu: number;
  han: number;
  koRon: number;
  koTsumo: string;
  oyaRon: number;
  oyaTsumo: string;
  label?: string;
}

export function generateScoreTable(): ScoreTableEntry[] {
  const entries: ScoreTableEntry[] = [];

  // 通常の符×翻の組み合わせ
  const fuValues = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  const hanValues = [1, 2, 3, 4];

  for (const fu of fuValues) {
    for (const han of hanValues) {
      // 20符1翻は存在しない（ピンフツモは20符だが最低2翻）
      if (fu === 20 && han === 1) continue;
      // 25符1翻は存在しない（七対子は25符だが最低2翻）
      if (fu === 25 && han === 1) continue;
      // 25符はツモなし（七対子のロンのみ）— ただし点数は計算可能
      // 高い符×翻で満貫超えるケースはスキップ
      const basePoints = fu * (1 << (han + 2));
      if (basePoints > 2000 && !((han === 4 && fu >= 30) || (han === 3 && fu >= 60))) {
        // 既に満貫を超えているが切り上げ満貫でもない → 満貫扱い
        // これは満貫セクションでカバーするのでスキップしない、満貫として出す
      }

      const koRon = calculateScore({ fu, han, isParent: false, isTsumo: false });
      const koTsumo = calculateScore({ fu, han, isParent: false, isTsumo: true });
      const oyaRon = calculateScore({ fu, han, isParent: true, isTsumo: false });
      const oyaTsumo = calculateScore({ fu, han, isParent: true, isTsumo: true });

      entries.push({
        fu,
        han,
        koRon: koRon.ronPoints,
        koTsumo: koTsumo.toAnswerString(),
        oyaRon: oyaRon.ronPoints,
        oyaTsumo: oyaTsumo.toAnswerString(),
      });
    }
  }

  // 満貫以上
  const specialEntries: { label: string; han: number; isYakuman: boolean }[] = [
    { label: '満貫', han: 5, isYakuman: false },
    { label: '跳満', han: 6, isYakuman: false },
    { label: '倍満', han: 8, isYakuman: false },
    { label: '三倍満', han: 11, isYakuman: false },
    { label: '役満', han: 13, isYakuman: true },
  ];

  for (const sp of specialEntries) {
    const koRon = calculateScore({ fu: 0, han: sp.han, isParent: false, isTsumo: false, isYakuman: sp.isYakuman });
    const koTsumo = calculateScore({ fu: 0, han: sp.han, isParent: false, isTsumo: true, isYakuman: sp.isYakuman });
    const oyaRon = calculateScore({ fu: 0, han: sp.han, isParent: true, isTsumo: false, isYakuman: sp.isYakuman });
    const oyaTsumo = calculateScore({ fu: 0, han: sp.han, isParent: true, isTsumo: true, isYakuman: sp.isYakuman });

    entries.push({
      fu: 0,
      han: sp.han,
      koRon: koRon.ronPoints,
      koTsumo: koTsumo.toAnswerString(),
      oyaRon: oyaRon.ronPoints,
      oyaTsumo: oyaTsumo.toAnswerString(),
      label: sp.label,
    });
  }

  return entries;
}
