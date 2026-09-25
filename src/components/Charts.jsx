import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

const COLORS = { N: '#22d3ee', E: '#a78bfa', S: '#f472b6', W: '#fbbf24' };
const LEVEL_COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function Charts({ history, densities, counts }) {
  const barData = ['N', 'E', 'S', 'W'].map(l => ({
    name: `Lane ${l}`,
    count: counts[l] || 0,
    density: Math.round((densities[l] || 0) * 100),
  }));

  const pieData = [
    { name: 'Low', value: ['N','E','S','W'].filter(l => (densities[l]||0) < 0.3).length || 1 },
    { name: 'Medium', value: ['N','E','S','W'].filter(l => (densities[l]||0) >= 0.3 && (densities[l]||0) < 0.7).length || 1 },
    { name: 'High', value: ['N','E','S','W'].filter(l => (densities[l]||0) >= 0.7).length || 1 },
  ];

  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <h2 className="text-lg font-bold mb-4">Analytics</h2>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-slate-950 border border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 mb-2">VEHICLE COUNT vs TIME</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="t" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="count_N" stroke={COLORS.N} dot={false} name="Lane A" strokeWidth={2} />
              <Line type="monotone" dataKey="count_E" stroke={COLORS.E} dot={false} name="Lane B" strokeWidth={2} />
              <Line type="monotone" dataKey="count_S" stroke={COLORS.S} dot={false} name="Lane C" strokeWidth={2} />
              <Line type="monotone" dataKey="count_W" stroke={COLORS.W} dot={false} name="Lane D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 mb-2">DENSITY DISTRIBUTION</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={LEVEL_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 rounded-xl bg-slate-950 border border-slate-800 p-4">
          <div className="text-xs font-mono text-slate-400 mb-2">LANE COMPARISON</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="#22d3ee" name="Vehicles" radius={[4,4,0,0]} />
              <Bar dataKey="density" fill="#a78bfa" name="Density %" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}