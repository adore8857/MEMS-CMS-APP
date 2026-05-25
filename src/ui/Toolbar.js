/**
 * Toolbar - Ribbon-style top toolbar
 */
import { eventBus } from '../core/EventBus.js';
import { appState, BusType } from '../core/AppState.js';
import { t } from '../core/i18n.js?v=mems-cms-brand-20260525-2';
import { csvSessionManager } from '../core/CsvSessionManager.js';

export class Toolbar {
  constructor(container, connectionManager, simulator) {
    this._container = container;
    this._conn = connectionManager;
    this._sim = simulator;
    this._rateEl = null;
    this._countEl = null;
    this._render();
    this._bindDomEvents();
    eventBus.on('state:connectionStateChanged', () => this._updateConnectBtn());
    setInterval(() => this._updateStats(), 1000);
  }

  _render() {
    this._container.innerHTML = `
      <div class="toolbar">
        <div class="toolbar-brand">
          <img class="toolbar-brand-icon" src="src/assets/neu-seal.png" alt="Northeastern University emblem">
          <div class="toolbar-brand-text">
            <div class="toolbar-brand-title">${t('app.brandTitle')}</div>
            <div class="toolbar-brand-subtitle">${t('app.brandSubtitle')}</div>
            <div class="toolbar-brand-subtitle">${t('app.brandDescription')}</div>
          </div>
        </div>

        <div class="toolbar-sections">
          <div class="toolbar-section">
            <div class="toolbar-section-content">
              <button class="toolbar-btn" id="btn-project-editor" title="${t('toolbar.editor')}">
                <div class="toolbar-btn-icon icon-editor" aria-hidden="true"></div>
                <div class="toolbar-btn-label">${t('toolbar.editor')}</div>
              </button>
              <div style="display:flex;flex-direction:column;gap:2px">
                <button class="toolbar-btn toolbar-btn-compact" id="btn-open-project" title="${t('toolbar.openProject')}">
                  <div class="toolbar-btn-icon icon-open" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.openProject')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact" id="btn-save-project" title="${t('toolbar.saveProject')}">
                  <div class="toolbar-btn-icon icon-save" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.saveProject')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact" id="btn-export-csv" title="${t('toolbar.exportCsv')}">
                  <div class="toolbar-btn-icon icon-export" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.exportCsv')}</div>
                </button>
              </div>
            </div>
            <div class="toolbar-section-label">${t('toolbar.project')}</div>
          </div>

          <div class="toolbar-section">
            <div class="toolbar-section-content">
              <div class="toolbar-drivers">
                <button class="toolbar-btn toolbar-btn-compact driver-btn ${appState.busType === BusType.Serial ? 'active' : ''}" data-bus="Serial" title="${t('toolbar.uart')}">
                  <div class="toolbar-btn-icon icon-uart" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.uart')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact driver-btn ${appState.busType === BusType.Bluetooth ? 'active' : ''}" data-bus="Bluetooth" title="${t('toolbar.ble')}">
                  <div class="toolbar-btn-icon icon-ble" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.ble')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact driver-btn ${appState.busType === BusType.WebSocket ? 'active' : ''}" data-bus="WebSocket" title="${t('toolbar.network')}">
                  <div class="toolbar-btn-icon icon-network" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.network')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact driver-btn ${appState.busType === BusType.MQTT ? 'active' : ''}" data-bus="MQTT" title="${t('toolbar.mqtt')}">
                  <div class="toolbar-btn-icon icon-mqtt" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.mqtt')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact driver-btn ${appState.busType === BusType.UDP ? 'active' : ''}" data-bus="UDP" title="${t('toolbar.udp')}">
                  <div class="toolbar-btn-icon icon-network" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.udp')}</div>
                </button>
              </div>
            </div>
            <div class="toolbar-section-label">${t('toolbar.interface')}</div>
          </div>

          <div class="toolbar-section">
            <div class="toolbar-section-content">
              <button class="toolbar-btn" id="btn-sim" title="${this._sim?.isRunning ? t('toolbar.stopSim') : t('toolbar.demoSim')}">
                <div class="toolbar-btn-icon ${this._sim?.isRunning ? 'icon-stop' : 'icon-sim'}" id="sim-icon" aria-hidden="true"></div>
                <div class="toolbar-btn-label" id="sim-label">${this._sim?.isRunning ? t('toolbar.stopSim') : t('toolbar.demoSim')}</div>
              </button>
              <div style="display:flex;flex-direction:column;gap:2px">
                <button class="toolbar-btn toolbar-btn-compact" id="btn-sidebar" title="${t('toolbar.setupPanel')}">
                  <div class="toolbar-btn-icon icon-panel" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.setupPanel')}</div>
                </button>
                <button class="toolbar-btn toolbar-btn-compact" id="btn-preferences" title="${t('toolbar.preferences')}">
                  <div class="toolbar-btn-icon icon-preferences" aria-hidden="true"></div>
                  <div class="toolbar-btn-label">${t('toolbar.preferences')}</div>
                </button>
              </div>
            </div>
            <div class="toolbar-section-label">${t('toolbar.tools')}</div>
          </div>

          <div class="toolbar-section">
            <div class="toolbar-section-content" style="flex-direction:column;align-items:flex-start;gap:6px;min-width:100px">
              <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${t('toolbar.framesPerSecond')}: <span id="stat-rate" style="color:var(--accent-green);font-family:var(--font-mono)">0</span></div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted)">${t('toolbar.total')}: <span id="stat-count" style="color:var(--accent-blue);font-family:var(--font-mono)">0</span></div>
            </div>
            <div class="toolbar-section-label">${t('toolbar.statistics')}</div>
          </div>
        </div>

        <div class="toolbar-connect-area">
          <button class="toolbar-connect-btn disconnected" id="btn-connect">
            <span class="btn-dot"></span>
            <span id="connect-label">${t('common.connect')}</span>
          </button>
        </div>
      </div>`;

    this._rateEl = this._container.querySelector('#stat-rate');
    this._countEl = this._container.querySelector('#stat-count');
    this._updateConnectBtn();
  }

