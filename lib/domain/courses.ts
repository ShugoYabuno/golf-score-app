import type { CourseConfidence, CourseSource, GolfCourse, RoundType } from "@/lib/domain/types";

const standard18 = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 4, 5];
const strategic18 = [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5, 4];
const resort18 = [5, 4, 3, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5, 4, 3, 4, 4, 5];
const half9 = [4, 4, 3, 5, 4, 3, 4, 5, 4];
const links9 = [5, 4, 3, 4, 4, 3, 5, 4, 4];
const short9 = [3, 3, 3, 3, 3, 3, 3, 3, 3];
const SEED_UPDATED_AT = "2026-04-23T00:00:00.000Z";

function preset(
  id: string,
  roundType: RoundType,
  label: string,
  holePars: number[],
  confidence: CourseConfidence = "unverified",
  source: CourseSource = "manual",
) {
  return {
    id,
    roundType,
    label,
    holePars,
    source,
    confidence,
    verifiedAt: confidence === "unverified" ? undefined : SEED_UPDATED_AT,
  };
}

export const COURSE_CATALOG: GolfCourse[] = [
  {
    id: "narashino-cc",
    name: "習志野カントリークラブ",
    prefecture: "千葉",
    area: "関東",
    category: "REGULAR",
    source: "manual",
    externalIds: {
      rakutenGora: "seed-narashino",
    },
    description: "トーナメント気分で回れる、王道18ホール向けスターター。",
    presets: [
      preset("narashino-king-queen-18", "FULL_18", "King & Queen 18H", strategic18),
      preset("narashino-front-9", "HALF_9", "Front 9", half9),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "wakasu-links",
    name: "若洲ゴルフリンクス",
    prefecture: "東京",
    area: "関東",
    category: "REGULAR",
    source: "manual",
    externalIds: {
      rakutenGora: "seed-wakasu",
    },
    description: "海風を意識したリンクス風ラウンドの練習向け。",
    presets: [
      preset("wakasu-seaside-18", "FULL_18", "Seaside 18H", standard18),
      preset("wakasu-bay-9", "HALF_9", "Bay 9", links9),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "sapporo-classic",
    name: "札幌クラシックゴルフ倶楽部",
    prefecture: "北海道",
    area: "北海道",
    category: "REGULAR",
    source: "manual",
    description: "広さと戦略性のバランスを見ながら振り返るのに向く構成。",
    presets: [
      preset("sapporo-classic-18", "FULL_18", "Classic 18H", resort18),
      preset("sapporo-morning-9", "HALF_9", "Morning 9", half9),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "hirono-style",
    name: "廣野スタイルコース",
    prefecture: "兵庫",
    area: "関西",
    category: "REGULAR",
    source: "manual",
    description: "狙いどころを考えるタイプの18H向けプリセット。",
    presets: [
      preset("hirono-championship-18", "FULL_18", "Championship 18H", strategic18),
      preset("hirono-practice-9", "HALF_9", "Practice 9", links9),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "phoenix-resort",
    name: "フェニックスリゾートGC",
    prefecture: "宮崎",
    area: "九州",
    category: "REGULAR",
    source: "manual",
    description: "リゾート感のある18Hと、気軽な9Hの両方を想定。",
    presets: [
      preset("phoenix-resort-18", "FULL_18", "Resort 18H", resort18),
      preset("phoenix-twilight-9", "HALF_9", "Twilight 9", half9),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "urban-short-nine",
    name: "アーバンショートナイン",
    prefecture: "神奈川",
    area: "関東",
    category: "SHORT",
    source: "manual",
    description: "ショートゲームの記録と比較を分離したい日に使うプリセット。",
    presets: [preset("urban-short-9", "SHORT", "Short 9", short9, "user_verified")],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "green-terrace-short",
    name: "グリーンテラスショートコース",
    prefecture: "静岡",
    area: "中部",
    category: "SHORT",
    source: "manual",
    description: "Par3中心で、アプローチとパットの反復に向いたショートコース。",
    presets: [
      preset(
        "green-terrace-short-9",
        "SHORT",
        "Terrace Short 9",
        [3, 3, 3, 3, 4, 3, 3, 4, 3],
        "user_verified",
      ),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
  {
    id: "seaside-short-links",
    name: "シーサイドショートリンクス",
    prefecture: "福岡",
    area: "九州",
    category: "SHORT",
    source: "manual",
    description: "ショートでもPar4を少し含む、実戦寄りの比較がしやすい構成。",
    presets: [
      preset(
        "seaside-short-links-9",
        "SHORT",
        "Links Short 9",
        [3, 4, 3, 3, 3, 4, 3, 3, 3],
        "user_verified",
      ),
    ],
    updatedAt: SEED_UPDATED_AT,
  },
];

export function findCourseById(courseId: string | null | undefined, courses = COURSE_CATALOG) {
  if (!courseId) return null;
  return courses.find((course) => course.id === courseId) ?? null;
}

export function parBreakdown(holePars: number[]) {
  return holePars.reduce(
    (acc, par) => {
      if (par === 3) acc.par3 += 1;
      if (par === 4) acc.par4 += 1;
      if (par === 5) acc.par5 += 1;
      return acc;
    },
    { par3: 0, par4: 0, par5: 0 },
  );
}

export function createUserCourse(input: {
  name: string;
  prefecture?: string;
  area?: string;
  category: "REGULAR" | "SHORT";
  roundType: RoundType;
  holePars: number[];
}): GolfCourse {
  const now = new Date().toISOString();
  const id = `user-${crypto.randomUUID()}`;

  return {
    id,
    name: input.name.trim() || "ユーザー登録コース",
    prefecture: input.prefecture ?? "未設定",
    area: input.area ?? "ユーザー登録",
    category: input.category,
    source: "user",
    description: "ユーザーがホールごとのParを編集して保存したコース。",
    presets: [
      {
        id: `${id}-${input.roundType.toLowerCase()}`,
        roundType: input.roundType,
        label: input.category === "SHORT" ? "User Short Course" : "User Course Layout",
        holePars: input.holePars,
        source: "user",
        confidence: "user_verified",
        verifiedAt: now,
      },
    ],
    updatedAt: now,
  };
}

export function upsertUserPreset(
  course: GolfCourse,
  input: {
    roundType: RoundType;
    label: string;
    holePars: number[];
  },
): GolfCourse {
  const now = new Date().toISOString();
  const presetId = `${course.id}-${input.roundType.toLowerCase()}-user`;
  const nextPreset = {
    id: presetId,
    roundType: input.roundType,
    label: input.label,
    holePars: input.holePars,
    source: "user" as const,
    confidence: "user_verified" as const,
    verifiedAt: now,
  };

  return {
    ...course,
    source: course.source === "user" ? "user" : course.source,
    presets: [
      nextPreset,
      ...course.presets.filter(
        (preset) => !(preset.id === presetId || preset.roundType === input.roundType),
      ),
    ],
    updatedAt: now,
  };
}
