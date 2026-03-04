import 'package:flutter/material.dart';
import '../utils/tile_parser.dart';

class TilePainter extends CustomPainter {
  final Tile tile;
  final bool isWinTile;
  final bool isDora;

  TilePainter({
    required this.tile,
    this.isWinTile = false,
    this.isDora = false,
  });

  static const double tileWidth = 40;
  static const double tileHeight = 56;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final rrect = RRect.fromRectAndRadius(rect, const Radius.circular(4));

    // 背景
    if (isWinTile) {
      const gradient = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFFFFF8E1),
          Color(0xFFFFECB3),
        ],
      );
      final paint = Paint()..shader = gradient.createShader(rect);
      canvas.drawRRect(rrect, paint);
    } else {
      canvas.drawRRect(rrect, Paint()..color = const Color(0xFFF5F5F0));
    }

    // 枠線
    final borderColor = isDora
        ? const Color(0xFFE53E3E)
        : isWinTile
            ? const Color(0xFFD4A017)
            : const Color(0xFFCCCCBB);
    canvas.drawRRect(
      rrect,
      Paint()
        ..color = borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = isDora ? 2.5 : 1.5,
    );

    // テキスト描画
    _drawTileContent(canvas, size);

    // ドラバッジ
    if (isDora) {
      _drawDoraBadge(canvas, size);
    }
  }

  void _drawTileContent(Canvas canvas, Size size) {
    switch (tile.type) {
      case TileType.man:
        _drawSuitTile(canvas, size, '${tile.number}', const Color(0xFFE53E3E));
        break;
      case TileType.pin:
        _drawSuitTile(canvas, size, '${tile.number}', const Color(0xFF2B6CB0));
        break;
      case TileType.sou:
        _drawSuitTile(canvas, size, '${tile.number}', const Color(0xFF2F855A));
        break;
      case TileType.wind:
        _drawHonorTile(canvas, size, tile.displayChar, const Color(0xFF2D3748));
        break;
      case TileType.dragon:
        _drawDragonTile(canvas, size);
        break;
    }
  }

  void _drawSuitTile(Canvas canvas, Size size, String number, Color color) {
    // 数字
    final numPainter = TextPainter(
      text: TextSpan(
        text: number,
        style: TextStyle(
          color: color,
          fontSize: 22,
          fontWeight: FontWeight.w900,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    numPainter.layout();
    numPainter.paint(
      canvas,
      Offset((size.width - numPainter.width) / 2, 2),
    );

    // スート記号（図形で描画 — フォント不要）
    final centerX = size.width / 2;
    final symbolY = size.height - 14.0;
    final bgColor = isWinTile ? const Color(0xFFFFECB3) : const Color(0xFFF5F5F0);

    switch (tile.type) {
      case TileType.pin:
        // 筒子: 二重丸
        canvas.drawCircle(Offset(centerX, symbolY), 7, Paint()..color = color);
        canvas.drawCircle(Offset(centerX, symbolY), 5, Paint()..color = bgColor);
        canvas.drawCircle(Offset(centerX, symbolY), 3, Paint()..color = color);
        break;
      case TileType.sou:
        // 索子: 竹（縦線 + 節）
        final stickPaint = Paint()
          ..color = color
          ..strokeWidth = 2.5
          ..strokeCap = StrokeCap.round;
        canvas.drawLine(
          Offset(centerX, symbolY - 7),
          Offset(centerX, symbolY + 7),
          stickPaint,
        );
        final nodePaint = Paint()
          ..color = color
          ..strokeWidth = 1.5
          ..strokeCap = StrokeCap.round;
        canvas.drawLine(
          Offset(centerX - 4, symbolY - 2),
          Offset(centerX + 4, symbolY - 2),
          nodePaint,
        );
        canvas.drawLine(
          Offset(centerX - 4, symbolY + 2),
          Offset(centerX + 4, symbolY + 2),
          nodePaint,
        );
        break;
      case TileType.man:
        // 萬子: 菱形
        final path = Path()
          ..moveTo(centerX, symbolY - 7)
          ..lineTo(centerX + 7, symbolY)
          ..lineTo(centerX, symbolY + 7)
          ..lineTo(centerX - 7, symbolY)
          ..close();
        canvas.drawPath(path, Paint()..color = color);
        break;
      default:
        break;
    }
  }

  void _drawHonorTile(Canvas canvas, Size size, String char, Color color) {
    final painter = TextPainter(
      text: TextSpan(
        text: char,
        style: TextStyle(
          color: color,
          fontSize: 28,
          fontWeight: FontWeight.w900,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    painter.layout();
    painter.paint(
      canvas,
      Offset(
        (size.width - painter.width) / 2,
        (size.height - painter.height) / 2,
      ),
    );
  }

  void _drawDragonTile(Canvas canvas, Size size) {
    Color color;
    switch (tile.number) {
      case 1: // 白
        color = const Color(0xFF9E9E9E);
        break;
      case 2: // 發
        color = const Color(0xFF2F855A);
        break;
      case 3: // 中
        color = const Color(0xFFE53E3E);
        break;
      default:
        color = const Color(0xFF2D3748);
    }
    _drawHonorTile(canvas, size, tile.displayChar, color);
  }

  void _drawDoraBadge(Canvas canvas, Size size) {
    final center = Offset(size.width - 6, 6);
    canvas.drawCircle(center, 6, Paint()..color = const Color(0xFFE53E3E));
    final painter = TextPainter(
      text: const TextSpan(
        text: 'D',
        style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
      ),
      textDirection: TextDirection.ltr,
    );
    painter.layout();
    painter.paint(canvas, Offset(center.dx - painter.width / 2, center.dy - painter.height / 2));
  }

  @override
  bool shouldRepaint(covariant TilePainter oldDelegate) {
    return tile.key != oldDelegate.tile.key ||
        isWinTile != oldDelegate.isWinTile ||
        isDora != oldDelegate.isDora;
  }
}
