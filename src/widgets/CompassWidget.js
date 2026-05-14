/**
 * CompassWidget — Compass heading drawn on Canvas
 */
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';

export class CompassWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'Compass', icon: '🧭', ...config });
    this._heading = 0;
    this._datasetIndex = config.datasetIndex ?? 6;
    this._canvas = null;
    this._ctx = null;
    this._valueEl = null;
    this._raf = null;
    this._dirty = false;
  }

  _render(body) {
    body.innerHTML = `
      <div class="compass-container">
        <canvas class="compass-canvas" width="200" height="200"></canvas>
        <div class="compass-value">0°</div>
      </div>`;
    this._canvas = body.querySelector('canvas');
    this._ctx = this._canvas.getContext('2d');
    this._valueEl = body.querySelector('.compass-value');
    this._draw(0);
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', (frame) => {
      if (this._destroyed) return;
      const ds = frame.datasets?.[this._datasetIndex];
      if (!ds) return;
      const v = typeof ds.value === 'number' ? ds.value : parseFloat(ds.value) || 0;
      this._heading = v;
      this._dirty = true;
      if (!this._raf) this._raf = requestAnimationFrame(() => {
        this._raf = null;
        if (this._dirty) { this._draw(this._heading); this._dirty = false; }
      });
    });
  }

  _draw(heading) {
    const canvas = this._canvas;
    const ctx = this._ctx;
    if (!canvas || !ctx) return;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2 - 10;

    ctx.clearRect(0, 0, W, H);

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, 'rgba(59,130,246,0.03)');
    grad.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Cardinal directions
    const cardinals = [['N', 0, '#ef4444'], ['E', 90, '#94a3b8'], ['S', 180, '#94a3b8'], ['W', 270, '#94a3b8']];
    cardinals.forEach(([label, angle, color]) => {
      const rad = (angle - 90) * Math.PI / 180;
      const tx = cx + (r - 14) * Math.cos(rad);
      const ty = cy + (r - 14) * Math.sin(rad);
      ctx.fillStyle = color;
      ctx.font = `bold 12px "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tx, ty);
    });

    // Tick marks
    for (let i = 0; i < 36; i++) {
      const rad = (i * 10 - 90) * Math.PI / 180;
      const inner = i % 9 === 0 ? r - 20 : r - 12;
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(rad), cy + inner * Math.sin(rad));
      ctx.lineTo(cx + (r - 4) * Math.cos(rad), cy + (r - 4) * Math.sin(rad));
      ctx.strokeStyle = i % 9 === 0 ? 'rgba(148,163,184,0.4)' : 'rgba(148,163,184,0.15)';
      ctx.lineWidth = i % 9 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Needle
    const needleRad = (heading - 90) * Math.PI / 180;
    const northRad = (-90 + 180) * Math.PI / 180;

    // North (red)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 20) * Math.cos(needleRad), cy + (r - 20) * Math.sin(needleRad));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // South (gray)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (r - 20) * Math.cos(needleRad + Math.PI), cy + (r - 20) * Math.sin(needleRad + Math.PI));
    ctx.strokeStyle = 'rgba(148,163,184,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();

    if (this._valueEl) this._valueEl.textContent = heading.toFixed(1) + '°';
  }

  reset() { this._heading = 0; this._draw(0); }
  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    super.destroy();
  }
}
