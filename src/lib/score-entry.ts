export interface EnteredSet { a: string; b: string }
export const MAX_SCORE_SETS = 5;
export const MAX_SET_SCORE = 99;

/** Accept social-tennis formats without silently dropping partially entered sets. */
export function parseScoreEntry(sets: EnteredSet[]) {
  const entered = sets.filter(s => s.a.trim() !== "" || s.b.trim() !== "");
  if (entered.length < 1 || entered.length > MAX_SCORE_SETS) throw new Error("Enter between one and five sets.");
  const scores = entered.map((s, index) => {
    if (!s.a.trim() || !s.b.trim()) throw new Error(`Fill both scores for Set ${index + 1}.`);
    const a = Number(s.a), b = Number(s.b);
    if (![a, b].every(n => Number.isInteger(n) && n >= 0 && n <= MAX_SET_SCORE)) {
      throw new Error(`Set ${index + 1} needs whole numbers from 0 to 99.`);
    }
    if (a === b) throw new Error(`Set ${index + 1} needs a winner; the scores cannot be tied.`);
    return { a, b };
  });
  const wonA = scores.filter(s => s.a > s.b).length;
  const wonB = scores.length - wonA;
  if (wonA === wonB) throw new Error("The match is tied in sets. Add the deciding set before saving.");
  return { scores, winner: (wonA > wonB ? "a" : "b") as "a" | "b" };
}