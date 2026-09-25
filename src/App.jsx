import { useEffect, useRef, useState } from 'react';
import Hero from './components/Hero.jsx';
import Landing from './components/Landing.jsx';
import IntersectionCanvas from './components/IntersectionCanvas.jsx';
import CameraFeed from './components/CameraFeed.jsx';
import SignalState from './components/SignalState.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import DensityDashboard from './components/DensityDashboard.jsx';
import Charts from './components/Charts.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Features from './components/Features.jsx';
import DataLog from './components/DataLog.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import ComparisonPanel from './components/ComparisonPanel.jsx';
import ScenarioBar from './components/ScenarioBar.jsx';
import WeatherWidget from './components/WeatherWidget.jsx';
import CloudPanel from './components/CloudPanel.jsx';
import { sound } from './simulation/sound.js';
import { SCENARIOS } from './simulation/scenarios.js';
import { getLighting } from './simulation/daynight.js';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [running, setRunning] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [emergencyLane, setEmergencyLane] = useState(null);
  const [showDetection, setShowDetection] = useState(true);
  const [cameraLane, setCameraLane] = useState('N');
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [speed, setSpeed] = useState(1.0);
  const [scenario, setScenario] = useState('normal');
  const [weather, setWeather] = useState('clear');
  const [manualOverride, setManualOverride] = useState({});
  const [lighting, setLighting] = useState(getLighting(0));

  const [densities, setDensities] = useState({ N: 0, E: 0, S: 0, W: 0 });
  const [counts, setCounts] = useState({ N: 0, E: 0, S: 0, W: 0 });
  const [signalState, setSignalState] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);

  const vehiclesRef = useRef([]);
  const startRef = useRef(performance.now());

  useEffect(() => {
    const t = setInterval(() => {
      setLighting(getLighting((performance.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    sound.setEnabled(soundOn);
    return () => { if (!soundOn) sound.setEnabled(false); };
  }, [soundOn]);

  useEffect(() => { sound.setVolume(volume); }, [volume]);

  useEffect(() => {
    if (emergencyLane && soundOn) sound.startSiren();
    else sound.stopSiren();
  }, [emergencyLane, soundOn]);

  const handleReset = () => {
    sound.stopSiren();
    sound.stopAmbient();
    setResetKey(k => k + 1);
    setHistory([]);
    setLogs([]);
    setEmergencyLane(null);
    setManualOverride({});
    setStats(null);
    startRef.current = performance.now();
    if (soundOn) setTimeout(() => sound.startAmbient(), 50);
  };

  const handleEmergency = () => {
    setEmergencyLane(['N', 'E', 'S', 'W'][Math.floor(Math.random() * 4)]);
  };

  const scenarioDef = SCENARIOS[scenario];

  return (
    <>
      {showLanding && <Landing onEnter={() => setShowLanding(false)} />}

      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Hero />

        <main className="max-w-7xl mx-auto px-4 md:px-8 pb-24 space-y-6">
          <ScenarioBar scenario={scenario} setScenario={setScenario} setWeather={setWeather} />

          <section className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl">
              <IntersectionCanvas
                running={running}
                resetKey={resetKey}
                emergencyLane={emergencyLane}
                showDetection={showDetection}
                scenario={scenarioDef}
                weather={weather}
                manualOverride={manualOverride}
                onDensities={setDensities}
                onCounts={setCounts}
                onSignal={setSignalState}
                onLog={entry => setLogs(prev => [entry, ...prev].slice(0, 60))}
                onHistory={point => setHistory(prev => [...prev, point].slice(-80))}
                onStats={setStats}
                vehiclesRef={vehiclesRef}
              />
            </div>

            <div className="space-y-6">
              <WeatherWidget weather={weather} setWeather={setWeather} lighting={lighting} />
              <CameraFeed
                vehiclesRef={vehiclesRef}
                lane={cameraLane}
                setLane={setCameraLane}
                showDetection={showDetection}
                lighting={lighting}
              />
              <SignalState signalState={signalState} densities={densities} />
              <CloudPanel densities={densities} counts={counts} />
            </div>
          </section>

          <ControlPanel
            running={running} setRunning={setRunning}
            onReset={handleReset} onEmergency={handleEmergency}
            emergencyLane={emergencyLane} setEmergencyLane={setEmergencyLane}
            showDetection={showDetection} setShowDetection={setShowDetection}
            soundOn={soundOn} setSoundOn={setSoundOn}
            volume={volume} setVolume={setVolume}
            speed={speed} setSpeed={setSpeed}
            scenario={scenario} setScenario={setScenario}
            weather={weather} setWeather={setWeather}
            manualOverride={manualOverride} setManualOverride={setManualOverride}
          />

          <StatsPanel stats={stats} />
          <DensityDashboard densities={densities} counts={counts} signalState={signalState} />
          <Charts history={history} densities={densities} counts={counts} />
          <ComparisonPanel history={history} running={running} />
          <HowItWorks />
          <Features />
          <DataLog logs={logs} onClear={() => setLogs([])} />
        </main>

        <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">
          <p>Traffic Density Monitoring System — Academic Prototype</p>
          <p className="mt-1">Muskan Sharma · 2310754 · B.Tech ECE · DAVIET Jalandhar · I.K. Gujral PTU Kapurthala</p>
          <p className="mt-1">Guide: Prof. Dr. Ramnik Singh</p>
        </footer>
      </div>
    </>
  );
}