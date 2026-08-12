/**
 * Deterministic pseudo-random number generation.
 *
 * All stochastic components of STRATUM must be reproducible from a seed.
 * We use mulberry32 (32-bit, fast, adequate for simulation, NOT cryptographic).
 */

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Standard normal via Box-Muller. */
  normal(): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    normal(): number {
      // Guard against log(0).
      let u = next();
      while (u <= Number.EPSILON) u = next();
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}
