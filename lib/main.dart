import 'package:flutter/material.dart';
import 'models/problem.dart';
import 'screens/home_screen.dart';
import 'screens/quiz_screen.dart';
import 'services/stats_service.dart';

void main() {
  runApp(const JanCalApp());
}

class JanCalApp extends StatefulWidget {
  const JanCalApp({super.key});

  @override
  State<JanCalApp> createState() => _JanCalAppState();
}

class _JanCalAppState extends State<JanCalApp> {
  final StatsService _statsService = StatsService();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _initStats();
  }

  Future<void> _initStats() async {
    await _statsService.init();
    setState(() => _initialized = true);
  }

  void _onAnswer(QuizLevel level, bool isCorrect) {
    _statsService.recordAnswer(level, isCorrect);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '雀カル',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0C1222),
        fontFamily: 'NotoSansJP',
        useMaterial3: true,
      ),
      home: _initialized
          ? HomeScreen(
              correctCounts: _statsService.getAllCorrectCounts(),
              totalCounts: _statsService.getAllTotalCounts(),
              onResetStats: () async {
                await _statsService.resetStats();
                setState(() {});
              },
            )
          : const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            ),
      onGenerateRoute: (settings) {
        if (settings.name == '/quiz') {
          final level = settings.arguments as QuizLevel;
          return MaterialPageRoute(
            builder: (context) => QuizScreen(
              level: level,
              onAnswer: (isCorrect) => _onAnswer(level, isCorrect),
            ),
          );
        }
        return null;
      },
    );
  }
}
