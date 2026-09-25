// Vehicle factory + update logic — realistic multi-lane

export const VEHICLE_TYPES = {
  car:       { w: 34, h: 18, speed: 110, color: '#e2e8f0' },
  suv:       { w: 38, h: 20, speed: 105, color: '#334155' },
  bike:      { w: 16, h: 10, speed: 130, color: '#f59e0b' },
  truck:     { w: 62, h: 22, speed: 85,  color: '#94a3b8' },
  bus:       { w: 68, h: 22, speed: 80,  color: '#22c55e' },
  ambulance: { w: 46, h: 20, speed: 170, color: '#ffffff' },
};

const CAR_COLORS = ['#e2e8f0', '#1e293b', '#ef4444', '#3b82f6', '#f8fafc', '#64748b', '#fbbf24', '#8b5cf6', '#14b8a6'];

// Punjab RTO codes — Jalandhar district = PB-08
const PB_SERIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const PB_PREFIXES = ['PB-08', 'PB-08', 'PB-08', 'PB-08', 'PB-08', 'PB-08', 'PB-08', 'PB-08', 'PB-65']; // mostly Jalandhar

let plateCounter = 1000 + Math.floor(Math.random() * 8000);

function generatePunjabPlate() {
  const prefix = PB_PREFIXES[Math.floor(Math.random() * PB_PREFIXES.length)];
  const series = PB_SERIES[Math.floor(Math.random() * PB_SERIES.length)];
  plateCounter = (plateCounter + 137 + Math.floor(Math.random() * 90)) % 9999;
  if (plateCounter < 1000) plateCounter += 1000;
  const num = String(plateCounter).padStart(4, '0');
  return `${prefix}-${series}-${num}`;
}

let vehicleIdCounter = 0;

export const LANES = ['NA', 'NB', 'EA', 'EB', 'SA', 'SB', 'WA', 'WB'];
export const DIRECTIONS = ['N', 'E', 'S', 'W'];
export const DIRECTION_LANES = { N: ['NA', 'NB'], E: ['EA', 'EB'], S: ['SA', 'SB'], W: ['WA', 'WB'] };

export const LAYOUT = {
  W: 700,
  H: 700,
  ROAD_W: 140,
  LANE_W: 46,
  STOP_LINE_OFFSET: 90,
  SPAWN_OFFSET: 420,
};

export function createVehicle(lane, type = null, route = null) {
  const t = type || pickRandomType();
  const spec = VEHICLE_TYPES[t];
  const dir = lane[0];
  const isInner = lane[1] === 'A';
  const r = route || pickRoute(isInner, t);

  const v = {
    id: ++vehicleIdCounter,
    lane,
    dir,
    isInner,
    route: r,
    type: t,
    plate: t === 'ambulance'
      ? `PB-08-AMB-${100 + Math.floor(Math.random() * 900)}`
      : generatePunjabPlate(),
    w: spec.w,
    h: spec.h,
    speed: spec.speed,
    maxSpeed: spec.speed,
    currentSpeed: spec.speed,
    color: t === 'ambulance' ? '#ffffff' : (t === 'car' || t === 'suv' ? pick(CAR_COLORS) : spec.color),
    x: 0, y: 0,
    angle: 0,
    stopped: false,
    braking: false,
    crossed: false,
    turning: false,
    turningProgress: 0,
    turnStart: null,
    turnEnd: null,
    spawnTime: performance.now(),
    headlightsOn: false,
    personality: pickPersonality(),
  };

  positionSpawn(v);
  return v;
}

