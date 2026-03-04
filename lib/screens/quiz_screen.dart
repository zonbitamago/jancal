import 'package:flutter/material.dart';
import '../models/problem.dart';
import '../widgets/tile_group.dart';
import '../widgets/badge.dart';

class QuizScreen extends StatefulWidget {
  final QuizLevel level;
  final void Function(bool isCorrect) onAnswer;

  const QuizScreen({
    super.key,
    required this.level,
    required this.onAnswer,
  });

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  late List<Problem> _problems;
  int _currentIndex = 0;
  String? _selectedAnswer;
  bool _showHint = false;
  int _correctCount = 0;
  int _answeredCount = 0;

  @override
  void initState() {
    super.initState();
    _problems = getProblemsForLevel(widget.level)..shuffle();
  }

  Problem get _currentProblem => _problems[_currentIndex % _problems.length];
  bool get _hasAnswered => _selectedAnswer != null;
  bool get _isCorrect => _selectedAnswer == _currentProblem.correctAnswer;

  void _selectAnswer(String answer) {
    if (_hasAnswered) return;
    setState(() {
      _selectedAnswer = answer;
      _answeredCount++;
      if (answer == _currentProblem.correctAnswer) {
        _correctCount++;
      }
    });
    widget.onAnswer(answer == _currentProblem.correctAnswer);
  }

