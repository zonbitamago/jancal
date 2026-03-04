import 'package:flutter_test/flutter_test.dart';

import 'package:jancal/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const JanCalApp());
    expect(find.text('雀カル'), findsOneWidget);
    expect(find.text('初級'), findsOneWidget);
    expect(find.text('中級'), findsOneWidget);
    expect(find.text('上級'), findsOneWidget);
  });
}
