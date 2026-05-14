/**
 * GaugeWidget — Circular gauge drawn on Canvas
 */
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';
import { getDatasetColor, formatValue } from '../utils/helpers.js';

export class GaugeWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'Gauge', icon: '🔘', ...config });
    this._value = 0;
    this._min = config.min ?? 0;
    this._max = config.max ?? 100;
    this._units = config.units || '';
    this._colorIdx = config.colorIdx || 0;
    this._datasetIndex = config.datasetIndex ?? 0;
    this._canvas = null;
    this._ctx = null;
    this._valueEl = null;
    this._labelEl = null;
    this._raf = null;
    this._dirty = false;
  }

  _theme(name, fallback = '') {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  _render(body) {
    body.innerHTML = `
      <div class="gauge-container">
        <canvas class="gauge-canvas" width="200" height="120"></canvas>
        <div class="gauge-value">0${this._units}</div>
        <div class="gauge-range">
          <span>${this._min}</span><span>${this._max}</span>
        </div>
      </div>`;
    this._canvas = body.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._valueEl = body.querySelector('.gauge-value');
    this._drawGauge(0);
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', (frame) => {
      if (this._destroyed) return;
      const ds = frame.datasets?.[this._datasetIndex];
      if (!ds) return;
      const v = typeof ds.value === 'number' ? ds.value : parseFloat(ds.value) || 0;
      if (v !== this._value) {
        this._value = v;
        this._dirty = true;
        if (!this._raf) this._raf = requestAnimationFrame(() => {
          this._raf = null;
          if (this._dirty) { this._drawGauge(this._value); this._dirty = false; }
        });
      }
    });
  }

  _drawGauge(value) {
    const canvas = this._canvas;
    const ctx = this._ctx;
    if (!canvas || !ctx) return;

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H - 10;
    const r = Math.min(W / 2, H) - 16;
    const startAngle = Math.PI;
    const endAngle = 0;
    const fraction = Math.max(0, Math.min(1, (value - this._min) / (this._max - this._min)));
    const currentAngle = startAngle + fraction * Math.PI;

    const color = getDatasetColor(this._colorIdx);
    const trackColor = this._theme('--gauge-track', 'rgba(51,65,85,0.42)');
    const trackGlow = this._theme('--gauge-track-glow', 'rgba(15,23,42,0.12)');
    const tickColor = this._theme('--gauge-tick', 'rgba(148,163,184,0.24)');
    const strongTickColor = this._theme('--gauge-tick-strong', 'rgba(203,213,225,0.42)');
    const needleColor = this._theme('--gauge-needle', '#e2e8f0');
    const centerColor = this._theme('--gauge-center', '#f8fafc');
    const scaleText = this._theme('--gauge-scale-text', '#94a3b8');

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle, false);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle, false);
    ctx.strokeStyle = trackGlow;
    ctx.lineWidth = 20;
    ctx.stroke();

    for (let i = 0; i <= 6; i += 1) {
      const tickAngle = startAngle + (i / 6) * Math.PI;
      const isMajor = i === 0 || i === 3 || i === 6;
      const outer = r + 4;
      const inner = isMajor ? r - 13 : r - 8;
      const x1 = cx + outer * Math.cos(tickAngle);
      const y1 = cy + outer * Math.sin(tickAngle);
      const x2 = cx + inner * Math.cos(tickAngle);
      const y2 = cy + inner * Math.sin(tickAngle);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? strongTickColor : tickColor;
      ctx.lineWidth = isMajor ? 1.6 : 1;
      ctx.stroke();
    }

    ctx.fillStyle = scaleText;
    ctx.font = "500 12px Consolas, 'Courier New', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labelValues = [this._min, (this._min + this._max) / 2, this._max];
    [0, 3, 6].forEach((tickIndex, idx) => {
      const labelAngle = startAngle + (tickIndex / 6) * Math.PI;
      const labelRadius = r + 16;
      const lx = cx + labelRadius * Math.cos(labelAngle);
      const ly = cy + labelRadius * Math.sin(labelAngle);
      ctx.fillText(formatValue(labelValues[idx], this._min, this._max), lx, ly);
    });

    // Arc gradient
    if (fraction > 0) {
      const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
      grad.addColorStop(0, color + '99');
      grad.addColorStop(1, color);
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, currentAngle, false);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, currentAngle, false);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 22;
      ctx.stroke();
    }

    // Needle
    const needleAngle = startAngle + fraction * Math.PI;
    const nx = cx + (r - 6) * Math.cos(needleAngle);
    const ny = cy + (r - 6) * Math.sin(needleAngle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = needleColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.fill();

    // Update value text
    if (this._valueEl) {
      this._valueEl.textContent = formatValue(value, this._min, this._max) + (this._units ? ` ${this._units}` : '');
      this._valueEl.style.color = color;
    }
  }

  reset() {
    this._value = 0;
    this._drawGauge(0);
    if (this._valueEl) this._valueEl.textContent = '0';
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    super.destroy();
  }
}