  _bindDomEvents() {
    this._container.querySelector('#btn-connect').addEventListener('click', () => {
      if (this._sim?.isRunning) {
        this._sim.stop();
        this._updateSimBtn();
        this._updateConnectBtn();
        return;
      }
      this._conn.toggleConnection();
    });

    this._container.querySelector('#btn-sim').addEventListener('click', () => {
      if (appState.isConnected && !this._sim?.isRunning) return;
      this._sim?.toggle();
      this._updateSimBtn();
      this._updateConnectBtn();
    });

    this._container.querySelectorAll('.driver-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (appState.isConnected) return;
        appState.busType = btn.dataset.bus;
        this._container.querySelectorAll('.driver-btn').forEach((node) => node.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    this._container.querySelector('#btn-sidebar').addEventListener('click', () => {
      appState.sidebarVisible = !appState.sidebarVisible;
      eventBus.emit('ui:toggleSidebar');
    });

    this._container.querySelector('#btn-open-project').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => eventBus.emit('project:load', ev.target.result);
        reader.readAsText(file);
      });
      input.click();
    });

    this._container.querySelector('#btn-save-project').addEventListener('click', () => eventBus.emit('project:save'));
    this._container.querySelector('#btn-export-csv').addEventListener('click', async () => {
      await csvSessionManager.exportLatest({ promptIfNeeded: true });
    });
    this._container.querySelector('#btn-preferences').addEventListener('click', () => eventBus.emit('ui:openPreferences'));
    this._container.querySelector('#btn-project-editor').addEventListener('click', () => eventBus.emit('ui:openEditor'));
  }

  _updateConnectBtn() {
    const btn = this._container.querySelector('#btn-connect');
    const label = this._container.querySelector('#connect-label');
    if (!btn || !label) return;
    const connected = appState.isConnected;
    const simRunning = this._sim?.isRunning;
    btn.className = `toolbar-connect-btn ${connected || simRunning ? 'connected' : 'disconnected'}`;
    label.textContent = connected ? t('common.disconnect') : (simRunning ? t('toolbar.stopSim') : t('common.connect'));
  }

  _updateSimBtn() {
    const icon = this._container.querySelector('#sim-icon');
    const label = this._container.querySelector('#sim-label');
    if (!icon || !label) return;
    icon.className = `toolbar-btn-icon ${this._sim?.isRunning ? 'icon-stop' : 'icon-sim'}`;
    label.textContent = this._sim?.isRunning ? t('toolbar.stopSim') : t('toolbar.demoSim');
  }

  _updateStats() {
    if (this._rateEl) this._rateEl.textContent = appState.dataRate;
    if (this._countEl) this._countEl.textContent = appState.frameCount;
  }
}
