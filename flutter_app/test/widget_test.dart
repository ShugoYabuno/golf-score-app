import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:golf_score_app_flutter/main.dart';

void main() {
  testWidgets('shows the app shell', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const GolfScoreApp());
    await tester.pumpAndSettle();

    expect(find.text('Golf Score App'), findsOneWidget);
  });
}
