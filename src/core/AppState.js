/**
 * AppState — Singleton application state management
 */
import { eventBus } from './EventBus.js';

export const OperationMode = {
  ProjectFile: 'ProjectFile',
  DeviceSendsJSON: 'DeviceSendsJSON',
  QuickPlot: 'QuickPlot',
  STM32Binary: 'STM32Binary'
};

export const BusType = {
  Serial: 'Serial',
  WebSocket: 'WebSocket',
  MQTT: 'MQTT',
  UDP: 'UDP'
};

const SUPPORTED_BUS_TYPES = new Set(Object.values(BusType));

export const ConnectionState = {
  Disconnected: 'Disconnected',
  Connecting: 'Connecting',
  Connected: 'Connected',
  Error: 'Error'
};

function createDefaultMqttConfig() {
  return {
    version: '3.1.1',
    mode: 'PubSub',
    keepalive: 60,
    host: 'broker.emqx.io',
    port: 8084,
    path: '/mqtt',
    topic: 'sensor/data',
    subscriptions: [],
    retain: false,
    clean: true,
    username: '',
    password: '',
    qos: 0,
    clientId: 'web-serial-studio-' + Math.random().toString(36).substr(2, 8),
    useSSL: true,
    brokerUrl: 'wss://broker.emqx.io:8084/mqtt'
  };
}

function createDefaultUdpConfig() {
  return {
    mode: 'legacy',
    commandSourceId: '',
    bridgeUrl: 'ws://localhost:8765',
    remoteHost: '192.168.1.252',
    remotePort: 1030,
    localHost: '0.0.0.0',
    localPort: 4000
  };
}

class AppState {
  constructor() {
    this._operationMode = OperationMode.QuickPlot;
    this._busType = BusType.Serial;
    this._connectionState = ConnectionState.Disconnected;
    this._locale = 'zh-CN';
    this._theme = 'dark';
    this._project = null;
    this._projectFileName = '';
    this._csvExportEnabled = true;
    this._consoleExportEnabled = false;
    this._sidebarVisible = true;
    this._currentWorkspace = 'dashboard';
    this._points = 5000;
    this._frameCount = 0;
    this._dataRate = 0;

    // Serial config
    this._serialConfig = {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      flowControl: 'none'
    };

    // WebSocket config
    this._wsConfig = {
      url: 'wss://localhost:8080',
      protocol: ''
    };

    // MQTT config
    this._mqttConfig = createDefaultMqttConfig();

    // UDP config. Browsers cannot open raw UDP sockets, so UDP traffic is
    // bridged through a local WebSocket helper.
    this._udpConfig = createDefaultUdpConfig();

    // Frame config
    this._frameConfig = {
      separator: ',',
      startDelimiter: '',
      endDelimiter: '\\n',
      frameDetection: 'EndDelimiterOnly',
      hexadecimalDelimiters: false
    };

    this._loadSettings();
  }

  // ── Getters ──
  get operationMode() { return this._operationMode; }
  get busType() { return this._busType; }
  get connectionState() { return this._connectionState; }
  get isConnected() { return this._connectionState === ConnectionState.Connected; }
  get locale() { return this._locale; }
  get theme() { return this._theme; }
  get project() { return this._project; }
  get projectFileName() { return this._projectFileName; }
  get csvExportEnabled() { return this._csvExportEnabled; }
  get consoleExportEnabled() { return this._consoleExportEnabled; }
  get sidebarVisible() { return this._sidebarVisible; }
  get currentWorkspace() { return this._currentWorkspace; }
  get points() { return this._points; }
  get serialConfig() { return { ...this._serialConfig }; }
  get wsConfig() { return { ...this._wsConfig }; }
  get mqttConfig() { return { ...this._mqttConfig }; }
  get udpConfig() { return { ...this._udpConfig }; }
  get frameConfig() { return { ...this._frameConfig }; }
  get frameCount() { return this._frameCount; }
  get dataRate() { return this._dataRate; }

