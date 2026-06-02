export type Format = "singles" | "doubles";

export function singlesMatchCount(n: number): number {
  if (n < 2) return 0;
  return (n * (n - 1)) / 2;
}

export function doublesMatchCount(teams: number): number {
  if (teams < 2) return 0;
  return (teams * (teams - 1)) / 2;
}

export function roundCount(units: number): number {
  // round-robin circle method: n-1 rounds if even, n if odd
  if (units < 2) return 0;
  return units % 2 === 0 ? units - 1 : units;
}

export function estimatedWeeks(matches: number, matchesPerWeek = 4): number {
  if (matches <= 0) return 0;
  return Math.max(1, Math.ceil(matches / matchesPerWeek));
}

export function weeksBetween(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  return Math.max(1, Math.round((e - s) / (7 * 86400000)));
}

export function recommendedSeasonLength(
  playersOrTeams: number,
  cadenceMatchesPerWeek = 4
): { minWeeks: number; maxWeeks: number; matches: number } {
  const matches = singlesMatchCount(playersOrTeams);
  const min = estimatedWeeks(matches, cadenceMatchesPerWeek + 1);
  const max = estimatedWeeks(matches, Math.max(1, cadenceMatchesPerWeek - 1));
  return { minWeeks: min, maxWeeks: max, matches };
}

/**
 * Compute first N round-robin pairings using the circle method.
 * Returns rounds grouped, each round containing its pairings.
 */
export function previewSchedule(
  unitNames: string[],
  maxRounds = 3
): { round: number; matches: { a: string; b: string }[] }[] {
  const names = [...unitNames];
  if (names.length < 2) return [];
  // add bye placeholder if odd
  if (names.length % 2 === 1) names.push("__BYE__");
  const n = names.length;
  const rounds = n - 1;
  const half = n / 2;
  const arr = [...names];
  const result: { round: number; matches: { a: string; b: string }[] }[] = [];
  for (let r = 0; r < Math.min(rounds, maxRounds); r++) {
    const matches: { a: string; b: string }[] = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a !== "__BYE__" && b !== "__BYE__") matches.push({ a, b });
    }
    result.push({ round: r + 1, matches });
    // rotate, keep first fixed
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return result;
}