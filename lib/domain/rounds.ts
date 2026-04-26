import { z } from "zod";
import { DEFAULT_ROUND_CONFIG, PAR_TEMPLATES } from "@/lib/domain/constants";
import type { HoleScore, Round, RoundConfig, RoundRecord, RoundType } from "@/lib/domain/types";

const roundTypeSchema = z.enum(["FULL_18", "HALF_9", "SHORT"]);

export const createRoundInputSchema = z.object({
  playedAt: z.string().min(1),
  courseId: z.string().nullable().optional(),
  courseName: z.string().max(80),
  roundType: roundTypeSchema,
  configSnapshot: z.object({
    fw: z.boolean(),
    gir: z.boolean(),
    ob: z.boolean(),
    bunker: z.boolean(),
    puttUnknown: z.boolean(),
  }),
  holePars: z.array(z.number().int().min(3).max(6)).optional(),
});

export type CreateRoundInput = z.infer<typeof createRoundInputSchema>;

export function createRoundRecord(input: CreateRoundInput): RoundRecord {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const parsed = createRoundInputSchema.parse(input);
  const holePars = parsed.holePars ?? PAR_TEMPLATES[parsed.roundType];

  const round: Round = {
    id,
    playedAt: parsed.playedAt,
    startedAt: now,
    finishedAt: null,
    status: "IN_PROGRESS",
    courseId: parsed.courseId ?? null,
    courseName: parsed.courseName.trim(),
    roundType: parsed.roundType,
    holesCount: holePars.length,
    holePars,
    currentHoleNo: 1,
    configSnapshot: parsed.configSnapshot,
    totalScore: null,
    lastInputAt: now,
  };

  return {
    round,
    holes: holePars.map((par, index) => createEmptyHole(round.id, index + 1, par)),
  };
}

export function createEmptyHole(roundId: string, holeNo: number, par: number): HoleScore {
  return {
    roundId,
    holeNo,
    par,
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
    updatedAt: new Date().toISOString(),
  };
}

export function mergeConfig(config?: Partial<RoundConfig>): RoundConfig {
  return {
    ...DEFAULT_ROUND_CONFIG,
    ...config,
  };
}

export function roundTypeFromLabel(value: string): RoundType {
  if (value === "HALF_9" || value === "SHORT") return value;
  return "FULL_18";
}
