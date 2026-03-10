import 'package:flutter/material.dart';
import '../models/problem.dart';

class HomeScreen extends StatelessWidget {
  final Map<QuizLevel, int> correctCounts;
  final Map<QuizLevel, int> totalCounts;
  final VoidCallback? onResetStats;

  const HomeScreen({
    super.key,
    required this.correctCounts,
    required this.totalCounts,
    this.onResetStats,
  });

  @override
  Widget build(BuildContext context) {
    final totalCorrect = correctCounts.values.fold(0, (a, b) => a + b);
    final totalAnswered = totalCounts.values.fold(0, (a, b) => a + b);
    final rate = totalAnswered > 0 ? totalCorrect / totalAnswered : 0.0;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0C1222), Color(0xFF162032), Color(0xFF0D2847)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildLogo(),
                  const SizedBox(height: 12),
                  Text(
                    '麻雀点数計算トレーニング',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.6),
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 40),
                  if (totalAnswered > 0) ...[
                    _buildStats(context, totalCorrect, totalAnswered, rate),
                    const SizedBox(height: 32),
                  ],
                  _buildLevelButton(
                    context,
                    level: QuizLevel.beginner,
                    label: '初級',
                    subtitle: '30符計算・基本役',
                    color: const Color(0xFF48BB78),
                  ),
                  const SizedBox(height: 16),
                  _buildLevelButton(
                    context,
                    level: QuizLevel.intermediate,
                    label: '中級',
                    subtitle: '満貫判定・複合役',
                    color: const Color(0xFFECC94B),
                  ),
                  const SizedBox(height: 16),
                  _buildLevelButton(
                    context,
                    level: QuizLevel.advanced,
                    label: '上級',
                    subtitle: '跳満以上・役満',
                    color: const Color(0xFFFC8181),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: const Text(
        '雀カル',
        style: TextStyle(
          color: Colors.white,
          fontSize: 48,
          fontWeight: FontWeight.w900,
          letterSpacing: 8,
        ),
      ),
    );
  }

  Widget _buildStats(BuildContext context, int correct, int total, double rate) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                '通算正答率: $correct / $total (${(rate * 100).toStringAsFixed(0)}%)',
                style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14),
              ),
              if (onResetStats != null) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    showDialog(
                      context: context,
                      builder: (ctx) => AlertDialog(
                        backgroundColor: const Color(0xFF1A2332),
                        title: const Text('リセット確認', style: TextStyle(color: Colors.white)),
                        content: const Text('統計データをリセットしますか？', style: TextStyle(color: Colors.white70)),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.of(ctx).pop(),
                            child: const Text('キャンセル'),
                          ),
                          TextButton(
                            onPressed: () {
                              onResetStats!();
                              Navigator.of(ctx).pop();
                            },
                            child: const Text('リセット', style: TextStyle(color: Color(0xFFFC8181))),
                          ),
                        ],
                      ),
                    );
                  },
                  child: Icon(Icons.refresh, color: Colors.white.withOpacity(0.4), size: 16),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: rate,
              backgroundColor: Colors.white.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation(
                rate >= 0.8
                    ? const Color(0xFF48BB78)
                    : rate >= 0.5
                        ? const Color(0xFFECC94B)
                        : const Color(0xFFFC8181),
              ),
              minHeight: 8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelButton(
    BuildContext context, {
    required QuizLevel level,
    required String label,
    required String subtitle,
    required Color color,
  }) {
    final correct = correctCounts[level] ?? 0;
    final total = totalCounts[level] ?? 0;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {
          Navigator.of(context).pushNamed(
            '/quiz',
            arguments: level,
          );
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: color.withOpacity(0.15),
          foregroundColor: color,
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: color.withOpacity(0.3)),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: color.withOpacity(0.7),
                  ),
                ),
              ],
            ),
            if (total > 0)
              Text(
                '$correct/$total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: color.withOpacity(0.8),
                ),
              ),
            Icon(Icons.arrow_forward_ios, color: color.withOpacity(0.5), size: 18),
          ],
        ),
      ),
    );
  }
}
