import { describe, expect, it } from "vitest";
import { combineMatchDateTime, matchDate, venueAddress } from "@/lib/match-scheduling";

describe("match scheduling values", () => {
  it("retains the selected calendar date and local time", () => {
    expect(combineMatchDateTime(new Date(2026, 9, 24), "18:30")).toBe("2026-10-24T18:30");
  });
  it("does not submit a partial or invalid date and time", () => {
    expect(combineMatchDateTime(undefined, "18:30")).toBe("");
    expect(combineMatchDateTime(new Date(2026, 9, 24), "")).toBe("");
    expect(combineMatchDateTime(new Date(2026, 9, 24), "24:30")).toBe("");
    expect(matchDate("not-a-date")).toBeUndefined();
  });
  it("populates the entire address together with the venue name", () => {
    expect(venueAddress("Riverside Courts", "123 Main St, New York, NY 10001, USA")).toBe("Riverside Courts · 123 Main St, New York, NY 10001, USA");
  });
});