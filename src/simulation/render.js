import { LAYOUT } from './vehicles.js';
import { getSignalForLane } from './signals.js';

const { W, H, ROAD_W, LANE_W } = LAYOUT;
const cx = W / 2;
const cy = H / 2;

// ============================================================
// STATIC LAYER — rendered ONCE to an offscreen canvas
// ============================================================
let staticLayer = null;

function buildStaticLayer() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { alpha: false });

  // --- Ground (grass) ---
  g.fillStyle = '#1e3a1e';
  g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let i = 0; i < 300; i++) {
    const x = (i * 137) % W;
    const y = (i * 89) % H;
    if (Math.abs(x - cx) < ROAD_W || Math.abs(y - cy) < ROAD_W) continue;
    g.fillRect(x, y, 2, 2);
  }

  // --- BUILDINGS ---
  drawBuildings(g);

  // --- Roads ---
  drawRoads(g);

  // --- Road markings ---
  drawMarkings(g);

  // --- Crosswalks ---
  drawCrosswalks(g);

  // --- Stop lines ---
  drawStopLines(g);

  // --- Direction arrows ---
  drawArrows(g);

  // --- Lane labels ---
  g.font = 'bold 14px JetBrains Mono, monospace';
  g.fillStyle = '#94a3b8';
  g.fillText('LANE A (N)', cx - ROAD_W / 2 + 6, 24);
  g.fillText('LANE B (E)', W - 110, cy - ROAD_W / 2 + 20);
  g.fillText('LANE C (S)', cx - ROAD_W / 2 + 6, H - 12);
  g.fillText('LANE D (W)', 10, cy - ROAD_W / 2 + 20);

  staticLayer = c;
}

// ============================================================
// BUILDINGS — detailed, themed per corner
// ============================================================
function drawBuildings(g) {
  // Top-left: row of shops
  drawShopRow(g, 20, 20, 140, 100);

  // Top-right: tall apartment building
  drawApartment(g, W - 160, 20, 140, 130, 4);

  // Bottom-left: café + small boutique
  drawCafe(g, 20, H - 150, 120, 130);
  drawBoutique(g, 145, H - 100, 70, 80);

  // Bottom-right: gas station + convenience store
  drawGasStation(g, W - 180, H - 160);
  drawConvenienceStore(g, W - 140, H - 90, 120, 70);
}

// ---------- SHOP ROW ----------
function drawShopRow(g, x, y, w, h) {
  // Building base
  g.fillStyle = '#cbd5e1';
  g.fillRect(x, y, w, h);

  // Roof trim
  g.fillStyle = '#475569';
  g.fillRect(x - 2, y - 4, w + 4, 8);

  // Split into 3 shops
  const shopW = w / 3;
  const shopColors = ['#dc2626', '#0891b2', '#16a34a'];
  const shopNames = ['CAFÉ', 'MART', 'BOOKS'];

  for (let i = 0; i < 3; i++) {
    const sx = x + i * shopW;

    // Awning stripe
    g.fillStyle = shopColors[i];
    g.fillRect(sx + 3, y + 30, shopW - 6, 12);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    for (let s = 0; s < 4; s++) {
      g.fillRect(sx + 5 + s * 8, y + 30, 4, 12);
    }

    // Shop sign
    g.fillStyle = '#0f172a';
    g.fillRect(sx + 5, y + 8, shopW - 10, 18);
    g.fillStyle = '#f8fafc';
    g.font = 'bold 10px Inter, sans-serif';
    g.textAlign = 'center';
    g.fillText(shopNames[i], sx + shopW / 2, y + 20);
    g.textAlign = 'left';

    // Door
    g.fillStyle = '#1e293b';
    g.fillRect(sx + shopW / 2 - 6, y + h - 30, 12, 30);
    g.fillStyle = '#475569';
    g.fillRect(sx + shopW / 2 - 1, y + h - 20, 2, 8);

    // Window
    g.fillStyle = '#93c5fd';
    g.fillRect(sx + 8, y + 50, shopW - 20, 25);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(sx + 10, y + 52, shopW - 30, 4);
    g.fillRect(sx + 10, y + 60, shopW - 40, 3);
  }
}

