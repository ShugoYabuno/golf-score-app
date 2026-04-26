import { describe, expect, it } from "vitest";
import { calculateAnalytics } from "../lib/domain/analytics";
import type { RoundRecord } from "../lib/domain/types";

const baseRecord: RoundRecord = {
  round: {
    id: "round-1",
    playedAt: "2026-04-19T09:00:00.000Z",
    startedAt: "2026-04-19T09:00:00.000Z",
    finishedAt: "2026-04-19T14:00:00.000Z",
    status: "COMPLETED",
    courseName: "Sample Golf",
    roundType: "FULL_18",
    holesCount: 2,
    holePars: [4, 3],
    currentHoleNo: 2,
    configSnapshot: {
      fw: true,
      gir: true,
      ob: true,
      bunker: false,
      puttUnknown: true,
    },
    totalScore: 9,
    lastInputAt: "2026-04-19T14:00:00.000Z",
  },
  holes: [
    {
      roundId: "round-1",
      holeNo: 1,
      par: 4,
      strokes: 5,
      putts: 2,
      puttsUnknown: false,
      penaltyTotal: 1,
      obCount: 1,
      otherPenaltyCount: 0,
      fwKeep: true,
      gir: false,
      bunkerIn: null,
      updatedAt: "2026-04-19T09:30:00.000Z",
    },
    {
      roundId: "round-1",
      holeNo: 2,
      par: 3,
      strokes: 4,
      putts: null,
      puttsUnknown: true,
      penaltyTotal: 0,
      obCount: 0,
      otherPenaltyCount: 0,
      fwKeep: null,
      gir: true,
      bunkerIn: null,
      updatedAt: "2026-04-19T09:40:00.000Z",
    },
  ],
};

describe("calculateAnalytics", () => {
  it("keeps round types isolated and reports sample counts", () => {
    const analytics = calculateAnalytics([baseRecord], "FULL_18");

    expect(analytics.roundCount).toBe(1);
    expect(analytics.bestScore).toBe(9);
    expect(analytics.averageScore).toBe(9);
    expect(analytics.puttSampleCount).toBe(1);
    expect(analytics.girSampleCount).toBe(2);
    expect(analytics.fwSampleCount).toBe(1);
    expect(analytics.fwRate).toBe(1);
  });
});
