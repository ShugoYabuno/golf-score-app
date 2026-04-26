import { describe, expect, it } from "vitest";
import { COURSE_CATALOG, parBreakdown } from "../lib/domain/courses";

describe("course catalog", () => {
  it("includes short course presets and keeps par breakdowns in app data", () => {
    const shortCourses = COURSE_CATALOG.filter((course) => course.category === "SHORT");
    expect(shortCourses.length).toBeGreaterThan(0);

    const breakdown = parBreakdown(shortCourses[0].presets[0].holePars);
    expect(breakdown.par3 + breakdown.par4 + breakdown.par5).toBe(
      shortCourses[0].presets[0].holePars.length,
    );
  });
});