// ---------- APARTMENT ----------
function drawApartment(g, x, y, w, h, floors) {
  // Main body
  g.fillStyle = '#475569';
  g.fillRect(x, y, w, h);

  // Roof
  g.fillStyle = '#1e293b';
  g.fillRect(x - 3, y - 6, w + 6, 10);

  // Roof AC units
  g.fillStyle = '#64748b';
  g.fillRect(x + 15, y - 12, 18, 8);
  g.fillRect(x + 60, y - 12, 18, 8);
  g.fillRect(x + w - 40, y - 12, 18, 8);

  // Floors
  const floorH = (h - 20) / floors;
  for (let f = 0; f < floors; f++) {
    const fy = y + 15 + f * floorH;

    // Floor divider line
    g.fillStyle = '#334155';
    g.fillRect(x, fy + floorH - 2, w, 2);

    // Windows per floor
    const winW = 20;
    const winH = floorH - 15;
    const gap = 8;
    const numWin = Math.floor((w - gap) / (winW + gap));
    for (let i = 0; i < numWin; i++) {
      const wx = x + gap + i * (winW + gap);

      // Window frame
      g.fillStyle = '#0f172a';
      g.fillRect(wx, fy + 5, winW, winH);

      // Lit window (deterministic pattern)
      const lit = ((f * 7 + i * 3) % 5) > 2;
      g.fillStyle = lit ? '#fde047' : '#1e3a5f';
      g.fillRect(wx + 2, fy + 7, winW - 4, winH - 4);

      // Window cross
      g.fillStyle = '#0f172a';
      g.fillRect(wx + winW / 2 - 1, fy + 7, 2, winH - 4);
      g.fillRect(wx + 2, fy + 5 + winH / 2, winW - 4, 2);
    }
  }

  // Entrance
  g.fillStyle = '#0f172a';
  g.fillRect(x + w / 2 - 12, y + h - 25, 24, 25);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + w / 2 + 6, y + h - 14, 3, 3);
}

// ---------- CAFÉ ----------
function drawCafe(g, x, y, w, h) {
  // Body
  g.fillStyle = '#fef3c7';
  g.fillRect(x, y, w, h);

  // Striped awning
  const awnW = w - 10;
  for (let i = 0; i < awnW / 8; i++) {
    g.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
    g.fillRect(x + 5 + i * 8, y + 15, 8, 14);
  }

  // Sign
  g.fillStyle = '#78350f';
  g.fillRect(x + 5, y + 35, w - 10, 20);
  g.fillStyle = '#fef3c7';
  g.font = 'bold 12px Inter, sans-serif';
  g.textAlign = 'center';
  g.fillText('☕ CAFÉ', x + w / 2, y + 49);
  g.textAlign = 'left';

  // Large window
  g.fillStyle = '#0f172a';
  g.fillRect(x + 8, y + 62, w - 16, 40);
  g.fillStyle = 'rgba(147,197,253,0.7)';
  g.fillRect(x + 10, y + 64, w - 20, 36);

  // Door
  g.fillStyle = '#1e293b';
  g.fillRect(x + w / 2 - 10, y + h - 30, 20, 30);

  // Door handle — FIXED: use arc + fill
  g.fillStyle = '#fbbf24';
  g.beginPath();
  g.arc(x + w / 2 + 6, y + h - 15, 2, 0, Math.PI * 2);
  g.fill();

  // Outdoor seating (small circles = tables)
  g.fillStyle = '#451a03';
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(x + w + 15 + i * 12, y + h - 20, 4, 0, Math.PI * 2);
    g.fill();
  }
}

