import {
  Play, Pause, RotateCcw, Ambulance, Eye, EyeOff,
  Volume2, VolumeX, Gauge,
} from 'lucide-react';
import { sound } from '../simulation/sound.js';
import { SCENARIOS } from '../simulation/scenarios.js';
import { WEATHERS, WEATHER_INFO } from '../simulation/weather.js';

export default function ControlPanel({
  running, setRunning, onReset, onEmergency, emergencyLane, setEmergencyLane,
  showDetection, setShowDetection, soundOn, setSoundOn,
  volume, setVolume, speed, setSpeed,
  scenario, setScenario, weather, setWeather,
  manualOverride, setManualOverride,
}) {
  const handleSoundToggle = () => {
    const next = !soundOn;
    console.log('[SOUND TOGGLE] next =', next);
    try {
      sound.setEnabled(next);
      // Confirmation beep only if enabling
      if (next) {
        setTimeout(() => sound.beep(880, 0.15, 0.3), 80);
      }
    } catch (err) {
      console.error('[SOUND] setEnabled failed:', err);
    }
    setSoundOn(next);
  };

  const applyScenario = (key) => {
    sound.uiClick();
    setScenario(key);
    const s = SCENARIOS[key];
    if (s?.weather) setWeather(s.weather);
  };

  const setOverride = (dir, val) => {
    sound.uiClick();
    setManualOverride(prev => {
      const next = { ...prev };
      if (next[dir] === val) delete next[dir];
      else next[dir] = val;
      return next;
    });
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    sound.setVolume(v);
  };

  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-slate-400">CONTROL PANEL</div>
        {soundOn ? (
          <div className="flex items-center gap-1 text-[10px] font-mono text-fuchsia-400">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            AUDIO ACTIVE
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-mono text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            AUDIO OFF
          </div>
        )}
      </div>

      {/* Row 1: primary actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { sound.uiClick(); setRunning(r => !r); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition active:scale-95 ${
            running ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
          }`}>
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? 'Pause' : 'Start Simulation'}
        </button>

        <button
          onClick={() => {
            sound.uiClick();
            sound.stopSiren();
            sound.stopAmbient();
            onReset();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95">
          <RotateCcw size={16} /> Reset
        </button>

        <button
          onClick={() => { sound.uiClick(); onEmergency(); }}
          disabled={!!emergencyLane}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm bg-red-600 hover:bg-red-500 text-white transition disabled:opacity-50 active:scale-95">
          <Ambulance size={16} /> {emergencyLane ? 'Emergency Active' : 'Emergency'}
        </button>

        <button
          onClick={() => { sound.uiClick(); setShowDetection(v => !v); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition active:scale-95 ${
            showDetection ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}>
          {showDetection ? <Eye size={16} /> : <EyeOff size={16} />}
          AI Detect
        </button>

        <button
          onClick={handleSoundToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition active:scale-95 ${
            soundOn ? 'bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-900'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
          }`}>
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Sound {soundOn ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Row 2: sliders */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
            <Gauge size={12} /> Speed: {speed.toFixed(1)}×
          </label>
          <input
            type="range" min="0.25" max="3" step="0.25" value={speed}
            onChange={e => setSpeed(parseFloat(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            Volume: {Math.round(volume * 100)}%
          </label>
          <input
            type="range" min="0" max="1" step="0.05" value={volume}
            onChange={handleVolumeChange}
            className="w-full accent-fuchsia-500"
          />
        </div>
      </div>

      {/* Row 3: weather */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Weather</div>
        <div className="flex flex-wrap gap-2">
          {WEATHERS.map(w => (
            <button
              key={w}
              onClick={() => { sound.uiClick(); setWeather(w); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                weather === w ? 'bg-sky-500 text-slate-900'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}>
              {WEATHER_INFO[w].icon} {WEATHER_INFO[w].label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 4: manual override */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Manual Signal Override</div>
        <div className="grid grid-cols-4 gap-2">
          {['N', 'E', 'S', 'W'].map(d => (
            <div key={d} className="rounded-lg border border-slate-800 bg-slate-950 p-2">
              <div className="text-[10px] font-mono text-slate-400 mb-1 text-center">Lane {d}</div>
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => setOverride(d, 'red')}
                  className={`w-5 h-5 rounded-full transition ${
                    manualOverride[d] === 'red'
                      ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                      : 'bg-red-900/50'
                  }`}
                />
                <button
                  onClick={() => setOverride(d, 'yellow')}
                  className={`w-5 h-5 rounded-full transition ${
                    manualOverride[d] === 'yellow'
                      ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.9)]'
                      : 'bg-yellow-900/50'
                  }`}
                />
                <button
                  onClick={() => setOverride(d, 'green')}
                  className={`w-5 h-5 rounded-full transition ${
                    manualOverride[d] === 'green'
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.9)]'
                      : 'bg-emerald-900/50'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Click a light again to release override.</p>
      </div>

      {/* Row 5: scenarios */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Scenarios</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SCENARIOS).map(([key, s]) => (
            <button
              key={key}
              onClick={() => applyScenario(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                scenario === key ? 'bg-emerald-500 text-slate-900'
                                 : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}>
              {s.icon} {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sound legend */}
      {soundOn && (
        <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">🔊 Ambient</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">🔔 Chime</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">📯 Horn</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">🚑 Siren</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">🛑 Thud</span>
        </div>
      )}
    </section>
  );
}