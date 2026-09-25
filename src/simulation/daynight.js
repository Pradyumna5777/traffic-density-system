// Day/night cycle — returns lighting values for the current moment

export const DAY_LENGTH = 90; // seconds for full cycle

export function getLighting(t) {
  // t = time in seconds, cycles smoothly
  const phase = (t % DAY_LENGTH) / DAY_LENGTH;

  // Phases: 0=dawn, 0.25=day, 0.5=dusk, 0.75=night, then back
  // Use cosine interpolation
  const nightAmount = Math.max(0, Math.cos(phase * Math.PI * 2)) * 0.5 + 0.5;

  return {
    phase,
    nightAmount,          // 0=full day, 1=full night
    ambientDarkness: nightAmount * 0.55,
    headlightsOn: nightAmount > 0.5,
    streetlightsOn: nightAmount > 0.45,
  };
}

export function applyNightTint(ctx, lighting, W, H) {
  if (lighting.ambientDarkness < 0.02) return;
  ctx.fillStyle = `rgba(10, 20, 50, ${lighting.ambientDarkness})`;
  ctx.fillRect(0, 0, W, H);
}

export function drawStreetlights(ctx, lighting, W, H) {
  if (!lighting.streetlightsOn) return;
  const cx = W / 2, cy = H / 2;
  const lightPositions = [
    { x: cx - 100, y: cy - 200 },
    { x: cx + 100, y: cy - 200 },
    { x: cx - 100, y: cy + 200 },
    { x: cx + 100, y: cy + 200 },
    { x: cx - 200, y: cy - 100 },
    { x: cx + 200, y: cy - 100 },
    { x: cx - 200, y: cy + 100 },
    { x: cx + 200, y: cy + 100 },
  ];

  for (const p of lightPositions) {
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 70);
    grad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
    grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 70, 0, Math.PI * 2);
    ctx.fill();

    // Pole
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(p.x - 1, p.y, 2, 12);
    // Light bulb
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHeadlightCones(ctx, vehicles, lighting, W, H) {
  if (!lighting.headlightsOn) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const v of vehicles) {
    const grad = ctx.createRadialGradient(v.x + v.w/2, v.y + v.h/2, 0, v.x + v.w/2, v.y + v.h/2, 55);
    grad.addColorStop(0, 'rgba(255, 250, 200, 0.35)');
    grad.addColorStop(1, 'rgba(255, 250, 200, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(v.x + v.w/2, v.y + v.h/2, 55, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}