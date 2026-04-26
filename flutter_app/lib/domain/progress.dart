import 'models.dart';

bool isHoleRequiredComplete(HoleScore hole, RoundConfig config) {
  void config;
  return hole.strokes != null;
}

int findFirstIncompleteHole(RoundRecord record) {
  for (final hole in record.holes) {
    if (!isHoleRequiredComplete(hole, record.round.configSnapshot)) {
      return hole.holeNo;
    }
  }
  return record.round.holesCount;
}

bool isRoundReadyToComplete(RoundRecord record) {
  return record.holes
      .every((hole) => isHoleRequiredComplete(hole, record.round.configSnapshot));
}
