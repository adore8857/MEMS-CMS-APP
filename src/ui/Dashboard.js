/**
 * Dashboard - Dashboard layout manager with free-form drag/resize
 */
import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { t } from '../core/i18n.js';
import { PlotWidget } from '../widgets/PlotWidget.js?v=axis-units-20260525-1';
import { GaugeWidget } from '../widgets/GaugeWidget.js?v=axis-units-20260525-1';
import { BarWidget } from '../widgets/BarWidget.js?v=axis-units-20260525-1';
import { CompassWidget } from '../widgets/CompassWidget.js?v=axis-units-20260525-1';
import { LedWidget } from '../widgets/LedWidget.js?v=dashboard-editor-fix-20260514-1';
import { FftWidget } from '../widgets/FftWidget.js?v=fft-analysis-20260525-1';
import { DataGridWidget } from '../widgets/DataGridWidget.js';
import { AccelWidget } from '../widgets/AccelWidget.js';

function finiteValues(values) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function plotRangeForDatasets(datasets) {
  const mins = finiteValues(datasets.map((dataset) => dataset.min ?? dataset.plotMin));
  const maxs = finiteValues(datasets.map((dataset) => dataset.max ?? dataset.plotMax));
  return {
    yMin: mins.length ? Math.min(...mins) : undefined,
    yMax: maxs.length ? Math.max(...maxs) : undefined
  };
}

function datasetLabel(dataset) {
  return dataset.title + (dataset.units ? ` (${dataset.units})` : '');
}

function isEnabled(value) {
  return value !== false;
}

function buildDefaultLayout(width) {
  const col = Math.floor(width / 3);
  const col2 = col * 2;
  return [
    {
      type: 'MultiPlot',
      config: {
        title: 'Temperature & Humidity',
        icon: 'PLOT',
        datasetIndices: [0, 1],
        datasetLabels: ['Temperature (°C)', 'Humidity (%)'],
        datasetUnits: ['°C', '%'],
        colorOffset: 0,
        x: 0, y: 0, w: col2, h: 280
      }
    },
    {
      type: 'Accel',
      config: {
        title: 'Accelerometer',
        icon: 'ACC',
        axes: [
          { index: 3, label: 'X', color: '#3b82f6', min: -10, max: 10 },
          { index: 4, label: 'Y', color: '#10b981', min: -10, max: 10 },
          { index: 5, label: 'Z', color: '#f59e0b', min: 0, max: 20 }
        ],
        x: col2, y: 0, w: col, h: 280
      }
    },
    {
      type: 'Gauge',
      config: {
        title: 'Temperature',
        icon: 'TMP',
        datasetIndex: 0, min: -20, max: 80, units: '°C', colorIdx: 0,
        x: 0, y: 288, w: col, h: 260
      }
    },
    {
      type: 'Gauge',
      config: {
        title: 'Humidity',
        icon: 'HUM',
        datasetIndex: 1, min: 0, max: 100, units: '%', colorIdx: 1,
        x: col, y: 288, w: col, h: 260
      }
    },
    {
      type: 'Gauge',
      config: {
        title: 'Pressure',
        icon: 'PRS',
        datasetIndex: 2, min: 900, max: 1100, units: 'hPa', colorIdx: 2,
        x: col2, y: 288, w: col, h: 260
      }
    },
    {
      type: 'Compass',
      config: {
        title: 'Heading',
        icon: 'HDG',
        datasetIndex: 6,
        x: 0, y: 556, w: col, h: 280
      }
    },
    {
      type: 'Bar',
      config: {
        title: 'Voltage',
        icon: 'BAR',
        datasets: [{ index: 7, title: 'Battery', min: 0, max: 5, units: 'V' }],
        colorOffset: 7,
        x: col, y: 556, w: col, h: 280
      }
    },
    {
      type: 'Plot',
      config: {
        title: 'Pressure History',
        icon: 'PLOT',
        datasetIndices: [2],
        datasetLabels: ['Pressure (hPa)'],
        datasetUnits: ['hPa'],
        colorOffset: 2,
        x: col2, y: 556, w: col, h: 280
      }
    },
    {
      type: 'DataGrid',
      config: {
        title: t('dashboard.allData'),
        icon: 'GRID',
        datasets: [
          { index: 0, title: 'Temperature', units: '°C' },
          { index: 1, title: 'Humidity', units: '%' },
          { index: 2, title: 'Pressure', units: 'hPa' },
          { index: 3, title: 'Accel X', units: 'm/s2' },
          { index: 4, title: 'Accel Y', units: 'm/s2' },
          { index: 5, title: 'Accel Z', units: 'm/s2' },
          { index: 6, title: 'Heading', units: 'deg' },
          { index: 7, title: 'Voltage', units: 'V' }
        ],
        x: 0, y: 844, w: width - 4, h: 260
      }
    }
  ];
}

