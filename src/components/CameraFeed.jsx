import { useEffect, useRef } from 'react';
import { LAYOUT } from '../simulation/vehicles.js';

const CAM_W = 380;
const CAM_H = 220;

const TYPE_COLORS = {
  car:       '#22d3ee',
  suv:       '#22d3ee',
  bike:      '#a78bfa',
  truck:     '#f59e0b',
  bus:       '#22c55e',
  ambulance: '#ef4444',
};

export default function CameraFeed({ vehiclesRef, lane, setLane, showDetection, lighting }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const trailsRef = useRef([]);
  const trackIdsRef = useRef(new Map());
  const nextTrackRef = useRef(1000);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loop = (ts) => {
      const vehicles = vehiclesRef.current || [];
      const laneVehicles = vehicles.filter(v => v.lane[0] === lane);
      const isNight = lighting?.nightAmount > 0.5;

      for (const v of laneVehicles) {
        if (!trackIdsRef.current.has(v.id)) {
          trackIdsRef.current.set(v.id, nextTrackRef.current++);
        }
      }

      drawBackground(ctx, isNight);
      drawRoad(ctx, lane);

      const sorted = [...laneVehicles].sort((a, b) => {
        return getProgress(a, lane) - getProgress(b, lane);
      });

      drawTrails(ctx, trailsRef.current);

      // Find the nearest vehicle for HUD
      let nearest = null;
      let nearestProgress = -1;

      for (const v of sorted) {
        const projected = projectVehicle(v, lane);
        if (projected) {
          drawVehicleSprite(ctx, projected, v);
          if (showDetection) {
            drawDetectionOverlay(ctx, projected, v, trackIdsRef.current.get(v.id));
          }
          // Draw license plate under each vehicle
          if (projected.scale > 0.55) {
            drawLicensePlate(ctx, projected, v);
          }
          trailsRef.current.push({
            x: projected.x + projected.w / 2,
            y: projected.y + projected.h,
            life: 1.0,
            color: TYPE_COLORS[v.type] || '#22d3ee',
          });

          if (projected.t > nearestProgress) {
            nearestProgress = projected.t;
            nearest = v;
          }
        }
      }

      for (const t of trailsRef.current) t.life -= 0.06;
      trailsRef.current = trailsRef.current.filter(t => t.life > 0).slice(-120);

      if (showDetection) drawDetectionZone(ctx);
      drawScanLine(ctx, ts);
      if (showDetection) drawGrid(ctx);
      if (isNight) drawNightVision(ctx);
      drawScanlines(ctx);
      drawGrain(ctx);
      drawHUD(ctx, lane, laneVehicles.length, isNight, nearest?.plate);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lane, showDetection, vehiclesRef, lighting]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-cyan-400">AI CAMERA · LANE {lane}</span>
        </div>
        <select
          value={lane}
          onChange={e => setLane(e.target.value)}
          className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 text-slate-200"
        >
          <option value="N">Lane A (N)</option>
          <option value="E">Lane B (E)</option>
          <option value="S">Lane C (S)</option>
          <option value="W">Lane D (W)</option>
        </select>
      </div>

      <div className="relative rounded-lg overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          width={CAM_W}
          height={CAM_H}
          className="w-full h-auto block"
        />
        <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-mono text-red-400 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
          REC
        </div>
        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400">
          YOLOv8 · 60 FPS · 1080p
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-500 font-mono">
        Real-time object detection · ANPR active · {showDetection ? 'tracking on' : 'tracking off'}
      </p>
    </div>
  );
}

// ============================================================
// PROJECTION
// ============================================================

