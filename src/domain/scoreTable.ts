import { calculateScore } from './scoreCalculator';

export interface ScoreTableEntry {
  fu: number;
  han: number;
  koRon: number | null;
  koTsumo: string | null;
  oyaRon: number | null;
  oyaTsumo: string | null;
  label?: string;
  note?: string;
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

      // 20符はピンフツモ専用（ロンは30符になるため20符ロンは存在しない）
      const hasRon = fu !== 20;

      const koRon = hasRon ? calculateScore({ fu, han, isParent: false, isTsumo: false }) : null;
      const koTsumo = calculateScore({ fu, han, isParent: false, isTsumo: true });
      const oyaRon = hasRon ? calculateScore({ fu, han, isParent: true, isTsumo: false }) : null;
      const oyaTsumo = calculateScore({ fu, han, isParent: true, isTsumo: true });

      entries.push({
        fu,
        han,
        koRon: koRon?.ronPoints ?? null,
        koTsumo: koTsumo.toAnswerString(),
        oyaRon: oyaRon?.ronPoints ?? null,
        oyaTsumo: oyaTsumo.toAnswerString(),
        note: fu === 20 ? 'ピンフツモ' : fu === 25 ? '七対子' : undefined,
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
