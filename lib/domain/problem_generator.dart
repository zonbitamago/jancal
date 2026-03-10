import 'dart:math';

import '../models/problem.dart';
import '../utils/tile_parser.dart';
import 'hand_analyzer.dart';
import 'yaku_judge.dart';
import 'fu_calculator.dart';
import 'score_calculator.dart';
import 'models/hand.dart';
import 'models/mentsu.dart';

/// 動的に問題を生成するエンジン
class ProblemGenerator {
  final Random _random;
  int _counter = 0;

  ProblemGenerator({int? seed}) : _random = Random(seed);

  /// 指定レベルの問題を1つ生成
  Problem generate(QuizLevel level) {
    for (int attempt = 0; attempt < 100; attempt++) {
      final problem = _tryGenerate(level);
      if (problem != null) return problem;
    }
    // フォールバック: ハードコード問題からランダムに返す
    final problems = getProblemsForLevel(level);
    return problems[_random.nextInt(problems.length)];
  }

  Problem? _tryGenerate(QuizLevel level) {
    switch (level) {
      case QuizLevel.beginner:
        return _generateBeginner();
      case QuizLevel.intermediate:
        return _generateIntermediate();
      case QuizLevel.advanced:
        return _generateAdvanced();
    }
  }

  /// 初級: ピンフ系・タンヤオ系・七対子 (1-3翻、門前)
  Problem? _generateBeginner() {
    final type = _random.nextInt(4);
    switch (type) {
      case 0:
        return _generatePinfuHand();
      case 1:
        return _generateTanyaoHand();
      case 2:
        return _generateChitoitsuHand();
      default:
        return _generateSimpleRiichiHand();
    }
  }

  /// 中級: 満貫前後 (3-5翻、副露含む)
  Problem? _generateIntermediate() {
    final type = _random.nextInt(4);
    switch (type) {
      case 0:
        return _generateTanyaoPinfuRiichi();
      case 1:
        return _generateYakuhaiOpenHand();
      case 2:
        return _generateChitoitsuHand(withDora: true);
      default:
        return _generateToitoiOpenHand();
    }
  }

  /// 上級: 跳満以上 (6翻以上、副露含む)
  Problem? _generateAdvanced() {
    final type = _random.nextInt(3);
    switch (type) {
      case 0:
        return _generateHonitsuHand();
      case 1:
        return _generateChinitsuHand();
      default:
        return _generateMultiDoraHand();
    }
  }

  // === ハンド生成ヘルパー ===

