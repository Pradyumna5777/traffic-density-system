import { useEffect, useRef } from 'react';
import { LAYOUT } from '../simulation/vehicles.js';

const CAM_W = 320;
const CAM_H = 200;

export default function CameraFeed({ vehiclesRef, lane, setLane, showDetection, lighting }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const loop = () => {
      const vehicles = vehiclesRef.current || [];
      const laneVehicles = vehicles.filter(v => v.lane[0] === lane);

      const grad = ctx.createLinearGradient(0, 0, 0, CAM_H);
      grad.addColorStop(0, lighting?.nightAmount > 0.5 ? '#050810' : '#111827');
      grad.addColorStop(1, lighting?.nightAmount > 0.5 ? '#0a1220' : '#1f2937');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CAM_W, CAM_H);

      // Horizon + road
      ctx.fillStyle = lighting?.nightAmount > 0.5 ? '#1a1f2a' : '#2a2f3a';
      ctx.beginPath();
      ctx.moveTo(CAM_W * 0.35, 0);
      ctx.lineTo(CAM_W * 0.65, 0);
      ctx.lineTo(CAM_W * 0.85, CAM_H);
      ctx.lineTo(CAM_W * 0.15, CAM_H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([10, 10]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(CAM_W / 2, 0);
      ctx.lineTo(CAM_W / 2, CAM_H);
      ctx.stroke();
      ctx.setLineDash([]);

      const sorted = [...laneVehicles].sort((a, b) => {
        if (lane === 'N') return b.y - a.y;
        if (lane === 'S') return a.y - b.y;
        if (lane === 'E') return a.x - b.x;
        return b.x - a.x;
      });

      for (const v of sorted) {
        const { W, H } = LAYOUT;
        let t = 0;
        if (lane === 'N') t = (v.y + v.h) / H;
        if (lane === 'S') t = 1 - v.y / H;
        if (lane === 'E') t = 1 - v.x / W;
        if (lane === 'W') t = v.x / W;

        const camY = 20 + t * (CAM_H - 60);
        const scale = 0.35 + t * 1.0;
        const vw = v.w * scale;
        const vh = v.h * scale;
        const camX = CAM_W / 2 - vw / 2;

        ctx.fillStyle = v.color;
        ctx.fillRect(camX, camY, vw, vh);
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(camX, camY, vw, vh);

        ctx.fillStyle = 'rgba(15,23,42,0.8)';
        ctx.fillRect(camX + 2, camY + 2, vw - 4, vh * 0.3);

        if (v.type === 'ambulance') {
          const flash = Math.floor(Date.now() / 200) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(camX + vw / 2, camY - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (showDetection) {
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(camX - 1, camY - 1, vw + 2, vh + 2);
          const conf = (0.85 + (v.id % 10) / 100).toFixed(2);
          const label = `${v.type} ${conf}`;
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = 'rgba(34,211,238,0.9)';
          ctx.fillRect(camX - 1, camY - 12, tw + 6, 11);
          ctx.fillStyle = '#0a0e1a';
          ctx.fillText(label, camX + 2, camY - 3);
        }
      }

      // Scanlines
      ctx.fillStyle = 'rgba(34,211,238,0.04)';
      for (let y = 0; y < CAM_H; y += 3) ctx.fillRect(0, y, CAM_W, 1);

      // Grain
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
        ctx.fillRect(Math.random() * CAM_W, Math.random() * CAM_H, 1, 1);
      }

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillText(`CAM-${lane} · 1080p`, 8, 14);
      ctx.fillText(`VEH: ${laneVehicles.length}`, 8, 26);
      if (lighting?.nightAmount > 0.5) ctx.fillText(`NIGHT-VISION ON`, 8, 38);

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [lane, showDetection, vehiclesRef, lighting]);

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-mono text-cyan-400">● AI CAMERA FEED</div>
        <select value={lane} onChange={e => setLane(e.target.value)}
          className="bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 text-slate-200">
          <option value="N">Lane A (N)</option>
          <option value="E">Lane B (E)</option>
          <option value="S">Lane C (S)</option>
          <option value="W">Lane D (W)</option>
        </select>
      </div>
      <div className="rounded-lg overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} width={CAM_W} height={CAM_H} className="w-full h-auto" />
      </div>
      <p className="mt-2 text-[10px] text-slate-500 font-mono">
        Simulated YOLO detection · bounding boxes + confidence
      </p>
    </div>
  );
}