// ---------- BOUTIQUE ----------
function drawBoutique(g, x, y, w, h) {
  g.fillStyle = '#f3e8ff';
  g.fillRect(x, y, w, h);

  // Pink awning
  g.fillStyle = '#d946ef';
  g.fillRect(x + 4, y + 12, w - 8, 10);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 5; i++) {
    g.fillRect(x + 6 + i * 12, y + 12, 5, 10);
  }

  // Sign
  g.fillStyle = '#701a75';
  g.fillRect(x + 4, y + 26, w - 8, 14);
  g.fillStyle = '#fce7f3';
  g.font = 'bold 9px Inter, sans-serif';
  g.textAlign = 'center';
  g.fillText('BOUTIQUE', x + w / 2, y + 36);
  g.textAlign = 'left';

  // Display window
  g.fillStyle = '#0f172a';
  g.fillRect(x + 8, y + 45, w - 16, 25);
  g.fillStyle = 'rgba(251,207,232,0.6)';
  g.fillRect(x + 10, y + 47, w - 20, 21);

  // Door
  g.fillStyle = '#1e293b';
  g.fillRect(x + w / 2 - 6, y + h - 20, 12, 20);
}

// ---------- GAS STATION ----------
function drawGasStation(g, x, y) {
  // Canopy
  g.fillStyle = '#dc2626';
  g.fillRect(x, y, 160, 20);
  g.fillStyle = '#f8fafc';
  g.fillRect(x, y + 8, 160, 4);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + 8, y + 4, 60, 12);
  g.fillStyle = '#1e293b';
  g.font = 'bold 9px Inter, sans-serif';
  g.fillText('FUEL', x + 14, y + 13);

  // Canopy supports
  g.fillStyle = '#475569';
  g.fillRect(x + 10, y + 20, 6, 40);
  g.fillRect(x + 144, y + 20, 6, 40);

  // Pumps
  for (let i = 0; i < 2; i++) {
    const px = x + 40 + i * 45;
    g.fillStyle = '#1e293b';
    g.fillRect(px, y + 40, 16, 26);
    g.fillStyle = '#22c55e';
    g.fillRect(px + 3, y + 43, 10, 6);
    g.strokeStyle = '#0f172a';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px + 16, y + 45);
    g.quadraticCurveTo(px + 22, y + 50, px + 20, y + 60);
    g.stroke();
  }

  // Ground pad
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.fillRect(x - 5, y + 62, 170, 6);
}

// ---------- CONVENIENCE STORE ----------
function drawConvenienceStore(g, x, y, w, h) {
  g.fillStyle = '#e0f2fe';
  g.fillRect(x, y, w, h);

  // Store stripe
  g.fillStyle = '#0284c7';
  g.fillRect(x, y, w, 14);

  // Store sign
  g.fillStyle = '#0c4a6e';
  g.fillRect(x + 3, y + 2, w - 6, 10);
  g.fillStyle = '#f8fafc';
  g.font = 'bold 9px Inter, sans-serif';
  g.textAlign = 'center';
  g.fillText('24/7 STORE', x + w / 2, y + 10);
  g.textAlign = 'left';

  // Windows
  g.fillStyle = '#0f172a';
  g.fillRect(x + 5, y + 20, w - 10, 30);
  g.fillStyle = 'rgba(147,197,253,0.5)';
  g.fillRect(x + 7, y + 22, w - 14, 26);

  // Products in window
  g.fillStyle = '#dc2626';
  for (let i = 0; i < 5; i++) {
    g.fillRect(x + 10 + i * 8, y + 30, 5, 6);
  }
  g.fillStyle = '#fbbf24';
  for (let i = 0; i < 5; i++) {
    g.fillRect(x + 10 + i * 8, y + 40, 5, 5);
  }

  // Door
  g.fillStyle = '#1e293b';
  g.fillRect(x + w / 2 - 8, y + h - 22, 16, 22);
  g.fillStyle = '#fbbf24';
  g.fillRect(x + w / 2 + 3, y + h - 12, 2, 3);
}