export class Dashboard {
  constructor(container) {
    this._container = container;
    this._grid = null;
    this._canvas = null;
    this._widgets = [];
    this._hasData = false;
    this._emptyEl = null;
    this._wheelHandler = (e) => this._handleWheelScroll(e);

    this._frameHandler = () => {
      if (!this._hasData) {
        this._hasData = true;
        this._showGrid();
      }
    };

    this._render();
    eventBus.on('frame:received', this._frameHandler);
    eventBus.on('state:connectionStateChanged', (state) => {
      if (state === 'Disconnected') {
        this._hasData = false;
        this._showEmpty();
        this._widgets.forEach((w) => w.reset?.());
      }
    });
  }

  _render() {
    this._container.innerHTML = `
      <div class="dashboard-header">
        <div class="dashboard-header-title">
          <span class="dashboard-header-badge" aria-hidden="true"></span>
          <span id="dashboard-title">${t('dashboard.title')}</span>
        </div>
        <div class="dashboard-header-actions">
          <button class="btn btn-icon dashboard-header-btn" id="btn-auto-layout" title="${t('dashboard.autoLayout')}">${t('dashboard.autoLayout')}</button>
          <button class="btn btn-icon dashboard-header-btn" id="btn-reset-data" title="${t('dashboard.reset')}">${t('dashboard.reset')}</button>
          <button class="btn btn-icon dashboard-header-btn" id="btn-fullscreen" title="${t('dashboard.fullscreen')}">${t('dashboard.fullscreen')}</button>
        </div>
      </div>
      <div class="dashboard-empty" id="dashboard-empty">
        <div class="dashboard-empty-icon" aria-hidden="true"></div>
        <div class="dashboard-empty-title">${t('dashboard.realTimeTitle')}</div>
        <div class="dashboard-empty-desc">${t('dashboard.realTimeDesc')}</div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:16px;max-width:680px">
          ${[
            [t('dashboard.featureQuickPlot'), t('dashboard.featureQuickPlotDesc')],
            [t('dashboard.featureProjectFile'), t('dashboard.featureProjectFileDesc')],
            [t('dashboard.featureJson'), t('dashboard.featureJsonDesc')],
            [t('dashboard.featureProtocols'), t('dashboard.featureProtocolsDesc')],
            [t('dashboard.featureExport'), t('dashboard.featureExportDesc')],
            [t('dashboard.featureActions'), t('dashboard.featureActionsDesc')]
          ].map(([title, desc]) => `
            <div style="background:var(--dashboard-empty-card-bg);border:1px solid var(--dashboard-empty-card-border);border-radius:12px;padding:14px 16px;max-width:220px;text-align:left;box-shadow:var(--shadow-sm)">
              <div style="font-size:var(--font-size-sm);font-weight:600;color:var(--text-secondary);margin-bottom:4px">${title}</div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.4">${desc}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:20px;display:flex;gap:8px">
          <button class="btn btn-primary" id="btn-start-sim-empty" style="font-size:13px;padding:8px 20px">${t('dashboard.startDemo')}</button>
          <button class="btn" id="btn-open-project-empty" style="font-size:13px;padding:8px 20px">${t('dashboard.openProject')}</button>
        </div>
      </div>
      <div class="dashboard-grid hidden" id="dashboard-grid">
        <div class="dashboard-grid-canvas" id="dashboard-grid-canvas"></div>
      </div>`;

    this._emptyEl = this._container.querySelector('#dashboard-empty');
    this._grid = this._container.querySelector('#dashboard-grid');
    this._canvas = this._container.querySelector('#dashboard-grid-canvas');
    this._container?.addEventListener('wheel', this._wheelHandler, { passive: false });

    this._container.querySelector('#btn-reset-data').addEventListener('click', () => this._resetAll());
    this._container.querySelector('#btn-auto-layout').addEventListener('click', () => this._autoLayout());
    this._container.querySelector('#btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) this._container.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    this._container.querySelector('#btn-start-sim-empty')?.addEventListener('click', () => eventBus.emit('ui:startSimulator'));
    this._container.querySelector('#btn-open-project-empty')?.addEventListener('click', () => eventBus.emit('project:openFile'));

    this._buildDefaultWidgets();
  }

  _buildDefaultWidgets() {
    this._widgets.forEach((w) => w.destroy?.());
    this._widgets = [];
    requestAnimationFrame(() => {
      const width = (this._grid.clientWidth || 1100) - 8;
      const layout = buildDefaultLayout(width);
      layout.forEach((def) => {
        const widget = this._createWidget(def.type, def.config);
        if (widget) {
          widget.mount(this._canvas);
          this._widgets.push(widget);
        }
      });
      this._updateCanvasHeight();
    });
  }

  _updateCanvasHeight() {
    let maxBottom = 600;
    this._widgets.forEach((w) => {
      if (!w._el) return;
      const bottom = (parseInt(w._el.style.top, 10) || 0) + (parseInt(w._el.style.height, 10) || 260);
      if (bottom > maxBottom) maxBottom = bottom;
    });
    if (this._canvas) {
      const nextHeight = `${maxBottom + 40}px`;
      this._canvas.style.height = nextHeight;
      this._canvas.style.minHeight = nextHeight;
    }
  }

  _autoLayout() {
    const width = (this._grid.clientWidth || 1100) - 8;
    let x = 0;
    let y = 0;
    let rowH = 0;
    const gap = 8;
    this._widgets.forEach((w) => {
      if (!w._el) return;
      const widgetW = Math.min(width, parseInt(w._el.style.width, 10) || w.config.w || 360);
      const widgetH = parseInt(w._el.style.height, 10) || w.config.h || 260;
      if (x > 0 && x + widgetW > width) {
        x = 0;
        y += rowH + gap;
        rowH = 0;
      }
      w._el.style.left = `${x}px`;
      w._el.style.top = `${y}px`;
      w._el.style.width = `${widgetW}px`;
      w._el.style.height = `${widgetH}px`;
      w.config.x = x;
      w.config.y = y;
      w.config.w = widgetW;
      w.config.h = widgetH;
      w._onResize?.();
      x += widgetW + gap;
      rowH = Math.max(rowH, widgetH);
    });
    this._updateCanvasHeight();
  }

  buildFromProject(project) {
    this._widgets.forEach((w) => w.destroy?.());
    this._widgets = [];

    const datasets = [];
    (project.groups || []).forEach((g) => g.datasets.forEach((d) => datasets.push(d)));
    const isTemperatureDataset = (d) => {
      const title = String(d.title || '').toLowerCase();
      const units = String(d.units || '').toLowerCase();
      return title.includes('temp') || units.includes('°c') || units === 'c';
    };
    const wantsPlot = (d) => isEnabled(d.plot);
    const plotDatasets = datasets.filter((d) => {
      const widget = String(d.widget || '').toLowerCase();
      const isGaugeLike = widget === 'gauge' || widget === 'gauges';
      const isTemperature = isTemperatureDataset(d);
      return wantsPlot(d) && !isGaugeLike && !isTemperature;
    });
    const temperatureDatasets = datasets.filter((d) => wantsPlot(d) && isTemperatureDataset(d));
    const gaugeDatasets = datasets.filter((d) => d.gauge);
    const barDatasets = datasets.filter((d) => d.bar);
    const compassDatasets = datasets.filter((d) => d.compass);
    const ledDatasets = datasets.filter((d) => d.led);
    const fftDatasets = datasets.filter((d) => d.fft);

    const width = (this._grid?.clientWidth || 1100) - 8;
    let y = 0;
    const gap = 8;

    const mountWidget = (widget) => {
      widget.mount(this._canvas);
      this._widgets.push(widget);
      return widget;
    };

    if (plotDatasets.length > 0 || temperatureDatasets.length > 0) {
      const hasMainPlot = plotDatasets.length > 0;
      const hasTempPlot = temperatureDatasets.length > 0;
      const plotHeight = 280;
      const mainWidth = hasMainPlot && hasTempPlot ? Math.floor(width * 0.66) : width;
      const tempX = hasMainPlot ? mainWidth + gap : 0;
      const tempWidth = hasMainPlot ? Math.max(280, width - tempX) : width;

      if (hasMainPlot) {
        const range = plotRangeForDatasets(plotDatasets);
        mountWidget(new PlotWidget({
          title: `${project.title} - ${t('dashboard.overview')}`,
          icon: 'PLOT',
          datasetIndices: plotDatasets.map((d) => d.index),
          datasetLabels: plotDatasets.map(datasetLabel),
          datasetUnits: plotDatasets.map((d) => d.units || ''),
          yMin: range.yMin,
          yMax: range.yMax,
          x: 0, y, w: mainWidth, h: plotHeight
        }));
      }

      if (hasTempPlot) {
        const range = plotRangeForDatasets(temperatureDatasets);
        mountWidget(new PlotWidget({
          title: 'Temperature Trend',
          icon: 'PLOT',
          datasetIndices: temperatureDatasets.map((d) => d.index),
          datasetLabels: temperatureDatasets.map(datasetLabel),
          datasetUnits: temperatureDatasets.map((d) => d.units || ''),
          colorOffset: 3,
          yMin: range.yMin,
          yMax: range.yMax,
          x: tempX,
          y,
          w: tempWidth,
          h: plotHeight
        }));
      }

      y += plotHeight + gap;
    }

    let cursorX = 0;
    let cursorY = y;
    let rowH = 0;
    const addFlowWidget = (factory, preferredWidth, height) => {
      const w = Math.min(width, preferredWidth);
      if (cursorX > 0 && cursorX + w > width) {
        cursorX = 0;
        cursorY += rowH + gap;
        rowH = 0;
      }
      mountWidget(factory({ x: cursorX, y: cursorY, w, h: height }));
      cursorX += w + gap;
      rowH = Math.max(rowH, height);
    };
    const finishFlow = () => {
      if (rowH > 0) {
        y = cursorY + rowH + gap;
        cursorX = 0;
        cursorY = y;
        rowH = 0;
      }
    };

    const gaugeWidth = Math.max(260, Math.floor((width - gap * 2) / 3));
    gaugeDatasets.forEach((ds, i) => {
      addFlowWidget(({ x, y: widgetY, w, h }) => new GaugeWidget({
        title: ds.title,
        datasetIndex: ds.index,
        min: ds.min,
        max: ds.max,
        units: ds.units,
        colorIdx: i,
        x,
        y: widgetY,
        w,
        h
      }), gaugeWidth, 260);
    });

    if (barDatasets.length > 0) {
      addFlowWidget(({ x, y: widgetY, w, h }) => new BarWidget({
        title: 'Bar Indicators',
        icon: 'BAR',
        datasets: barDatasets,
        x,
        y: widgetY,
        w,
        h
      }), Math.max(320, Math.floor((width - gap) / 2)), 260);
    }

    compassDatasets.forEach((ds) => {
      addFlowWidget(({ x, y: widgetY, w, h }) => new CompassWidget({
        title: ds.title,
        datasetIndex: ds.index,
        units: ds.units,
        x,
        y: widgetY,
        w,
        h
      }), Math.max(260, Math.floor((width - gap * 2) / 3)), 260);
    });

    if (ledDatasets.length > 0) {
      addFlowWidget(({ x, y: widgetY, w, h }) => new LedWidget({
        title: 'LED Indicators',
        icon: 'LED',
        datasets: ledDatasets,
        x,
        y: widgetY,
        w,
        h
      }), Math.max(320, Math.floor((width - gap) / 2)), 220);
    }

    if (fftDatasets.length > 0) {
      addFlowWidget(({ x, y: widgetY, w, h }) => new FftWidget({
        title: 'FFT',
        icon: 'FFT',
        datasets: fftDatasets,
        x,
        y: widgetY,
        w,
        h
      }), width, 280);
    }

    finishFlow();

    if (datasets.length > 0) {
      const dg = new DataGridWidget({
        title: t('dashboard.allData'),
        icon: 'GRID',
        datasets,
        x: 0,
        y,
        w: width,
        h: 260
      });
      dg.mount(this._canvas);
      this._widgets.push(dg);
    }

    this._updateCanvasHeight();
  }

  _createWidget(type, config) {
    switch (type) {
      case 'Plot':
      case 'MultiPlot':
        return new PlotWidget(config);
      case 'Gauge':
        return new GaugeWidget(config);
      case 'Bar':
        return new BarWidget(config);
      case 'Compass':
        return new CompassWidget(config);
      case 'LED':
        return new LedWidget(config);
      case 'FFT':
        return new FftWidget(config);
      case 'DataGrid':
        return new DataGridWidget(config);
      case 'Accel':
        return new AccelWidget(config);
      default:
        return null;
    }
  }

  _showGrid() {
    this._emptyEl?.classList.add('hidden');
    this._grid?.classList.remove('hidden');
  }

  _showEmpty() {
    this._emptyEl?.classList.remove('hidden');
    this._grid?.classList.add('hidden');
  }

  _resetAll() {
    this._widgets.forEach((w) => w.reset?.());
  }

  _handleWheelScroll(e) {
    if (!this._container || e.ctrlKey || e.metaKey) return;
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;

    const target = this._findScrollableTarget(e.target);
    if (!target) return;

    target.scrollTop += e.deltaY;
    e.preventDefault();
  }

  _findScrollableTarget(startEl) {
    let el = startEl instanceof HTMLElement ? startEl : null;
    while (el && el !== this._container) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const canScroll = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      if (canScroll) return el;
      el = el.parentElement;
    }
    return this._container.scrollHeight > this._container.clientHeight ? this._container : null;
  }

  destroy() {
    this._container?.removeEventListener('wheel', this._wheelHandler);
    this._widgets.forEach((w) => w.destroy?.());
    this._widgets = [];
  }
}
