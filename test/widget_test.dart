import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:jancal/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(const JanCalApp());
    await tester.pumpAndSettle();
    expect(find.text('雀カル'), findsOneWidget);
    expect(find.text('初級'), findsOneWidget);
    expect(find.text('中級'), findsOneWidget);
    expect(find.text('上級'), findsOneWidget);
  });
}
