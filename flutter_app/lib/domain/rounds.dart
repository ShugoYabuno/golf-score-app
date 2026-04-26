import 'package:uuid/uuid.dart';

import 'constants.dart';
import 'models.dart';

const _uuid = Uuid();

class CreateRoundInput {
  const CreateRoundInput({
    required this.playedAt,
    required this.courseId,
    required this.courseName,
    required this.roundType,
    required this.configSnapshot,
    this.holePars,
  });

  final String playedAt;
  final String? courseId;
  final String courseName;
  final RoundType roundType;
  final RoundConfig configSnapshot;
  final List<int>? holePars;
}

RoundRecord createRoundRecord(CreateRoundInput input) {
  final now = DateTime.now().toIso8601String();
  final id = _uuid.v4();
  final normalizedName =
      input.courseName.trim().isEmpty ? '未設定コース' : input.courseName.trim();
  final holePars = input.holePars ?? parTemplates[input.roundType]!;

  final round = Round(
    id: id,
    playedAt: input.playedAt,
    startedAt: now,
    finishedAt: null,
    status: RoundStatus.inProgress,
    courseId: input.courseId,
    courseName: normalizedName,
    roundType: input.roundType,
    holesCount: holePars.length,
    holePars: holePars,
    currentHoleNo: 1,
    configSnapshot: input.configSnapshot,
    totalScore: null,
    lastInputAt: now,
  );

  return RoundRecord(
    round: round,
    holes: [
      for (var i = 0; i < holePars.length; i++)
        createEmptyHole(round.id, i + 1, holePars[i]),
    ],
  );
}

HoleScore createEmptyHole(String roundId, int holeNo, int par) {
  return HoleScore(
    roundId: roundId,
    holeNo: holeNo,
    par: par,
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
    updatedAt: DateTime.now().toIso8601String(),
  );
}

RoundConfig mergeConfig([RoundConfig? config]) {
  if (config == null) return defaultRoundConfig;
  return defaultRoundConfig.copyWith(
    fw: config.fw,
    gir: config.gir,
    ob: config.ob,
    bunker: config.bunker,
    puttUnknown: config.puttUnknown,
  );
}
