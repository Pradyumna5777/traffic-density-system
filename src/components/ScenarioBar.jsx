import { SCENARIOS } from '../simulation/scenarios.js';

export default function ScenarioBar({ scenario, setScenario, setWeather }) {
  const active = SCENARIOS[scenario];
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs font-mono text-slate-400">ACTIVE SCENARIO</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{active?.icon}</span>
            <div>
              <div className="font-bold">{active?.label}</div>
              <div className="text-xs text-slate-400">{active?.description}</div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button key={key} onClick={() => { setScenario(key); if (s.weather) setWeather(s.weather); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                scenario === key ? 'bg-emerald-500 text-slate-900' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}