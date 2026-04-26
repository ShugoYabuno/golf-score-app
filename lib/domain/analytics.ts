import type { HoleScore, RoundRecord, RoundSummary, RoundType } from "@/lib/domain/types";

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageForDefined(values: Array<number | null>) {
  return average(values.filter((value): value is number => value != null));
}

export type AnalyticsSnapshot = {
  roundCount: number;
  bestScore: number | null;
  averageScore: number | null;
  recentFiveAverage: number | null;
  averagePutts: number | null;
  puttSampleCount: number;
  girRate: number | null;
  girSampleCount: number;
  fwRate: number | null;
  fwSampleCount: number;
  penaltyAverage: number | null;
  penaltySampleCount: number;
};

function completedRounds(records: RoundRecord[], roundType: RoundType) {
  return records.filter(
    ({ round }) => round.status === "COMPLETED" && round.roundType === roundType,
  );
}

export function calculateAnalytics(
  records: RoundRecord[],
  roundType: RoundType,
): AnalyticsSnapshot {
  const targetRounds = completedRounds(records, roundType).sort((a, b) =>
    b.round.playedAt.localeCompare(a.round.playedAt),
  );

  const totalScores = targetRounds
    .map(({ round }) => round.totalScore)
    .filter((score): score is number => score != null);

  const allHoles = targetRounds.flatMap(({ holes }) => holes);
  const girHoles = allHoles.filter((hole) => hole.gir != null);
  const fwHoles = allHoles.filter(
    (hole) => hole.fwKeep != null && hole.par >= 4,
  );

  return {
    roundCount: targetRounds.length,
    bestScore: totalScores.length ? Math.min(...totalScores) : null,
    averageScore: average(totalScores),
    recentFiveAverage: average(totalScores.slice(0, 5)),
    averagePutts: averageForDefined(allHoles.map((hole) => hole.putts)),
    puttSampleCount: allHoles.filter((hole) => hole.putts != null).length,
    girRate: girHoles.length
      ? girHoles.filter((hole) => hole.gir === true).length / girHoles.length
      : null,
    girSampleCount: girHoles.length,
    fwRate: fwHoles.length
      ? fwHoles.filter((hole) => hole.fwKeep === true).length / fwHoles.length
      : null,
    fwSampleCount: fwHoles.length,
    penaltyAverage: average(allHoles.map((hole) => hole.penaltyTotal)),
    penaltySampleCount: allHoles.length,
  };
}

export function toRoundSummaries(records: RoundRecord[]): RoundSummary[] {
  return records
    .map(({ round }) => ({
      id: round.id,
      playedAt: round.playedAt,
      courseId: round.courseId ?? null,
      courseName: round.courseName,
      roundType: round.roundType,
      status: round.status,
      totalScore: round.totalScore,
      lastInputAt: round.lastInputAt,
    }))
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

export function calcRoundTotal(holes: HoleScore[]) {
  const filled = holes
    .map((hole) => hole.strokes)
    .filter((value): value is number => value != null);

  if (filled.length !== holes.length) return null;
  return filled.reduce((sum, value) => sum + value, 0);
}
