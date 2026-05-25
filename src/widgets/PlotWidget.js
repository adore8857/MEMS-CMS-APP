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
    this._datasetUnits = config.datasetUnits || this._datasetIndices.map(() => '');
    this._maxPoints = appState.points;
    this._data = this._datasetIndices.map(() => []);
    this._labels = [];
    this._nextSamplePoint = 0;
    this._yMin = Number.isFinite(config.yMin) ? config.yMin : undefined;
    this._yMax = Number.isFinite(config.yMax) ? config.yMax : undefined;
    this._manualXScale = false;
    this._manualYScale = Number.isFinite(this._yMin) || Number.isFinite(this._yMax);
    this._pendingChartUpdate = false;
    this._chartUpdateTimer = null;
    this._lastChartUpdateAt = 0;
    this._updateIntervalMs = Number.isFinite(config.updateIntervalMs) ? config.updateIntervalMs : 50;
    this._middlePanState = null;
    this._paused = false;
    this._lastFrameDatasets = [];
    this._chartRetryTimer = null;
    this._frameHandler = (frame) => this._onFrame(frame);
    this._middlePanMoveHandler = (event) => this._handleMiddlePanMove(event);
    this._middlePanUpHandler = (event) => this._stopMiddlePan(event);
    this._syncVisibleScale = () => {
      this._manualXScale = this._hasFixedXScale();
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
    const uiFont = this._readThemeToken(
      themeStyles,
      '--font-sans',
      'Helvetica, Arial, "Microsoft YaHei", sans-serif'
    );
    const units = [...new Set(this._datasetUnits.filter(Boolean))];
    const xTitle = appState.locale === 'zh-CN' ? '\u6570\u636e\u70b9' : 'Sample Point';
    const yTitleBase = appState.locale === 'zh-CN' ? '\u6570\u503c' : 'Value';
    const yTitle = units.length ? `${yTitleBase} (${units.join(' / ')})` : yTitleBase;

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
              font: { size: 13, family: uiFont, weight: '600' },
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
            titleFont: { family: uiFont, size: 12, weight: '600' },
            bodyFont: { family: uiFont, size: 12 },
            cornerRadius: 10,
            padding: 10,
            boxPadding: 4,
            displayColors: true,
            callbacks: {
              title: (items) => items.length ? `${xTitle}: ${items[0].label}` : '',
              label: (context) => {
                const unit = this._datasetUnits[context.datasetIndex] || '';
                return `${context.dataset.label}: ${context.formattedValue}${unit ? ` ${unit}` : ''}`;
              }
            }
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
            onZoomComplete: this._syncVisibleScale,
            onPanComplete: this._syncVisibleScale
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: xTitle,
              color: tickColor,
              font: { size: 12, family: uiFont, weight: '500' }
            },
            grid: {
              color: majorGridColor,
              drawTicks: false,
              borderColor: axisColor
            },
            ticks: {
              color: tickColor,
              font: { size: 11, family: uiFont, weight: '500' },
              maxTicksLimit: 7,
              padding: 6
            }
          },
          y: {
            beginAtZero: false,
            min: this._yMin,
            max: this._yMax,
            title: {
              display: true,
              text: yTitle,
              color: tickColor,
              font: { size: 12, family: uiFont, weight: '500' }
            },
            grid: {
              color: majorGridColor,
              drawTicks: false,
              lineWidth: 1,
              borderColor: axisColor
            },
            ticks: {
              color: tickColor,
              font: { size: 12, family: uiFont, weight: '500' },
              maxTicksLimit: 6,
              padding: 8
            },
            border: { color: axisColor, width: 1 }
          }
        }
      }
    });

    canvas.addEventListener('wheel', (event) => this._handleWheelScale(event), { passive: false });
    canvas.addEventListener('mousedown', (event) => this._startMiddlePan(event));
    canvas.addEventListener('auxclick', (event) => {
      if (event.button === 1) event.preventDefault();
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
    let appendedCount = 0;

    this._datasetIndices.forEach((idx, i) => {
      const ds = frame.datasets?.[idx];
      this._lastFrameDatasets[i] = ds || null;
      if (ds && ds.buffer && Array.isArray(ds.buffer)) {
        this._data[i].push(...ds.buffer);
        appendedCount = Math.max(appendedCount, ds.buffer.length);
      } else {
        const val = ds ? (typeof ds.value === 'number' ? ds.value : parseFloat(ds.value) || 0) : 0;
        this._data[i].push(val);
        appendedCount = Math.max(appendedCount, 1);
      }

      if (this._data[i].length > maxPts) {
        this._data[i].splice(0, this._data[i].length - maxPts);
      }
    });

    const maxLen = Math.max(...this._data.map((d) => d.length));
    for (let i = 0; i < appendedCount; i += 1) {
      this._labels.push(this._nextSamplePoint);
      this._nextSamplePoint += 1;
    }
    if (this._labels.length > maxLen) this._labels.splice(0, this._labels.length - maxLen);

    this._scheduleChartUpdate();
  }

  reset() {
    this._data.forEach((series) => { series.length = 0; });
    this._lastFrameDatasets = [];
    this._labels.length = 0;
    this._nextSamplePoint = 0;
    if (this._chart) {
      if (typeof this._chart.resetZoom === 'function') this._chart.resetZoom();
      this._chart.data.labels = this._labels;
      this._chart.data.datasets.forEach((dataset, index) => {
        dataset.data = this._data[index];
      });
      this._manualXScale = false;
      this._manualYScale = Number.isFinite(this._yMin) || Number.isFinite(this._yMax);
      this._chart.options.scales.x.min = undefined;
      this._chart.options.scales.x.max = undefined;
      this._chart.options.scales.y.min = this._yMin;
      this._chart.options.scales.y.max = this._yMax;
      this._updatePointVisibility();
      this._chart.update('none');
    }
  }

  _scheduleChartUpdate() {
    if (!this._chart || this._pendingChartUpdate) return;
    this._pendingChartUpdate = true;
    const now = performance.now();
    const delay = Math.max(0, this._updateIntervalMs - (now - this._lastChartUpdateAt));
    const run = () => {
      this._chartUpdateTimer = null;
      requestAnimationFrame(() => {
        this._pendingChartUpdate = false;
        if (!this._chart || this._destroyed) return;
        this._lastChartUpdateAt = performance.now();
        this._updateLiveXScale();
        this._updateVisibleYScale();
        this._updatePointVisibility();
        this._chart.update('none');
      });
    };

    if (delay > 0) {
      this._chartUpdateTimer = setTimeout(run, delay);
    } else {
      run();
    }
  }

  _updatePointVisibility() {
    if (!this._chart) return;
    this._chart.data.datasets.forEach((dataset, index) => {
      const length = this._data[index]?.length || 0;
      dataset.pointRadius = length < 2 ? 2 : 0;
      dataset.tension = length > 1200 ? 0 : 0.22;
    });
  }

  _hasFixedXScale() {
    const xOptions = this._chart?.options?.scales?.x;
    return Number.isFinite(xOptions?.min) || Number.isFinite(xOptions?.max);
  }

  _updateLiveXScale() {
    if (this._manualXScale || !this._chart) return;
    const xOptions = this._chart.options?.scales?.x;
    if (!xOptions) return;
    xOptions.min = undefined;
    xOptions.max = undefined;
  }

  _handleWheelScale(event) {
    if (!this._chart || this._destroyed) return;
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();

    const yScale = this._chart.scales?.y;
    const yOptions = this._chart.options?.scales?.y;
    if (!yScale || !yOptions) return;

    const currentMin = Number.isFinite(yOptions.min) ? yOptions.min : yScale.min;
    const currentMax = Number.isFinite(yOptions.max) ? yOptions.max : yScale.max;
    if (!Number.isFinite(currentMin) || !Number.isFinite(currentMax) || currentMin === currentMax) return;

    const zoomIn = event.deltaY < 0;
    const factor = zoomIn ? 0.82 : 1.22;
    const pointerValue = typeof yScale.getValueForPixel === 'function'
      ? yScale.getValueForPixel(event.offsetY)
      : (currentMin + currentMax) / 2;
    const center = Number.isFinite(pointerValue) ? pointerValue : (currentMin + currentMax) / 2;
    const nextMin = center - (center - currentMin) * factor;
    const nextMax = center + (currentMax - center) * factor;

    if (!Number.isFinite(nextMin) || !Number.isFinite(nextMax) || nextMin === nextMax) return;
    this._manualYScale = true;
    this._updateLiveXScale();
    yOptions.min = nextMin;
    yOptions.max = nextMax;
    this._chart.update('none');
  }

  _startMiddlePan(event) {
    if (event.button !== 1 || !this._chart || this._destroyed) return;
    const chartArea = this._chart.chartArea;
    const xScale = this._chart.scales?.x;
    const yScale = this._chart.scales?.y;
    const yOptions = this._chart.options?.scales?.y;
    const xOptions = this._chart.options?.scales?.x;
    if (!chartArea || !xScale || !yScale || !xOptions || !yOptions) return;

    event.preventDefault();
    event.stopPropagation();

    const fallbackEnd = Math.max(...this._data.map((series) => series.length - 1), 0);
    const xMin = Number.isFinite(xOptions.min) ? xOptions.min : (Number.isFinite(xScale.min) ? xScale.min : 0);
    const xMax = Number.isFinite(xOptions.max) ? xOptions.max : (Number.isFinite(xScale.max) ? xScale.max : fallbackEnd);
    const yMin = Number.isFinite(yOptions.min) ? yOptions.min : yScale.min;
    const yMax = Number.isFinite(yOptions.max) ? yOptions.max : yScale.max;
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) return;

    this._middlePanState = {
      startX: event.clientX,
      startY: event.clientY,
      xMin,
      xMax: xMax === xMin ? xMin + 1 : xMax,
      yMin,
      yMax,
      width: Math.max(1, chartArea.right - chartArea.left),
      height: Math.max(1, chartArea.bottom - chartArea.top)
    };

    document.addEventListener('mousemove', this._middlePanMoveHandler);
    document.addEventListener('mouseup', this._middlePanUpHandler);
  }

  _handleMiddlePanMove(event) {
    if (!this._middlePanState || !this._chart) return;
    event.preventDefault();

    const state = this._middlePanState;
    const xOptions = this._chart.options?.scales?.x;
    const yOptions = this._chart.options?.scales?.y;
    if (!xOptions || !yOptions) return;

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    const xRange = state.xMax - state.xMin;
    const yRange = state.yMax - state.yMin;
    const xShift = -(dx / state.width) * xRange;
    const yShift = (dy / state.height) * yRange;

    if (Math.abs(dx) > 1) {
      xOptions.min = state.xMin + xShift;
      xOptions.max = state.xMax + xShift;
      this._manualXScale = true;
    } else if (!this._manualXScale) {
      xOptions.min = undefined;
      xOptions.max = undefined;
    }
    yOptions.min = state.yMin + yShift;
    yOptions.max = state.yMax + yShift;
    this._manualYScale = true;
    this._chart.update('none');
  }

  _stopMiddlePan(event) {
    if (event?.button !== undefined && event.button !== 1) return;
    this._middlePanState = null;
    document.removeEventListener('mousemove', this._middlePanMoveHandler);
    document.removeEventListener('mouseup', this._middlePanUpHandler);
  }

  _updateVisibleYScale() {
    if (!this._chart) return;

    const xScale = this._chart.scales?.x;
    const yScale = this._chart.options?.scales?.y;
    if (!xScale || !yScale) return;
    if (this._manualYScale) return;

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
    this._stopMiddlePan();
    if (this._chartUpdateTimer) {
      clearTimeout(this._chartUpdateTimer);
      this._chartUpdateTimer = null;
    }
    if (this._chartRetryTimer) {
      clearInterval(this._chartRetryTimer);
      this._chartRetryTimer = null;
    }
    super.destroy();
  }
}
