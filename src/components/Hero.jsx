import { Activity } from 'lucide-react';

export default function Hero() {
  return (
    <header className="border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">
        <div className="flex items-center gap-3 text-emerald-400 font-mono text-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          LIVE SIMULATION · IoT + AI + Computer Vision
        </div>
        <h1 className="mt-3 text-3xl md:text-5xl font-extrabold tracking-tight">
          Traffic Density Monitoring System
        </h1>
        <p className="mt-3 text-slate-400 max-w-3xl">
          An intelligent, adaptive traffic-management solution that detects vehicles from
          camera feeds, estimates lane-wise density, and dynamically controls traffic signals
          in real time.
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
          {[
            { k: 'Submitted by', v: 'Muskan Sharma' },
            { k: 'Roll No.', v: '2310754' },
            { k: 'Program', v: 'B.Tech ECE' },
            { k: 'Institute', v: 'DAVIET, Jalandhar' },
          ].map(i => (
            <div key={i.k} className="rounded-xl bg-slate-900/60 border border-slate-800 p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">{i.k}</div>
              <div className="text-sm font-semibold text-slate-200 mt-1">{i.v}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}