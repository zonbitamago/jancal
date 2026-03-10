import { ScoreResult } from './models/scoreResult';

export function calculateScore(params: {
  fu: number;
  han: number;
  isParent: boolean;
  isTsumo: boolean;
  isYakuman?: boolean;
}): ScoreResult {
  const { fu, han, isParent, isTsumo, isYakuman = false } = params;

  let basePoints: number;

  if (isYakuman) {
    basePoints = 8000; // 役満
  } else if (han >= 13) {
    basePoints = 6000; // 三倍満（数え役満なし）
  } else if (han >= 11) {
    basePoints = 6000; // 三倍満
  } else if (han >= 8) {
    basePoints = 4000; // 倍満
  } else if (han >= 6) {
    basePoints = 3000; // 跳満
  } else if (han >= 5) {
    basePoints = 2000; // 満貫
  } else if ((han === 4 && fu >= 30) || (han === 3 && fu >= 60)) {
    basePoints = 2000; // 切り上げ満貫
  } else {
    basePoints = fu * (1 << (han + 2));
    if (basePoints > 2000) basePoints = 2000; // 満貫上限
  }

  return new ScoreResult(basePoints, isParent, isTsumo);
}
