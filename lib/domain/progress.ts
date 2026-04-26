import type { HoleScore, RoundConfig, RoundRecord } from "@/lib/domain/types";

export function isHoleRequiredComplete(hole: HoleScore, config: RoundConfig) {
  void config;
  return hole.strokes != null;
}

export function findFirstIncompleteHole(record: RoundRecord) {
  return (
    record.holes.find((hole) => !isHoleRequiredComplete(hole, record.round.configSnapshot))
      ?.holeNo ?? record.round.holesCount
  );
}

export function isRoundReadyToComplete(record: RoundRecord) {
  return record.holes.every((hole) => isHoleRequiredComplete(hole, record.round.configSnapshot));
}