  void _nextProblem() {
    setState(() {
      _currentIndex++;
      _selectedAnswer = null;
      _showHint = false;
      if (_currentIndex % _problems.length == 0) {
        _problems.shuffle();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final problem = _currentProblem;
    final levelColor = _getLevelColor();

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
          child: Column(
            children: [
              _buildHeader(levelColor),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      _buildTileCard(problem),
                      const SizedBox(height: 16),
                      _buildBadges(problem),
                      const SizedBox(height: 20),
                      if (!_hasAnswered && !_showHint)
                        _buildHintButton(),
                      if (_showHint && !_hasAnswered)
                        _buildHintCard(problem),
                      const SizedBox(height: 16),
                      _buildChoices(problem),
                      if (_hasAnswered) ...[
                        const SizedBox(height: 16),
                        _buildResult(problem),
                        const SizedBox(height: 16),
                        _buildNextButton(),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Color levelColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: levelColor.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              widget.level.label,
              style: TextStyle(
                color: levelColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const Spacer(),
          Text(
            '$_correctCount / $_answeredCount',
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildTileCard(Problem problem) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        children: [
          Text(
            'この手牌の点数は？',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 16),
          TileGroupWidget(
            tilesNotation: problem.tiles,
            winTile: problem.winTile,
            dora: problem.dora,
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'アガリ牌: ',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.5),
                  fontSize: 12,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFD4A017).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: const Color(0xFFD4A017).withOpacity(0.4)),
                ),
                child: Text(
                  _winTileLabel(problem.winTile),
                  style: const TextStyle(
                    color: Color(0xFFD4A017),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBadges(Problem problem) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.center,
      children: [
        InfoBadge(
          label: problem.isParent ? '親' : '子',
          color: problem.isParent
              ? const Color(0xFFECC94B).withOpacity(0.2)
              : const Color(0xFF63B3ED).withOpacity(0.2),
          textColor: problem.isParent
              ? const Color(0xFFECC94B)
              : const Color(0xFF63B3ED),
        ),
        InfoBadge(
          label: problem.isTsumo ? 'ツモ' : 'ロン',
          color: problem.isTsumo
              ? const Color(0xFF48BB78).withOpacity(0.2)
              : const Color(0xFFFC8181).withOpacity(0.2),
          textColor: problem.isTsumo
              ? const Color(0xFF48BB78)
              : const Color(0xFFFC8181),
        ),
        InfoBadge(label: '${problem.fu}符'),
        InfoBadge(label: '${problem.han}翻'),
        ...problem.yaku.map((y) => InfoBadge(
              label: y,
              color: const Color(0xFF805AD5).withOpacity(0.2),
              textColor: const Color(0xFFB794F4),
            )),
        if (problem.dora.isNotEmpty)
          InfoBadge(
            label: 'ドラ${problem.dora.length}',
            color: const Color(0xFFE53E3E).withOpacity(0.2),
            textColor: const Color(0xFFFC8181),
          ),
      ],
    );
  }

  Widget _buildHintButton() {
    return TextButton.icon(
      onPressed: () => setState(() => _showHint = true),
      icon: const Icon(Icons.lightbulb_outline, color: Color(0xFFECC94B), size: 18),
      label: const Text(
        'ヒントを見る',
        style: TextStyle(color: Color(0xFFECC94B), fontSize: 13),
      ),
    );
  }

  Widget _buildHintCard(Problem problem) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFECC94B).withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFECC94B).withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.lightbulb, color: Color(0xFFECC94B), size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              problem.hint,
              style: const TextStyle(color: Color(0xFFECC94B), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChoices(Problem problem) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 2.5,
      children: problem.choices.map((choice) {
        Color bgColor;
        Color borderColor;
        Color textColor;

        if (!_hasAnswered) {
          bgColor = Colors.white.withOpacity(0.05);
          borderColor = Colors.white.withOpacity(0.15);
          textColor = Colors.white;
        } else if (choice == problem.correctAnswer) {
          bgColor = const Color(0xFF48BB78).withOpacity(0.2);
          borderColor = const Color(0xFF48BB78);
          textColor = const Color(0xFF48BB78);
        } else if (choice == _selectedAnswer) {
          bgColor = const Color(0xFFFC8181).withOpacity(0.2);
          borderColor = const Color(0xFFFC8181);
          textColor = const Color(0xFFFC8181);
        } else {
          bgColor = Colors.white.withOpacity(0.02);
          borderColor = Colors.white.withOpacity(0.06);
          textColor = Colors.white.withOpacity(0.3);
        }

        return GestureDetector(
          onTap: () => _selectAnswer(choice),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: borderColor, width: 1.5),
            ),
            alignment: Alignment.center,
            child: Text(
              '$choice点',
              style: TextStyle(
                color: textColor,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildResult(Problem problem) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _isCorrect
            ? const Color(0xFF48BB78).withOpacity(0.1)
            : const Color(0xFFFC8181).withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _isCorrect
              ? const Color(0xFF48BB78).withOpacity(0.3)
              : const Color(0xFFFC8181).withOpacity(0.3),
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                _isCorrect ? Icons.check_circle : Icons.cancel,
                color: _isCorrect
                    ? const Color(0xFF48BB78)
                    : const Color(0xFFFC8181),
              ),
              const SizedBox(width: 8),
              Text(
                _isCorrect ? '正解！' : '不正解...',
                style: TextStyle(
                  color: _isCorrect
                      ? const Color(0xFF48BB78)
                      : const Color(0xFFFC8181),
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            problem.hint,
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildNextButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _nextProblem,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF4299E1),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: const Text(
          '次の問題',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Color _getLevelColor() {
    switch (widget.level) {
      case QuizLevel.beginner:
        return const Color(0xFF48BB78);
      case QuizLevel.intermediate:
        return const Color(0xFFECC94B);
      case QuizLevel.advanced:
        return const Color(0xFFFC8181);
    }
  }

  String _winTileLabel(String winTile) {
    final tiles = parseWinTile(winTile);
    return tiles;
  }

  String parseWinTile(String notation) {
    if (notation.isEmpty) return '';
    final suffix = notation[notation.length - 1];
    final num = notation.substring(0, notation.length - 1);
    switch (suffix) {
      case 'm':
        return '$num萬';
      case 'p':
        return '$num筒';
      case 's':
        return '$num索';
      case 'z':
        final n = int.tryParse(num) ?? 0;
        const winds = ['', '東', '南', '西', '北'];
        const dragons = ['白', '發', '中'];
        if (n <= 4) return winds[n];
        return dragons[n - 5];
      default:
        return notation;
    }
  }
}
