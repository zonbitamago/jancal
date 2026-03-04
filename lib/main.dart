import 'package:flutter/material.dart';
import 'models/problem.dart';
import 'screens/home_screen.dart';
import 'screens/quiz_screen.dart';

void main() {
  runApp(const JanCalApp());
}

class JanCalApp extends StatefulWidget {
  const JanCalApp({super.key});

  @override
  State<JanCalApp> createState() => _JanCalAppState();
}

class _JanCalAppState extends State<JanCalApp> {
  final Map<QuizLevel, int> _correctCounts = {};
  final Map<QuizLevel, int> _totalCounts = {};

  void _onAnswer(QuizLevel level, bool isCorrect) {
    setState(() {
      _totalCounts[level] = (_totalCounts[level] ?? 0) + 1;
      if (isCorrect) {
        _correctCounts[level] = (_correctCounts[level] ?? 0) + 1;
      }
    });
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
      home: HomeScreen(
        correctCounts: _correctCounts,
        totalCounts: _totalCounts,
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