  // ── Setters ──
  set operationMode(v) {
    if (this._operationMode === v) return;
    this._operationMode = v;
    eventBus.emit('state:operationModeChanged', v);
    this._saveSettings();
  }
  set busType(v) {
    if (!SUPPORTED_BUS_TYPES.has(v)) v = BusType.Serial;
    if (this._busType === v) return;
    this._busType = v;
    eventBus.emit('state:busTypeChanged', v);
    this._saveSettings();
  }
  set connectionState(v) {
    if (this._connectionState === v) return;
    this._connectionState = v;
    eventBus.emit('state:connectionStateChanged', v);
  }
  set locale(v) {
    if (!v || this._locale === v) return;
    this._locale = v;
    eventBus.emit('state:localeChanged', v);
    this._saveSettings();
  }
  set theme(v) {
    if (!v || this._theme === v) return;
    this._theme = v;
    eventBus.emit('state:themeChanged', v);
    this._saveSettings();
  }
  set project(v) {
    this._project = v;
    eventBus.emit('state:projectChanged', v);
  }
  set projectFileName(v) {
    this._projectFileName = v;
    eventBus.emit('state:projectFileNameChanged', v);
  }
  set csvExportEnabled(v) {
    this._csvExportEnabled = v;
    eventBus.emit('state:csvExportChanged', v);
    this._saveSettings();
  }
  set consoleExportEnabled(v) {
    this._consoleExportEnabled = v;
    this._saveSettings();
  }
  set sidebarVisible(v) {
    this._sidebarVisible = v;
    eventBus.emit('state:sidebarVisibleChanged', v);
  }
  set currentWorkspace(v) {
    if (this._currentWorkspace === v) return;
    this._currentWorkspace = v;
    eventBus.emit('state:workspaceChanged', v);
  }
  set points(v) {
    this._points = Math.max(10, Math.min(50000, v));
    eventBus.emit('state:pointsChanged', this._points);
    this._saveSettings();
  }
  set frameCount(v) { this._frameCount = v; }
  set dataRate(v) { this._dataRate = v; }

  updateSerialConfig(cfg) {
    Object.assign(this._serialConfig, cfg);
    eventBus.emit('state:serialConfigChanged', this._serialConfig);
    this._saveSettings();
  }
  updateWsConfig(cfg) {
    Object.assign(this._wsConfig, cfg);
    this._saveSettings();
  }
  updateMqttConfig(cfg) {
    Object.assign(this._mqttConfig, cfg);
    this._saveSettings();
  }
  updateUdpConfig(cfg) {
    Object.assign(this._udpConfig, cfg);
    eventBus.emit('state:udpConfigChanged', this.udpConfig);
    this._saveSettings();
  }
  updateFrameConfig(cfg) {
    Object.assign(this._frameConfig, cfg);
    eventBus.emit('state:frameConfigChanged', this._frameConfig);
    this._saveSettings();
  }

  _saveSettings() {
    try {
      const s = {
        operationMode: this._operationMode,
        busType: this._busType,
        locale: this._locale,
        theme: this._theme,
        csvExportEnabled: this._csvExportEnabled,
        points: this._points,
        serialConfig: this._serialConfig,
        wsConfig: this._wsConfig,
        mqttConfig: this._mqttConfig,
        udpConfig: this._udpConfig,
        frameConfig: this._frameConfig
      };
      localStorage.setItem('webSerialStudio_settings', JSON.stringify(s));
    } catch (e) { /* ignore */ }
  }

  _loadSettings() {
    try {
      const raw = localStorage.getItem('webSerialStudio_settings');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.operationMode) this._operationMode = s.operationMode;
      if (SUPPORTED_BUS_TYPES.has(s.busType)) this._busType = s.busType;
      if (s.locale) this._locale = s.locale;
      if (s.theme) this._theme = s.theme;
      if (s.csvExportEnabled !== undefined) this._csvExportEnabled = s.csvExportEnabled;
      if (s.points) this._points = s.points;
      if (s.serialConfig) Object.assign(this._serialConfig, s.serialConfig);
      if (s.wsConfig) Object.assign(this._wsConfig, s.wsConfig);
      if (s.mqttConfig) Object.assign(this._mqttConfig, createDefaultMqttConfig(), s.mqttConfig);
      if (s.udpConfig) Object.assign(this._udpConfig, createDefaultUdpConfig(), s.udpConfig);
      if (s.frameConfig) Object.assign(this._frameConfig, s.frameConfig);
    } catch (e) { /* ignore */ }
  }
}

export const appState = new AppState();
