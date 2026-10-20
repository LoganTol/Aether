import { describe, expect, it } from "vitest";
import { parseScoreEntry } from "@/lib/score-entry";

describe("Flexible social-tennis scores", () => {
  it("accepts a single standard set without requiring two set wins", () => {
    expect(parseScoreEntry([{ a: "6", b: "4" }])).toEqual({ scores: [{ a: 6, b: 4 }], winner: "a" });
  });
  it("accepts short sets", () => {
    expect(parseScoreEntry([{ a: "4", b: "2" }]).winner).toBe("a");
  });
  it("accepts pro sets", () => {
    expect(parseScoreEntry([{ a: "8", b: "6" }]).scores).toEqual([{ a: 8, b: 6 }]);
  });
  it("accepts a deciding match tiebreak", () => {
    expect(parseScoreEntry([{ a: "6", b: "4" }, { a: "3", b: "6" }, { a: "10", b: "8" }]).winner).toBe("a");
  });
  it("accepts five played sets even after one side wins two", () => {
    expect(parseScoreEntry(["6", "6", "4", "4", "6"].map(a => ({ a, b: a === "6" ? "4" : "6" }))).winner).toBe("a");
  });
  it("accepts extended tiebreaks", () => {
    expect(parseScoreEntry([{ a: "23", b: "21" }]).scores).toEqual([{ a: 23, b: 21 }]);
  });
  it("ignores only fully blank optional sets", () => {
    expect(parseScoreEntry([{ a: "6", b: "0" }, { a: "", b: "" }]).scores).toHaveLength(1);
  });
  it("rejects partially entered sets", () => {
    expect(() => parseScoreEntry([{ a: "6", b: "4" }, { a: "6", b: "" }])).toThrow("Fill both");
  });
  it("rejects tied sets and matches without guessing a winner", () => {
    expect(() => parseScoreEntry([{ a: "6", b: "6" }])).toThrow("cannot be tied");
    expect(() => parseScoreEntry([{ a: "6", b: "4" }, { a: "4", b: "6" }])).toThrow("match is tied");
  });
  it("rejects negative, fractional and out-of-range values", () => {
    for (const a of ["-1", "6.5", "100", "invalid"]) expect(() => parseScoreEntry([{ a, b: "4" }])).toThrow("whole numbers");
  });
  it("requires one to five entered sets", () => {
    expect(() => parseScoreEntry([])).toThrow();
    expect(() => parseScoreEntry(Array.from({ length: 6 }, () => ({ a: "6", b: "4" })))).toThrow();
  });
});