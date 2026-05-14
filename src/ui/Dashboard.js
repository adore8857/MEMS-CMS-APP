/**
 * Dashboard - Dashboard layout manager with free-form drag/resize
 */
import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { t } from '../core/i18n.js';
import { PlotWidget } from '../widgets/PlotWidget.js?v=font-load-demo-20260513-1';
import { GaugeWidget } from '../widgets/GaugeWidget.js';
import { BarWidget } from '../widgets/BarWidget.js';
import { CompassWidget } from '../widgets/CompassWidget.js';
import { DataGridWidget } from '../widgets/DataGridWidget.js';
import { AccelWidget } from '../widgets/AccelWidget.js';

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
    const layout = buildDefaultLayout(width);
    this._widgets.forEach((w, i) => {
      const pos = layout[i];
      if (pos && w._el) {
        w._el.style.left = `${pos.config.x}px`;
        w._el.style.top = `${pos.config.y}px`;
        w._el.style.width = `${pos.config.w}px`;
        w._el.style.height = `${pos.config.h}px`;
      }
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
    const plotDatasets = datasets.filter((d) => {
      const widget = String(d.widget || '').toLowerCase();
      const isGaugeLike = widget === 'gauge' || widget === 'gauges';
      const isTemperature = isTemperatureDataset(d);
      return d.plot !== false && d.graph !== false && !isGaugeLike && !isTemperature;
    });
    const temperatureDatasets = datasets.filter((d) => isTemperatureDataset(d));
    const gaugeDatasets = [];
    (project.groups || []).forEach((group) => {
      const groupForcesGauge = group.widget === 'Gauges';
      (group.datasets || []).forEach((dataset) => {
        if (groupForcesGauge || dataset.gauge) {
          gaugeDatasets.push(dataset);
        }
      });
    });

    const width = (this._grid?.clientWidth || 1100) - 8;
    let y = 0;

    if (plotDatasets.length > 0) {
      const mp = new PlotWidget({
        title: `${project.title} - ${t('dashboard.overview')}`,
        icon: 'PLOT',
        datasetIndices: plotDatasets.map((d) => d.index),
        datasetLabels: plotDatasets.map((d) => d.title + (d.units ? ` (${d.units})` : '')),
        x: 0, y, w: width, h: 280
      });
      mp.mount(this._canvas);
      this._widgets.push(mp);
      y += 288;
    }

    if (temperatureDatasets.length > 0) {
      const tempPlot = new PlotWidget({
        title: 'Temperature Trend',
        icon: 'PLOT',
        datasetIndices: temperatureDatasets.map((d) => d.index),
        datasetLabels: temperatureDatasets.map((d) => d.title + (d.units ? ` (${d.units})` : '')),
        colorOffset: 3,
        x: 0,
        y,
        w: Math.floor(width * 0.52),
        h: 260
      });
      tempPlot.mount(this._canvas);
      this._widgets.push(tempPlot);
    }

    let gx = temperatureDatasets.length > 0 ? Math.floor(width * 0.52) + 8 : 0;
    const gaugeWidth = temperatureDatasets.length > 0
      ? Math.max(320, width - gx)
      : Math.floor(width / 3);
    gaugeDatasets.forEach((ds, i) => {
      const gauge = new GaugeWidget({
        title: ds.title,
        datasetIndex: ds.index,
        min: ds.min,
        max: ds.max,
        units: ds.units,
        colorIdx: i,
        x: gx,
        y,
        w: gaugeWidth,
        h: 260
      });
      gauge.mount(this._canvas);
      this._widgets.push(gauge);
      gx += gaugeWidth;
      if (gx + gaugeWidth > width) {
        gx = 0;
        y += 268;
      }
    });
    if (gx > 0) y += 268;

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
