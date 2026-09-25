import { Activity, Clock, Car, TrendingUp, Leaf, RefreshCw } from 'lucide-react';

const CARDS = [
  { key: 'activeVehicles', label: 'Active Vehicles', icon: Car, color: 'cyan' },
  { key: 'cleared', label: 'Total Cleared', icon: TrendingUp, color: 'emerald' },
  { key: 'avgWait', label: 'Avg Wait (s)', icon: Clock, color: 'amber', format: v => v.toFixed(1) },
  { key: 'throughput', label: 'Throughput/min', icon: Activity, color: 'violet', format: v => v.toFixed(0) },
  { key: 'cycleCount', label: 'Signal Cycles', icon: RefreshCw, color: 'sky' },
  { key: 'co2Saved', label: 'CO₂ Saved (kg)', icon: Leaf, color: 'green' },
];

const COLOR_MAP = {
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  sky: 'text-sky-400',
  green: 'text-green-400',
};

export default function StatsPanel({ stats }) {
  if (!stats) return null;
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Live Statistics</h2>
        <span className="text-xs font-mono text-slate-500">Updated every 1s</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CARDS.map(c => {
          const Icon = c.icon;
          const raw = stats[c.key] ?? 0;
          const val = c.format ? c.format(raw) : raw;
          return (
            <div key={c.key} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <Icon size={18} className={COLOR_MAP[c.color]} />
              <div className="text-2xl font-extrabold mt-2">{val}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}