function getProgress(v, laneDir) {
  const { SPAWN_OFFSET, STOP_LINE_OFFSET } = LAYOUT;

  switch (laneDir) {
    case 'N': {
      const spawnY = -70;
      const stopY = 260;
      return clamp01((v.y - spawnY) / (stopY - spawnY));
    }
    case 'S': {
      const spawnY = 770;
      const stopY = 440;
      return clamp01((spawnY - v.y) / (spawnY - stopY));
    }
    case 'E': {
      const spawnX = 770;
      const stopX = 440;
      return clamp01((spawnX - v.x) / (spawnX - stopX));
    }
    case 'W': {
      const spawnX = -70;
      const stopX = 260;
      return clamp01((v.x - spawnX) / (stopX - spawnX));
    }
  }
  return 0.5;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function projectVehicle(v, laneDir) {
  const t = getProgress(v, laneDir);
  if (t < 0 || t > 1.3) return null;

  const scale = 0.35 + t * 1.35;
  const camY = 30 + t * (CAM_H - 60);

  const laneSign = v.isInner ? -1 : 1;
  const roadBotW = CAM_W * 0.9;
  const roadTopW = 25;
  const laneWidth = (roadBotW - roadTopW) / 4;
  const camX = CAM_W / 2 + laneSign * laneWidth * (0.3 + t * 1.2) - (v.w * scale) / 2;

  const projected = {
    x: camX,
    y: camY - v.h * scale,
    w: v.w * scale,
    h: v.h * scale,
    scale,
    t,
  };

  if (projected.y > CAM_H || projected.y + projected.h < 0) return null;
  return projected;
}

// ============================================================
// BACKGROUND & ROAD
// ============================================================

function drawBackground(ctx, isNight) {
  const grad = ctx.createLinearGradient(0, 0, 0, CAM_H);
  if (isNight) {
    grad.addColorStop(0, '#050810');
    grad.addColorStop(1, '#0a1220');
  } else {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1f2937');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CAM_W, CAM_H);

  const sky = ctx.createRadialGradient(CAM_W / 2, 0, 0, CAM_W / 2, 0, 200);
  sky.addColorStop(0, isNight ? 'rgba(30,58,138,0.15)' : 'rgba(56,189,248,0.08)');
  sky.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CAM_W, CAM_H);
}

function drawRoad(ctx, lane) {
  const vpX = CAM_W / 2;
  const vpY = 30;
  const roadTopW = 25;
  const roadBotW = CAM_W * 0.9;

  ctx.fillStyle = '#1a1f2a';
  ctx.beginPath();
  ctx.moveTo(vpX - roadTopW / 2, vpY);
  ctx.lineTo(vpX + roadTopW / 2, vpY);
  ctx.lineTo(vpX + roadBotW / 2, CAM_H);
  ctx.lineTo(vpX - roadBotW / 2, CAM_H);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.2;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(vpX, vpY);
  ctx.lineTo(vpX, CAM_H);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(226,232,240,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vpX - roadTopW / 2, vpY);
  ctx.lineTo(vpX - roadBotW / 2, CAM_H);
  ctx.moveTo(vpX + roadTopW / 2, vpY);
  ctx.lineTo(vpX + roadBotW / 2, CAM_H);
  ctx.stroke();
}

// ============================================================
// VEHICLE RENDERING
// ============================================================

function drawVehicleSprite(ctx, p, v) {
  const { x, y, w, h } = p;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x + 2, y + 2, w, h);

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, lighten(v.color, 20));
  grad.addColorStop(1, v.color);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(15,23,42,0.7)';
  ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.25);

  ctx.fillStyle = 'rgba(255,250,200,0.9)';
  const lightW = Math.max(1, w * 0.12);
  const lightH = Math.max(1, h * 0.15);
  ctx.fillRect(x + w * 0.1, y + h - lightH - 1, lightW, lightH);
  ctx.fillRect(x + w - w * 0.1 - lightW, y + h - lightH - 1, lightW, lightH);

  if (v.type === 'ambulance') {
    const flash = Math.floor(Date.now() / 150) % 2 === 0;
    ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.3, Math.max(1.5, w * 0.08), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (v.braking || v.stopped) {
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.fillRect(x + w * 0.1, y + h - lightH - 1, lightW, lightH);
    ctx.fillRect(x + w - w * 0.1 - lightW, y + h - lightH - 1, lightW, lightH);
    ctx.shadowBlur = 0;
  }
}