  /// ピンフ手: 全順子 + 両面待ち + 役牌以外の雀頭
  Problem? _generatePinfuHand() {
    final shuntsuList = <List<int>>[];
    final suits = [TileType.man, TileType.pin, TileType.sou];

    // 4つの順子をランダム生成
    for (int i = 0; i < 4; i++) {
      final suit = suits[_random.nextInt(3)];
      final start = _random.nextInt(7) + 1; // 1-7
      shuntsuList.add([start, start + 1, start + 2, suit.index]);
    }

    // 雀頭: 数牌の2-8
    final pairSuit = suits[_random.nextInt(3)];
    final pairNum = _random.nextInt(7) + 2; // 2-8

    // 両面待ちになるよう最後の順子からアガリ牌を決定
    final lastShuntsu = shuntsuList.last;
    final lastStart = lastShuntsu[0];
    // アガリ牌は順子の端(両面)
    String winTileStr;
    if (lastStart >= 2 && lastStart <= 6) {
      // 両端どちらか
      final useLeft = _random.nextBool();
      if (useLeft) {
        winTileStr =
            '${lastStart}${_suitChar(TileType.values[lastShuntsu[3]])}';
      } else {
        winTileStr =
            '${lastStart + 2}${_suitChar(TileType.values[lastShuntsu[3]])}';
      }
    } else if (lastStart == 1) {
      // 123 → 3が両面(34待ちの3)ではなく、1が辺張 → 使えない → 両面にするため4で待つ
      // 実際は123の場合3のアガリは辺張なので別の順子を使う
      winTileStr =
          '${lastStart + 2}${_suitChar(TileType.values[lastShuntsu[3]])}';
    } else {
      winTileStr =
          '${lastStart}${_suitChar(TileType.values[lastShuntsu[3]])}';
    }

    // 手牌文字列を構築
    final groups = <String>[];
    for (final s in shuntsuList) {
      final suit = _suitChar(TileType.values[s[3]]);
      groups.add('${s[0]}${s[1]}${s[2]}$suit');
    }
    groups.add('$pairNum$pairNum${_suitChar(pairSuit)}');

    final tilesStr = groups.join(' ');
    final isRiichi = _random.nextBool();
    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: isRiichi,
      isIppatsu: false,
      isMenzen: true,
      level: QuizLevel.beginner,
    );
  }

  /// タンヤオ手: 全牌2-8
  Problem? _generateTanyaoHand() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final groups = <String>[];

    // 4つの順子(2-8の範囲)
    for (int i = 0; i < 4; i++) {
      final suit = suits[_random.nextInt(3)];
      final start = _random.nextInt(5) + 2; // 2-6 → 順子は 2xx, 3xx, ..., 678
      groups.add('${start}${start + 1}${start + 2}${_suitChar(suit)}');
    }

    // 雀頭
    final pairSuit = suits[_random.nextInt(3)];
    final pairNum = _random.nextInt(7) + 2; // 2-8
    groups.add('$pairNum$pairNum${_suitChar(pairSuit)}');

    final tilesStr = groups.join(' ');
    // アガリ牌: 最後の順子の端
    final lastGroup = groups[3];
    final lastStart = int.parse(lastGroup[0]);
    final lastSuit = lastGroup[lastGroup.length - 1];
    final winNum = _random.nextBool() ? lastStart : lastStart + 2;
    final winTileStr = '$winNum$lastSuit';

    final isMenzen = _random.nextBool();
    final isRiichi = isMenzen && _random.nextBool();
    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: isRiichi,
      isIppatsu: false,
      isMenzen: isMenzen,
      openGroups: isMenzen ? [] : [0],
      level: QuizLevel.beginner,
    );
  }

  /// 七対子手
  Problem? _generateChitoitsuHand({bool withDora = false}) {
    final allTileKeys = <String>[];
    for (final suit in ['m', 'p', 's']) {
      for (int n = 1; n <= 9; n++) {
        allTileKeys.add('$n$suit');
      }
    }
    for (int n = 1; n <= 7; n++) {
      allTileKeys.add('${n}z');
    }
    allTileKeys.shuffle(_random);

    final chosen = allTileKeys.take(7).toList();
    final groups = chosen.map((k) => '$k$k'.replaceAllMapped(
        RegExp(r'(\d)(\w)\1\2'), (m) => '${m[1]}${m[1]}${m[2]}')).toList();
    // Simpler: just build notation properly
    final groupStrs = <String>[];
    for (final k in chosen) {
      final num = k.substring(0, k.length - 1);
      final suit = k[k.length - 1];
      groupStrs.add('$num$num$suit');
    }

    final tilesStr = groupStrs.join(' ');
    // アガリ牌: 最後の対子の一枚
    final lastKey = chosen.last;
    final winTileStr = lastKey;

    final isRiichi = _random.nextBool();
    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    final doraStrs = <String>[];
    if (withDora) {
      // ドラとして手牌内の牌を1-2個選ぶ
      final doraCount = _random.nextInt(2) + 1;
      final doraCandidates = List<String>.from(chosen)..shuffle(_random);
      doraStrs.addAll(doraCandidates.take(doraCount));
    }

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: isRiichi,
      isIppatsu: false,
      isMenzen: true,
      doraStrs: doraStrs,
      level: withDora ? QuizLevel.intermediate : QuizLevel.beginner,
    );
  }

  /// 単純なリーチ手
  Problem? _generateSimpleRiichiHand() {
    return _generatePinfuHand(); // ピンフ+リーチの形
  }

  /// タンヤオ+ピンフ+リーチ (中級向け)
  Problem? _generateTanyaoPinfuRiichi() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final groups = <String>[];

    for (int i = 0; i < 4; i++) {
      final suit = suits[_random.nextInt(3)];
      final start = _random.nextInt(5) + 2;
      groups.add('${start}${start + 1}${start + 2}${_suitChar(suit)}');
    }

    final pairSuit = suits[_random.nextInt(3)];
    final pairNum = _random.nextInt(7) + 2;
    groups.add('$pairNum$pairNum${_suitChar(pairSuit)}');

    final tilesStr = groups.join(' ');
    final lastGroup = groups[3];
    final lastStart = int.parse(lastGroup[0]);
    final lastSuit = lastGroup[lastGroup.length - 1];
    final winNum = _random.nextBool() ? lastStart : lastStart + 2;
    final winTileStr = '$winNum$lastSuit';

    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    // ドラを1-2枚追加
    final tiles = parseTiles(tilesStr);
    final doraCount = _random.nextInt(2) + 1;
    final doraCandidates = tiles.toSet().toList()..shuffle(_random);
    final doraStrs = doraCandidates
        .take(doraCount)
        .map((t) => t.key)
        .toList();

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: true,
      isIppatsu: false,
      isMenzen: true,
      doraStrs: doraStrs,
      level: QuizLevel.intermediate,
    );
  }

  /// 役牌の鳴き手 (中級)
  Problem? _generateYakuhaiOpenHand() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final dragons = ['5z', '6z', '7z'];
    final dragonKey = dragons[_random.nextInt(3)];

    final groups = <String>[];
    // 役牌の明刻
    final dn = dragonKey.substring(0, dragonKey.length - 1);
    groups.add('$dn$dn${dn}z');

    // 3つの順子
    for (int i = 0; i < 3; i++) {
      final suit = suits[_random.nextInt(3)];
      final start = _random.nextInt(7) + 1;
      groups.add('${start}${start + 1}${start + 2}${_suitChar(suit)}');
    }

    // 雀頭
    final pairSuit = suits[_random.nextInt(3)];
    final pairNum = _random.nextInt(9) + 1;
    groups.add('$pairNum$pairNum${_suitChar(pairSuit)}');

    final tilesStr = groups.join(' ');
    final winTileStr = '${pairNum}${_suitChar(pairSuit)}';

    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: false,
      isIppatsu: false,
      isMenzen: false,
      openGroups: [0],
      level: QuizLevel.intermediate,
    );
  }

  /// トイトイ鳴き手 (中級)
  Problem? _generateToitoiOpenHand() {
    final allTileKeys = <String>[];
    for (final suit in ['m', 'p', 's']) {
      for (int n = 1; n <= 9; n++) {
        allTileKeys.add('$n$suit');
      }
    }
    for (int n = 1; n <= 7; n++) {
      allTileKeys.add('${n}z');
    }
    allTileKeys.shuffle(_random);

    final chosen = allTileKeys.take(5).toList();
    final groups = <String>[];
    // 4つの刻子
    for (int i = 0; i < 4; i++) {
      final k = chosen[i];
      final num = k.substring(0, k.length - 1);
      final suit = k[k.length - 1];
      groups.add('$num$num$num$suit');
    }
    // 雀頭
    final pk = chosen[4];
    final pnum = pk.substring(0, pk.length - 1);
    final psuit = pk[pk.length - 1];
    groups.add('$pnum$pnum$psuit');

    final tilesStr = groups.join(' ');
    final winTileStr = pk;

    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: false,
      isIppatsu: false,
      isMenzen: false,
      openGroups: [0, 1],
      level: QuizLevel.intermediate,
    );
  }

  /// 混一色手 (上級)
  Problem? _generateHonitsuHand() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final suit = suits[_random.nextInt(3)];
    final sc = _suitChar(suit);

    final groups = <String>[];
    // 3つの順子(同色)
    for (int i = 0; i < 3; i++) {
      final start = _random.nextInt(7) + 1;
      groups.add('${start}${start + 1}${start + 2}$sc');
    }
    // 字牌刻子
    final honorNum = _random.nextInt(7) + 1;
    groups.add('$honorNum$honorNum${honorNum}z');
    // 雀頭(同色)
    final pairNum = _random.nextInt(9) + 1;
    groups.add('$pairNum$pairNum$sc');

    final tilesStr = groups.join(' ');
    final winTileStr = '$pairNum$sc';

    final isRiichi = _random.nextBool();
    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    final doraStrs = <String>[];
    // ドラ1-2枚追加して跳満以上に
    final doraCount = _random.nextInt(2) + 1;
    final tiles = parseTiles(tilesStr);
    final doraCandidates = tiles.toSet().toList()..shuffle(_random);
    doraStrs.addAll(doraCandidates.take(doraCount).map((t) => t.key));

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: isRiichi,
      isIppatsu: false,
      isMenzen: true,
      doraStrs: doraStrs,
      level: QuizLevel.advanced,
    );
  }

  /// 清一色手 (上級)
  Problem? _generateChinitsuHand() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final suit = suits[_random.nextInt(3)];
    final sc = _suitChar(suit);

    final groups = <String>[];
    for (int i = 0; i < 4; i++) {
      final start = _random.nextInt(7) + 1;
      groups.add('${start}${start + 1}${start + 2}$sc');
    }
    final pairNum = _random.nextInt(9) + 1;
    groups.add('$pairNum$pairNum$sc');

    final tilesStr = groups.join(' ');
    final winTileStr = '$pairNum$sc';

    final isMenzen = _random.nextBool();
    final isRiichi = isMenzen && _random.nextBool();
    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: isRiichi,
      isIppatsu: false,
      isMenzen: isMenzen,
      openGroups: isMenzen ? [] : [0, 1],
      level: QuizLevel.advanced,
    );
  }

  /// ドラ多め + リーチ (上級)
  Problem? _generateMultiDoraHand() {
    final suits = [TileType.man, TileType.pin, TileType.sou];
    final groups = <String>[];

    for (int i = 0; i < 4; i++) {
      final suit = suits[_random.nextInt(3)];
      final start = _random.nextInt(7) + 1;
      groups.add('${start}${start + 1}${start + 2}${_suitChar(suit)}');
    }

    final pairSuit = suits[_random.nextInt(3)];
    final pairNum = _random.nextInt(9) + 1;
    groups.add('$pairNum$pairNum${_suitChar(pairSuit)}');

    final tilesStr = groups.join(' ');
    final lastGroup = groups[3];
    final lastStart = int.parse(lastGroup[0]);
    final lastSuit = lastGroup[lastGroup.length - 1];
    final winTileStr = '$lastStart$lastSuit';

    final isTsumo = _random.nextBool();
    final isParent = _random.nextInt(4) == 0;

    // ドラ3-4枚
    final tiles = parseTiles(tilesStr);
    final doraCount = _random.nextInt(2) + 3;
    final doraCandidates = tiles.toSet().toList()..shuffle(_random);
    final doraStrs = doraCandidates
        .take(min(doraCount, doraCandidates.length))
        .map((t) => t.key)
        .toList();

    return _buildAndVerifyProblem(
      tilesStr: tilesStr,
      winTileStr: winTileStr,
      isTsumo: isTsumo,
      isParent: isParent,
      isRiichi: true,
      isIppatsu: _random.nextInt(3) == 0,
      isMenzen: true,
      doraStrs: doraStrs,
      level: QuizLevel.advanced,
    );
  }

  // === 共通 ===

  /// 生成した手牌をドメインパイプラインで検証し、Problem を構築
  Problem? _buildAndVerifyProblem({
    required String tilesStr,
    required String winTileStr,
    required bool isTsumo,
    required bool isParent,
    required bool isRiichi,
    required bool isIppatsu,
    required bool isMenzen,
    List<String> doraStrs = const [],
    List<int> openGroups = const [],
    required QuizLevel level,
  }) {
    try {
      final tiles = parseTiles(tilesStr);
      if (tiles.length != 14) return null;

      final winTile = parseTiles(winTileStr)[0];
      if (!tiles.contains(winTile)) return null;

      final dora = doraStrs.map((s) => parseTiles(s)[0]).toList();

      final hand = Hand(
        tiles: tiles,
        winTile: winTile,
        isTsumo: isTsumo,
        isMenzen: isMenzen,
        isParent: isParent,
        isRiichi: isRiichi,
        isIppatsu: isIppatsu,
        dora: dora,
      );

      final decompositions = analyzeHand(tiles, winTile);
      if (decompositions.isEmpty) return null;

      String? bestAnswer;
      int bestScore = -1;
      int bestHan = 0;
      int bestFu = 0;
      List<YakuResult> bestYaku = [];
      bool bestIsYakuman = false;

      for (final decomp in decompositions) {
        final yakuList = judgeYaku(hand: hand, decomposition: decomp);
        if (yakuList.isEmpty) continue;

        int han = yakuList.fold(0, (sum, y) => sum + y.han);
        final doraCount = countDora(tiles, dora);
        han += doraCount;

        final hasYakuman = yakuList.any((y) => y.han >= 13);
        if (hasYakuman) han = 13;

        final isPinfu = yakuList.any((y) => y.name == 'ピンフ');
        int fu;
        if (hasYakuman) {
          fu = 0;
        } else {
          fu = calculateFu(
            decomposition: decomp,
            isTsumo: isTsumo,
            isMenzen: isMenzen,
            isPinfu: isPinfu,
          );
        }

        final result = calculateScore(
          fu: fu,
          han: han,
          isParent: isParent,
          isTsumo: isTsumo,
          isYakuman: hasYakuman,
        );

        final score = isTsumo
            ? (isParent
                ? result.tsumoOyaPoints * 3
                : result.tsumoKoPoints * 2 + result.tsumoOyaPoints)
            : result.ronPoints;

        if (score > bestScore) {
          bestScore = score;
          bestAnswer = result.toAnswerString();
          bestHan = han;
          bestFu = fu;
          bestYaku = yakuList;
          bestIsYakuman = hasYakuman;
        }
      }

      if (bestAnswer == null || bestYaku.isEmpty) return null;

      // レベルに応じた翻数チェック
      if (!_isValidForLevel(level, bestHan, bestIsYakuman)) return null;

      // 選択肢を生成
      final choices = _generateChoices(bestAnswer, isTsumo, isParent);

      // ヒント生成
      final yakuNames = bestYaku.map((y) => y.name).toList();
      final doraCount = countDora(tiles, dora);
      if (doraCount > 0) yakuNames.add('ドラ$doraCount');
      final hint = _generateHint(
          bestFu, bestHan, isParent, isTsumo, bestAnswer, yakuNames);

      _counter++;
      return Problem(
        id: 'g$_counter',
        tiles: tilesStr,
        winTile: winTileStr,
        yaku: bestYaku.map((y) => y.name).toList(),
        dora: doraStrs,
        fu: bestFu,
        han: bestHan,
        isParent: isParent,
        isTsumo: isTsumo,
        correctAnswer: bestAnswer,
        choices: choices,
        hint: hint,
        openGroups: openGroups,
      );
    } catch (_) {
      return null;
    }
  }

  bool _isValidForLevel(QuizLevel level, int han, bool isYakuman) {
    switch (level) {
      case QuizLevel.beginner:
        return han >= 1 && han <= 3 && !isYakuman;
      case QuizLevel.intermediate:
        return han >= 2 && han <= 5 && !isYakuman;
      case QuizLevel.advanced:
        return han >= 5 || isYakuman;
    }
  }

  List<String> _generateChoices(
      String correct, bool isTsumo, bool isParent) {
    final choices = <String>{correct};

    if (isTsumo && correct.contains('/')) {
      // ツモ形式: "ko/oya"
      final parts = correct.split('/');
      final ko = int.parse(parts[0]);
      final oya = int.parse(parts[1]);

      // 近い点数のバリエーション
      final multipliers = [0.5, 0.65, 1.5, 2.0, 0.75, 1.3];
      multipliers.shuffle(_random);
      for (final m in multipliers) {
        if (choices.length >= 4) break;
        final newKo = _roundToHundred((ko * m).round());
        final newOya = _roundToHundred((oya * m).round());
        if (newKo > 0 && newOya > 0 && newKo != ko) {
          choices.add('$newKo/$newOya');
        }
      }
    } else if (isTsumo && correct.contains(' all')) {
      final base = int.parse(correct.replaceAll(' all', ''));
      final multipliers = [0.5, 0.65, 1.5, 2.0];
      multipliers.shuffle(_random);
      for (final m in multipliers) {
        if (choices.length >= 4) break;
        final newBase = _roundToHundred((base * m).round());
        if (newBase > 0 && newBase != base) {
          choices.add('$newBase all');
        }
      }
    } else {
      final base = int.parse(correct);
      final multipliers = [0.5, 0.65, 0.75, 1.3, 1.5, 2.0];
      multipliers.shuffle(_random);
      for (final m in multipliers) {
        if (choices.length >= 4) break;
        final newVal = _roundToHundred((base * m).round());
        if (newVal > 0 && newVal != base) {
          choices.add('$newVal');
        }
      }
    }

    // 足りない場合の補完
    while (choices.length < 4) {
      if (isTsumo && correct.contains('/')) {
        final parts = correct.split('/');
        final ko = int.parse(parts[0]);
        final r = _random.nextInt(3) + 1;
        choices.add('${ko * r}/${ko * r * 2}');
      } else {
        choices.add('${(_random.nextInt(10) + 1) * 1000}');
      }
    }

    final choiceList = choices.toList()..shuffle(_random);
    return choiceList;
  }

  int _roundToHundred(int value) {
    return ((value + 99) ~/ 100) * 100;
  }

  String _generateHint(int fu, int han, bool isParent, bool isTsumo,
      String answer, List<String> yakuNames) {
    final position = isParent ? '親' : '子';
    final method = isTsumo ? 'ツモ' : 'ロン';
    final yakuStr = yakuNames.join('+');

    String levelName;
    if (han >= 13) {
      levelName = '役満';
    } else if (han >= 11) {
      levelName = '三倍満';
    } else if (han >= 8) {
      levelName = '倍満';
    } else if (han >= 6) {
      levelName = '跳満';
    } else if (han >= 5 || (han == 4 && fu >= 30) || (han == 3 && fu >= 60)) {
      levelName = '満貫';
    } else {
      levelName = '${fu}符${han}翻';
    }

    return '$levelName ${position}の$method → $answer点。$yakuStr。';
  }

  String _suitChar(TileType type) {
    switch (type) {
      case TileType.man:
        return 'm';
      case TileType.pin:
        return 'p';
      case TileType.sou:
        return 's';
      case TileType.wind:
      case TileType.dragon:
        return 'z';
    }
  }
}
