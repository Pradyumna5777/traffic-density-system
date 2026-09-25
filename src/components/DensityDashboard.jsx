import { densityLevel } from '../simulation/density.js';

const DIRS = ['N', 'E', 'S', 'W'];
const NAMES = { N: 'A', E: 'B', S: 'C', W: 'D' };
const FULL = { N: 'North', E: 'East', S: 'South', W: 'West' };

const COLOR_MAP = {
  LOW:    { text: 'text-emerald-400', bar: 'bg-emerald-500' },
  MEDIUM: { text: 'text-amber-400',   bar: 'bg-amber-500' },
  HIGH:   { text: 'text-red-400',     bar: 'bg-red-500' },
};

export default function DensityDashboard({ densities, counts, signalState }) {
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Live Density Dashboard</h2>
        <span className="text-xs font-mono text-slate-500">8 lanes · 4 directions</span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DIRS.map(d => {
          const dVal = densities[d] ?? 0;
          const level = densityLevel(dVal);
          const pct = Math.round(dVal * 100);
          const c = COLOR_MAP[level];
          const isActive = signalState?.activeDir === d;
          return (
            <div key={d}
              className={`rounded-xl border p-4 transition ${
                isActive ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">Lane {NAMES[d]}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{FULL[d]} approach</div>
                </div>
                {isActive && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500 text-slate-900">
                    {signalState.phase === 'left-arrow' ? 'ARROW' : 'GREEN'}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="text-3xl font-extrabold">{counts[d] ?? 0}</div>
                <div className="text-right">
                  <div className={`text-xs font-mono ${c.text}`}>{level}</div>
                  <div className="text-[10px] text-slate-500">{pct}%</div>
                </div>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${c.bar} transition-all duration-500`}
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}