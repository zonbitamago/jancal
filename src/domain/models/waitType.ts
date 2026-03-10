export enum WaitType {
  ryanmen = 'ryanmen',   // 両面待ち (0符)
  shanpon = 'shanpon',   // 双碰待ち (0符)
  kanchan = 'kanchan',   // 嵌張待ち (2符)
  penchan = 'penchan',   // 辺張待ち (2符)
  tanki = 'tanki',       // 単騎待ち (2符)
}

export function waitTypeFu(wt: WaitType): number {
  switch (wt) {
    case WaitType.ryanmen:
    case WaitType.shanpon:
      return 0;
    case WaitType.kanchan:
    case WaitType.penchan:
    case WaitType.tanki:
      return 2;
  }
}