function pickPersonality() {
  const r = Math.random();
  if (r < 0.05) return 'aggressive';
  if (r < 0.10) return 'slow';
  return 'normal';
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function pickRandomType() {
  const r = Math.random();
  if (r < 0.55) return 'car';
  if (r < 0.68) return 'suv';
  if (r < 0.82) return 'bike';
  if (r < 0.93) return 'truck';
  return 'bus';
}

function pickRoute(isInner, type) {
  if (type === 'bike') return Math.random() < 0.3 ? 'left' : Math.random() < 0.7 ? 'straight' : 'right';
  if (isInner) {
    const r = Math.random();
    if (r < 0.35) return 'left';
    return 'straight';
  } else {
    const r = Math.random();
    if (r < 0.30) return 'right';
    return 'straight';
  }
}

function positionSpawn(v) {
  const { W, H, SPAWN_OFFSET, LANE_W } = LAYOUT;
  const cx = W / 2, cy = H / 2;
  const innerOffset = LANE_W / 2 + 4;
  const outerOffset = LANE_W * 1.5 + 8;
  const offset = v.isInner ? innerOffset : outerOffset;

  switch (v.dir) {
    case 'N':
      v.x = cx - offset - v.w / 2;
      v.y = cy - SPAWN_OFFSET;
      v.angle = Math.PI / 2;
      break;
    case 'S':
      v.x = cx + offset - v.w / 2;
      v.y = cy + SPAWN_OFFSET;
      v.angle = -Math.PI / 2;
      break;
    case 'E':
      v.x = cx + SPAWN_OFFSET;
      v.y = cy - offset - v.h / 2;
      v.angle = Math.PI;
      break;
    case 'W':
      v.x = cx - SPAWN_OFFSET;
      v.y = cy + offset - v.h / 2;
      v.angle = 0;
      break;
  }
}

export function distanceToStopLine(v) {
  const { W, H, STOP_LINE_OFFSET } = LAYOUT;
  const cx = W / 2, cy = H / 2;
  switch (v.dir) {
    case 'N': return (cy - STOP_LINE_OFFSET) - (v.y + v.h);
    case 'S': return v.y - (cy + STOP_LINE_OFFSET);
    case 'E': return v.x - (cx + STOP_LINE_OFFSET);
    case 'W': return (cx - STOP_LINE_OFFSET) - (v.x + v.w);
  }
  return 0;
}

export function hasCrossed(v) {
  const { W, H, STOP_LINE_OFFSET } = LAYOUT;
  const cx = W / 2, cy = H / 2;
  switch (v.dir) {
    case 'N': return v.y > cy + STOP_LINE_OFFSET;
    case 'S': return v.y + v.h < cy - STOP_LINE_OFFSET;
    case 'E': return v.x + v.w < cx - STOP_LINE_OFFSET;
    case 'W': return v.x > cx + STOP_LINE_OFFSET;
  }
  return false;
}

export function isOffScreen(v) {
  const { W, H } = LAYOUT;
  return v.x < -150 || v.x > W + 150 || v.y < -150 || v.y > H + 150;
}

export function moveVehicle(v, dt, signal, vehiclesInLane, weather = 'clear', accidentLane = null) {
  if (v.turning) {
    updateTurn(v, dt);
    return;
  }

  const stopDist = distanceToStopLine(v);
  const inIntersection = stopDist < -4;

  if (accidentLane && v.lane === accidentLane && !inIntersection) {
    if (stopDist > 60) {
      // fall through
    } else {
      v.currentSpeed = Math.max(0, v.currentSpeed - 500 * dt);
      v.stopped = v.currentSpeed < 5;
      v.braking = true;
      const step = v.currentSpeed * dt;
      switch (v.dir) {
        case 'N': v.y += step; break;
        case 'S': v.y -= step; break;
        case 'E': v.x -= step; break;
        case 'W': v.x += step; break;
      }
      return;
    }
  }

  if (inIntersection) {
    v.currentSpeed = Math.max(v.currentSpeed, v.maxSpeed * 0.9);
    v.stopped = false;
    v.braking = false;
    const step = v.currentSpeed * dt;
    switch (v.dir) {
      case 'N': v.y += step; break;
      case 'S': v.y -= step; break;
      case 'E': v.x -= step; break;
      case 'W': v.x += step; break;
    }
    if (hasCrossed(v)) v.crossed = true;
    if (v.crossed && v.route !== 'straight' && !v.turning) {
      const distPast = -distanceToStopLine(v);
      if (distPast < 40 && distPast > -5) startTurn(v);
    }
    return;
  }

  const shouldStop = signal === 'red' || signal === 'yellow';
  const reactionDist = v.personality === 'aggressive' ? 45 : 70;

  const ahead = vehiclesInLane
    .filter(o => o.id !== v.id && !o.crossed && !o.turning && isAheadOf(v, o))
    .sort((a, b) => gapTo(v, a) - gapTo(v, b))[0];

  let minGap = Infinity;
  if (ahead) minGap = gapTo(v, ahead);

  const vLen = (v.dir === 'N' || v.dir === 'S') ? v.h : v.w;
  const aLen = ahead
    ? ((ahead.dir === 'N' || ahead.dir === 'S') ? ahead.h : ahead.w)
    : 0;
  const SAFE_GAP = vLen * 0.5 + aLen * 0.5 + 4;

  const weatherFactor = weather === 'rain' ? 0.75 : weather === 'snow' ? 0.55 : weather === 'fog' ? 0.7 : 1.0;

  let targetSpeed = v.maxSpeed * weatherFactor;

  if (shouldStop && stopDist > 0 && stopDist < reactionDist) {
    targetSpeed = Math.min(targetSpeed, (stopDist / reactionDist) * v.maxSpeed);
  }
  if (shouldStop && stopDist <= 2) targetSpeed = 0;

  if (accidentLane && v.lane === accidentLane) {
    const accidentStopDist = 60;
    if (stopDist > 0 && stopDist < accidentStopDist) {
      targetSpeed = Math.min(targetSpeed, (stopDist / accidentStopDist) * v.maxSpeed);
    }
  }

  if (isFinite(minGap) && minGap < reactionDist) {
    const ratio = Math.max(0, (minGap - SAFE_GAP) / (reactionDist - SAFE_GAP));
    targetSpeed = Math.min(targetSpeed, ratio * v.maxSpeed * weatherFactor);
  }
  if (isFinite(minGap) && minGap < SAFE_GAP) targetSpeed = 0;

  if (v.personality === 'aggressive') targetSpeed *= 1.15;
  if (v.personality === 'slow') targetSpeed *= 0.75;

  const accel = 300 * dt;
  v.braking = targetSpeed < v.currentSpeed - 5;

  if (v.currentSpeed < targetSpeed) {
    v.currentSpeed = Math.min(targetSpeed, v.currentSpeed + accel);
  } else {
    v.currentSpeed = Math.max(targetSpeed, v.currentSpeed - accel * 1.5);
  }

  v.stopped = v.currentSpeed < 5;

  const step = v.currentSpeed * dt;
  switch (v.dir) {
    case 'N': v.y += step; break;
    case 'S': v.y -= step; break;
    case 'E': v.x -= step; break;
    case 'W': v.x += step; break;
  }

  if (hasCrossed(v)) v.crossed = true;

  if (v.crossed && v.route !== 'straight' && !v.turning) {
    const distPast = -distanceToStopLine(v);
    if (distPast < 40 && distPast > -5) startTurn(v);
  }
}

function startTurn(v) {
  const { W, H, STOP_LINE_OFFSET } = LAYOUT;
  const cx = W / 2, cy = H / 2;
  const targetOffset = v.isInner ? 34 : 88;

  v.turning = true;
  v.turningProgress = 0;
  v.turnStart = { x: v.x, y: v.y };
  v.turnDuration = 0.9;

  let exitX = v.x, exitY = v.y;
  const turnDir = getTurnDirection(v.dir, v.route);

  switch (turnDir) {
    case 'E':
      exitX = W + 20;
      exitY = cy + targetOffset - v.h / 2;
      break;
    case 'W':
      exitX = -20;
      exitY = cy - targetOffset - v.h / 2;
      break;
    case 'N':
      exitX = cx - targetOffset - v.w / 2;
      exitY = -20;
      break;
    case 'S':
      exitX = cx + targetOffset - v.w / 2;
      exitY = H + 20;
      break;
  }

  v.turnEnd = { x: exitX, y: exitY };
}

function getTurnDirection(fromDir, route) {
  const dirs = ['N', 'E', 'S', 'W'];
  const idx = dirs.indexOf(fromDir);
  if (route === 'straight') return fromDir;
  if (route === 'right') return dirs[(idx + 1) % 4];
  return dirs[(idx + 3) % 4];
}

function updateTurn(v, dt) {
  v.turningProgress += dt / v.turnDuration;
  if (v.turningProgress >= 1) {
    v.x = v.turnEnd.x;
    v.y = v.turnEnd.y;
    v.turning = false;
    v.crossed = true;
    return;
  }

  const t = v.turningProgress;
  const mid = {
    x: (v.turnStart.x + v.turnEnd.x) / 2,
    y: (v.turnStart.y + v.turnEnd.y) / 2,
  };
  v.x = (1 - t) ** 2 * v.turnStart.x + 2 * (1 - t) * t * mid.x + t ** 2 * v.turnEnd.x;
  v.y = (1 - t) ** 2 * v.turnStart.y + 2 * (1 - t) * t * mid.y + t ** 2 * v.turnEnd.y;
  v.angle += 0.15;
}

function isAheadOf(v, o) {
  if (v.dir !== o.dir) return false;
  switch (v.dir) {
    case 'N': return o.y > v.y;
    case 'S': return o.y < v.y;
    case 'E': return o.x < v.x;
    case 'W': return o.x > v.x;
  }
  return false;
}

function gapTo(v, o) {
  switch (v.dir) {
    case 'N': return o.y - (v.y + v.h);
    case 'S': return v.y - (o.y + o.h);
    case 'E': return v.x - (o.x + o.w);
    case 'W': return o.x - (v.x + v.w);
  }
  return 0;
}