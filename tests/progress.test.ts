import { describe, expect, it } from "vitest";
import { findFirstIncompleteHole, isHoleRequiredComplete, isRoundReadyToComplete } from "../lib/domain/progress";
import type { RoundRecord } from "../lib/domain/types";

const baseRecord: RoundRecord = {
  round: {
    id: "round-1",
    playedAt: "2026-04-20T09:00:00.000Z",
    startedAt: "2026-04-20T09:00:00.000Z",
    finishedAt: null,
    status: "IN_PROGRESS",
    courseId: null,
    courseName: "Sample Golf",
    roundType: "FULL_18",
    holesCount: 2,
    holePars: [4, 3],
    currentHoleNo: 1,
    configSnapshot: {
      fw: true,
      gir: true,
      ob: true,
      bunker: false,
      puttUnknown: true,
    },
    totalScore: null,
    lastInputAt: "2026-04-20T09:00:00.000Z",
  },
  holes: [
    {
      roundId: "round-1",
      holeNo: 1,
      par: 4,
      strokes: 5,
      putts: null,
      puttsUnknown: false,
      penaltyTotal: 0,
      obCount: 0,
      otherPenaltyCount: 0,
      fwKeep: null,
      gir: null,
      bunkerIn: null,
      updatedAt: "2026-04-20T09:05:00.000Z",
    },
    {
      roundId: "round-1",
      holeNo: 2,
      par: 3,
      strokes: null,
      putts: null,
      puttsUnknown: false,
      penaltyTotal: 0,
      obCount: 0,
      otherPenaltyCount: 0,
      fwKeep: null,
      gir: null,
      bunkerIn: null,
      updatedAt: "2026-04-20T09:05:00.000Z",
    },
  ],
};

describe("progress helpers", () => {
  it("treats a hole as complete once strokes exist even when putts are missing", () => {
    expect(isHoleRequiredComplete(baseRecord.holes[0], baseRecord.round.configSnapshot)).toBe(true);
    expect(findFirstIncompleteHole(baseRecord)).toBe(2);
    expect(isRoundReadyToComplete(baseRecord)).toBe(false);
  });
});
