export interface Problem {
  id: string;
  tiles: string;
  winTile: string;
  yaku: string[];
  dora: string[];
  fu: number;
  han: number;
  isParent: boolean;
  isTsumo: boolean;
  correctAnswer: string;
  choices: string[];
  hint: string;
  openGroups: number[];
}

export function isOpen(problem: Problem): boolean {
  return problem.openGroups.length > 0;
}

export enum QuizLevel {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export function quizLevelLabel(level: QuizLevel): string {
  switch (level) {
    case QuizLevel.beginner: return '初級';
    case QuizLevel.intermediate: return '中級';
    case QuizLevel.advanced: return '上級';
  }
}

export function quizLevelPrefix(level: QuizLevel): string {
  switch (level) {
    case QuizLevel.beginner: return 'b';
    case QuizLevel.intermediate: return 'i';
    case QuizLevel.advanced: return 'a';
  }
}

export function getProblemsForLevel(level: QuizLevel): Problem[] {
  return allProblems.filter(p => p.id.startsWith(quizLevelPrefix(level)));
}

export const allProblems: Problem[] = [
  // 初級
  { id: 'b9', tiles: '11m 99m 11p 99p 11s 55z 77z', winTile: '7z', yaku: ['七対子'], dora: [], fu: 25, han: 2, isParent: false, isTsumo: false, correctAnswer: '1600', choices: ['800', '1600', '2000', '3200'], hint: '25符2翻 子のロン → 1600点。七対子は25符固定です。', openGroups: [] },
  { id: 'b1', tiles: '123m 456p 789s 11z', winTile: '1z', yaku: ['リーチ', 'ピンフ'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '3900', '2600'], hint: '30符2翻 子のロン → 2000点。ピンフ+リーチの基本形です。', openGroups: [] },
  { id: 'b2', tiles: '234m 567m 345p 66s 78s', winTile: '6s', yaku: ['リーチ', 'ツモ'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: true, correctAnswer: '500/1000', choices: ['500/1000', '1000/2000', '2000/3900', '1300/2600'], hint: '30符2翻 子のツモ → 500/1000点。子/親の支払いです。', openGroups: [] },
  { id: 'b3', tiles: '234m 567p 234s 678s 55p', winTile: '5p', yaku: ['タンヤオ', 'ピンフ'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '3900', '7700'], hint: '30符2翻 子のロン → 2000点。タンヤオ+ピンフ。', openGroups: [] },
  { id: 'b4', tiles: '123p 456p 789p 123s 55m', winTile: '5m', yaku: ['リーチ', 'ピンフ', 'ツモ'], dora: [], fu: 20, han: 3, isParent: false, isTsumo: true, correctAnswer: '700/1300', choices: ['700/1300', '1300/2600', '2000/3900', '2000/4000'], hint: '20符3翻 子のツモ → 700/1300点。ピンフツモは20符計算。', openGroups: [] },
  { id: 'b5', tiles: '345m 678m 234p 567s 11z', winTile: '1z', yaku: ['リーチ'], dora: ['3m'], fu: 30, han: 2, isParent: true, isTsumo: false, correctAnswer: '2900', choices: ['1000', '2000', '2900', '3900'], hint: '30符2翻 親のロン → 2900点。※ドラ表示は3mですが手牌にはドラなし。', openGroups: [] },
  { id: 'b6', tiles: '234m 345m 678p 99s 456s', winTile: '9s', yaku: ['タンヤオ'], dora: ['4m'], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '3900', '2600'], hint: '30符2翻 子のロン → 2000点。タンヤオ+ドラ1。', openGroups: [] },
  { id: 'b7', tiles: '123m 456m 789p 33s 678s', winTile: '3s', yaku: ['リーチ', 'ピンフ'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '3900', '7700'], hint: '30符2翻 子のロン → 2000点。', openGroups: [] },
  { id: 'b8', tiles: '234p 567p 345s 678s 22m', winTile: '2m', yaku: ['リーチ', 'タンヤオ', 'ピンフ'], dora: [], fu: 30, han: 3, isParent: false, isTsumo: false, correctAnswer: '3900', choices: ['2000', '3900', '7700', '2600'], hint: '30符3翻 子のロン → 3900点。リーチ+タンヤオ+ピンフ。', openGroups: [] },

  // 中級
  { id: 'i1', tiles: '234m 456m 234p 678s 55p', winTile: '5p', yaku: ['リーチ', 'タンヤオ', 'ピンフ'], dora: ['5p'], fu: 30, han: 4, isParent: false, isTsumo: false, correctAnswer: '8000', choices: ['3900', '7700', '8000', '12000'], hint: '30符4翻 → 満貫 8000点。4翻以上は満貫！', openGroups: [] },
  { id: 'i2', tiles: '123m 456m 789m 234s 11p', winTile: '1p', yaku: ['リーチ', '一発', 'ピンフ'], dora: [], fu: 30, han: 3, isParent: false, isTsumo: false, correctAnswer: '3900', choices: ['2000', '3900', '7700', '8000'], hint: '30符3翻 子のロン → 3900点。リーチ+一発+ピンフ。', openGroups: [] },
  { id: 'i3', tiles: '234m 234p 234s 678m 55s', winTile: '5s', yaku: ['タンヤオ', '三色同順'], dora: ['5s'], fu: 30, han: 4, isParent: false, isTsumo: false, correctAnswer: '8000', choices: ['3900', '7700', '8000', '12000'], hint: '30符4翻 → 満貫 8000点。三色+タンヤオ+ドラ1。', openGroups: [] },
  { id: 'i4', tiles: '234m 567m 345p 789s 66p', winTile: '6p', yaku: ['リーチ', 'ツモ', 'ピンフ'], dora: ['6p'], fu: 20, han: 4, isParent: false, isTsumo: true, correctAnswer: '1300/2600', choices: ['1300/2600', '2000/3900', '2000/4000', '4000/8000'], hint: '20符4翻 子のツモ → 1300/2600点。20符4翻は満貫にならない（基本点1280）。', openGroups: [] },
  { id: 'i5', tiles: '456m 456p 456s 789m 11z', winTile: '1z', yaku: ['リーチ', '一発', 'タンヤオ'], dora: ['4m'], fu: 40, han: 4, isParent: false, isTsumo: false, correctAnswer: '8000', choices: ['3900', '7700', '8000', '12000'], hint: '40符4翻 → 満貫 8000点。', openGroups: [] },
  { id: 'i6', tiles: '222m 345p 678p 99s 567s', winTile: '9s', yaku: ['リーチ', 'ツモ'], dora: ['9s', '2m'], fu: 30, han: 4, isParent: true, isTsumo: true, correctAnswer: '4000 all', choices: ['2000 all', '3000 all', '4000 all', '6000 all'], hint: '30符4翻 → 満貫 親ツモ 4000 all。', openGroups: [] },
  { id: 'i7', tiles: '112233m 456p 789s 55z', winTile: '5z', yaku: ['リーチ', 'ツモ', '一盃口'], dora: [], fu: 30, han: 4, isParent: false, isTsumo: true, correctAnswer: '2000/4000', choices: ['1000/2000', '1300/2600', '2000/4000', '3000/6000'], hint: '30符4翻 → 満貫ツモ 2000/4000。', openGroups: [] },
  { id: 'i8', tiles: '22m 44p 66p 33s 77s 88s 99m', winTile: '9m', yaku: ['タンヤオ', '七対子'], dora: ['9m'], fu: 25, han: 4, isParent: false, isTsumo: false, correctAnswer: '6400', choices: ['3200', '6400', '8000', '12000'], hint: '25符4翻 子のロン → 6400点。七対子は25符固定。', openGroups: [] },
  { id: 'i9', tiles: '22m 88m 33p 77p 44s 11z 66z', winTile: '6z', yaku: ['リーチ', '七対子'], dora: [], fu: 25, han: 3, isParent: false, isTsumo: false, correctAnswer: '3200', choices: ['1600', '2600', '3200', '6400'], hint: '25符3翻 子のロン → 3200点。七対子(2翻)+リーチ(1翻)。', openGroups: [] },

  // 上級
  { id: 'a1', tiles: '234m 345m 567p 678s 22p', winTile: '2p', yaku: ['リーチ', '一発', 'ツモ', 'タンヤオ', 'ピンフ'], dora: ['2p'], fu: 20, han: 6, isParent: false, isTsumo: true, correctAnswer: '3000/6000', choices: ['2000/4000', '3000/6000', '4000/8000', '6000/12000'], hint: '跳満 子ツモ → 3000/6000。6-7翻は跳満。', openGroups: [] },
  { id: 'a2', tiles: '123p 345p 789p 11z 567p', winTile: '1z', yaku: ['リーチ', 'ツモ', '混一色'], dora: ['1p', '7p'], fu: 30, han: 7, isParent: false, isTsumo: true, correctAnswer: '3000/6000', choices: ['2000/4000', '3000/6000', '4000/8000', '6000/12000'], hint: '跳満 子ツモ → 3000/6000。混一色+リーチ+ツモ+ドラ2。', openGroups: [] },
  { id: 'a3', tiles: '234m 456m 234p 567s 88p', winTile: '8p', yaku: ['リーチ', '一発', 'ツモ', 'タンヤオ', 'ピンフ'], dora: ['8p', '4m', '2p'], fu: 20, han: 8, isParent: false, isTsumo: true, correctAnswer: '4000/8000', choices: ['3000/6000', '4000/8000', '6000/12000', '8000/16000'], hint: '倍満 子ツモ → 4000/8000。8-10翻は倍満。', openGroups: [] },
  { id: 'a4', tiles: '111p 234p 567p 899p 9p', winTile: '9p', yaku: ['清一色', 'ツモ'], dora: ['1p', '9p', '5p'], fu: 30, han: 10, isParent: false, isTsumo: true, correctAnswer: '4000/8000', choices: ['3000/6000', '4000/8000', '6000/12000', '8000/16000'], hint: '倍満 子ツモ → 4000/8000。清一色+ツモ+ドラ3。', openGroups: [] },
  { id: 'a5', tiles: '123p 456p 789p 123p 55p', winTile: '5p', yaku: ['清一色', 'ツモ', 'ピンフ'], dora: ['5p', '3p', '1p'], fu: 20, han: 11, isParent: false, isTsumo: true, correctAnswer: '6000/12000', choices: ['4000/8000', '6000/12000', '8000/16000', '16000/32000'], hint: '三倍満 子ツモ → 6000/12000。11-12翻は三倍満。', openGroups: [] },
  { id: 'a6', tiles: '19m 19p 19s 1234567z', winTile: '7z', yaku: ['国士無双'], dora: [], fu: 0, han: 13, isParent: false, isTsumo: false, correctAnswer: '32000', choices: ['16000', '24000', '32000', '48000'], hint: '役満 子ロン → 32000点。国士無双は役満！', openGroups: [] },
  { id: 'a7', tiles: '111p 234p 678p 99p 55z', winTile: '5z', yaku: ['リーチ', '混一色'], dora: ['1p', '9p'], fu: 40, han: 7, isParent: true, isTsumo: false, correctAnswer: '18000', choices: ['12000', '18000', '24000', '36000'], hint: '跳満 親ロン → 18000点。親は子の1.5倍。', openGroups: [] },
  { id: 'a9', tiles: '11m 33m 55m 99m 11z 55z 77z', winTile: '7z', yaku: ['リーチ', '七対子', '混一色'], dora: [], fu: 25, han: 6, isParent: false, isTsumo: false, correctAnswer: '12000', choices: ['8000', '12000', '16000', '24000'], hint: '跳満 子のロン → 12000点。七対子(2翻)+混一色(3翻)+リーチ(1翻)=6翻。', openGroups: [] },
  { id: 'a8', tiles: '111m 444p 777s 222m 55z', winTile: '5z', yaku: ['四暗刻'], dora: [], fu: 0, han: 13, isParent: false, isTsumo: true, correctAnswer: '8000/16000', choices: ['4000/8000', '6000/12000', '8000/16000', '16000/32000'], hint: '役満 子ツモ → 8000/16000。四暗刻は役満！', openGroups: [] },

  // 副露あり
  { id: 'b10', tiles: '234m 567p 345s 678s 55m', winTile: '5m', yaku: ['タンヤオ'], dora: [], fu: 30, han: 1, isParent: false, isTsumo: false, correctAnswer: '1000', choices: ['1000', '1300', '2000', '2600'], hint: '30符1翻 子のロン → 1000点。鳴きタンヤオの基本形。', openGroups: [0] },
  { id: 'b11', tiles: '555z 234m 678p 456s 33p', winTile: '3p', yaku: ['役牌'], dora: [], fu: 30, han: 1, isParent: false, isTsumo: false, correctAnswer: '1000', choices: ['1000', '1300', '2000', '2600'], hint: '30符1翻 子のロン → 1000点。白ポンの役牌。明刻4符+単騎2符+副底20=26→30符。', openGroups: [0] },
  { id: 'i10', tiles: '777z 345m 678p 456s 22m', winTile: '2m', yaku: ['役牌'], dora: ['7z'], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '2600', '5200'], hint: '30符2翻 子のロン → 2000点。中ポン+ドラ1。明刻4符+単騎2符+副底20=26→30符。', openGroups: [0] },
  { id: 'i11', tiles: '222m 555p 888s 333m 77s', winTile: '7s', yaku: ['トイトイ'], dora: ['8s'], fu: 40, han: 3, isParent: false, isTsumo: false, correctAnswer: '5200', choices: ['2600', '3900', '5200', '8000'], hint: '40符3翻 子のロン → 5200点。トイトイ+ドラ1。鳴きでも2翻。', openGroups: [0, 1] },
  { id: 'i12', tiles: '123p 456p 789p 11z 567p', winTile: '1z', yaku: ['混一色'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '3900', '7700'], hint: '30符2翻 子のロン → 2000点。鳴き混一色は食い下がり2翻。', openGroups: [0] },
  { id: 'a10', tiles: '234m 234p 234s 666z 33s', winTile: '3s', yaku: ['三色同順', '役牌'], dora: [], fu: 30, han: 2, isParent: false, isTsumo: false, correctAnswer: '2000', choices: ['1000', '2000', '2600', '5200'], hint: '30符2翻 子のロン → 2000点。鳴き三色(1翻)+發ポン(1翻)。', openGroups: [0, 3] },
  { id: 'a11', tiles: '123s 345s 567s 789s 22s', winTile: '2s', yaku: ['清一色'], dora: [], fu: 30, han: 5, isParent: false, isTsumo: false, correctAnswer: '8000', choices: ['6400', '8000', '12000', '16000'], hint: '鳴き清一色 5翻 → 満貫 8000点。食い下がりでも5翻は満貫。', openGroups: [0, 1] },
];
