/**
 * BarWidget — Bar/level indicator widget
 */
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';
import { getDatasetColor, formatValue } from '../utils/helpers.js';

export class BarWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'Bar', icon: '▮', ...config });
    this._datasets = config.datasets || [{ index: 0, title: 'Ch 1', min: 0, max: 100, units: '' }];
    this._values = this._datasets.map(() => 0);
    this._colorOffset = config.colorOffset || 0;
    this._items = [];
  }

  _render(body) {
    body.innerHTML = '<div class="bar-container"></div>';
    const container = body.querySelector('.bar-container');
    this._datasets.forEach((ds, i) => {
      const color = getDatasetColor(this._colorOffset + i);
      const el = document.createElement('div');
      el.className = 'bar-item';
      el.innerHTML = `
        <div class="bar-label">${ds.title}</div>
        <div class="bar-track">
          <div class="bar-fill" style="background: linear-gradient(90deg, ${color}99, ${color}); width: 0%"></div>
        </div>
        <div class="bar-value mono">0 ${ds.units || ''}</div>`;
      container.appendChild(el);
      this._items.push({
        fill: el.querySelector('.bar-fill'),
        valueEl: el.querySelector('.bar-value'),
        ds, color
      });
    });
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', (frame) => {
      if (this._destroyed) return;
      this._datasets.forEach((ds, i) => {
        const fds = frame.datasets?.[ds.index];
        if (!fds) return;
        const v = typeof fds.value === 'number' ? fds.value : parseFloat(fds.value) || 0;
        this._values[i] = v;
        const pct = Math.max(0, Math.min(100, ((v - ds.min) / (ds.max - ds.min)) * 100));
        const item = this._items[i];
        if (item) {
          item.fill.style.width = pct + '%';
          item.valueEl.textContent = formatValue(v, ds.min, ds.max) + (ds.units ? ` ${ds.units}` : '');
          // Color changes when near max
          const hot = pct > 85;
          item.fill.style.background = hot
            ? `linear-gradient(90deg, #f59e0b99, #ef4444)`
            : `linear-gradient(90deg, ${item.color}99, ${item.color})`;
        }
      });
    });
  }

  reset() {
    this._values = this._datasets.map(() => 0);
    this._items.forEach(item => {
      item.fill.style.width = '0%';
      item.valueEl.textContent = '0' + (item.ds.units ? ` ${item.ds.units}` : '');
    });
  }
}
