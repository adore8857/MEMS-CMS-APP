/**
 * Sidebar - Device setup panel
 */
import { eventBus } from '../core/EventBus.js';
import { appState, OperationMode, BusType, ConnectionState } from '../core/AppState.js';
import { busLabel, t } from '../core/i18n.js?v=csv-autosave-20260424-1';
import { csvSessionManager } from '../core/CsvSessionManager.js';

export class Sidebar {
  constructor(container) {
    this._container = container;
    this._lastReceivedJSON = '';
    this._render();
    this._bindDomEvents();
    this._updateDriverPanel();
    this._updateStatusDot();
    eventBus.on('state:busTypeChanged', () => this._updateDriverPanel());
    eventBus.on('state:connectionStateChanged', () => this._updateStatusDot());
    eventBus.on('state:operationModeChanged', () => this._updateDriverPanel());
    eventBus.on('csv:targetChanged', () => this._updateCsvTargetHint());
    eventBus.on('frame:receivedJSON', (json) => {
      this._lastReceivedJSON = JSON.stringify(json).slice(0, 200);
      const lastEl = this._container.querySelector('#json-last-received');
      if (lastEl) lastEl.textContent = this._lastReceivedJSON;
    });
  }

  _render() {
    this._container.innerHTML = `
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-title">
            <span class="sidebar-title-icon" aria-hidden="true"></span>
            <span>${t('sidebar.title')}</span>
          </div>
        </div>
        <div class="sidebar-scroll">
          <div class="sidebar-section">
            <div class="sidebar-section-label">${t('sidebar.frameParsing')}</div>
            <div class="sidebar-section-content">
              <label class="radio-wrap">
                <input type="radio" name="opMode" value="QuickPlot" ${appState.operationMode === OperationMode.QuickPlot ? 'checked' : ''}>
                <span>${t('sidebar.quickPlot')}</span>
              </label>
              <label class="radio-wrap">
                <input type="radio" name="opMode" value="DeviceSendsJSON" ${appState.operationMode === OperationMode.DeviceSendsJSON ? 'checked' : ''}>
                <span>${t('sidebar.deviceSendsJson')}</span>
              </label>
              <label class="radio-wrap">
                <input type="radio" name="opMode" value="ProjectFile" ${appState.operationMode === OperationMode.ProjectFile ? 'checked' : ''}>
                <span>${t('sidebar.projectFile')}</span>
              </label>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-label">${t('sidebar.dataExport')}</div>
            <div class="sidebar-section-content">
              <label class="checkbox-wrap">
                <input type="checkbox" id="chk-csv" ${appState.csvExportEnabled ? 'checked' : ''}>
                <span>${t('sidebar.exportCsv')}</span>
              </label>
              <label class="checkbox-wrap">
                <input type="checkbox" id="chk-console-log" ${appState.consoleExportEnabled ? 'checked' : ''}>
                <span>${t('sidebar.exportConsole')}</span>
              </label>
              <button class="btn" id="btn-csv-path">${t('sidebar.chooseCsvPath')}</button>
              <div class="sidebar-helper-text" id="csv-target-hint">${csvSessionManager.targetSummary}</div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-label">${t('sidebar.ioInterface')}</div>
            <div class="sidebar-section-content">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
                <button class="btn bus-btn ${appState.busType === BusType.Serial ? 'btn-primary' : ''}" data-bus="Serial">${t('toolbar.uart')}</button>
                <button class="btn bus-btn ${appState.busType === BusType.Bluetooth ? 'btn-primary' : ''}" data-bus="Bluetooth">${t('toolbar.ble')}</button>
                <button class="btn bus-btn ${appState.busType === BusType.WebSocket ? 'btn-primary' : ''}" data-bus="WebSocket">WebSocket</button>
                <button class="btn bus-btn ${appState.busType === BusType.MQTT ? 'btn-primary' : ''}" data-bus="MQTT">MQTT</button>
                <button class="btn bus-btn ${appState.busType === BusType.UDP ? 'btn-primary' : ''}" data-bus="UDP">UDP</button>
              </div>
            </div>
          </div>

          <div class="sidebar-section" id="driver-panel"></div>

          <div class="sidebar-section" id="json-editor-section" style="display:none">
            <div class="sidebar-section-label">${t('sidebar.jsonProjectEditor')}</div>
            <div class="json-editor-panel">
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5;margin-bottom:4px">
                ${t('sidebar.jsonEditorHint')}
              </div>
              <textarea class="json-editor-textarea" id="json-schema-editor" spellcheck="false" rows="10">${JSON.stringify({
  t: 'My Device',
  g: [
    {
      t: 'Sensors',
      w: 'multiplot',
      d: [
        { t: 'Temperature', v: 0, u: '°C', g: true, b: true, min: -20, max: 80 },
        { t: 'Humidity', v: 0, u: '%', g: false, b: true, min: 0, max: 100 }
      ]
    }
  ]
}, null, 2)}</textarea>
              <div style="display:flex;align-items:center;justify-content:space-between">
                <span class="json-editor-status valid" id="json-status">OK ${t('sidebar.validJson')}</span>
                <div style="display:flex;gap:4px">
                  <button class="btn" id="btn-json-load" style="font-size:var(--font-size-xs);padding:3px 8px">${t('sidebar.loadJson')}</button>
                  <button class="btn btn-primary" id="btn-json-apply" style="font-size:var(--font-size-xs);padding:3px 8px">${t('sidebar.apply')}</button>
                </div>
              </div>
              <div style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:4px">
                <strong style="color:var(--text-secondary)">${t('sidebar.lastReceivedJson')}</strong>
                <div id="json-last-received" style="color:var(--accent-green);font-family:var(--font-mono);font-size:var(--font-size-xs);max-height:80px;overflow-y:auto;margin-top:2px;word-break:break-all">${this._lastReceivedJSON || t('sidebar.none')}</div>
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-label">${t('sidebar.frameSettings')}</div>
            <div class="sidebar-section-content">
              <div class="form-row">
                <div class="form-label">${t('sidebar.endDelimiter')}</div>
                <input class="form-input" id="cfg-end-del" value="${appState.frameConfig.endDelimiter}" placeholder="\\n">
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.startDelimiter')}</div>
                <input class="form-input" id="cfg-start-del" value="${appState.frameConfig.startDelimiter}" placeholder="${t('sidebar.leaveEmpty')}">
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-label">${t('sidebar.plotSettings')}</div>
            <div class="sidebar-section-content">
              <div class="form-row">
                <div class="form-label">${t('sidebar.historyPoints')}</div>
                <input class="form-input" id="cfg-points" type="number" min="10" max="5000" value="${appState.points}">
              </div>
            </div>
          </div>
        </div>
        <div class="sidebar-status">
          <div class="sidebar-status-dot" id="status-dot"></div>
          <span id="status-text">${t('sidebar.disconnected')}</span>
        </div>
      </div>`;
  }

