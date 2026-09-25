import { Camera, Cpu, Gauge, GitBranch, Lightbulb, RefreshCw } from 'lucide-react';

const STEPS = [
  { icon: Camera, title: 'Image Acquisition', desc: 'Cameras capture live feeds of all four lanes at the intersection.' },
  { icon: Cpu, title: 'Density Calculation', desc: 'AI model draws bounding boxes around vehicles and computes lane occupancy ratio.' },
  { icon: GitBranch, title: 'Optimization Algorithm', desc: 'Signals cycle based on a minimum threshold; the highest-density lane gets priority.' },
  { icon: Lightbulb, title: 'Signal Execution', desc: 'Arduino/ESP32 updates the physical LED traffic lights in a safe sequence.' },
  { icon: Gauge, title: 'Feedback Loop', desc: 'System records how much traffic cleared and improves future timing decisions.' },
  { icon: RefreshCw, title: 'Adaptive Repeat', desc: 'Observe → Analyse → Decide → Control → Observe again.' },
];

export default function HowItWorks() {
  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-6">
      <h2 className="text-lg font-bold mb-1">How It Works</h2>
      <p className="text-sm text-slate-400 mb-6">Six-stage adaptive pipeline executed on every simulation frame.</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="relative rounded-xl border border-slate-800 bg-slate-950 p-5 hover:border-cyan-500/50 transition">
            <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-cyan-500 text-slate-900 font-bold flex items-center justify-center text-sm">
              {i + 1}
            </div>
            <s.icon className="text-cyan-400 mb-3" size={28} />
            <h3 className="font-bold text-slate-100">{s.title}</h3>
            <p className="text-sm text-slate-400 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}