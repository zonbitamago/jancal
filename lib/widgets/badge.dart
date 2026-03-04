import 'package:flutter/material.dart';

class InfoBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;

  const InfoBadge({
    super.key,
    required this.label,
    this.color = const Color(0x33FFFFFF),
    this.textColor = Colors.white,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: textColor.withOpacity(0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
