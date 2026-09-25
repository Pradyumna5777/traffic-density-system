import { useEffect, useState } from 'react';
import {
  ArrowRight, Activity, Cpu, Camera, Zap, BarChart3, Radio,
  GraduationCap, Award, User, BookOpen,
} from 'lucide-react';

const FEATURES = [
  { icon: Camera,   title: 'AI Vision',       desc: 'Real-time vehicle detection with YOLO-style bounding boxes' },
  { icon: Cpu,      title: 'Adaptive Signals', desc: 'Green time scales with live lane density' },
  { icon: Activity, title: '8-Lane Model',     desc: 'Multi-lane with turns, arrows, and per-lane analytics' },
  { icon: Zap,      title: 'Emergency Priority', desc: 'Automatic ambulance lane preemption' },
  { icon: BarChart3, title: 'Live Analytics',  desc: 'Throughput, wait time, CO₂ saved, cycle stats' },
  { icon: Radio,    title: 'IoT Ready',        desc: 'Multi-intersection cloud coordination' },
];

// const STATS = [
//   { value: '8',    label: 'Lanes' },
//   { value: '60',   label: 'FPS' },
//   { value: '7',    label: 'Scenarios' },
//   { value: '100%', label: 'Interactive' },
// ];

export default function Landing({ onEnter }) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const handleEnter = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      onEnter();
    }, 500);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            animation: 'scroll-grid 30s linear infinite',
          }}
        />
      </div>

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-fuchsia-500/10 blur-[100px] pointer-events-none" />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24">

        {/* Top badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/5 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="text-xs font-mono text-cyan-300 tracking-wider">B.TECH ECE · MAJOR PROJECT</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            <span className="text-slate-100">Traffic Density</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-fuchsia-400 bg-clip-text text-transparent">
              Monitoring System
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An intelligent, adaptive traffic-management solution combining
            <span className="text-cyan-300"> computer vision</span>,
            <span className="text-emerald-300"> real-time density estimation</span>, and
            <span className="text-fuchsia-300"> dynamic signal control</span>.
          </p>
        </div>

        {/* Stats row */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-14">
          {STATS.map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4 text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div> */}

        {/* Enter button */}
        <div className="flex justify-center mb-20">
          <button
            onClick={handleEnter}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95"
          >
            Enter Dashboard
            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={22} />
          </button>
        </div>

        {/* Feature grid */}
        <div className="mb-20">
          <h2 className="text-center text-2xl md:text-3xl font-bold mb-2">What's Inside</h2>
          <p className="text-center text-slate-500 mb-10 text-sm">Everything the simulator demonstrates</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-5 hover:border-cyan-500/50 hover:bg-slate-900 transition-all"
                  style={{ animation: `fade-up 0.6s ease-out ${i * 0.08}s both` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
                    <Icon className="text-cyan-400" size={22} />
                  </div>
                  <h3 className="font-bold text-slate-100 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Author card */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <User size={14} className="text-fuchsia-400" />
              <span className="text-[10px] font-mono tracking-wider text-fuchsia-400 uppercase">Submitted By</span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-3xl font-bold text-cyan-300">
                    MS
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-100">Muskan Sharma</h3>
                <p className="text-sm text-slate-400 mt-1">B.Tech — Electronics & Communication Engineering</p>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <GraduationCap size={12} /> Roll No. 2310754
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Award size={12} /> DAVIET Jalandhar
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <BookOpen size={12} /> I.K. Gujral PTU Kapurthala
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Under the guidance of</div>
                <div className="font-semibold text-slate-200">Prof. Dr. Ramnik Singh</div>
                <div className="text-xs text-slate-500">Department of ECE, DAVIET</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">In partial fulfillment of</div>
                <div className="font-semibold text-slate-200">Bachelor of Technology</div>
                <div className="text-xs text-slate-500">Electronics and Communication Engineering</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 text-xs text-slate-600 font-mono">
          © {new Date().getFullYear()} · Muskan Sharma · Academic Prototype
        </div>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes scroll-grid {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}