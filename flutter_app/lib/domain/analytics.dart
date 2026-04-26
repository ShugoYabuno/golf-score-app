import 'models.dart';

double? _average(List<num> values) {
  if (values.isEmpty) return null;
  final total = values.fold<num>(0, (sum, value) => sum + value);
  return total / values.length;
}

double? _averageForDefined(List<int?> values) {
  final filtered = values.whereType<int>().toList();
  return _average(filtered);
}

bool? _isGir(HoleScore hole) {
  final strokes = hole.strokes;
  final putts = hole.putts;
  if (strokes == null || putts == null) return null;
  return strokes - putts <= hole.par - 2;
}

class AnalyticsSnapshot {
  const AnalyticsSnapshot({
    required this.roundCount,
    required this.bestScore,
    required this.averageScore,
    required this.recentFiveAverage,
    required this.averagePutts,
    required this.puttSampleCount,
    required this.girRate,
    required this.girSampleCount,
    required this.fwRate,
    required this.fwSampleCount,
    required this.penaltyAverage,
    required this.penaltySampleCount,
  });

  final int roundCount;
  final int? bestScore;
  final double? averageScore;
  final double? recentFiveAverage;
  final double? averagePutts;
  final int puttSampleCount;
  final double? girRate;
  final int girSampleCount;
  final double? fwRate;
  final int fwSampleCount;
  final double? penaltyAverage;
  final int penaltySampleCount;
}

List<RoundRecord> _completedRounds(
    List<RoundRecord> records, RoundType roundType) {
  return records.where((record) {
    return record.round.status == RoundStatus.completed &&
        record.round.roundType == roundType;
  }).toList();
}

AnalyticsSnapshot calculateAnalytics(
    List<RoundRecord> records, RoundType roundType) {
  final targetRounds = _completedRounds(records, roundType)
    ..sort((a, b) => b.round.playedAt.compareTo(a.round.playedAt));

  final totalScores = targetRounds
      .map((record) => record.round.totalScore)
      .whereType<int>()
      .toList();

  final allHoles = targetRounds.expand((record) => record.holes).toList();
  final girValues = allHoles.map(_isGir).whereType<bool>().toList();
  final fwHoles =
      allHoles.where((hole) => hole.fwKeep != null && hole.par >= 4).toList();

  return AnalyticsSnapshot(
    roundCount: targetRounds.length,
    bestScore: totalScores.isEmpty
        ? null
        : totalScores.reduce((a, b) => a < b ? a : b),
    averageScore: _average(totalScores),
    recentFiveAverage: _average(totalScores.take(5).toList()),
    averagePutts:
        _averageForDefined(allHoles.map((hole) => hole.putts).toList()),
    puttSampleCount: allHoles.where((hole) => hole.putts != null).length,
    girRate: girValues.isEmpty
        ? null
        : girValues.where((isGir) => isGir).length / girValues.length,
    girSampleCount: girValues.length,
    fwRate: fwHoles.isEmpty
        ? null
        : fwHoles.where((hole) => hole.fwKeep == true).length / fwHoles.length,
    fwSampleCount: fwHoles.length,
    penaltyAverage:
        _average(allHoles.map((hole) => hole.penaltyTotal).toList()),
    penaltySampleCount: allHoles.length,
  );
}

List<RoundSummary> toRoundSummaries(List<RoundRecord> records) {
  final summaries = records
      .map(
        (record) => RoundSummary(
          id: record.round.id,
          playedAt: record.round.playedAt,
          courseId: record.round.courseId,
          courseName: record.round.courseName,
          roundType: record.round.roundType,
          status: record.round.status,
          totalScore: record.round.totalScore,
          lastInputAt: record.round.lastInputAt,
        ),
      )
      .toList();

  summaries.sort((a, b) => b.playedAt.compareTo(a.playedAt));
  return summaries;
}

int? calcRoundTotal(List<HoleScore> holes) {
  final filled = holes.map((hole) => hole.strokes).whereType<int>().toList();
  if (filled.length != holes.length) return null;
  return filled.fold<int>(0, (sum, value) => sum + value);
}
