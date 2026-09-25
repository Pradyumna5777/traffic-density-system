import { getSignalForLane } from '../simulation/signals.js';

const DIRS = ['N', 'E', 'S', 'W'];
const NAMES = { N: 'A', E: 'B', S: 'C', W: 'D' };

export default function SignalState({ signalState, densities }) {
  if (!signalState) return null;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="text-xs font-mono text-slate-400 mb-3">SIGNAL CONTROLLER</div>
      <div className="space-y-2">
        {DIRS.map(d => {
          const inner = getSignalForLane(signalState, d + 'A');
          const isActive = signalState.activeDir === d;
          const phaseLabel = signalState.phase === 'left-arrow' && isActive && inner === 'arrow-left'
            ? 'LEFT ARROW' : inner.toUpperCase();
          return (
            <div key={d}
              className={`flex items-center justify-between rounded-lg px-3 py-2 border transition ${
                isActive ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 bg-slate-950'
              }`}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Dot on={inner === 'red'} color="red" />
                  <Dot on={inner === 'yellow'} color="yellow" />
                  <Dot on={inner === 'green' || inner === 'arrow-left'} color="green" />
                </div>
                <span className="text-xs font-mono text-slate-300">Lane {NAMES[d]}</span>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 font-mono">
                  {((densities[d] || 0) * 100).toFixed(0)}%
                </div>
                {isActive && (
                  <div className="text-xs font-mono text-emerald-400">
                    {signalState.timeLeft.toFixed(1)}s · {phaseLabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {signalState.emergencyActive && (
        <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/50 px-3 py-2 text-xs text-red-300 font-mono animate-pulse">
          🚑 EMERGENCY PRIORITY
        </div>
      )}
    </div>
  );
}

function Dot({ on, color }) {
  const colors = {
    red: on ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]' : 'bg-red-900/40',
    yellow: on ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.9)]' : 'bg-yellow-900/40',
    green: on ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]' : 'bg-emerald-900/40',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[color]}`} />;
}