function drawDetectionOverlay(ctx, p, v, trackId) {
  const { x, y, w, h } = p;
  const color = TYPE_COLORS[v.type] || '#22d3ee';
  const padding = 2;

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x - padding, y - padding, w + padding * 2, h + padding * 2);

  const cornerLen = Math.min(6, w * 0.25, h * 0.25);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - padding, y - padding + cornerLen);
  ctx.lineTo(x - padding, y - padding);
  ctx.lineTo(x - padding + cornerLen, y - padding);
  ctx.moveTo(x + w + padding - cornerLen, y - padding);
  ctx.lineTo(x + w + padding, y - padding);
  ctx.lineTo(x + w + padding, y - padding + cornerLen);
  ctx.moveTo(x + w + padding, y + h + padding - cornerLen);
  ctx.lineTo(x + w + padding, y + h + padding);
  ctx.lineTo(x + w + padding - cornerLen, y + h + padding);
  ctx.moveTo(x - padding + cornerLen, y + h + padding);
  ctx.lineTo(x - padding, y + h + padding);
  ctx.lineTo(x - padding, y + h + padding - cornerLen);
  ctx.stroke();

  const conf = (0.82 + ((v.id * 7) % 17) / 100).toFixed(2);

  const label = `${v.type.toUpperCase()} #${trackId}`;
  ctx.font = 'bold 8px JetBrains Mono, monospace';
  const textW = ctx.measureText(label).width;
  const labelH = 11;

  ctx.fillStyle = color;
  ctx.fillRect(x - padding, y - padding - labelH, textW + 6, labelH);
  ctx.fillStyle = '#0a0e1a';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x - padding + 3, y - padding - labelH / 2);

  const barH = h + padding * 2;
  const barW = 2;
  const barX = x + w + padding + 3;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX, y - padding, barW, barH);
  ctx.fillStyle = color;
  ctx.fillRect(barX, y - padding, barW, barH * parseFloat(conf));
}

