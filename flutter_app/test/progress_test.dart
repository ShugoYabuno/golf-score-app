import 'package:flutter_test/flutter_test.dart';
import 'package:golf_score_app_flutter/domain/models.dart';
import 'package:golf_score_app_flutter/domain/progress.dart';

void main() {
  final baseRecord = RoundRecord(
    round: Round(
      id: 'round-1',
      playedAt: '2026-04-20T09:00:00.000Z',
      startedAt: '2026-04-20T09:00:00.000Z',
      finishedAt: null,
      status: RoundStatus.inProgress,
      courseId: null,
      courseName: 'Sample Golf',
      roundType: RoundType.full18,
      holesCount: 2,
      holePars: const [4, 3],
      currentHoleNo: 1,
      configSnapshot: const RoundConfig(
        fw: true,
        gir: true,
        ob: true,
        bunker: false,
        puttUnknown: true,
      ),
      totalScore: null,
      lastInputAt: '2026-04-20T09:00:00.000Z',
    ),
    holes: const [
      HoleScore(
        roundId: 'round-1',
        holeNo: 1,
        par: 4,
        strokes: 5,
        putts: null,
        teeShotDirection: null,
        puttsUnknown: false,
        penaltyTotal: 0,
        obCount: 0,
        otherPenaltyCount: 0,
        fwKeep: null,
        gir: null,
        bunkerIn: null,
        bunkerCount: 0,
        updatedAt: '2026-04-20T09:05:00.000Z',
      ),
      HoleScore(
        roundId: 'round-1',
        holeNo: 2,
        par: 3,
        strokes: null,
        putts: null,
        teeShotDirection: null,
        puttsUnknown: false,
        penaltyTotal: 0,
        obCount: 0,
        otherPenaltyCount: 0,
        fwKeep: null,
        gir: null,
        bunkerIn: null,
        bunkerCount: 0,
        updatedAt: '2026-04-20T09:05:00.000Z',
      ),
    ],
  );

  test(
      'treats a hole as complete once strokes exist even when putts are missing',
      () {
    expect(
        isHoleRequiredComplete(
            baseRecord.holes[0], baseRecord.round.configSnapshot),
        isTrue);
    expect(findFirstIncompleteHole(baseRecord), 2);
    expect(isRoundReadyToComplete(baseRecord), isFalse);
  });
}
