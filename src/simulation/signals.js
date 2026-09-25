// Per-lane signal state machine with arrow phases

export const DIRECTIONS = ['N', 'E', 'S', 'W'];
export const LANES = ['NA', 'NB', 'EA', 'EB', 'SA', 'SB', 'WA', 'WB'];

export const SIGNAL_CONFIG = {
  MIN_GREEN: 5,
  MAX_GREEN: 12,
  YELLOW: 2,
  ALL_RED: 2.5,
  LEFT_ARROW: 3.5,       // protected left-turn arrow duration
};

export function createSignalState() {
  return {
    activeDir: 'N',
    phase: 'green',            // 'green' | 'left-arrow' | 'yellow' | 'allred'
    timeLeft: SIGNAL_CONFIG.MIN_GREEN,
    cycleCount: 0,
    emergencyLane: null,
    emergencyActive: false,
    previousDir: null,
    waitTime: { N: 0, E: 0, S: 0, W: 0 },
    // manual override per direction
    manualOverride: {},
  };
}

export function computeGreenTime(density, config = SIGNAL_CONFIG) {
  const d = Math.min(1, Math.max(0, density));
  return config.MIN_GREEN + d * (config.MAX_GREEN - config.MIN_GREEN);
}

// For a specific lane (NA, NB, ...), return its signal: 'green' | 'yellow' | 'red' | 'arrow-left' | 'arrow-right'
export function getSignalForLane(state, lane) {
  const dir = lane[0];
  const isInner = lane[1] === 'A';

  if (state.emergencyActive) {
    // Emergency lane matches vehicle's physical dir
    const emDir = state.emergencyLane ? state.emergencyLane[0] : null;
    return dir === emDir ? 'green' : 'red';
  }

  // Manual override
  if (state.manualOverride[dir]) {
    return state.manualOverride[dir];
  }

  if (dir !== state.activeDir) return 'red';

  // Active direction
  switch (state.phase) {
    case 'green':
      return 'green';
    case 'left-arrow':
      return isInner ? 'arrow-left' : 'red';
    case 'yellow':
      return 'yellow';
    case 'allred':
      return 'red';
  }
  return 'red';
}

// Old API for backwards compat — returns signal for direction only (used by legacy code)
export function getSignalForDirection(state, dir) {
  return getSignalForLane(state, dir + 'A'); // use inner lane as representative
}

export function tickSignal(state, dt, densities, weather = 'clear') {
  const s = { ...state, waitTime: { ...state.waitTime }, manualOverride: { ...state.manualOverride } };

  for (const d of DIRECTIONS) {
    if (d !== s.activeDir || s.phase !== 'green') {
      s.waitTime[d] += dt;
    }
  }

  s.timeLeft -= dt;
  if (s.timeLeft > 0) return s;

  if (s.phase === 'green') {
    // Check if inner lane has waiting left-turners → give arrow
    const innerLane = s.activeDir + 'A';
    const innerDensity = densities[innerLane] || 0;
    if (innerDensity > 0.35) {
      s.phase = 'left-arrow';
      s.timeLeft = SIGNAL_CONFIG.LEFT_ARROW;
    } else {
      s.phase = 'yellow';
      s.timeLeft = SIGNAL_CONFIG.YELLOW;
    }
  } else if (s.phase === 'left-arrow') {
    s.phase = 'yellow';
    s.timeLeft = SIGNAL_CONFIG.YELLOW;
  } else if (s.phase === 'yellow') {
    s.phase = 'allred';
    s.timeLeft = SIGNAL_CONFIG.ALL_RED;
  } else if (s.phase === 'allred') {
    const candidates = DIRECTIONS.filter(d => d !== s.activeDir);
    let best = candidates[0];
    let bestScore = -1;
    for (const d of candidates) {
      // Aggregate density of both lanes in this direction
      const laneA = d + 'A';
      const laneB = d + 'B';
      const dA = densities[laneA] || 0;
      const dB = densities[laneB] || 0;
      const dirDensity = Math.max(dA, dB);
      const wait = s.waitTime[d];
      const score = dirDensity * 10 + wait * 0.5;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    s.previousDir = s.activeDir;
    s.activeDir = best;
    s.phase = 'green';
    // Use max density to pick green time
    const dA = densities[best + 'A'] || 0;
    const dB = densities[best + 'B'] || 0;
    s.timeLeft = computeGreenTime(Math.max(dA, dB));
    s.cycleCount += 1;
    s.waitTime[best] = 0;
  }
  return s;
}