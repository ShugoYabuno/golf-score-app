export type RoundType = "FULL_18" | "HALF_9" | "SHORT";
export type RoundStatus = "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
export type CourseCategory = "REGULAR" | "SHORT";
export type CourseSource = "rakuten_gora" | "official" | "user" | "manual";
export type CourseConfidence = "official" | "user_verified" | "unverified";

export type RoundConfig = {
  fw: boolean;
  gir: boolean;
  ob: boolean;
  bunker: boolean;
  puttUnknown: boolean;
};

export type SwipeSensitivity = "low" | "medium" | "high";
export type FontScale = "normal" | "large" | "xlarge";
export type DistanceUnit = "yard" | "meter";
export type TeeShotDirection = "LEFT" | "RIGHT" | "SHORT" | "OVER";

export type UiPreferences = {
  highContrast: boolean;
  haptics: boolean;
  celebration: boolean;
  swipeSensitivity: SwipeSensitivity;
  fontScale: FontScale;
  distanceUnit: DistanceUnit;
};

export type HoleScore = {
  roundId: string;
  holeNo: number;
  par: number;
  strokes: number | null;
  putts: number | null;
  teeShotDirection?: TeeShotDirection | null;
  puttsUnknown: boolean;
  penaltyTotal: number;
  obCount: number;
  otherPenaltyCount: number;
  fwKeep: boolean | null;
  gir: boolean | null;
  bunkerIn: boolean | null;
  updatedAt: string;
};

export type Round = {
  id: string;
  playedAt: string;
  startedAt: string;
  finishedAt: string | null;
  status: RoundStatus;
  courseId?: string | null;
  courseName: string;
  roundType: RoundType;
  holesCount: number;
  holePars: number[];
  currentHoleNo: number;
  configSnapshot: RoundConfig;
  totalScore: number | null;
  lastInputAt: string;
};

export type RoundRecord = {
  round: Round;
  holes: HoleScore[];
};

export type RoundSummary = {
  id: string;
  playedAt: string;
  courseId?: string | null;
  courseName: string;
  roundType: RoundType;
  status: RoundStatus;
  totalScore: number | null;
  lastInputAt: string;
};

export type CoursePreset = {
  id: string;
  roundType: RoundType;
  label: string;
  holePars: number[];
  source: CourseSource;
  sourceUrl?: string;
  verifiedAt?: string;
  confidence: CourseConfidence;
};

export type ParBreakdown = {
  par3: number;
  par4: number;
  par5: number;
};

export type GolfCourse = {
  id: string;
  name: string;
  prefecture: string;
  area: string;
  category: CourseCategory;
  source: CourseSource;
  externalIds?: {
    rakutenGora?: string;
  };
  officialUrl?: string;
  description: string;
  presets: CoursePreset[];
  updatedAt: string;
};
