enum WaitType {
  ryanmen,  // 両面待ち (0符)
  shanpon,  // 双碰待ち (0符)
  kanchan,  // 嵌張待ち (2符)
  penchan,  // 辺張待ち (2符)
  tanki,    // 単騎待ち (2符)
}

extension WaitTypeFu on WaitType {
  int get fuValue {
    switch (this) {
      case WaitType.ryanmen:
      case WaitType.shanpon:
        return 0;
      case WaitType.kanchan:
      case WaitType.penchan:
      case WaitType.tanki:
        return 2;
    }
  }
}