// ============================================================
// ROADS
// ============================================================
function drawRoads(g) {
  g.fillStyle = '#1f242e';
  g.fillRect(cx - ROAD_W / 2, 0, ROAD_W, H);
  g.fillRect(0, cy - ROAD_W / 2, W, ROAD_W);
  g.fillStyle = '#252b36';
  g.fillRect(cx - ROAD_W / 2, cy - ROAD_W / 2, ROAD_W, ROAD_W);

  // Asphalt noise
  g.fillStyle = 'rgba(255, 255, 255, 0.02)';
  for (let i = 0; i < 250; i++) {
    g.fillRect(cx - ROAD_W / 2 + Math.random() * ROAD_W, Math.random() * H, 1, 1);
  }
  for (let i = 0; i < 250; i++) {
    g.fillRect(Math.random() * W, cy - ROAD_W / 2 + Math.random() * ROAD_W, 1, 1);
  }
}

function drawMarkings(g) {
  // Yellow double center lines
  g.strokeStyle = '#eab308';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - 3, 0); g.lineTo(cx - 3, cy - ROAD_W / 2);
  g.moveTo(cx - 3, cy + ROAD_W / 2); g.lineTo(cx - 3, H);
  g.moveTo(cx + 3, 0); g.lineTo(cx + 3, cy - ROAD_W / 2);
  g.moveTo(cx + 3, cy + ROAD_W / 2); g.lineTo(cx + 3, H);
  g.moveTo(0, cy - 3); g.lineTo(cx - ROAD_W / 2, cy - 3);
  g.moveTo(cx + ROAD_W / 2, cy - 3); g.lineTo(W, cy - 3);
  g.moveTo(0, cy + 3); g.lineTo(cx - ROAD_W / 2, cy + 3);
  g.moveTo(cx + ROAD_W / 2, cy + 3); g.lineTo(W, cy + 3);
  g.stroke();

  // White dashed lane dividers
  g.strokeStyle = '#e2e8f0';
  g.lineWidth = 2;
  g.setLineDash([15, 12]);
  const laneOffset = LANE_W / 2;
  g.beginPath();
  g.moveTo(cx - laneOffset, 0); g.lineTo(cx - laneOffset, cy - ROAD_W / 2);
  g.moveTo(cx - laneOffset, cy + ROAD_W / 2); g.lineTo(cx - laneOffset, H);
  g.moveTo(cx + laneOffset, 0); g.lineTo(cx + laneOffset, cy - ROAD_W / 2);
  g.moveTo(cx + laneOffset, cy + ROAD_W / 2); g.lineTo(cx + laneOffset, H);
  g.moveTo(0, cy - laneOffset); g.lineTo(cx - ROAD_W / 2, cy - laneOffset);
  g.moveTo(cx + ROAD_W / 2, cy - laneOffset); g.lineTo(W, cy - laneOffset);
  g.moveTo(0, cy + laneOffset); g.lineTo(cx - ROAD_W / 2, cy + laneOffset);
  g.moveTo(cx + ROAD_W / 2, cy + laneOffset); g.lineTo(W, cy + laneOffset);
  g.stroke();
  g.setLineDash([]);
}

function drawCrosswalks(g) {
  g.fillStyle = 'rgba(241,245,249,0.9)';
  const stripeW = 8, stripeGap = 8, stripeLen = 18, zOff = 55;
  for (let i = 0; i < 8; i++) {
    const x = cx - ROAD_W / 2 + 8 + i * (stripeW + stripeGap);
    g.fillRect(x, cy - ROAD_W / 2 - zOff - stripeLen, stripeW, stripeLen);
    g.fillRect(x, cy + ROAD_W / 2 + zOff, stripeW, stripeLen);
    const y = cy - ROAD_W / 2 + 8 + i * (stripeW + stripeGap);
    g.fillRect(cx + ROAD_W / 2 + zOff, y, stripeLen, stripeW);
    g.fillRect(cx - ROAD_W / 2 - zOff - stripeLen, y, stripeLen, stripeW);
  }
}

