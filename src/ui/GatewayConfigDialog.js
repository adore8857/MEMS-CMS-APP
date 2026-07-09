/** GatewayConfigDialog - live configuration editor for the multi-UDP gateway. */
import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';

export class GatewayConfigDialog {
  constructor(modalRoot) {
    this._root = modalRoot;
    this._el = null;
    this._config = null;
    eventBus.on('ui:openGatewayConfig', () => this.open());
    eventBus.on('gateway:status', (message) => this._handleGatewayMessage(message));
  }

  _text(zh, en) {
    return appState.locale === 'zh-CN' ? zh : en;
  }

  _escape(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  open() {
    if (this._el) this.close();
    this._el = document.createElement('div');
    this._el.className = 'modal-overlay animate-fadeIn';
    this._el.innerHTML = `
      <div class="modal gateway-config-modal">
        <div class="modal-header">
          <div class="modal-title">${this._text('多 UDP 网关配置', 'Multi-UDP Gateway Configuration')}</div>
          <button class="btn btn-icon" id="gateway-config-close" aria-label="Close">X</button>
        </div>
        <div class="modal-body" id="gateway-config-body">
          <div class="gateway-config-loading">${this._text('正在读取网关配置…', 'Loading gateway configuration…')}</div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="gateway-config-cancel">${this._text('取消', 'Cancel')}</button>
          <button class="btn btn-primary" id="gateway-config-save" disabled>${this._text('保存配置', 'Save Configuration')}</button>
        </div>
      </div>`;
    this._root.appendChild(this._el);
    this._el.addEventListener('click', (event) => { if (event.target === this._el) this.close(); });
    this._el.querySelector('#gateway-config-close')?.addEventListener('click', () => this.close());
    this._el.querySelector('#gateway-config-cancel')?.addEventListener('click', () => this.close());
    this._el.querySelector('#gateway-config-save')?.addEventListener('click', () => this._save());
    eventBus.emit('gateway:command', { type: 'gateway.config.request' });
  }

  _handleGatewayMessage(message) {
    if (!this._el || !message) return;
    if (message.type === 'gateway.config' || message.type === 'gateway.config.saved') {
      this._config = message.config || {};
      this._renderForm(message.restartRequired === true);
      if (message.type === 'gateway.config.saved') {
        eventBus.emit('toast', {
          type: 'success',
          message: message.restartRequired
            ? this._text('配置已保存；监听地址或端口变化将在重启网关后生效。', 'Configuration saved; restart the gateway to apply endpoint changes.')
            : this._text('网关配置已保存并生效。', 'Gateway configuration saved and applied.')
        });
      }
    } else if (message.type === 'gateway.error') {
      const body = this._el.querySelector('#gateway-config-body');
      if (body) body.innerHTML = `<div class="gateway-config-alert error">${this._escape(message.message || this._text('网关配置失败', 'Gateway configuration failed'))}</div>`;
    } else if (message.type === 'gateway.disconnected') {
      this.close();
    }
  }

  _renderForm(restartRequired = false) {
    if (!this._el) return;
    const cfg = this._config || {};
    const udp = cfg.udp || {};
    const ws = cfg.websocket || {};
    const routing = cfg.routing || {};
    const sequence = routing.sequence || {};
    const frameNumbering = routing.frameNumbering || { enabled: true, start: 1 };
    const aggregation = cfg.aggregation || {};
    const frameAggregation = aggregation.frame || {};
    const status = cfg.status || {};
    const outbound = cfg.outbound || {};
    const control = cfg.control || {};
    const devices = Array.isArray(routing.devices) ? routing.devices : [];
    const body = this._el.querySelector('#gateway-config-body');
    body.innerHTML = `
      ${restartRequired ? `<div class="gateway-config-alert">${this._text('监听地址或端口已改变，请保存工作后重启网关。', 'Listen endpoints changed. Restart the gateway when convenient.')}</div>` : ''}
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._text('基本参数', 'Basic Parameters')}</div>
        <div class="editor-form-grid gateway-config-grid">
          ${this._field('gateway-name', this._text('网关名称', 'Gateway Name'), cfg.name || 'MEMS-CMS Multi UDP Gateway')}
          ${this._field('gateway-udp-host', this._text('UDP 监听地址', 'UDP Listen Host'), udp.host || '0.0.0.0')}
          ${this._field('gateway-udp-port', this._text('UDP 监听端口', 'UDP Listen Port'), udp.port || 4000, 'number', '1', '65535')}
          ${this._field('gateway-ws-host', this._text('WebSocket 监听地址', 'WebSocket Listen Host'), ws.host || '127.0.0.1')}
          ${this._field('gateway-ws-port', this._text('WebSocket 端口', 'WebSocket Port'), ws.port || 8765, 'number', '1', '65535')}
          <div class="form-row">
            <div class="form-label">${this._text('未知设备处理', 'Unknown Device Policy')}</div>
            <select class="form-select" id="gateway-unknown-policy">
              <option value="ip" ${routing.unknownDevices !== 'drop' && routing.unknownDevices !== 'ip-port' ? 'selected' : ''}>${this._text('按 IP 自动注册（推荐）', 'Auto-register by IP (Recommended)')}</option>
              <option value="ip-port" ${routing.unknownDevices === 'ip-port' ? 'selected' : ''}>${this._text('按 IP + 端口自动注册', 'Auto-register by IP + Port')}</option>
              <option value="drop" ${routing.unknownDevices === 'drop' ? 'selected' : ''}>${this._text('丢弃未知设备', 'Drop unknown devices')}</option>
            </select>
          </div>
          ${this._field('gateway-status-interval', this._text('状态刷新间隔（ms）', 'Status Interval (ms)'), status.intervalMs || 1000, 'number', '200')}
          ${this._field('gateway-offline-timeout', this._text('离线判定时间（ms）', 'Offline Timeout (ms)'), status.offlineAfterMs || 5000, 'number', '1000')}
        </div>
      </div>

      <div class="editor-form-section gateway-config-section">
        <div class="editor-form-section-title">${this._text('网关帧编号', 'Gateway Frame Numbering')}</div>
        <label class="checkbox-wrap gateway-config-checkbox">
          <input type="checkbox" id="gateway-numbering-enabled" ${frameNumbering.enabled !== false ? 'checked' : ''}>
          <span>${this._text('为每个 sourceId 独立添加连续 frameNumber', 'Add an independent continuous frameNumber for each sourceId')}</span>
        </label>
        <div class="editor-form-grid gateway-config-grid">
          ${this._field('gateway-numbering-start', this._text('起始编号', 'Starting Number'), frameNumbering.start ?? 1, 'number', '0')}
        </div>
        <div class="gateway-config-hint">${this._text('网关编号用于网页追踪帧；检测网络丢包仍需启用下方的设备序号识别。', 'Gateway numbers track frames in the browser. Detecting network loss still requires the device sequence field below.')}</div>
      </div>

      <div class="editor-form-section gateway-config-section">
        <div class="editor-form-section-title">${this._text('UDP 帧重组', 'UDP Frame Reassembly')}</div>
        <div class="editor-form-grid gateway-config-grid">
          <div class="form-row">
            <div class="form-label">${this._text('处理模式', 'Processing Mode')}</div>
            <select class="form-select" id="gateway-aggregation-mode">
              <option value="frame" ${aggregation.mode === 'frame' ? 'selected' : ''}>${this._text('按设备重组完整帧', 'Reassemble complete frames')}</option>
              <option value="realtime" ${aggregation.mode !== 'frame' ? 'selected' : ''}>${this._text('UDP 数据报实时透传', 'Forward UDP datagrams')}</option>
            </select>
          </div>
          ${this._field('gateway-frame-start', this._text('帧头（十六进制）', 'Start Delimiter (Hex)'), frameAggregation.startDelimiter || '5A A5')}
          ${this._field('gateway-frame-end', this._text('帧尾（十六进制）', 'End Delimiter (Hex)'), frameAggregation.endDelimiter || 'DD EE')}
          ${this._field('gateway-frame-length', this._text('完整帧长度（含帧头帧尾）', 'Total Frame Length'), frameAggregation.frameLength ?? 5732, 'number', '0')}
          ${this._field('gateway-frame-timeout', this._text('残帧空闲超时（ms）', 'Incomplete Frame Idle Timeout (ms)'), frameAggregation.timeoutMs ?? 2000, 'number', '100')}
          ${this._field('gateway-frame-max-buffer', this._text('每设备最大缓存（byte）', 'Max Buffer per Device (bytes)'), frameAggregation.maxBufferBytes ?? 65536, 'number', '1024')}
        </div>
        <div class="gateway-config-hint">${this._text('每个 sourceId 独立缓存；只有通过帧头、帧尾和长度校验的完整帧才会编号并发送到网页。', 'Each sourceId has an independent buffer. Only complete frames passing delimiter and length validation are numbered and forwarded.')}</div>
      </div>

      <div class="editor-form-section gateway-config-section">
        <div class="editor-form-section-title">${this._text('序号识别', 'Sequence Detection')}</div>
        <label class="checkbox-wrap gateway-config-checkbox">
          <input type="checkbox" id="gateway-sequence-enabled" ${sequence.enabled ? 'checked' : ''}>
          <span>${this._text('从 UDP 负载提取设备序号，用于统计丢包和乱序', 'Extract device sequence from UDP payload')}</span>
        </label>
        <div class="editor-form-grid gateway-config-grid">
          ${this._field('gateway-sequence-offset', this._text('字节偏移', 'Byte Offset'), sequence.offset ?? 0, 'number', '0')}
          <div class="form-row">
            <div class="form-label">${this._text('序号长度', 'Sequence Size')}</div>
            <select class="form-select" id="gateway-sequence-size">
              ${[1, 2, 4, 8].map((size) => `<option value="${size}" ${Number(sequence.size || 4) === size ? 'selected' : ''}>${size} byte</option>`).join('')}
            </select>
          </div>
          <div class="form-row">
            <div class="form-label">${this._text('字节序', 'Byte Order')}</div>
            <select class="form-select" id="gateway-sequence-order">
              <option value="little" ${sequence.byteOrder !== 'big' ? 'selected' : ''}>Little Endian</option>
              <option value="big" ${sequence.byteOrder === 'big' ? 'selected' : ''}>Big Endian</option>
            </select>
          </div>
        </div>
      </div>

      <div class="editor-form-section gateway-config-section">
        <div class="editor-form-section-title">${this._text('固定设备映射（可选）', 'Fixed Device Mapping (Optional)')}</div>
        <div class="gateway-config-hint">${this._text('留空数组即可自适应接入。固定映射可为指定 IP 设置易读的 sourceId 和名称。', 'Keep an empty array for adaptive discovery. Fixed mappings assign readable source IDs to selected IPs.')}</div>
        <div class="gateway-device-config-list" id="gateway-device-config-list">
          ${devices.map((device) => this._deviceConfigRow(device)).join('')}
        </div>
        <button class="btn gateway-add-device" id="gateway-add-device" type="button">+ ${this._text('添加固定设备', 'Add Fixed Device')}</button>
      </div>

      <div class="editor-form-section gateway-config-section">
        <div class="editor-form-section-title">${this._text('下行与安全', 'Outbound and Security')}</div>
        <div class="editor-form-grid gateway-config-grid">
          ${this._field('gateway-default-source', this._text('网页命令默认 sourceId', 'Default Command sourceId'), outbound.defaultSourceId || '')}
          ${this._field('gateway-outbound-host', this._text('默认下行目标 IP（可选）', 'Default Outbound Host (Optional)'), outbound.host || '')}
          ${this._field('gateway-outbound-port', this._text('默认下行端口', 'Default Outbound Port'), outbound.port || 0, 'number', '0', '65535')}
        </div>
        <label class="checkbox-wrap gateway-config-checkbox">
          <input type="checkbox" id="gateway-control-remote" ${control.allowRemote ? 'checked' : ''}>
          <span>${this._text('允许其他电脑通过 WebSocket 修改网关配置', 'Allow remote computers to modify gateway configuration')}</span>
        </label>
      </div>`;
    body.querySelector('#gateway-add-device')?.addEventListener('click', () => this._addDeviceConfigRow());
    body.querySelectorAll('[data-remove-device]').forEach((button) => {
      button.addEventListener('click', () => button.closest('.gateway-device-config-row')?.remove());
    });
    this._el.querySelector('#gateway-config-save').disabled = false;
  }

  _deviceConfigRow(device = {}) {
    return `<div class="gateway-device-config-row">
      <div class="gateway-device-config-fields">
        ${this._deviceField('ip', this._text('设备 IP', 'Device IP'), device.ip || '', '192.168.1.11')}
        ${this._deviceField('sourceId', 'sourceId', device.sourceId || device.deviceId || '', 'bearing-01')}
        ${this._deviceField('title', this._text('显示名称', 'Display Name'), device.title || '', this._text('轴承 01', 'Bearing 01'))}
        ${this._deviceField('port', this._text('来源端口（可选）', 'Source Port (Optional)'), device.port || '', '4000', 'number')}
        ${this._deviceField('commandPort', this._text('命令端口', 'Command Port'), device.commandPort || device.port || '', '4000', 'number')}
      </div>
      <button class="btn btn-icon gateway-remove-device" type="button" data-remove-device title="${this._text('删除设备', 'Remove device')}">X</button>
    </div>`;
  }

  _deviceField(name, label, value, placeholder, type = 'text') {
    return `<label class="form-row"><span class="form-label">${label}</span><input class="form-input" type="${type}" data-device-field="${name}" value="${this._escape(value)}" placeholder="${this._escape(placeholder)}" ${type === 'number' ? 'min="1" max="65535"' : ''}></label>`;
  }

  _addDeviceConfigRow() {
    const list = this._el?.querySelector('#gateway-device-config-list');
    if (!list) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this._deviceConfigRow();
    const row = wrapper.firstElementChild;
    row.querySelector('[data-remove-device]')?.addEventListener('click', () => row.remove());
    list.appendChild(row);
  }

  _collectDevices() {
    const devices = Array.from(this._el.querySelectorAll('.gateway-device-config-row')).map((row) => {
      const value = (name) => row.querySelector(`[data-device-field="${name}"]`)?.value?.trim() || '';
      const port = Number(value('port')) || undefined;
      const commandPort = Number(value('commandPort')) || undefined;
      return {
        ip: value('ip'),
        sourceId: value('sourceId'),
        title: value('title') || value('sourceId'),
        ...(port ? { port } : {}),
        ...(commandPort ? { commandPort } : {})
      };
    });
    if (devices.some((device) => !device.ip || !device.sourceId)) {
      throw new Error(this._text('每个固定设备都必须填写设备 IP 和 sourceId', 'Every fixed device requires an IP and sourceId'));
    }
    if (new Set(devices.map((device) => device.sourceId)).size !== devices.length) {
      throw new Error(this._text('固定设备的 sourceId 不能重复', 'Fixed device sourceId values must be unique'));
    }
    return devices;
  }

  _field(id, label, value, type = 'text', min = '', max = '') {
    return `<div class="form-row"><div class="form-label">${label}</div>
      <input class="form-input" id="${id}" type="${type}" value="${this._escape(value)}" ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''}></div>`;
  }

  _number(id, fallback) {
    const value = Number(this._el.querySelector(`#${id}`)?.value);
    return Number.isFinite(value) ? value : fallback;
  }

  _save() {
    try {
      const devices = this._collectDevices();
      const previous = this._config || {};
      const config = {
        ...previous,
        name: this._el.querySelector('#gateway-name')?.value?.trim() || 'MEMS-CMS Multi UDP Gateway',
        udp: {
          host: this._el.querySelector('#gateway-udp-host')?.value?.trim() || '0.0.0.0',
          port: this._number('gateway-udp-port', 4000)
        },
        websocket: {
          host: this._el.querySelector('#gateway-ws-host')?.value?.trim() || '127.0.0.1',
          port: this._number('gateway-ws-port', 8765)
        },
        routing: {
          ...(previous.routing || {}),
          unknownDevices: this._el.querySelector('#gateway-unknown-policy')?.value || 'ip',
          sequence: {
            enabled: !!this._el.querySelector('#gateway-sequence-enabled')?.checked,
            offset: this._number('gateway-sequence-offset', 0),
            size: this._number('gateway-sequence-size', 4),
            byteOrder: this._el.querySelector('#gateway-sequence-order')?.value || 'little'
          },
          frameNumbering: {
            enabled: !!this._el.querySelector('#gateway-numbering-enabled')?.checked,
            start: this._number('gateway-numbering-start', 1)
          },
          devices
        },
        aggregation: {
          mode: this._el.querySelector('#gateway-aggregation-mode')?.value || 'realtime',
          frame: {
            startDelimiter: this._el.querySelector('#gateway-frame-start')?.value?.trim() || '5A A5',
            endDelimiter: this._el.querySelector('#gateway-frame-end')?.value?.trim() || 'DD EE',
            frameLength: this._number('gateway-frame-length', 5732),
            timeoutMs: this._number('gateway-frame-timeout', 2000),
            maxBufferBytes: this._number('gateway-frame-max-buffer', 65536)
          }
        },
        status: {
          intervalMs: this._number('gateway-status-interval', 1000),
          offlineAfterMs: this._number('gateway-offline-timeout', 5000)
        },
        outbound: {
          defaultSourceId: this._el.querySelector('#gateway-default-source')?.value?.trim() || '',
          host: this._el.querySelector('#gateway-outbound-host')?.value?.trim() || '',
          port: this._number('gateway-outbound-port', 0)
        },
        control: {
          allowRemote: !!this._el.querySelector('#gateway-control-remote')?.checked
        }
      };
      this._el.querySelector('#gateway-config-save').disabled = true;
      eventBus.emit('gateway:command', { type: 'gateway.config.update', config });
    } catch (error) {
      eventBus.emit('toast', { type: 'error', message: error.message || String(error) });
    }
  }

  close() {
    this._el?.remove();
    this._el = null;
    this._config = null;
  }
}
