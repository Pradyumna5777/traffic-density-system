import { useEffect, useRef } from 'react';
import {
  LAYOUT, createVehicle, moveVehicle, isOffScreen, LANES, DIRECTIONS,
} from '../simulation/vehicles.js';
import {
  createSignalState, tickSignal, getSignalForLane,
} from '../simulation/signals.js';
import { computeDensities, densityLevel } from '../simulation/density.js';
import { drawScene } from '../simulation/render.js';
import { getLighting } from '../simulation/daynight.js';
import { sound } from '../simulation/sound.js';

const { W, H } = LAYOUT;

export default function IntersectionCanvas({
  running, resetKey, emergencyLane, showDetection,
  scenario, weather, manualOverride,
  onDensities, onCounts, onSignal, onLog, onHistory, onStats, vehiclesRef,
}) {
  const canvasRef = useRef(null);
  const startTimeRef = useRef(performance.now());

  const configRef = useRef({ scenario, weather, manualOverride, showDetection });
  configRef.current = { scenario, weather, manualOverride, showDetection };

  const stateRef = useRef({
    vehicles: [],
    signal: createSignalState(),
    spawnTimers: { NA: 0, NB: 0, EA: 0, EB: 0, SA: 0, SB: 0, WA: 0, WB: 0 },
    logTimer: 0, historyTimer: 0, statsTimer: 0,
    clearedCount: 0, totalWaitTime: 0, waitSamples: 0,
    seeded: false,
  });

  const soundRef = useRef({
    hornTimer: 3,
    stopDebounce: new WeakMap(),
  });

  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const accRef = useRef(0);

  // ---- Reset ----
  useEffect(() => {
    stateRef.current.vehicles = [];
    stateRef.current.signal = createSignalState();
    stateRef.current.spawnTimers = { NA: 0, NB: 0, EA: 0, EB: 0, SA: 0, SB: 0, WA: 0, WB: 0 };
    stateRef.current.logTimer = 0;
    stateRef.current.historyTimer = 0;
    stateRef.current.statsTimer = 0;
    stateRef.current.clearedCount = 0;
    stateRef.current.totalWaitTime = 0;
    stateRef.current.waitSamples = 0;
    stateRef.current.seeded = false;
    soundRef.current.hornTimer = 3;
    soundRef.current.stopDebounce = new WeakMap();
    if (vehiclesRef) vehiclesRef.current = stateRef.current.vehicles;
  }, [resetKey, vehiclesRef]);

  useEffect(() => {
    stateRef.current.signal.manualOverride = manualOverride || {};
  }, [manualOverride]);

  // ---- Emergency ----
  useEffect(() => {
    const s = stateRef.current;
    if (emergencyLane) {
      s.signal.emergencyActive = true;
      s.signal.emergencyLane = emergencyLane + 'A';
      try {
        const amb = createVehicle(emergencyLane + 'A', 'ambulance', 'straight');
        const { W: w, H: h, STOP_LINE_OFFSET } = LAYOUT;
        const cx = w / 2, cy = h / 2;
        switch (emergencyLane) {
          case 'N': amb.y = cy - STOP_LINE_OFFSET - 60 - amb.h; break;
          case 'S': amb.y = cy + STOP_LINE_OFFSET + 10; break;
          case 'E': amb.x = cx + STOP_LINE_OFFSET + 10; break;
          case 'W': amb.x = cx - STOP_LINE_OFFSET - 60 - amb.w; break;
        }
        s.vehicles.push(amb);
      } catch (err) {
        console.error('Ambulance spawn failed:', err);
      }
    } else {
      s.signal.emergencyActive = false;
      s.signal.emergencyLane = null;
    }
  }, [emergencyLane]);

  useEffect(() => {
    if (!emergencyLane) return;
    const t = setTimeout(() => {
      stateRef.current.signal.emergencyActive = false;
      stateRef.current.signal.emergencyLane = null;
    }, 9000);
    return () => clearTimeout(t);
  }, [emergencyLane]);

  // ---- Click-to-inject ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const cx = W / 2, cy = H / 2;
      const ROAD_W = LAYOUT.ROAD_W;

      let dir = null, isInner = false;
      if (Math.abs(x - cx) < ROAD_W / 2) {
        dir = y < cy ? 'N' : 'S';
        isInner = dir === 'N' ? x < cx : x > cx;
      } else if (Math.abs(y - cy) < ROAD_W / 2) {
        dir = x < cx ? 'W' : 'E';
        isInner = dir === 'W' ? y > cy : y < cy;
      }
      if (!dir) return;

      const laneCode = dir + (isInner ? 'A' : 'B');
      const s = stateRef.current;
      for (let i = 0; i < 5; i++) {
        try {
          const v = createVehicle(laneCode);
          if (dir === 'N') v.y -= i * 40;
          if (dir === 'S') v.y += i * 40;
          if (dir === 'E') v.x += i * 40;
          if (dir === 'W') v.x -= i * 40;
          s.vehicles.push(v);
        } catch (err) { break; }
      }
      sound.uiClick();
    };
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, []);

  // ---- Main loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    let alive = true;

    const loop = (ts) => {
      if (!alive) return;
      if (lastTsRef.current === 0) {
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const elapsed = Math.min(0.1, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;
      accRef.current += elapsed;

      const FIXED_DT = 1 / 60;
      let steps = 0;
      while (accRef.current >= FIXED_DT && steps < 5) {
        updateSimulation(FIXED_DT);
        accRef.current -= FIXED_DT;
        steps++;
      }
      if (accRef.current > FIXED_DT * 5) accRef.current = 0;

      renderFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    const updateSimulation = (dt) => {
      try {
        const s = stateRef.current;
        const cfg = configRef.current;
        const { scenario, weather, manualOverride } = cfg;

        // LOG: accident state once every ~2s
        if (scenario?.accident && Math.random() < 0.008) {
          const naCount = s.vehicles.filter(v => v.lane === 'NA' && !v.crossed).length;
          console.log('[ACCIDENT]', {
            active: scenario.accident,
            lane: scenario.accidentLane,
            carsInNA: naCount,
            sample: s.vehicles.find(v => v.lane === 'NA' && !v.crossed)
              ? {
                  lane: 'NA',
                  y: Math.round(s.vehicles.find(v => v.lane === 'NA' && !v.crossed).y),
                  speed: Math.round(s.vehicles.find(v => v.lane === 'NA' && !v.crossed).currentSpeed),
                }
              : null,
          });
        }

        if (running && !s.seeded) {
          s.seeded = true;
          for (const lane of LANES) {
            try { s.vehicles.push(createVehicle(lane)); } catch (e) {}
          }
        }

        if (running && !s.signal.emergencyActive) {
          const prevPhase = s.signal.phase;
          const prevDir = s.signal.activeDir;
          s.signal.manualOverride = manualOverride || {};
          s.signal = tickSignal(s.signal, dt, computeDensities(s.vehicles).densities, weather);
          if (s.signal.phase !== prevPhase && (s.signal.phase === 'yellow' || s.signal.phase === 'green' || s.signal.phase === 'left-arrow')) {
            sound.signalChangeBeep();
          }
          if (s.signal.activeDir !== prevDir && s.signal.phase === 'green') {
            sound.beep(1100, 0.15, 0.22);
          }
        }

        // Spawn
        if (running) {
          const totalLive = s.vehicles.filter(v => !v.crossed && !v.turning).length;
          const cap = scenario?.globalCap ?? 20;
          const accidentLane = scenario?.accidentLane || null;

          if (totalLive < cap) {
            for (const lane of LANES) {
              // Skip spawning into the accident lane (avoid infinite queue)
              if (accidentLane && lane === accidentLane) continue;

              if (typeof s.spawnTimers[lane] !== 'number') s.spawnTimers[lane] = 0;
              s.spawnTimers[lane] -= dt;
              if (s.spawnTimers[lane] <= 0) {
                const rate = scenario?.spawnRate ?? 2.0;
                s.spawnTimers[lane] = rate + Math.random() * 1.0;
                const laneVehicles = s.vehicles.filter(v => v.lane === lane && !v.crossed && !v.turning);
                if (laneVehicles.length >= 6) continue;

                const { SPAWN_OFFSET } = LAYOUT;
                const cx = W / 2, cy = H / 2;
                const dir = lane[0];
                const nearSpawn = laneVehicles.some(v => {
                  switch (dir) {
                    case 'N': return v.y < cy - SPAWN_OFFSET + 70;
                    case 'S': return v.y > cy + SPAWN_OFFSET - 70;
                    case 'E': return v.x > cx + SPAWN_OFFSET - 70;
                    case 'W': return v.x < cx - SPAWN_OFFSET + 70;
                  }
                  return false;
                });
                if (nearSpawn) continue;
                try { s.vehicles.push(createVehicle(lane)); } catch (e) {}
              }
            }
          }
        }

        // Move
        if (running) {
          const vehicles = s.vehicles;

          const byLane = {};
          for (const v of vehicles) {
            if (v.crossed && !v.turning) continue;
            if (!byLane[v.lane]) byLane[v.lane] = [];
            byLane[v.lane].push(v);
          }
          for (const lane in byLane) {
            const dir = lane[0];
            byLane[lane].sort((a, b) => {
              switch (dir) {
                case 'N': return b.y - a.y;
                case 'S': return a.y - b.y;
                case 'E': return a.x - b.x;
                case 'W': return b.x - a.x;
              }
              return 0;
            });
          }

          for (const v of vehicles) {
            const signal = getSignalForLane(s.signal, v.lane);
            const sameLane = byLane[v.lane] || [];
            if (v.stopped && signal === 'red') {
              s.totalWaitTime += dt;
              s.waitSamples += 1;
            }
            moveVehicle(v, dt, signal, sameLane, weather, cfg.scenario?.accidentLane || null);
          }

          const before = s.vehicles.length;
          s.vehicles = s.vehicles.filter(v => !isOffScreen(v));
          s.clearedCount += (before - s.vehicles.length);

          for (const v of s.vehicles) {
            const wasStopped = soundRef.current.stopDebounce.get(v) || false;
            if (!wasStopped && v.stopped) {
              sound.stopThud();
              soundRef.current.stopDebounce.set(v, true);
            } else if (wasStopped && !v.stopped) {
              soundRef.current.stopDebounce.set(v, false);
            }
          }

          s.logTimer -= dt;
          if (s.logTimer <= 0) {
            s.logTimer = 1;
            const { densities, counts } = computeDensities(s.vehicles);
            for (const dir of DIRECTIONS) {
              const laneA = dir + 'A';
              const laneB = dir + 'B';
              const d = Math.max(densities[laneA] || 0, densities[laneB] || 0);
              const c = (counts[laneA] || 0) + (counts[laneB] || 0);
              onLog({
                id: Math.random().toString(36).slice(2, 9),
                time: new Date().toLocaleTimeString(),
                lane: dir, count: c, density: d,
                level: densityLevel(d),
                signal: getSignalForLane(s.signal, laneA),
              });
            }
          }

          s.historyTimer -= dt;
          if (s.historyTimer <= 0) {
            s.historyTimer = 2;
            const { dirDensities, counts } = computeDensities(s.vehicles);
            const dirCounts = {};
            for (const d of DIRECTIONS) dirCounts[d] = (counts[d + 'A'] || 0) + (counts[d + 'B'] || 0);
            onHistory({
              t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              ...Object.fromEntries(DIRECTIONS.map(d => [`count_${d}`, dirCounts[d]])),
              ...Object.fromEntries(DIRECTIONS.map(d => [`dens_${d}`, +((dirDensities[d] || 0) * 100).toFixed(0)])),
            });
          }

          s.statsTimer -= dt;
          if (s.statsTimer <= 0) {
            s.statsTimer = 1;
            const { dirDensities } = computeDensities(s.vehicles);
            const avgWait = s.waitSamples > 0 ? s.totalWaitTime / s.waitSamples : 0;
            onStats({
              cleared: s.clearedCount,
              avgWait: avgWait,
              activeVehicles: s.vehicles.filter(v => !v.crossed).length,
              throughput: s.clearedCount / Math.max(1, (performance.now() - startTimeRef.current) / 60000),
              cycleCount: s.signal.cycleCount,
              co2Saved: (s.signal.cycleCount * 0.15 + s.clearedCount * 0.02).toFixed(2),
            });
          }

          const { densities, counts, dirDensities } = computeDensities(s.vehicles);
          onDensities(dirDensities);
          const dirCounts = {};
          for (const d of DIRECTIONS) dirCounts[d] = (counts[d + 'A'] || 0) + (counts[d + 'B'] || 0);
          onCounts(dirCounts);
          onSignal(s.signal);

          sound.updateTrafficIntensity(s.vehicles.length);
          soundRef.current.hornTimer -= dt;
          if (soundRef.current.hornTimer <= 0) {
            soundRef.current.hornTimer = 1.5 + Math.random() * 2.5;
            if (Math.random() < 0.7) sound.horn();
          }
        }
      } catch (err) {
        console.error('[SIM ERROR]', err);
      }
    };

    const renderFrame = () => {
      const s = stateRef.current;
      const cfg = configRef.current;
      const lighting = getLighting((performance.now() - startTimeRef.current) / 1000);

      drawScene(ctx, {
        vehicles: s.vehicles,
        signalState: s.signal,
        highlightedDir: s.signal.activeDir,
        showDetection: cfg.showDetection,
        lighting,
        weather: cfg.weather,
        accidentLane: cfg.scenario?.accident ? 'N' : null,
        accidentLaneId: cfg.scenario?.accidentLane || null,
        rainTime: (performance.now() - startTimeRef.current) / 1000,
      });

      if (vehiclesRef) vehiclesRef.current = s.vehicles;
    };

    lastTsRef.current = 0;
    accRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE INTERSECTION FEED
        </div>
        <div className="text-xs font-mono text-slate-500">
          {W}×{H} · 8-LANE · {scenario?.accident ? `ACCIDENT: ${scenario.accidentLane}` : 'NORMAL'}
        </div>
      </div>
      <div className="relative rounded-xl overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} width={W} height={H} className="w-full h-auto block cursor-crosshair" />
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-emerald-400">
          ● REC
        </div>
        {/* Debug: accident state visible in the corner */}
        {scenario?.accident && (
          <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur px-2 py-1 rounded text-[10px] font-mono text-white">
            🚨 ACCIDENT ACTIVE · LANE {scenario.accidentLane}
          </div>
        )}
      </div>
    </div>
  );
}