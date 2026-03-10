export interface LevelStats {
  correct: number;
  total: number;
}

const STORAGE_KEY = 'jancal_stats';

function getAll(): Record<string, LevelStats> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, LevelStats>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getStats(level: string): LevelStats {
  const all = getAll();
  return all[level] ?? { correct: 0, total: 0 };
}

export function getTotalStats(): LevelStats {
  const all = getAll();
  let correct = 0, total = 0;
  for (const s of Object.values(all)) {
    correct += s.correct;
    total += s.total;
  }
  return { correct, total };
}

export function recordAnswer(level: string, isCorrect: boolean) {
  const all = getAll();
  const stats = all[level] ?? { correct: 0, total: 0 };
  stats.total++;
  if (isCorrect) stats.correct++;
  all[level] = stats;
  saveAll(all);
}

export function resetStats() {
  localStorage.removeItem(STORAGE_KEY);
}
