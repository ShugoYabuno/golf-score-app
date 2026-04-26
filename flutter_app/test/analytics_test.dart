import 'package:flutter_test/flutter_test.dart';
import 'package:golf_score_app_flutter/domain/analytics.dart';
import 'package:golf_score_app_flutter/domain/models.dart';

void main() {
  final baseRecord = RoundRecord(
    round: Round(
      id: 'round-1',
      playedAt: '2026-04-19T09:00:00.000Z',
      startedAt: '2026-04-19T09:00:00.000Z',
      finishedAt: '2026-04-19T14:00:00.000Z',
      status: RoundStatus.completed,
      courseId: null,
      courseName: 'Sample Golf',
      roundType: RoundType.full18,
      holesCount: 2,
      holePars: const [4, 3],
      currentHoleNo: 2,
      configSnapshot: const RoundConfig(
        fw: true,
        gir: true,
        ob: true,
        bunker: false,
        puttUnknown: true,
      ),
      totalScore: 9,
      lastInputAt: '2026-04-19T14:00:00.000Z',
    ),
    holes: const [
      HoleScore(
        roundId: 'round-1',
        holeNo: 1,
        par: 4,
        strokes: 5,
        putts: 2,
        teeShotDirection: null,
        puttsUnknown: false,
        penaltyTotal: 1,
        obCount: 1,
        otherPenaltyCount: 0,
        fwKeep: true,
        gir: false,
        bunkerIn: null,
        bunkerCount: 0,
        updatedAt: '2026-04-19T09:30:00.000Z',
      ),
      HoleScore(
        roundId: 'round-1',
        holeNo: 2,
        par: 3,
        strokes: 4,
        putts: null,
        teeShotDirection: null,
        puttsUnknown: true,
        penaltyTotal: 0,
        obCount: 0,
        otherPenaltyCount: 0,
        fwKeep: null,
        gir: true,
        bunkerIn: null,
        bunkerCount: 0,
        updatedAt: '2026-04-19T09:40:00.000Z',
      ),
    ],
  );

  test('keeps round types isolated and reports sample counts', () {
    final analytics = calculateAnalytics([baseRecord], RoundType.full18);

    expect(analytics.roundCount, 1);
    expect(analytics.bestScore, 9);
    expect(analytics.averageScore, 9);
    expect(analytics.puttSampleCount, 1);
    expect(analytics.girSampleCount, 1);
    expect(analytics.girRate, 0);
    expect(analytics.fwSampleCount, 1);
    expect(analytics.fwRate, 1);
  });
}
