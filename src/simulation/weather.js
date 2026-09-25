export const WEATHERS = ['clear', 'rain', 'fog', 'snow'];

export const WEATHER_INFO = {
  clear: { label: 'Clear', icon: '☀️', color: '#38bdf8' },
  rain:  { label: 'Rain',  icon: '🌧️', color: '#60a5fa' },
  fog:   { label: 'Fog',   icon: '🌫️', color: '#94a3b8' },
  snow:  { label: 'Snow',  icon: '❄️', color: '#e2e8f0' },
};

export function drawWeather(ctx, weather, W, H, time) {
  if (weather === 'clear') return;

  if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const x = (i * 137 + time * 400) % W;
      const y = (i * 89 + time * 800) % H;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2, y + 12);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30, 58, 138, 0.15)';
    ctx.fillRect(0, 0, W, H);
  } else if (weather === 'fog') {
    const grad = ctx.createRadialGradient(W/2, H/2, 100, W/2, H/2, 600);
    grad.addColorStop(0, 'rgba(226, 232, 240, 0.05)');
    grad.addColorStop(1, 'rgba(226, 232, 240, 0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else if (weather === 'snow') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 80; i++) {
      const x = (i * 91 + time * 60) % W;
      const y = (i * 73 + time * 120) % H;
      const size = 1 + (i % 3);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(200, 220, 240, 0.08)';
    ctx.fillRect(0, 0, W, H);
  }
}