// ============================================================
// LICENSE PLATE (Punjab / Jalandhar)
// ============================================================
function drawLicensePlate(ctx, p, v) {
  const { x, y, w, h, scale } = p;
  const plate = v.plate || 'PB-08-A-0000';

  // Skip tiny plates (vehicle too far away)
  if (scale < 0.55) return;

  const plateH = Math.max(8, 9 * scale);
  const plateW = Math.max(30, plate.length * 4 * scale);
  const plateX = x + w / 2 - plateW / 2;
  const plateY = y + h + 2;

  // Off-canvas guard
  if (plateY + plateH > CAM_H - 12) return;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(plateX + 1, plateY + 1, plateW, plateH);

  // Background
  const isAmbulance = v.type === 'ambulance';
  ctx.fillStyle = isAmbulance ? '#facc15' : '#f8fafc';
  ctx.fillRect(plateX, plateY, plateW, plateH);

  // Border
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(0.5, 0.6 * scale);
  ctx.strokeRect(plateX + 0.3, plateY + 0.3, plateW - 0.6, plateH - 0.6);

  // Text — scale-aware font
  const fontSize = Math.max(5, 7 * scale);
  ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
  ctx.textBaseline = 'middle';

  // India "IND" badge on left
  ctx.fillStyle = '#0f172a';
  const badgeW = Math.max(7, 8 * scale);
  ctx.fillRect(plateX + 1, plateY + 1, badgeW, plateH - 2);
  ctx.fillStyle = '#f8fafc';
  const badgeFontSize = Math.max(3, 3.5 * scale);
  ctx.font = `bold ${badgeFontSize}px Inter, sans-serif`;
  ctx.fillText('IND', plateX + 1.8, plateY + plateH / 2 + 0.3);

  // Plate number
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold ${fontSize}px JetBrains Mono, monospace`;
  const textX = plateX + badgeW + 3;
  const textY = plateY + plateH / 2 + 0.5;

  // Draw the plate characters
  ctx.fillText(plate, textX, textY);
}

// ============================================================
// OVERLAYS
// ============================================================

function drawTrails(ctx, trails) {
  for (const t of trails) {
    if (t.life <= 0) continue;
    ctx.fillStyle = hexToRgba(t.color, t.life * 0.4);
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.life * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDetectionZone(ctx) {
  const zoneY = CAM_H * 0.55;
  const zoneH = CAM_H * 0.4;
  ctx.strokeStyle = 'rgba(250,204,21,0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(10, zoneY);
  ctx.lineTo(CAM_W - 10, zoneY);
  ctx.lineTo(CAM_W - 10, zoneY + zoneH);
  ctx.lineTo(10, zoneY + zoneH);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(250,204,21,0.7)';
  ctx.font = 'bold 7px JetBrains Mono, monospace';
  ctx.fillText('ANPR ZONE · PB-08', 14, zoneY + 10);
}

function drawScanLine(ctx, ts) {
  const y = ((ts * 0.08) % (CAM_H + 40)) - 20;
  const grad = ctx.createLinearGradient(0, y - 20, 0, y + 20);
  grad.addColorStop(0, 'rgba(34,211,238,0)');
  grad.addColorStop(0.5, 'rgba(34,211,238,0.15)');
  grad.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 20, CAM_W, 40);
}

function drawGrid(ctx) {
  ctx.strokeStyle = 'rgba(148,163,184,0.06)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x < CAM_W; x += 30) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CAM_H);
  }
  for (let y = 0; y < CAM_H; y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(CAM_W, y);
  }
  ctx.stroke();
}

function drawNightVision(ctx) {
  ctx.fillStyle = 'rgba(34,197,94,0.10)';
  ctx.fillRect(0, 0, CAM_W, CAM_H);
  const grad = ctx.createRadialGradient(CAM_W / 2, CAM_H / 2, 20, CAM_W / 2, CAM_H / 2, CAM_W * 0.7);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CAM_W, CAM_H);
}

function drawScanlines(ctx) {
  ctx.fillStyle = 'rgba(34,211,238,0.03)';
  for (let y = 0; y < CAM_H; y += 3) {
    ctx.fillRect(0, y, CAM_W, 1);
  }
}

function drawGrain(ctx) {
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * CAM_W, Math.random() * CAM_H, 1, 1);
  }
}

function drawHUD(ctx, lane, vehicleCount, isNight, lastPlate) {
  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, CAM_W, 14);

  ctx.font = 'bold 7px JetBrains Mono, monospace';
  ctx.fillStyle = '#22d3ee';
  ctx.textBaseline = 'middle';

  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  ctx.fillText(`CAM-${lane} | ${time}`, 5, 7);

  // Vehicle count
  ctx.fillStyle = '#22c55e';
  ctx.fillText(`VEH: ${vehicleCount}`, CAM_W - 55, 7);

  // Day/IR
  ctx.fillStyle = isNight ? '#22c55e' : '#38bdf8';
  ctx.fillText(isNight ? 'IR' : 'DAY', CAM_W - 100, 7);

  // Nearest plate — in the middle of the top bar
  if (lastPlate) {
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    const tw = ctx.measureText(lastPlate).width;
    ctx.fillText(lastPlate, CAM_W / 2 - tw / 2, 7);
  }

  // Bottom bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, CAM_H - 12, CAM_W, 12);
  ctx.fillStyle = '#64748b';
  ctx.font = '6px JetBrains Mono, monospace';
  ctx.fillText('confidence threshold: 0.75', 5, CAM_H - 6);
  ctx.fillText('frame: ' + (Math.floor(performance.now() / 16.67) % 10000), CAM_W - 80, CAM_H - 6);
}

// ============================================================
// UTILITIES
// ============================================================

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lighten(hex, amt) {
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (n >> 16) + amt);
    const g = Math.min(255, ((n >> 8) & 0xff) + amt);
    const b = Math.min(255, (n & 0xff) + amt);
    return `rgb(${r},${g},${b})`;
  }
  return hex;
}

function hexToRgba(hex, alpha) {
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 0xff},${n & 0xff},${alpha})`;
  }
  return `rgba(34,211,238,${alpha})`;
}