function drawStopLines(g) {
  g.strokeStyle = '#f1f5f9';
  g.lineWidth = 4;
  const off = 90;
  g.beginPath();
  g.moveTo(cx - ROAD_W / 2, cy - off); g.lineTo(cx - 4, cy - off);
  g.moveTo(cx + 4, cy + off); g.lineTo(cx + ROAD_W / 2, cy + off);
  g.moveTo(cx + off, cy - ROAD_W / 2); g.lineTo(cx + off, cy - 4);
  g.moveTo(cx - off, cy + 4); g.lineTo(cx - off, cy + ROAD_W / 2);
  g.stroke();
}

function drawArrows(g) {
  g.fillStyle = '#cbd5e1';
  const laneOffset = LANE_W / 2;
  drawArrow(g, cx - laneOffset - 4, cy - ROAD_W / 2 - 60, 'up');
  drawArrow(g, cx + laneOffset - 4, cy - ROAD_W / 2 - 60, 'up');
  drawArrow(g, cx + laneOffset - 4, cy + ROAD_W / 2 + 60, 'down');
  drawArrow(g, cx - laneOffset - 4, cy + ROAD_W / 2 + 60, 'down');
  drawArrow(g, cx + ROAD_W / 2 + 60, cy + laneOffset - 4, 'left');
  drawArrow(g, cx + ROAD_W / 2 + 60, cy - laneOffset - 4, 'left');
  drawArrow(g, cx - ROAD_W / 2 - 60, cy - laneOffset - 4, 'right');
  drawArrow(g, cx - ROAD_W / 2 - 60, cy + laneOffset - 4, 'right');
}

