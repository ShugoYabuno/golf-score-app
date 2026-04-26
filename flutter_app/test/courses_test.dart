import 'package:flutter_test/flutter_test.dart';
import 'package:golf_score_app_flutter/domain/courses.dart';
import 'package:golf_score_app_flutter/domain/models.dart';

void main() {
  test('includes short course presets and keeps par breakdowns in app data', () {
    final shortCourses = courseCatalog.where((course) => course.category == CourseCategory.short).toList();
    expect(shortCourses.isNotEmpty, isTrue);

    final breakdown = parBreakdown(shortCourses.first.presets.first.holePars);
    expect(
      breakdown.par3 + breakdown.par4 + breakdown.par5,
      shortCourses.first.presets.first.holePars.length,
    );
  });
}
