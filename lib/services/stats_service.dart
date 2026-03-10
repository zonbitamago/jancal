import 'package:shared_preferences/shared_preferences.dart';
import '../models/problem.dart';

class StatsService {
  static const _prefix = 'stats_';
  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  int getCorrectCount(QuizLevel level) {
    return _prefs?.getInt('${_prefix}correct_${level.name}') ?? 0;
  }

  int getTotalCount(QuizLevel level) {
    return _prefs?.getInt('${_prefix}total_${level.name}') ?? 0;
  }

  Future<void> recordAnswer(QuizLevel level, bool isCorrect) async {
    final totalKey = '${_prefix}total_${level.name}';
    final correctKey = '${_prefix}correct_${level.name}';
    final total = (_prefs?.getInt(totalKey) ?? 0) + 1;
    await _prefs?.setInt(totalKey, total);
    if (isCorrect) {
      final correct = (_prefs?.getInt(correctKey) ?? 0) + 1;
      await _prefs?.setInt(correctKey, correct);
    }
  }

  Map<QuizLevel, int> getAllCorrectCounts() {
    return {
      for (final level in QuizLevel.values) level: getCorrectCount(level),
    };
  }

  Map<QuizLevel, int> getAllTotalCounts() {
    return {
      for (final level in QuizLevel.values) level: getTotalCount(level),
    };
  }

  Future<void> resetStats() async {
    for (final level in QuizLevel.values) {
      await _prefs?.remove('${_prefix}correct_${level.name}');
      await _prefs?.remove('${_prefix}total_${level.name}');
    }
  }
}
