// Round-robin fixture generation (circle method).
// Returns ordered list of rounds; each round is an array of [a,b] id pairs.
// If odd number of sides, a BYE is added (represented as null).

export type Pairing = [string | null, string | null];

export function generateRoundRobin(ids: string[]): Pairing[][] {
  const list = [...ids];
  if (list.length < 2) return [];
  if (list.length % 2 === 1) list.push(null as unknown as string); // BYE
  const n = list.length;
  const rounds: Pairing[][] = [];
  const arr = [...list];
  for (let r = 0; r < n - 1; r++) {
    const pairings: Pairing[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      pairings.push([a as string | null, b as string | null]);
    }
    rounds.push(pairings);
    // rotate: keep first, move last to position 1
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr.splice(0, arr.length, fixed, ...rest);
  }
  return rounds;
}