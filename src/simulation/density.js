import { distanceToStopLine, LANES, DIRECTIONS } from './vehicles.js';

const MAX_QUEUE = 10;

export function computeDensities(vehicles) {
  const counts = {};
  const queued = {};
  for (const lane of LANES) {
    counts[lane] = 0;
    queued[lane] = 0;
  }

  for (const v of vehicles) {
    if (v.crossed && !v.turning) continue;
    const lane = v.lane;
    counts[lane] = (counts[lane] || 0) + 1;
    const d = distanceToStopLine(v);
    if (d < 220 && d > -10) queued[lane] = (queued[lane] || 0) + 1;
  }

  const densities = {};
  for (const lane of LANES) {
    densities[lane] = Math.min(1, (queued[lane] || 0) / MAX_QUEUE);
  }

  const dirDensities = {};
  for (const dir of DIRECTIONS) {
    dirDensities[dir] = Math.max(densities[dir + 'A'] || 0, densities[dir + 'B'] || 0);
  }

  return { counts, queued, densities, dirDensities };
}

export function densityLevel(d) {
  if (d < 0.3) return 'LOW';
  if (d < 0.7) return 'MEDIUM';
  return 'HIGH';
}