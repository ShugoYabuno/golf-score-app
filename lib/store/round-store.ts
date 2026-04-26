"use client";

import { create } from "zustand";
import { calcRoundTotal } from "@/lib/domain/analytics";
import { DEFAULT_UI_PREFERENCES } from "@/lib/domain/constants";
import { createRoundRecord, mergeConfig } from "@/lib/domain/rounds";
import { isRoundReadyToComplete } from "@/lib/domain/progress";
import type { GolfCourse, HoleScore, RoundConfig, RoundRecord, RoundType, UiPreferences } from "@/lib/domain/types";
import { getInProgressRound, listCourses, listRoundRecords, saveCourse, saveRoundRecord, db, getSettings, saveSettings } from "@/lib/db/app-db";

type RoundStore = {
  currentRound: RoundRecord | null;
  rounds: RoundRecord[];
  courses: GolfCourse[];
  roundDefaults: RoundConfig;
  uiPreferences: UiPreferences;
  hydrated: boolean;
  boot: () => Promise<void>;
  startRound: (input: {
    playedAt: string;
    courseId?: string | null;
    courseName: string;
    roundType: RoundType;
    holePars?: number[];
  }) => Promise<void>;
  updateHole: (holeNo: number, patch: Partial<HoleScore>) => Promise<void>;
  goToHole: (holeNo: number) => Promise<void>;
  completeRound: () => Promise<boolean>;
  saveCourseMaster: (course: GolfCourse) => Promise<void>;
  saveDefaults: (config: RoundConfig) => Promise<void>;
  saveUiPreferences: (preferences: Partial<UiPreferences>) => Promise<void>;
};

function touchRound(record: RoundRecord): RoundRecord {
  const totalScore = calcRoundTotal(record.holes);

  return {
    round: {
      ...record.round,
      totalScore,
      lastInputAt: new Date().toISOString(),
    },
    holes: record.holes,
  };
}

export const useRoundStore = create<RoundStore>((set, get) => ({
  currentRound: null,
  rounds: [],
  courses: [],
  roundDefaults: mergeConfig(),
  uiPreferences: DEFAULT_UI_PREFERENCES,
  hydrated: false,
  async boot() {
    const [records, currentRound, settings, courses] = await Promise.all([
      listRoundRecords(),
      getInProgressRound(),
      getSettings(),
      listCourses(),
    ]);

    let currentRecord: RoundRecord | null = null;
    if (currentRound) {
      const currentHoles = await db.holes
        .where("roundId")
        .equals(currentRound.id)
        .sortBy("holeNo");
      currentRecord = {
        round: currentRound,
        holes: currentHoles,
      };
    }

    set({
      rounds: records,
      courses,
      currentRound: currentRecord,
      roundDefaults: mergeConfig(settings?.roundDefaults),
      uiPreferences: {
        ...DEFAULT_UI_PREFERENCES,
        ...(settings?.uiPreferences ?? {}),
      },
      hydrated: true,
    });
  },
  async startRound(input) {
    const configSnapshot = get().roundDefaults;
    const record = createRoundRecord({
      ...input,
      configSnapshot,
      courseName: input.courseName,
    });

    await saveRoundRecord(record);
    set((state) => ({
      currentRound: record,
      rounds: [record, ...state.rounds.filter((item) => item.round.id !== record.round.id)],
    }));
  },
  async updateHole(holeNo, patch) {
    const current = get().currentRound;
    if (!current) return;

    const holes = current.holes.map((hole) =>
      hole.holeNo === holeNo
        ? {
            ...hole,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : hole,
    );

    const record = touchRound({
      round: current.round,
      holes,
    });

    set((state) => ({
      currentRound: record,
      rounds: [record, ...state.rounds.filter((item) => item.round.id !== record.round.id)],
    }));

    try {
      await saveRoundRecord(record);
    } catch (error) {
      console.error("Failed to save hole update", error);
    }
  },
  async goToHole(holeNo) {
    const current = get().currentRound;
    if (!current) return;

    const nextHoleNo = Math.min(Math.max(1, holeNo), current.round.holesCount);
    const record: RoundRecord = {
      round: {
        ...current.round,
        currentHoleNo: nextHoleNo,
        lastInputAt: new Date().toISOString(),
      },
      holes: current.holes,
    };

    set((state) => ({
      currentRound: record,
      rounds: [record, ...state.rounds.filter((item) => item.round.id !== record.round.id)],
    }));

    try {
      await saveRoundRecord(record);
    } catch (error) {
      console.error("Failed to save hole move", error);
    }
  },
  async completeRound() {
    const current = get().currentRound;
    if (!current) return false;
    if (!isRoundReadyToComplete(current)) return false;

    const completedAt = new Date().toISOString();
    const record: RoundRecord = {
      round: {
        ...current.round,
        status: "COMPLETED",
        finishedAt: completedAt,
        totalScore: calcRoundTotal(current.holes),
        lastInputAt: completedAt,
      },
      holes: current.holes,
    };

    await saveRoundRecord(record);

    set((state) => ({
      currentRound: null,
      rounds: [record, ...state.rounds.filter((item) => item.round.id !== record.round.id)],
    }));

    return true;
  },
  async saveCourseMaster(course) {
    await saveCourse(course);
    const courses = await listCourses();
    set({ courses });
  },
  async saveDefaults(config) {
    const merged = mergeConfig(config);
    await saveSettings({ roundDefaults: merged });
    set({ roundDefaults: merged });
  },
  async saveUiPreferences(preferences) {
    const merged = {
      ...get().uiPreferences,
      ...preferences,
    };
    await saveSettings({ uiPreferences: merged });
    set({ uiPreferences: merged });
  },
}));
