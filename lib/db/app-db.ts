"use client";

import Dexie, { type Table } from "dexie";
import { COURSE_CATALOG } from "@/lib/domain/courses";
import { DEFAULT_ROUND_CONFIG, DEFAULT_UI_PREFERENCES } from "@/lib/domain/constants";
import type { GolfCourse, HoleScore, Round, RoundConfig, RoundRecord, UiPreferences } from "@/lib/domain/types";

export type AppSettings = {
  id: "app";
  roundDefaults: RoundConfig;
  uiPreferences: UiPreferences;
};

class GolfScoreDB extends Dexie {
  rounds!: Table<Round, string>;
  holes!: Table<HoleScore, [string, number]>;
  settings!: Table<AppSettings, string>;
  courses!: Table<GolfCourse, string>;

  constructor() {
    super("golf-score-app");

    this.version(1).stores({
      rounds: "id, status, playedAt, roundType, lastInputAt",
      holes: "[roundId+holeNo], roundId, holeNo",
      settings: "id",
    });

    this.version(2).stores({
      rounds: "id, status, playedAt, roundType, lastInputAt",
      holes: "[roundId+holeNo], roundId, holeNo",
      settings: "id",
      courses: "id, name, prefecture, area, category, source",
    });
  }
}

export const db = new GolfScoreDB();

export async function getSettings() {
  const settings = await db.settings.get("app");
  if (!settings) return null;
  return {
    ...settings,
    roundDefaults: {
      ...DEFAULT_ROUND_CONFIG,
      ...settings.roundDefaults,
    },
    uiPreferences: {
      ...DEFAULT_UI_PREFERENCES,
      ...settings.uiPreferences,
    },
  };
}

export async function saveSettings(input: {
  roundDefaults?: RoundConfig;
  uiPreferences?: UiPreferences;
}) {
  const current = await getSettings();
  await db.settings.put({
    id: "app",
    roundDefaults: {
      ...DEFAULT_ROUND_CONFIG,
      ...(current?.roundDefaults ?? {}),
      ...(input.roundDefaults ?? {}),
    },
    uiPreferences: {
      ...DEFAULT_UI_PREFERENCES,
      ...(current?.uiPreferences ?? {}),
      ...(input.uiPreferences ?? {}),
    },
  });
}

export async function seedCourseCatalog() {
  const existingCount = await db.courses.count();
  if (existingCount > 0) return;
  await db.courses.bulkPut(COURSE_CATALOG);
}

export async function listCourses() {
  await seedCourseCatalog();
  return db.courses.orderBy("name").toArray();
}

export async function saveCourse(course: GolfCourse) {
  await db.courses.put(course);
  return course;
}

export async function listRoundRecords(): Promise<RoundRecord[]> {
  const rounds = await db.rounds.orderBy("playedAt").reverse().toArray();
  const roundIds = rounds.map((round) => round.id);
  const holes = roundIds.length
    ? await db.holes.where("roundId").anyOf(roundIds).toArray()
    : [];

  return rounds.map((round) => ({
    round,
    holes: holes
      .filter((hole) => hole.roundId === round.id)
      .sort((a, b) => a.holeNo - b.holeNo),
  }));
}

export async function getInProgressRound() {
  return db.rounds.where("status").equals("IN_PROGRESS").first();
}

export async function saveRoundRecord(record: RoundRecord) {
  await db.transaction("rw", db.rounds, db.holes, async () => {
    await db.rounds.put(record.round);
    await db.holes.bulkPut(record.holes);
  });
}
