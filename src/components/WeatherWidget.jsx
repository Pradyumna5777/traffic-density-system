import { WEATHERS, WEATHER_INFO } from '../simulation/weather.js';

export default function WeatherWidget({ weather, setWeather, lighting }) {
  const info = WEATHER_INFO[weather];
  const timeLabel = lighting
    ? lighting.nightAmount > 0.7 ? 'Night'
    : lighting.nightAmount > 0.3 ? 'Dusk' : 'Day'
    : 'Day';

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <div className="text-xs font-mono text-slate-400 mb-2">ENVIRONMENT</div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-3xl">{info.icon}</div>
          <div className="text-sm font-bold mt-1" style={{ color: info.color }}>{info.label}</div>
          <div className="text-[10px] text-slate-500 font-mono">{timeLabel} · 22°C · 60% RH</div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
          {WEATHERS.map(w => (
            <button key={w} onClick={() => setWeather(w)}
              title={WEATHER_INFO[w].label}
              className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition ${
                weather === w ? 'bg-sky-500' : 'bg-slate-800 hover:bg-slate-700'
              }`}>
              {WEATHER_INFO[w].icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}