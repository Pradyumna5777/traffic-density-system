import { useState, useEffect } from 'react';
import { Cloud, Wifi } from 'lucide-react';

export default function CloudPanel({ densities, counts }) {
  const [remote, setRemote] = useState({
    i1: { density: 0.4, count: 8 },
    i2: { density: 0.2, count: 4 },
    i3: { density: 0.7, count: 12 },
  });

  useEffect(() => {
    const t = setInterval(() => {
      setRemote({
        i1: { density: Math.random(), count: 3 + Math.floor(Math.random() * 15) },
        i2: { density: Math.random(), count: 2 + Math.floor(Math.random() * 10) },
        i3: { density: Math.random(), count: 5 + Math.floor(Math.random() * 20) },
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const totalCount = (counts?.N || 0) + (counts?.E || 0) + (counts?.S || 0) + (counts?.W || 0);
  const avgDensity = ((densities?.N || 0) + (densities?.E || 0) + (densities?.S || 0) + (densities?.W || 0)) / 4;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-cyan-400" />
          <span className="text-xs font-mono text-slate-400">CITY NETWORK (IoT)</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
          <Wifi size={12} /> Connected
        </div>
      </div>

      <div className="space-y-2">
        <Row label="This Intersection" count={totalCount} density={avgDensity} highlighted />
        <Row label="Intersection 2" count={remote.i1.count} density={remote.i1.density} />
        <Row label="Intersection 3" count={remote.i2.count} density={remote.i2.density} />
        <Row label="Intersection 4" count={remote.i3.count} density={remote.i3.density} />
      </div>
    </div>
  );
}

function Row({ label, count, density, highlighted }) {
  const level = density < 0.3 ? 'LOW' : density < 0.7 ? 'MED' : 'HIGH';
  const color = level === 'LOW' ? 'text-emerald-400' : level === 'MED' ? 'text-amber-400' : 'text-red-400';
  const barColor = level === 'LOW' ? 'bg-emerald-500' : level === 'MED' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`rounded-lg border p-2 ${highlighted ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 bg-slate-950'}`}>
      <div className="flex justify-between text-xs">
        <span className={highlighted ? 'text-cyan-300 font-semibold' : 'text-slate-400'}>{label}</span>
        <span className={`font-mono ${color}`}>{count} · {level}</span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full ${barColor} transition-all`} style={{ width: `${density * 100}%` }} />
      </div>
    </div>
  );
}