function drawArrow(ctx, x, y, facing) {
  ctx.save();
  ctx.translate(x, y);
  const rot = { up: 0, down: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[facing];
  ctx.rotate(rot);
  ctx.fillRect(-2, -14, 4, 22);
  ctx.beginPath();
  ctx.moveTo(-7, -14); ctx.lineTo(7, -14); ctx.lineTo(0, -22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ============================================================
// MAIN DRAW FUNCTION
// ============================================================
export function drawScene(ctx, opts) {
  const {
    vehicles,
    signalState,
    highlightedDir,
    showDetection,
    lighting,
    weather,
    accidentLane,
        accidentLaneId,
    rainTime,
  } = opts;

  if (!staticLayer) buildStaticLayer();

  // 1) Blit static layer
  ctx.drawImage(staticLayer, 0, 0);

  // 2) Active lane highlight
  if (highlightedDir) {
    ctx.fillStyle = 'rgba(34,197,94,0.06)';
    const h = ROAD_W / 2;
    if (highlightedDir === 'N') ctx.fillRect(cx - ROAD_W / 2, 0, ROAD_W, cy - ROAD_W / 2);
    if (highlightedDir === 'E') ctx.fillRect(cx + ROAD_W / 2, cy - ROAD_W / 2, W, ROAD_W);
    if (highlightedDir === 'S') ctx.fillRect(cx - ROAD_W / 2, cy + ROAD_W / 2, ROAD_W, H);
    if (highlightedDir === 'W') ctx.fillRect(0, cy - ROAD_W / 2, cx - ROAD_W / 2, ROAD_W);
  }

  if (accidentLane) drawAccident(ctx, accidentLane, accidentLaneId);

  
  // 3) Vehicles
  for (let i = 0; i < vehicles.length; i++) {
    drawVehicle(ctx, vehicles[i]);
  }

  // 4) Traffic lights
  drawAllTrafficLights(ctx, signalState);

  // 5) Night overlays
  if (lighting && lighting.headlightsOn) {
    drawStreetlights(ctx);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 250, 200, 0.06)';
    for (let i = 0; i < vehicles.length; i++) {
      const v = vehicles[i];
      ctx.beginPath();
      ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 40, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  if (lighting && lighting.ambientDarkness > 0.02) {
    ctx.fillStyle = `rgba(10, 20, 50, ${lighting.ambientDarkness})`;
    ctx.fillRect(0, 0, W, H);
  }

  // 6) Detection boxes
  if (showDetection) drawDetectionBoxes(ctx, vehicles);

  // 7) Weather
  if (weather && weather !== 'clear') {
    drawWeatherOverlay(ctx, weather, rainTime);
  }
}

// ============================================================
// DYNAMIC ELEMENTS
// ============================================================
function drawAccident(ctx, dir, laneId) {
  const { W: w, H: h, ROAD_W: rw, LANE_W: lw, STOP_LINE_OFFSET } = LAYOUT;
  const cX = w / 2, cY = h / 2;

  const laneOffset = (laneId && laneId[1] === 'B')
    ? (lw * 1.5 + 8)
    : (lw / 2 + 4);

  let x = cX, y = cY;
  const stopOff = STOP_LINE_OFFSET + 25;

  if (dir === 'N') { x = cX - laneOffset; y = cY - stopOff; }
  if (dir === 'S') { x = cX + laneOffset; y = cY + stopOff; }
  if (dir === 'E') { x = cX + stopOff; y = cY - laneOffset; }
  if (dir === 'W') { x = cX - stopOff; y = cY + laneOffset; }

  // Pulsing red glow
  const pulse = (Math.sin(Date.now() / 250) + 1) / 2;
  const glowR = 28 + pulse * 8;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
  grad.addColorStop(0, `rgba(239, 68, 68, ${0.35 + pulse * 0.25})`);
  grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Triangle warning sign
  const size = 18;
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.85, y + size * 0.6);
  ctx.lineTo(x - size * 0.85, y + size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // "!" symbol
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y + 3);

  // Debris
  ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = 22 + (i % 3) * 4;
    ctx.fillRect(
      x + Math.cos(angle) * dist - 2,
      y + Math.sin(angle) * dist - 2,
      3, 3
    );
  }

  // "ACCIDENT" label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(x - 34, y + 26, 68, 16);
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ACCIDENT', x, y + 34);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawVehicle(ctx, v) {
  const isVertical = v.dir === 'N' || v.dir === 'S';
  const rotation = { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 }[v.dir];
  const turningRot = v.turning ? (v.angle - rotation) : 0;

  ctx.save();
  ctx.translate(v.x + v.w / 2, v.y + v.h / 2);
  if (v.turning) ctx.rotate(turningRot);
  ctx.translate(-v.w / 2, -v.h / 2);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(3, 4, v.w, v.h);

  // Body
  ctx.fillStyle = v.color;
  roundRect(ctx, 0, 0, v.w, v.h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Windshield
  ctx.fillStyle = 'rgba(15,23,42,0.85)';
  if (isVertical) {
    ctx.fillRect(4, 3, v.w - 8, 4);
    ctx.fillRect(4, v.h - 7, v.w - 8, 4);
  } else {
    ctx.fillRect(3, 4, 4, v.h - 8);
    ctx.fillRect(v.w - 7, 4, 4, v.h - 8);
  }

  // Wheels
  ctx.fillStyle = '#0a0a0a';
  if (isVertical) {
    ctx.fillRect(-1, 3, 2, 5);
    ctx.fillRect(v.w - 1, 3, 2, 5);
    ctx.fillRect(-1, v.h - 8, 2, 5);
    ctx.fillRect(v.w - 1, v.h - 8, 2, 5);
  } else {
    ctx.fillRect(3, -1, 5, 2);
    ctx.fillRect(v.w - 8, -1, 5, 2);
    ctx.fillRect(3, v.h - 1, 5, 2);
    ctx.fillRect(v.w - 8, v.h - 1, 5, 2);
  }

  // Ambulance
  if (v.type === 'ambulance') {
    const flash = (Math.floor(Date.now() / 200) % 2) === 0;
    ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(v.w / 2, 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Brake lights
  if (v.braking || v.stopped) {
    ctx.fillStyle = '#ef4444';
    if (isVertical) {
      if (v.dir === 'N') { ctx.fillRect(2, 0, 5, 3); ctx.fillRect(v.w - 7, 0, 5, 3); }
      else { ctx.fillRect(2, v.h - 3, 5, 3); ctx.fillRect(v.w - 7, v.h - 3, 5, 3); }
    } else {
      if (v.dir === 'E') { ctx.fillRect(0, 3, 3, 5); ctx.fillRect(0, v.h - 8, 3, 5); }
      else { ctx.fillRect(v.w - 3, 3, 3, 5); ctx.fillRect(v.w - 3, v.h - 8, 3, 5); }
    }
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawAllTrafficLights(ctx, signalState) {
  const off = 90;
  const positions = [
    { x: cx - ROAD_W / 2 - 30, y: cy - off - 30, dir: 'N' },
    { x: cx + off + 30, y: cy - ROAD_W / 2 - 30, dir: 'E' },
    { x: cx + ROAD_W / 2 + 30, y: cy + off + 30, dir: 'S' },
    { x: cx - off - 30, y: cy + ROAD_W / 2 + 30, dir: 'W' },
  ];

  for (const p of positions) {
    const signal = getSignalForLane(signalState, p.dir + 'A');
    drawTrafficLight(ctx, p.x, p.y, signal);
  }
}

function drawTrafficLight(ctx, x, y, state) {
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  roundRect(ctx, x - 14, y - 34, 28, 72, 6);
  ctx.fill();
  ctx.stroke();

  const colors = [
    { c: '#ef4444', on: state === 'red' },
    { c: '#eab308', on: state === 'yellow' },
    { c: '#22c55e', on: state === 'green' || state === 'arrow-left' },
  ];

  for (let i = 0; i < colors.length; i++) {
    const cc = colors[i];
    const cyy = y - 22 + i * 22;
    ctx.beginPath();
    ctx.arc(x, cyy, 8, 0, Math.PI * 2);
    if (cc.on) {
      ctx.fillStyle = cc.c;
      ctx.shadowColor = cc.c;
      ctx.shadowBlur = 20;
    } else {
      ctx.fillStyle = shade(cc.c, -0.65);
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0a0e1a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + pct * 255));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + pct * 255));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct * 255));
  return `rgb(${r|0},${g|0},${b|0})`;
}

function drawDetectionBoxes(ctx, vehicles) {
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 1.5;
  ctx.font = 'bold 10px JetBrains Mono, monospace';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];
    if (v.crossed && !v.turning) continue;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    const conf = (0.85 + (v.id % 10) / 100).toFixed(2);
    const label = `${v.type} ${conf}`;
    const tw = label.length * 5.5;
    ctx.fillStyle = 'rgba(34,211,238,0.9)';
    ctx.fillRect(v.x, v.y - 12, tw + 4, 11);
    ctx.fillStyle = '#0a0e1a';
    ctx.fillText(label, v.x + 2, v.y - 6);
  }
}

function drawStreetlights(ctx) {
  const positions = [
    { x: cx - 100, y: cy - 200 }, { x: cx + 100, y: cy - 200 },
    { x: cx - 100, y: cy + 200 }, { x: cx + 100, y: cy + 200 },
    { x: cx - 200, y: cy - 100 }, { x: cx + 200, y: cy - 100 },
    { x: cx - 200, y: cy + 100 }, { x: cx + 200, y: cy + 100 },
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(253, 224, 71, 0.10)';
  for (let i = 0; i < positions.length; i++) {
    ctx.beginPath();
    ctx.arc(positions[i].x, positions[i].y, 55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#fde047';
  for (let i = 0; i < positions.length; i++) {
    ctx.fillRect(positions[i].x - 1, positions[i].y - 1, 3, 3);
  }
}

function drawWeatherOverlay(ctx, weather, time) {
  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 40; i++) {
      const x = (i * 137 + time * 400) % W;
      const y = (i * 89 + time * 800) % H;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 12);
    }
    ctx.stroke();
  } else if (weather === 'fog') {
    ctx.fillStyle = 'rgba(226, 232, 240, 0.18)';
    ctx.fillRect(0, 0, W, H);
  } else if (weather === 'snow') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 91 + time * 60) % W;
      const y = (i * 73 + time * 120) % H;
      ctx.fillRect(x, y, 2, 2);
    }
  }
}