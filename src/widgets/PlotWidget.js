/**
 * PlotWidget - Real-time line chart using Chart.js
 */
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { getDatasetColor, getDatasetColorAlpha } from '../utils/helpers.js';

export class PlotWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'Plot', icon: 'P', ...config });
    this._chart = null;
    this._datasetIndices = config.datasetIndices || [0];
    this._datasetLabels = config.datasetLabels || ['Channel 1'];
    this._maxPoints = appState.points;
    this._data = this._datasetIndices.map(() => []);
    this._labels = [];
    this._paused = false;
    this._lastFrameDatasets = [];
    this._chartRetryTimer = null;
    this._frameHandler = (frame) => this._onFrame(frame);
    this._syncVisibleYScale = () => {
      this._updateVisibleYScale();
      this._chart?.update('none');
    };
  }

  _readThemeToken(styles, name, fallback = '') {
    return styles.getPropertyValue(name).trim() || fallback;
  }

  _render(body) {
    body.style.padding = '8px';
    if (!window.Chart) {
      body.innerHTML = '<div class="text-muted" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:var(--font-size-sm)">Chart.js is loading or unavailable</div>';
      if (!this._chartRetryTimer) {
        this._chartRetryTimer = setInterval(() => {
          if (this._destroyed) return;
          if (window.Chart) {
            clearInterval(this._chartRetryTimer);
            this._chartRetryTimer = null;
            body.innerHTML = '';
            this._render(body);
            this._updateVisibleYScale();
            this._chart?.update('none');
          }
        }, 300);
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    body.appendChild(canvas);

    const themeStyles = getComputedStyle(document.documentElement);
    const colors = this._datasetIndices.map((_, i) => getDatasetColor(this.config.colorOffset + i || i));
    const alphas = this._datasetIndices.map((_, i) => getDatasetColorAlpha(this.config.colorOffset + i || i, 0.15));
    const legendColor = this._readThemeToken(themeStyles, '--chart-legend-text', '#cbd5e1');
    const tickColor = this._readThemeToken(themeStyles, '--chart-tick', '#7b8ba1');
    const axisColor = this._readThemeToken(themeStyles, '--chart-axis', 'rgba(148,163,184,0.14)');
    const majorGridColor = this._readThemeToken(themeStyles, '--chart-grid-major', 'rgba(148,163,184,0.08)');
    const lineWidth = Number.parseFloat(this._readThemeToken(themeStyles, '--chart-line-width', '2.2')) || 2.2;
    const crosshairColor = this._readThemeToken(themeStyles, '--chart-crosshair', 'rgba(59,130,246,0.18)');

    this._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this._labels,
        datasets: this._datasetIndices.map((_, i) => ({
          label: this._datasetLabels[i] || `Ch ${i + 1}`,
          data: this._data[i],
          borderColor: colors[i],
          backgroundColor: alphas[i],
          borderWidth: this._datasetIndices.length === 1 ? lineWidth + 0.2 : lineWidth,
          pointRadius: 0,
          pointHoverRadius: 3,
          pointHitRadius: 10,
          pointHoverBorderWidth: 0,
          tension: 0.22,
          fill: this._datasetIndices.length === 1
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        elements: {
          line: {
            borderCapStyle: 'round',
            borderJoinStyle: 'round'
          }
        },
        plugins: {
          legend: {
            display: this._datasetIndices.length > 1,
            labels: {
              color: legendColor,
              font: { size: 13, family: "'Times New Roman', serif", weight: '600' },
              usePointStyle: true,
              pointStyle: 'line',
              pointStyleWidth: 30,
              boxWidth: 28,
              boxHeight: 5,
              padding: 14
            }
          },
          tooltip: {
            backgroundColor: themeStyles.getPropertyValue('--chart-tooltip-bg').trim() || 'rgba(12,18,32,0.95)',
            borderColor: themeStyles.getPropertyValue('--chart-tooltip-border').trim() || 'rgba(148,163,184,0.15)',
            borderWidth: 1,
            titleColor: themeStyles.getPropertyValue('--chart-tooltip-title').trim() || '#94a3b8',
            bodyColor: themeStyles.getPropertyValue('--chart-tooltip-body').trim() || '#f1f5f9',
            titleFont: { family: "'Times New Roman', serif", size: 12, weight: '600' },
            bodyFont: { family: "Consolas, 'Courier New', monospace", size: 12 },
            cornerRadius: 10,
            padding: 10,
            boxPadding: 4,
            displayColors: true
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              modifierKey: 'shift'
            },
            zoom: {
              wheel: { enabled: true, modifierKey: 'ctrl' },
              pinch: { enabled: true },
              drag: { enabled: true, backgroundColor: crosshairColor },
              mode: 'x'
            },
            onZoomComplete: this._syncVisibleYScale,
            onPanComplete: this._syncVisibleYScale
          }
        },
        scales: {
          x: {
            display: false,
            grid: {
              color: majorGridColor,
              drawTicks: false,
              borderColor: axisColor
            }
          },
          y: {
            beginAtZero: false,
            grid: {
              color: majorGridColor,
              drawTicks: false,
              lineWidth: 1,
              borderColor: axisColor
            },
            ticks: {
              color: tickColor,
              font: { size: 12, family: "Consolas, 'Courier New', monospace", weight: '500' },
              maxTicksLimit: 6,
              padding: 8
            },
            border: { color: axisColor, width: 1 }
          }
        }
      }
    });

    const actionsEl = this._el.querySelector('.widget-actions');
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'widget-action-btn';
    pauseBtn.title = 'Pause/Resume';
    pauseBtn.textContent = 'II';
    pauseBtn.addEventListener('click', () => {
      this._paused = !this._paused;
      pauseBtn.textContent = this._paused ? '>' : 'II';
    });
    actionsEl.insertBefore(pauseBtn, actionsEl.firstChild);
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', this._frameHandler);
  }

  _onFrame(frame) {
    if (this._paused || this._destroyed) return;
    const maxPts = appState.points;

    this._datasetIndices.forEach((idx, i) => {
      const ds = frame.datasets?.[idx];
      this._lastFrameDatasets[i] = ds || null;
      if (ds && ds.buffer && Array.isArray(ds.buffer)) {
        this._data[i].push(...ds.buffer);
      } else {
        const val = ds ? (typeof ds.value === 'number' ? ds.value : parseFloat(ds.value) || 0) : 0;
        this._data[i].push(val);
      }

      if (this._data[i].length > maxPts) {
        this._data[i].splice(0, this._data[i].length - maxPts);
      }
    });

    const maxLen = Math.max(...this._data.map((d) => d.length));
    while (this._labels.length < maxLen) this._labels.push('');
    if (this._labels.length > maxLen) this._labels.splice(0, this._labels.length - maxLen);

    if (this._chart) {
      this._updateVisibleYScale();
      this._chart.update('none');
    }
  }

  reset() {
    this._data = this._datasetIndices.map(() => []);
    this._lastFrameDatasets = [];
    this._labels = [];
    if (this._chart) {
      if (typeof this._chart.resetZoom === 'function') this._chart.resetZoom();
      this._chart.options.scales.y.min = undefined;
      this._chart.options.scales.y.max = undefined;
      this._chart.update('none');
    }
  }

  _updateVisibleYScale() {
    if (!this._chart) return;

    const xScale = this._chart.scales?.x;
    const yScale = this._chart.options?.scales?.y;
    if (!xScale || !yScale) return;

    const fallbackEnd = Math.max(...this._data.map((series) => series.length - 1), 0);
    const isViewingHistory = Number.isFinite(xScale.max) && xScale.max < fallbackEnd - 2;
    const start = isViewingHistory && Number.isFinite(xScale.min)
      ? Math.max(0, Math.floor(xScale.min))
      : 0;
    const end = isViewingHistory
      ? Math.max(start, Math.ceil(xScale.max))
      : fallbackEnd;

    const visible = [];
    this._data.forEach((series, seriesIndex) => {
      const frameDataset = this._lastFrameDatasets[seriesIndex];
      const preferWindowValue = !frameDataset?.buffer && Number.isFinite(frameDataset?.value);
      for (let i = start; i <= end && i < series.length; i += 1) {
        const value = series[i];
        if (Number.isFinite(value)) visible.push(value);
      }
      if (!isViewingHistory && preferWindowValue) {
        visible.push(frameDataset.value);
      }
    });

    if (!visible.length) {
      yScale.min = undefined;
      yScale.max = undefined;
      return;
    }

    let min = Math.min(...visible);
    let max = Math.max(...visible);

    if (min === max) {
      const padding = Math.max(Math.abs(min) * 0.08, 0.0001);
      min -= padding;
      max += padding;
    } else {
      const maxAbs = Math.max(Math.abs(min), Math.abs(max), 0.0001);
      const padding = Math.max((max - min) * 0.18, maxAbs * 0.02, 0.0001);
      min -= padding;
      max += padding;
    }

    yScale.min = min;
    yScale.max = max;
  }

  destroy() {
    if (this._chart) {
      this._chart.destroy();
      this._chart = null;
    }
    if (this._chartRetryTimer) {
      clearInterval(this._chartRetryTimer);
      this._chartRetryTimer = null;
    }
    super.destroy();
  }
}
