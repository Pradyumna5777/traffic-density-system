import { CheckCircle2 } from 'lucide-react';

const FEATURES = [
  'Real-time monitoring',
  'Automated vehicle detection',
  'Lane-wise density estimation',
  'Adaptive signal control',
  'Reduced dependence on fixed timings',
  'Data collection for analysis',
  'Emergency-vehicle priority',
  'AI / ML integration ready',
  'IoT integration ready',
  'Scalability to multiple intersections',
  'Camera-based computer vision',
  'Live analytics dashboard',
];

export default function Features() {
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <h2 className="text-lg font-bold mb-1">Key Features</h2>
      <p className="text-sm text-slate-400 mb-6">Everything the proposed Traffic Density Monitoring System provides.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map(f => (
          <div key={f} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <CheckCircle2 className="text-emerald-400 shrink-0" size={16} />
            <span className="text-sm text-slate-300">{f}</span>
          </div>
        ))}
      </div>
    </section>
  );
}