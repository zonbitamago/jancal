class ScoreResult {
  final int basePoints;
  final bool isParent;
  final bool isTsumo;

  const ScoreResult({
    required this.basePoints,
    required this.isParent,
    required this.isTsumo,
  });

  int get ronPoints {
    final multiplier = isParent ? 6 : 4;
    return _roundUp(basePoints * multiplier, 100);
  }

  int get tsumoKoPoints => _roundUp(basePoints, 100);

  int get tsumoOyaPoints => _roundUp(basePoints * 2, 100);

  String toAnswerString() {
    if (isTsumo) {
      if (isParent) {
        return '$tsumoOyaPoints all';
      } else {
        return '$tsumoKoPoints/$tsumoOyaPoints';
      }
    } else {
      return '$ronPoints';
    }
  }

  static int _roundUp(int value, int unit) {
    return ((value + unit - 1) ~/ unit) * unit;
  }
}
