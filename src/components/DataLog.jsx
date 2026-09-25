import { Trash2, Download } from 'lucide-react';

export default function DataLog({ logs, onClear }) {
  const downloadCSV = () => {
    const headers = ['Time', 'Lane', 'Vehicles', 'Density', 'Level', 'Signal'];
    const rows = logs.map(l => [l.time, l.lane, l.count, (l.density * 100).toFixed(0), l.level, l.signal]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">Data Log</h2>
          <p className="text-sm text-slate-400">Live observations recorded every second.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold">
            <Download size={14} /> CSV
          </button>
          <button onClick={downloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold">
            <Download size={14} /> JSON
          </button>
          <button onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold">
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 overflow-hidden max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-950 sticky top-0">
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Lane</th>
              <th className="px-3 py-2">Vehicles</th>
              <th className="px-3 py-2">Density</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Signal</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {logs.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                No data yet — start the simulation.
              </td></tr>
            )}
            {logs.map(l => (
              <tr key={l.id} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-3 py-1.5 text-slate-400">{l.time}</td>
                <td className="px-3 py-1.5">Lane {l.lane}</td>
                <td className="px-3 py-1.5">{l.count}</td>
                <td className="px-3 py-1.5">{(l.density * 100).toFixed(0)}%</td>
                <td className={`px-3 py-1.5 font-semibold ${
                  l.level === 'LOW' ? 'text-emerald-400' :
                  l.level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                }`}>{l.level}</td>
                <td className="px-3 py-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    l.signal === 'green' ? 'bg-emerald-500/20 text-emerald-300' :
                    l.signal === 'yellow' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>{l.signal.toUpperCase()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}