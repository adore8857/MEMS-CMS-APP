/**
 * Sidebar - Device setup panel
 */
import { eventBus } from '../core/EventBus.js';
import { appState, OperationMode, BusType, ConnectionState } from '../core/AppState.js';
import { busLabel, t } from '../core/i18n.js?v=interface-cleanup-20260625-1';
import { csvSessionManager } from '../core/CsvSessionManager.js';

export class Sidebar {
  constructor(container) {
    this._container = container;
    this._lastReceivedJSON = '';
    this._gatewayStatus = null;
    this._render();
    this._bindDomEvents();
    this._updateDriverPanel();
    this._updateStatusDot();
    eventBus.on('state:busTypeChanged', () => this._updateDriverPanel());
    eventBus.on('state:connectionStateChanged', () => this._updateStatusDot());
    eventBus.on('state:operationModeChanged', () => this._updateDriverPanel());
    eventBus.on('csv:targetChanged', () => this._updateCsvTargetHint());
    eventBus.on('gateway:status', (status) => {
      if (status?.type === 'gateway.command.result') {
        eventBus.emit('toast', {
          type: status.ok ? 'success' : 'error',
          message: status.ok
            ? (appState.locale === 'zh-CN' ? `命令已发送到 ${status.sourceId || status.host}` : `Command sent to ${status.sourceId || status.host}`)
            : (status.message || (appState.locale === 'zh-CN' ? '命令发送失败' : 'Command failed'))
        });
        return;
      }
      if (status?.type === 'gateway.config' || status?.type === 'gateway.config.saved') return;
      this._gatewayStatus = status;
      this._renderGatewayStatus();
    });
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
    const subscriptionLines = Array.isArray(cfg.subscriptions)
      ? cfg.subscriptions.map((subscription) => {
        if (typeof subscription === 'string') return subscription;
        const topic = subscription.topic || subscription.mqttTopic || '';
        const sourceId = subscription.sourceId ?? subscription.source ?? '';
        return sourceId ? `${topic} | ${sourceId}` : topic;
      }).filter(Boolean).join('\n')
      : '';

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
        <div class="form-row" style="grid-column:1 / -1">
          <div class="form-label">${appState.locale === 'zh-CN' ? '订阅主题列表' : 'Subscriptions'}</div>
          <textarea class="form-input mono" id="drv-mqtt-subscriptions" rows="4" placeholder="bearing/v2/data | bearing-v2&#10;gearbox/data | gearbox">${subscriptionLines}</textarea>
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
        <div class="mqtt-helper-note">${t('sidebar.mqttHelper')} ${appState.locale === 'zh-CN' ? '多主题格式：每行 topic 或 topic | sourceId。sourceId 用于绑定项目 sources 中的解析器。' : 'Multi-topic format: one topic per line, or topic | sourceId.'}</div>
      </div>`;
  }

  _parseMqttSubscriptionLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [topicPart, sourcePart] = line.split('|').map((part) => part.trim());
        return sourcePart ? { topic: topicPart, sourceId: sourcePart } : { topic: topicPart };
      })
      .filter((subscription) => subscription.topic);
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
        subscriptions: this._parseMqttSubscriptionLines(panel.querySelector('#drv-mqtt-subscriptions')?.value || ''),
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

    panel.querySelectorAll('#drv-mqtt-version, #drv-mqtt-mode, #drv-mqtt-qos, #drv-mqtt-keepalive, #drv-mqtt-host, #drv-mqtt-port, #drv-mqtt-topic, #drv-mqtt-subscriptions, #drv-mqtt-path, #drv-mqtt-user, #drv-mqtt-pass, #drv-mqtt-clientid, #drv-mqtt-ssl, #drv-mqtt-clean, #drv-mqtt-retain')
      .forEach((el) => {
        const eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
        el.addEventListener(eventName, update);
      });
  }

  _buildUdpConfigPanel(cfg) {
    const isGateway = cfg.mode === 'gateway';
    const commandTargets = Array.isArray(this._gatewayStatus?.devices) ? this._gatewayStatus.devices : [];
    const modeLabel = appState.locale === 'zh-CN' ? '接入模式' : 'Access Mode';
    const legacyLabel = appState.locale === 'zh-CN' ? '兼容 UDP 桥接' : 'Legacy UDP Bridge';
    const gatewayLabel = appState.locale === 'zh-CN' ? '多 UDP 网关' : 'Multi-UDP Gateway';
    const urlLabel = isGateway
      ? (appState.locale === 'zh-CN' ? '网关 WebSocket 地址' : 'Gateway WebSocket URL')
      : t('sidebar.bridgeUrl');
    return `
      <div class="mqtt-config-grid">
        <div class="form-row" style="grid-column:1 / -1">
          <div class="form-label">${modeLabel}</div>
          <select class="form-select" id="drv-udp-mode">
            <option value="legacy" ${!isGateway ? 'selected' : ''}>${legacyLabel}</option>
            <option value="gateway" ${isGateway ? 'selected' : ''}>${gatewayLabel}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-label">${urlLabel}</div>
          <input class="form-input" id="drv-udp-bridge" value="${cfg.bridgeUrl || 'ws://localhost:8765'}" placeholder="ws://localhost:8765">
        </div>
        ${isGateway ? `<div class="form-row">
          <div class="form-label">${appState.locale === 'zh-CN' ? '网页命令目标' : 'Web Command Target'}</div>
          <select class="form-select" id="drv-udp-command-source">
            <option value="">${appState.locale === 'zh-CN' ? '使用网关默认路由' : 'Use gateway default route'}</option>
            ${commandTargets.map((device) => `<option value="${this._escapeHtml(device.sourceId)}" ${String(cfg.commandSourceId || '') === String(device.sourceId) ? 'selected' : ''}>${this._escapeHtml(device.title || device.sourceId)} · ${this._escapeHtml(device.sourceId)}</option>`).join('')}
          </select>
        </div>` : ''}
        ${isGateway ? '' : `
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
        `}
      </div>
      <div class="mqtt-helper-card">
        <div class="mqtt-helper-title">${isGateway ? gatewayLabel : t('sidebar.udpBridge')}</div>
        <div class="mqtt-helper-url mono">${isGateway
          ? 'python scripts/multi_udp_gateway.py --config scripts/multi_udp_gateway.json'
          : `python scripts/udp_ws_bridge.py --local-port ${cfg.localPort || 4000} --remote-host ${cfg.remoteHost || '192.168.1.252'} --remote-port ${cfg.remotePort || 1030}`}</div>
        <div class="mqtt-helper-note">${isGateway
          ? (appState.locale === 'zh-CN' ? '设备编号、序号提取和监听端口由 JSON 配置文件管理。修改配置后请重启网关。' : 'Device IDs, sequence extraction and listen ports are managed by JSON. Restart the gateway after editing it.')
          : t('sidebar.udpHelper')}</div>
      </div>
      ${isGateway ? '<div class="gateway-status-card" id="gateway-status-card"></div>' : ''}`;
  }

  _bindUdpConfigPanel(panel) {
    const update = () => {
      appState.updateUdpConfig({
        mode: panel.querySelector('#drv-udp-mode')?.value || 'legacy',
        commandSourceId: panel.querySelector('#drv-udp-command-source')?.value || appState.udpConfig.commandSourceId || '',
        bridgeUrl: panel.querySelector('#drv-udp-bridge')?.value?.trim() || 'ws://localhost:8765',
        remoteHost: panel.querySelector('#drv-udp-remote-host')?.value?.trim() || appState.udpConfig.remoteHost || '',
        remotePort: Math.max(1, parseInt(panel.querySelector('#drv-udp-remote-port')?.value, 10) || appState.udpConfig.remotePort || 1030),
        localHost: panel.querySelector('#drv-udp-local-host')?.value?.trim() || appState.udpConfig.localHost || '0.0.0.0',
        localPort: Math.max(1, parseInt(panel.querySelector('#drv-udp-local-port')?.value, 10) || appState.udpConfig.localPort || 4000)
      });
    };

    panel.querySelector('#drv-udp-mode')?.addEventListener('change', (event) => {
      appState.updateUdpConfig({ mode: event.target.value });
      this._updateDriverPanel();
    });
    panel.querySelector('#drv-udp-command-source')?.addEventListener('change', (event) => {
      appState.updateUdpConfig({ commandSourceId: event.target.value || '' });
    });
    panel.querySelectorAll('#drv-udp-bridge, #drv-udp-remote-host, #drv-udp-remote-port, #drv-udp-local-host, #drv-udp-local-port')
      .forEach((el) => {
        const eventName = el.type === 'number' ? 'change' : 'input';
        el.addEventListener(eventName, update);
      });
    this._renderGatewayStatus();
  }

  _escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  _formatGatewayBytes(value) {
    const bytes = Number(value) || 0;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  _renderGatewayStatus() {
    const card = this._container.querySelector('#gateway-status-card');
    if (!card) return;
    const zh = appState.locale === 'zh-CN';
    const status = this._gatewayStatus;
    this._updateGatewayCommandTargets();
    if (!status || status.type === 'gateway.disconnected') {
      card.innerHTML = `<div class="gateway-status-heading"><span class="gateway-health-dot"></span>${zh ? '网关未连接' : 'Gateway disconnected'}</div>
        <div class="gateway-status-empty">${zh ? '启动网关并点击工具栏连接按钮后显示设备状态。' : 'Start the gateway and connect to view device status.'}</div>`;
      return;
    }
    if (status.type === 'gateway.hello') {
      card.innerHTML = `<div class="gateway-status-heading"><span class="gateway-health-dot online"></span><span>${this._escapeHtml(status.gateway || (zh ? '网关已连接' : 'Gateway connected'))}</span><button class="btn gateway-config-button" data-gateway-config>${zh ? '配置' : 'Configure'}</button></div>
        <div class="gateway-status-empty">${zh ? '正在等待状态数据…' : 'Waiting for status data…'}</div>`;
      this._bindGatewayStatusActions(card);
      return;
    }
    if (status.type === 'gateway.error') {
      card.innerHTML = `<div class="gateway-status-heading"><span class="gateway-health-dot error"></span>${zh ? '网关错误' : 'Gateway error'}</div>
        <div class="gateway-status-empty">${this._escapeHtml(status.message || '')}</div>`;
      return;
    }

    const devices = Array.isArray(status.devices) ? status.devices : [];
    const deviceRows = devices.length
      ? devices.map((device) => `
        <div class="gateway-device-row">
          <span class="gateway-health-dot ${device.online ? 'online' : ''}"></span>
          <div class="gateway-device-main">
            <div class="gateway-device-name">${this._escapeHtml(device.title || device.sourceId)}</div>
            <div class="gateway-device-endpoint mono">${this._escapeHtml(device.sourceId)} · ${this._escapeHtml(device.ip)}:${Number(device.port) || 0}</div>
            <div class="gateway-device-endpoint mono">frame #${Number(device.lastFrameNumber) || 0} · ${zh ? '设备序号' : 'device seq'} ${device.lastSequence ?? '-'}</div>
            <div class="gateway-device-endpoint mono">${zh ? 'UDP包' : 'UDP packets'} ${Number(device.packets) || 0} · ${zh ? '完整帧' : 'frames'} ${Number(device.frames) || 0}</div>
            <div class="gateway-device-endpoint mono">${zh ? '残帧' : 'incomplete'} ${Number(device.incompleteFrames) || 0} · ${zh ? '无效帧' : 'invalid'} ${Number(device.invalidFrames) || 0} · ${zh ? '缓存' : 'buffer'} ${Number(device.bufferedBytes) || 0} B</div>
          </div>
          <div class="gateway-device-count mono">${Number(device.frames) || 0}</div>
        </div>`).join('')
      : `<div class="gateway-status-empty">${zh ? '等待 UDP 设备数据…' : 'Waiting for UDP device data…'}</div>`;

    card.innerHTML = `
      <div class="gateway-status-heading">
        <span class="gateway-health-dot online"></span>
        <span>${this._escapeHtml(status.gateway || (zh ? '多 UDP 网关' : 'Multi-UDP Gateway'))}</span>
        <button class="btn gateway-config-button" data-gateway-config>${zh ? '配置' : 'Configure'}</button>
      </div>
      <div class="gateway-stat-grid">
        <div><strong>${Number(status.onlineDevices) || 0}/${Number(status.knownDevices) || 0}</strong><span>${zh ? '在线设备' : 'Online'}</span></div>
        <div><strong>${Number(status.frames) || 0}/${Number(status.packets) || 0}</strong><span>${zh ? '完整帧 / UDP包' : 'Frames / UDP packets'}</span></div>
        <div><strong>${this._formatGatewayBytes(status.bytes)}</strong><span>${zh ? '接收数据' : 'Received'}</span></div>
        <div><strong>${Number(status.dropped) || 0}/${Number(status.lost) || 0}</strong><span>${zh ? '丢弃 / 丢包' : 'Dropped / Lost'}</span></div>
      </div>
      <div class="gateway-device-list">${deviceRows}</div>`;
    this._bindGatewayStatusActions(card);
  }

  _updateGatewayCommandTargets() {
    const select = this._container.querySelector('#drv-udp-command-source');
    if (!select || !Array.isArray(this._gatewayStatus?.devices)) return;
    const selected = appState.udpConfig.commandSourceId || '';
    const zh = appState.locale === 'zh-CN';
    select.innerHTML = `<option value="">${zh ? '使用网关默认路由' : 'Use gateway default route'}</option>${this._gatewayStatus.devices.map((device) => `<option value="${this._escapeHtml(device.sourceId)}" ${String(selected) === String(device.sourceId) ? 'selected' : ''}>${this._escapeHtml(device.title || device.sourceId)} · ${this._escapeHtml(device.sourceId)}</option>`).join('')}`;
  }

  _bindGatewayStatusActions(card) {
    card.querySelector('[data-gateway-config]')?.addEventListener('click', () => {
      eventBus.emit('ui:openGatewayConfig');
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