  _bindDomEvents() {
    this._container.querySelectorAll('input[name="opMode"]').forEach((r) => {
      r.addEventListener('change', () => {
        appState.operationMode = r.value;
        this._toggleJsonEditor(r.value);
      });
    });

    const csvChk = this._container.querySelector('#chk-csv');
    if (csvChk) csvChk.addEventListener('change', () => { appState.csvExportEnabled = csvChk.checked; });
    const conChk = this._container.querySelector('#chk-console-log');
    if (conChk) conChk.addEventListener('change', () => { appState.consoleExportEnabled = conChk.checked; });
    const csvPathBtn = this._container.querySelector('#btn-csv-path');
    if (csvPathBtn) {
      csvPathBtn.addEventListener('click', async () => {
        try {
          await csvSessionManager.pickSaveDirectory();
        } catch (error) {
          if (error?.name !== 'AbortError') {
            eventBus.emit('toast', { type: 'error', message: t('messages.csvSaveFailed', { error: error.message || error }) });
          }
        }
      });
    }

    this._container.querySelectorAll('.bus-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        appState.busType = btn.dataset.bus;
        this._container.querySelectorAll('.bus-btn').forEach((node) => node.classList.remove('btn-primary'));
        btn.classList.add('btn-primary');
      });
    });

    const endDel = this._container.querySelector('#cfg-end-del');
    if (endDel) endDel.addEventListener('change', () => appState.updateFrameConfig({ endDelimiter: endDel.value }));
    const startDel = this._container.querySelector('#cfg-start-del');
    if (startDel) startDel.addEventListener('change', () => appState.updateFrameConfig({ startDelimiter: startDel.value }));

    const pointsInput = this._container.querySelector('#cfg-points');
    if (pointsInput) pointsInput.addEventListener('change', () => { appState.points = parseInt(pointsInput.value, 10) || 100; });

    this._bindJsonEditor();
    this._toggleJsonEditor(appState.operationMode);
    this._updateCsvTargetHint();
  }

  _updateCsvTargetHint() {
    const el = this._container.querySelector('#csv-target-hint');
    if (el) el.textContent = csvSessionManager.targetSummary;
  }

  _toggleJsonEditor(mode) {
    const section = this._container.querySelector('#json-editor-section');
    if (!section) return;
    section.style.display = mode === 'DeviceSendsJSON' ? 'block' : 'none';
  }

  _bindJsonEditor() {
    const textarea = this._container.querySelector('#json-schema-editor');
    const statusEl = this._container.querySelector('#json-status');
    const applyBtn = this._container.querySelector('#btn-json-apply');
    const loadBtn = this._container.querySelector('#btn-json-load');
    if (!textarea) return;

    textarea.addEventListener('input', () => {
      try {
        JSON.parse(textarea.value);
        if (statusEl) {
          statusEl.textContent = `OK ${t('sidebar.validJson')}`;
          statusEl.className = 'json-editor-status valid';
        }
        if (applyBtn) applyBtn.disabled = false;
      } catch (e) {
        if (statusEl) {
          statusEl.textContent = e.message.slice(0, 40);
          statusEl.className = 'json-editor-status invalid';
        }
        if (applyBtn) applyBtn.disabled = true;
      }
    });

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        try {
          const schema = JSON.parse(textarea.value);
          eventBus.emit('project:applyJSON', schema);
        } catch (e) {
          eventBus.emit('toast', { type: 'error', message: t('messages.invalidJson', { error: e.message }) });
        }
      });
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            textarea.value = ev.target.result;
            textarea.dispatchEvent(new Event('input'));
          };
          reader.readAsText(file);
        });
        input.click();
      });
    }
  }

  _buildMqttConfigPanel(cfg) {
    const path = cfg.path || '/mqtt';
    const host = cfg.host || '';
    const port = Number(cfg.port) || (cfg.useSSL ? 8084 : 8083);
    const preview = host ? `${cfg.useSSL ? 'wss' : 'ws'}://${host}:${port}${path.startsWith('/') ? path : `/${path}`}` : t('sidebar.waitingForHost');

    return `
      <div class="mqtt-config-grid">
        <div class="form-row">
          <div class="form-label">${t('sidebar.mqttVersion')}</div>
          <select class="form-select" id="drv-mqtt-version">
            ${['3.1', '3.1.1', '5.0'].map((v) => `<option ${cfg.version === v ? 'selected' : ''} value="${v}">MQTT ${v}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.mode')}</div>
          <select class="form-select" id="drv-mqtt-mode">
            ${[
              ['PubSub', t('sidebar.subscribePublish')],
              ['SubscribeOnly', t('sidebar.subscribeOnly')],
              ['PublishOnly', t('sidebar.publishOnly')]
            ].map(([value, label]) => `<option ${cfg.mode === value ? 'selected' : ''} value="${value}">${label}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.qos')}</div>
          <select class="form-select" id="drv-mqtt-qos">
            ${[
              [0, t('sidebar.atMostOnce')],
              [1, t('sidebar.atLeastOnce')],
              [2, t('sidebar.exactlyOnce')]
            ].map(([value, label]) => `<option ${Number(cfg.qos) === value ? 'selected' : ''} value="${value}">${label}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.keepAlive')}</div>
          <input class="form-input" id="drv-mqtt-keepalive" type="number" min="5" max="3600" value="${cfg.keepalive ?? 60}">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.host')}</div>
          <input class="form-input" id="drv-mqtt-host" value="${host}" placeholder="broker.example.com">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.port')}</div>
          <input class="form-input" id="drv-mqtt-port" type="number" min="1" max="65535" value="${port}">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.topic')}</div>
          <input class="form-input" id="drv-mqtt-topic" value="${cfg.topic || ''}" placeholder="sensor/data">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.websocketPath')}</div>
          <input class="form-input" id="drv-mqtt-path" value="${path}" placeholder="/mqtt">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.username')}</div>
          <input class="form-input" id="drv-mqtt-user" value="${cfg.username || ''}" placeholder="${t('sidebar.optional')}">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.password')}</div>
          <input class="form-input" id="drv-mqtt-pass" type="password" value="${cfg.password || ''}" placeholder="${t('sidebar.optional')}">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.clientId')}</div>
          <input class="form-input mono" id="drv-mqtt-clientid" value="${cfg.clientId || ''}" placeholder="web-serial-studio-client">
        </div>
        <div class="form-row mqtt-toggles">
          <label class="checkbox-wrap">
            <input type="checkbox" id="drv-mqtt-ssl" ${cfg.useSSL ? 'checked' : ''}>
            <span>${t('sidebar.enableSsl')}</span>
          </label>
          <label class="checkbox-wrap">
            <input type="checkbox" id="drv-mqtt-clean" ${cfg.clean !== false ? 'checked' : ''}>
            <span>${t('sidebar.cleanSession')}</span>
          </label>
          <label class="checkbox-wrap">
            <input type="checkbox" id="drv-mqtt-retain" ${cfg.retain ? 'checked' : ''}>
            <span>${t('sidebar.retainPublish')}</span>
          </label>
        </div>
      </div>
      <div class="mqtt-helper-card">
        <div class="mqtt-helper-title">${t('sidebar.browserEndpoint')}</div>
        <div class="mqtt-helper-url mono">${preview}</div>
        <div class="mqtt-helper-note">${t('sidebar.mqttHelper')}</div>
      </div>`;
  }

  _bindMqttConfigPanel(panel) {
    const update = () => {
      const useSSL = !!panel.querySelector('#drv-mqtt-ssl')?.checked;
      const rawPort = parseInt(panel.querySelector('#drv-mqtt-port')?.value, 10);
      const port = Number.isInteger(rawPort) && rawPort >= 1 && rawPort <= 65535
        ? rawPort
        : (useSSL ? 8084 : 8083);
      const next = {
        version: panel.querySelector('#drv-mqtt-version')?.value || '3.1.1',
        mode: panel.querySelector('#drv-mqtt-mode')?.value || 'PubSub',
        qos: parseInt(panel.querySelector('#drv-mqtt-qos')?.value, 10) || 0,
        keepalive: Math.max(5, parseInt(panel.querySelector('#drv-mqtt-keepalive')?.value, 10) || 60),
        host: panel.querySelector('#drv-mqtt-host')?.value?.trim() || '',
        port,
        topic: panel.querySelector('#drv-mqtt-topic')?.value?.trim() || '',
        path: panel.querySelector('#drv-mqtt-path')?.value?.trim() || '/mqtt',
        username: panel.querySelector('#drv-mqtt-user')?.value || '',
        password: panel.querySelector('#drv-mqtt-pass')?.value || '',
        clientId: panel.querySelector('#drv-mqtt-clientid')?.value?.trim() || '',
        useSSL,
        clean: !!panel.querySelector('#drv-mqtt-clean')?.checked,
        retain: !!panel.querySelector('#drv-mqtt-retain')?.checked
      };

      const effectivePath = next.path.startsWith('/') ? next.path : `/${next.path}`;
      next.path = effectivePath;
      next.brokerUrl = next.host ? `${next.useSSL ? 'wss' : 'ws'}://${next.host}:${next.port}${effectivePath}` : '';
      appState.updateMqttConfig(next);

      const portInput = panel.querySelector('#drv-mqtt-port');
      if (portInput && portInput.value !== String(next.port)) portInput.value = String(next.port);
      const preview = panel.querySelector('.mqtt-helper-url');
      if (preview) preview.textContent = next.brokerUrl || t('sidebar.waitingForHost');
    };

    panel.querySelectorAll('#drv-mqtt-version, #drv-mqtt-mode, #drv-mqtt-qos, #drv-mqtt-keepalive, #drv-mqtt-host, #drv-mqtt-port, #drv-mqtt-topic, #drv-mqtt-path, #drv-mqtt-user, #drv-mqtt-pass, #drv-mqtt-clientid, #drv-mqtt-ssl, #drv-mqtt-clean, #drv-mqtt-retain')
      .forEach((el) => {
        const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(eventName, update);
      });
  }

  _buildUdpConfigPanel(cfg) {
    return `
      <div class="mqtt-config-grid">
        <div class="form-row">
          <div class="form-label">${t('sidebar.bridgeUrl')}</div>
          <input class="form-input" id="drv-udp-bridge" value="${cfg.bridgeUrl || 'ws://localhost:8765'}" placeholder="ws://localhost:8765">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.remoteIp')}</div>
          <input class="form-input" id="drv-udp-remote-host" value="${cfg.remoteHost || ''}" placeholder="192.168.1.252">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.remotePort')}</div>
          <input class="form-input" id="drv-udp-remote-port" type="number" min="1" max="65535" value="${cfg.remotePort || 1030}">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.localIp')}</div>
          <input class="form-input" id="drv-udp-local-host" value="${cfg.localHost || '0.0.0.0'}" placeholder="0.0.0.0">
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.localPort')}</div>
          <input class="form-input" id="drv-udp-local-port" type="number" min="1" max="65535" value="${cfg.localPort || 4000}">
        </div>
      </div>
      <div class="mqtt-helper-card">
        <div class="mqtt-helper-title">${t('sidebar.udpBridge')}</div>
        <div class="mqtt-helper-url mono">python scripts/udp_ws_bridge.py --local-port ${cfg.localPort || 4000} --remote-host ${cfg.remoteHost || '192.168.1.252'} --remote-port ${cfg.remotePort || 1030}</div>
        <div class="mqtt-helper-note">${t('sidebar.udpHelper')}</div>
      </div>`;
  }

  _bindUdpConfigPanel(panel) {
    const update = () => {
      appState.updateUdpConfig({
        bridgeUrl: panel.querySelector('#drv-udp-bridge')?.value?.trim() || 'ws://localhost:8765',
        remoteHost: panel.querySelector('#drv-udp-remote-host')?.value?.trim() || '',
        remotePort: Math.max(1, parseInt(panel.querySelector('#drv-udp-remote-port')?.value, 10) || 1030),
        localHost: panel.querySelector('#drv-udp-local-host')?.value?.trim() || '0.0.0.0',
        localPort: Math.max(1, parseInt(panel.querySelector('#drv-udp-local-port')?.value, 10) || 4000)
      });
    };

    panel.querySelectorAll('#drv-udp-bridge, #drv-udp-remote-host, #drv-udp-remote-port, #drv-udp-local-host, #drv-udp-local-port')
      .forEach((el) => {
        const eventName = el.type === 'number' ? 'change' : 'input';
        el.addEventListener(eventName, update);
      });
  }

  _updateDriverPanel() {
    const panel = this._container.querySelector('#driver-panel');
    if (!panel) return;

    const bus = appState.busType;
    let html = '';

    if (bus === BusType.Serial) {
      const cfg = appState.serialConfig;
      html = `<div class="sidebar-section-label">${t('sidebar.serialConfiguration')}</div><div class="driver-config">
        <div class="form-row">
          <div class="form-label">${t('sidebar.baudRate')}</div>
          <select class="form-select" id="drv-baud">
            ${[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) => `<option ${b === cfg.baudRate ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.dataBits')}</div>
          <select class="form-select" id="drv-databits">
            ${[7, 8].map((b) => `<option ${b === cfg.dataBits ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.stopBits')}</div>
          <select class="form-select" id="drv-stopbits">
            ${[1, 2].map((b) => `<option ${b === cfg.stopBits ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${t('sidebar.parity')}</div>
          <select class="form-select" id="drv-parity">
            ${['none', 'even', 'odd', 'mark', 'space'].map((p) => `<option ${p === cfg.parity ? 'selected' : ''} value="${p}">${p}</option>`).join('')}
          </select>
        </div>
      </div>`;
    } else if (bus === BusType.WebSocket) {
      const cfg = appState.wsConfig;
      html = `<div class="sidebar-section-label">${t('sidebar.websocketConfiguration')}</div><div class="driver-config">
        <div class="form-row">
          <div class="form-label">${t('sidebar.url')}</div>
          <input class="form-input" id="drv-ws-url" value="${cfg.url}" placeholder="ws://localhost:8080">
        </div>
      </div>`;
    } else if (bus === BusType.MQTT) {
      html = `<div class="sidebar-section-label">${t('sidebar.mqttConfiguration')}</div><div class="driver-config">${this._buildMqttConfigPanel(appState.mqttConfig)}</div>`;
    } else if (bus === BusType.UDP) {
      html = `<div class="sidebar-section-label">${t('sidebar.udpConfiguration')}</div><div class="driver-config">${this._buildUdpConfigPanel(appState.udpConfig)}</div>`;
    } else if (bus === BusType.Bluetooth) {
      html = `<div class="sidebar-section-label">${t('sidebar.bluetoothConfiguration')}</div><div class="driver-config">
        <div style="color:var(--text-muted);font-size:var(--font-size-xs);line-height:1.6;">
          ${t('sidebar.bluetoothHint')}
        </div>
      </div>`;
    }

    panel.innerHTML = html;

    if (bus === BusType.Serial) {
      ['baud', 'databits', 'stopbits', 'parity'].forEach((id) => {
        const el = panel.querySelector(`#drv-${id}`);
        if (el) {
          el.addEventListener('change', () => {
            appState.updateSerialConfig({
              baudRate: parseInt(panel.querySelector('#drv-baud')?.value, 10) || 115200,
              dataBits: parseInt(panel.querySelector('#drv-databits')?.value, 10) || 8,
              stopBits: parseInt(panel.querySelector('#drv-stopbits')?.value, 10) || 1,
              parity: panel.querySelector('#drv-parity')?.value || 'none'
            });
          });
        }
      });
    } else if (bus === BusType.WebSocket) {
      panel.querySelector('#drv-ws-url')?.addEventListener('change', (e) => appState.updateWsConfig({ url: e.target.value }));
    } else if (bus === BusType.MQTT) {
      this._bindMqttConfigPanel(panel);
    } else if (bus === BusType.UDP) {
      this._bindUdpConfigPanel(panel);
    }
  }

  _updateStatusDot() {
    const dot = this._container.querySelector('#status-dot');
    const text = this._container.querySelector('#status-text');
    if (!dot || !text) return;
    const state = appState.connectionState;
    dot.className = 'sidebar-status-dot';
    if (state === ConnectionState.Connected) {
      dot.classList.add('connected');
      text.textContent = t('sidebar.connectedVia', { bus: busLabel(appState.busType) });
    } else if (state === ConnectionState.Connecting) {
      dot.classList.add('connecting');
      text.textContent = t('sidebar.connecting');
    } else if (state === ConnectionState.Error) {
      dot.classList.add('error');
      text.textContent = t('sidebar.connectionError');
    } else {
      text.textContent = t('sidebar.disconnected');
    }
  }
}
