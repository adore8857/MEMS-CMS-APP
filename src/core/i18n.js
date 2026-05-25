import { appState, BusType, OperationMode } from './AppState.js';

const translations = {
  'zh-CN': {
    app: {
      brandTitle: 'MEMS-CMS',
      brandSubtitle: 'MEMS Condition Monitoring System',
      brandDescription: 'MEMS\u5b9e\u9a8c\u5ba4\u72b6\u6001\u68c0\u6d4b\u7cfb\u7edf'
    },
    common: {
      save: '保存',
      close: '关闭',
      reset: '恢复默认',
      fullscreen: '全屏',
      connect: '连接',
      disconnect: '断开',
      dashboard: '仪表盘',
      console: '控制台',
      noProject: '未加载项目',
      language: '语言',
      theme: '主题',
      darkTheme: '深色主题',
      lightTheme: '浅色主题',
      chinese: '简体中文',
      english: 'English'
    },
    toolbar: {
      editor: '编辑器',
      openProject: '打开项目',
      saveProject: '保存项目',
      exportCsv: '导出 CSV',
      project: '项目',
      interface: '接口',
      uart: '串口',
      ble: '蓝牙',
      network: '网络',
      mqtt: 'MQTT',
      udp: 'UDP',
      demoSim: '演示模拟',
      stopSim: '停止模拟',
      setupPanel: '设置面板',
      preferences: '偏好设置',
      tools: '工具',
      statistics: '统计',
      framesPerSecond: '帧率',
      total: '总计'
    },
    sidebar: {
      title: '设备设置',
      frameParsing: '解析模式',
      quickPlot: '快速绘图（CSV 数值）',
      deviceSendsJson: '设备发送 JSON',
      projectFile: '项目文件',
      dataExport: '数据导出',
      exportCsv: '导出 CSV 文件',
      exportConsole: '导出控制台日志',
      chooseCsvPath: '选择 CSV 保存位置',
      csvTargetFolder: '自动保存到：{name}',
      csvTargetDownloads: '未选择目录，断开后将自动下载 CSV',
      ioInterface: '通信接口',
      jsonProjectEditor: 'JSON 项目编辑器',
      jsonEditorHint: '设备应发送由 /* ... */ 包裹的 JSON。你可以在下方编辑结构来自定义仪表盘控件。',
      validJson: 'JSON 有效',
      loadJson: '加载 JSON',
      apply: '应用',
      lastReceivedJson: '最近收到的 JSON：',
      none: '无',
      frameSettings: '帧设置',
      endDelimiter: '结束分隔符',
      startDelimiter: '起始分隔符',
      leaveEmpty: '留空',
      plotSettings: '绘图设置',
      historyPoints: '历史点数',
      disconnected: '未连接',
      connecting: '连接中...',
      connectionError: '连接错误',
      connectedVia: '已通过 {bus} 连接',
      serialConfiguration: '串口配置',
      websocketConfiguration: 'WebSocket 配置',
      mqttConfiguration: 'MQTT 配置',
      udpConfiguration: 'UDP 配置',
      bluetoothConfiguration: '蓝牙配置',
      baudRate: '波特率',
      dataBits: '数据位',
      stopBits: '停止位',
      parity: '校验位',
      url: '地址',
      mqttVersion: 'MQTT 版本',
      mode: '模式',
      qos: 'QoS 等级',
      keepAlive: '保活时间（秒）',
      host: '主机',
      port: '端口',
      topic: '主题',
      websocketPath: 'WebSocket 路径',
      username: '用户名',
      password: '密码',
      clientId: '客户端 ID',
      enableSsl: '启用 SSL / TLS',
      cleanSession: '清理会话',
      retainPublish: '保留发布',
      browserEndpoint: '浏览器 WebSocket 端点',
      waitingForHost: '等待输入主机...',
      mqttHelper: '浏览器中的 MQTT 必须通过 WebSocket 端口连接。原始 TCP 端口例如 1883 不能直接在网页中使用，除非 Broker 在该端口额外暴露了 WS/WSS。',
      bridgeUrl: '桥接地址',
      remoteIp: '远端 IP',
      remotePort: '远端端口',
      localIp: '本地 IP',
      localPort: '本地端口',
      udpBridge: 'UDP WebSocket 桥接',
      udpHelper: '浏览器不能直接打开 UDP 端口，请先运行桥接脚本，再在网页中连接 UDP。',
      subscribePublish: '发布 + 订阅',
      subscribeOnly: '仅订阅',
      publishOnly: '仅发布',
      atMostOnce: '0 - 最多一次',
      atLeastOnce: '1 - 至少一次',
      exactlyOnce: '2 - 恰好一次',
      bluetoothHint: '点击连接后，浏览器会弹出蓝牙设备选择窗口。需要目标设备暴露可读且支持通知的 GATT 特征值。',
      optional: '可选'
    },
    dashboard: {
      title: '仪表盘',
      autoLayout: '自动布局',
      reset: '重置',
      fullscreen: '全屏',
      realTimeTitle: '实时遥测仪表盘',
      realTimeDesc: '连接设备或启动演示模拟器，即可查看实时数据。支持串口、BLE、WebSocket、MQTT 等多种方式。',
      startDemo: '启动演示模拟',
      openProject: '打开项目文件',
      featureQuickPlot: '快速绘图',
      featureQuickPlotDesc: '直接发送逗号分隔的数据即可立即成图。',
      featureProjectFile: '项目文件',
      featureProjectFileDesc: '通过 JSON 项目文件自定义仪表盘布局。',
      featureJson: '设备 JSON',
      featureJsonDesc: '让设备通过 JSON 自描述自己的界面。',
      featureProtocols: '多协议',
      featureProtocolsDesc: '支持 UART、BLE、WebSocket、MQTT。',
      featureExport: '数据导出',
      featureExportDesc: '支持 CSV 导出，便于分析与回放。',
      featureActions: '交互操作',
      featureActionsDesc: '可扩展按钮与指令发送逻辑。',
      allData: '全部数据',
      overview: '总览'
    },
    console: {
      clear: '清空',
      pause: '暂停',
      hex: '十六进制',
      auto: '自动滚动',
      export: '导出',
      placeholder: '输入命令并按 Enter 发送...',
      send: '发送'
    },
    preferences: {
      title: '偏好设置',
      display: '显示',
      plotHistoryPoints: '绘图历史点数',
      frameParsing: '帧解析',
      frameDetection: '帧检测方式',
      endDelimiterOnly: '仅结束分隔符',
      startAndEnd: '起始 + 结束分隔符',
      noDelimiters: '无分隔符',
      serialDefaults: '串口默认参数',
      flowControl: '流控',
      dataExport: '数据导出',
      autoExportCsv: '连接后自动导出 CSV',
      exportConsoleLog: '导出控制台日志',
      chooseCsvPath: '选择 CSV 保存位置',
      about: '关于',
      aboutIntro: '一个受 Serial Studio 启发的网页遥测仪表盘。',
      aboutSupports: '支持：Web Serial API（UART）、WebSocket、MQTT',
      aboutWidgets: '控件：Plot、Gauge、Bar、Compass、DataGrid、Accelerometer',
      aboutQuickPlot: '快速绘图：发送逗号分隔数值，例如',
      aboutJson: '设备发送 JSON：使用 /* ... */ 包裹 JSON',
      aboutProject: '项目文件：加载 .json 自定义仪表盘',
      saveClose: '保存并关闭',
      resetSuccess: '偏好设置已恢复默认值',
      saveSuccess: '偏好设置已保存',
      reloadNotice: '语言或主题已更新，界面即将刷新'
    },
    taskbar: {
      menu: '菜单'
    },
    messages: {
      demoRunning: '演示模拟器已启动（20 Hz）',
      demoStopped: '演示模拟器已停止',
      loaded: '已加载：{title}',
      failedParseProject: '项目文件解析失败',
      jsonApplied: 'JSON 结构已应用到仪表盘',
      invalidJson: '无效 JSON：{error}',
      csvExported: 'CSV 已导出',
      csvSavedTo: 'CSV 已保存：{file}',
      csvAutoSaved: '连接结束，CSV 已自动保存：{file}',
      csvAutoDownloaded: '连接结束，CSV 已自动下载：{file}',
      csvPathSelected: 'CSV 自动保存目录已选择：{name}',
      csvNoData: '当前没有可导出的 CSV 数据',
      csvSaveFailed: 'CSV 保存失败：{error}',
      csvDirectoryUnsupported: '当前浏览器不支持直接选择保存目录，将使用下载方式导出 CSV',
      csvDirectoryPermissionDenied: '未获得目录写入权限，自动保存将回退为浏览器下载',
      connected: '连接成功',
      disconnected: '已断开连接',
      connectionError: '连接错误：{error}',
      failedConnect: '连接失败：{error}',
      sendFailed: '发送失败：{error}',
      driverUnavailable: '{bus} 驱动在当前浏览器中不可用'
    }
  },
  en: {
    app: {
      brandTitle: 'MEMS-CMS',
      brandSubtitle: 'MEMS Condition Monitoring System',
      brandDescription: 'MEMS\u5b9e\u9a8c\u5ba4\u72b6\u6001\u68c0\u6d4b\u7cfb\u7edf'
    },
    common: {
      save: 'Save',
      close: 'Close',
      reset: 'Reset',
      fullscreen: 'Full Screen',
      connect: 'Connect',
      disconnect: 'Disconnect',
      dashboard: 'Dashboard',
      console: 'Console',
      noProject: 'No Project',
      language: 'Language',
      theme: 'Theme',
      darkTheme: 'Dark Theme',
      lightTheme: 'Light Theme',
      chinese: 'Simplified Chinese',
      english: 'English'
    },
    toolbar: {
      editor: 'Editor',
      openProject: 'Open Project',
      saveProject: 'Save Project',
      exportCsv: 'Export CSV',
      project: 'Project',
      interface: 'Interface',
      uart: 'UART',
      ble: 'BLE',
      network: 'Network',
      mqtt: 'MQTT',
      udp: 'UDP',
      demoSim: 'Demo Sim',
      stopSim: 'Stop Sim',
      setupPanel: 'Setup Panel',
      preferences: 'Preferences',
      tools: 'Tools',
      statistics: 'Statistics',
      framesPerSecond: 'Frames/s',
      total: 'Total'
    },
    sidebar: {
      title: 'Device Setup',
      frameParsing: 'Frame Parsing',
      quickPlot: 'Quick Plot (CSV values)',
      deviceSendsJson: 'Device Sends JSON',
      projectFile: 'Project File',
      dataExport: 'Data Export',
      exportCsv: 'Export CSV file',
      exportConsole: 'Export console log',
      chooseCsvPath: 'Choose CSV save folder',
      csvTargetFolder: 'Auto-save to: {name}',
      csvTargetDownloads: 'No folder selected, CSV will be downloaded on disconnect',
      ioInterface: 'I/O Interface',
      jsonProjectEditor: 'JSON Project Editor',
      jsonEditorHint: 'Device should send JSON wrapped in /* ... */ delimiters. Edit the schema below to customize dashboard widgets.',
      validJson: 'Valid JSON',
      loadJson: 'Load JSON',
      apply: 'Apply',
      lastReceivedJson: 'Last received JSON:',
      none: 'None',
      frameSettings: 'Frame Settings',
      endDelimiter: 'End Delimiter',
      startDelimiter: 'Start Delimiter',
      leaveEmpty: 'Leave empty',
      plotSettings: 'Plot Settings',
      historyPoints: 'History Points',
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      connectionError: 'Connection Error',
      connectedVia: 'Connected via {bus}',
      serialConfiguration: 'Serial Configuration',
      websocketConfiguration: 'WebSocket Configuration',
      mqttConfiguration: 'MQTT Configuration',
      udpConfiguration: 'UDP Configuration',
      bluetoothConfiguration: 'Bluetooth Configuration',
      baudRate: 'Baud Rate',
      dataBits: 'Data Bits',
      stopBits: 'Stop Bits',
      parity: 'Parity',
      url: 'URL',
      mqttVersion: 'MQTT Version',
      mode: 'Mode',
      qos: 'QoS Level',
      keepAlive: 'Keep Alive (s)',
      host: 'Host',
      port: 'Port',
      topic: 'Topic',
      websocketPath: 'WebSocket Path',
      username: 'Username',
      password: 'Password',
      clientId: 'Client ID',
      enableSsl: 'Enable SSL / TLS',
      cleanSession: 'Clean Session',
      retainPublish: 'Retain Publish',
      browserEndpoint: 'Browser WebSocket Endpoint',
      waitingForHost: 'Waiting for host...',
      mqttHelper: 'Browser MQTT must connect through a WebSocket listener. A raw TCP MQTT port like 1883 will fail unless your broker exposes MQTT over WS/WSS on that port.',
      bridgeUrl: 'Bridge URL',
      remoteIp: 'Remote IP',
      remotePort: 'Remote Port',
      localIp: 'Local IP',
      localPort: 'Local Port',
      udpBridge: 'UDP WebSocket Bridge',
      udpHelper: 'Browsers cannot open raw UDP sockets. Start the bridge script first, then connect UDP from the web app.',
      subscribePublish: 'Publish + Subscribe',
      subscribeOnly: 'Subscribe Only',
      publishOnly: 'Publish Only',
      atMostOnce: '0 - At most once',
      atLeastOnce: '1 - At least once',
      exactlyOnce: '2 - Exactly once',
      bluetoothHint: 'Web Bluetooth API will prompt for device selection when you click Connect. It requires a GATT service exposing a readable and notify-capable characteristic.',
      optional: 'Optional'
    },
    dashboard: {
      title: 'Dashboard',
      autoLayout: 'Auto Layout',
      reset: 'Reset',
      fullscreen: 'Full Screen',
      realTimeTitle: 'Real-Time Telemetry Dashboard',
      realTimeDesc: 'Connect a device or start the Demo Simulator to visualize live data. Supports Serial, BLE, WebSocket, MQTT and more.',
      startDemo: 'Start Demo Simulator',
      openProject: 'Open Project File',
      featureQuickPlot: 'Quick Plot',
      featureQuickPlotDesc: 'Send comma-separated values and start plotting immediately.',
      featureProjectFile: 'Project File',
      featureProjectFileDesc: 'Use JSON project files to build custom dashboards.',
      featureJson: 'Device JSON',
      featureJsonDesc: 'Let the device describe its own dashboard via JSON.',
      featureProtocols: 'Multi-Protocol',
      featureProtocolsDesc: 'Supports UART, BLE, WebSocket and MQTT.',
      featureExport: 'Export',
      featureExportDesc: 'Export CSV data for analysis and playback.',
      featureActions: 'Actions',
      featureActionsDesc: 'Extend buttons and command sending logic.',
      allData: 'All Data',
      overview: 'Overview'
    },
    console: {
      clear: 'Clear',
      pause: 'Pause',
      hex: 'HEX',
      auto: 'Auto',
      export: 'Export',
      placeholder: 'Type command and press Enter...',
      send: 'Send'
    },
    preferences: {
      title: 'Preferences',
      display: 'Display',
      plotHistoryPoints: 'Plot History Points',
      frameParsing: 'Frame Parsing',
      frameDetection: 'Frame Detection',
      endDelimiterOnly: 'End Delimiter Only',
      startAndEnd: 'Start + End Delimiter',
      noDelimiters: 'No Delimiters',
      serialDefaults: 'Serial Port Defaults',
      flowControl: 'Flow Control',
      dataExport: 'Data Export',
      autoExportCsv: 'Auto-export CSV on connect',
      exportConsoleLog: 'Export console log',
      chooseCsvPath: 'Choose CSV save folder',
      about: 'About',
      aboutIntro: 'A web-based telemetry dashboard inspired by Serial Studio.',
      aboutSupports: 'Supports: Web Serial API (UART), WebSocket, MQTT',
      aboutWidgets: 'Widgets: Plot, Gauge, Bar, Compass, DataGrid, Accelerometer',
      aboutQuickPlot: 'Quick Plot: send comma-separated values, e.g.',
      aboutJson: 'Device Sends JSON: wrap JSON in /* ... */ delimiters',
      aboutProject: 'Project File: load a .json project to define dashboards',
      saveClose: 'Save & Close',
      resetSuccess: 'Preferences reset to defaults',
      saveSuccess: 'Preferences saved',
      reloadNotice: 'Language or theme updated, refreshing the UI'
    },
    taskbar: {
      menu: 'Menu'
    },
    messages: {
      demoRunning: 'Demo Simulator started (20 Hz)',
      demoStopped: 'Demo Simulator stopped',
      loaded: 'Loaded: {title}',
      failedParseProject: 'Failed to parse project file',
      jsonApplied: 'JSON schema applied to dashboard',
      invalidJson: 'Invalid JSON: {error}',
      csvExported: 'CSV exported',
      csvSavedTo: 'CSV saved: {file}',
      csvAutoSaved: 'Session ended, CSV auto-saved: {file}',
      csvAutoDownloaded: 'Session ended, CSV auto-downloaded: {file}',
      csvPathSelected: 'CSV save folder selected: {name}',
      csvNoData: 'No CSV data available to export',
      csvSaveFailed: 'Failed to save CSV: {error}',
      csvDirectoryUnsupported: 'This browser cannot choose a save folder directly. CSV export will fall back to downloads.',
      csvDirectoryPermissionDenied: 'Directory write permission was denied. Auto-save will fall back to browser downloads.',
      connected: 'Connected successfully',
      disconnected: 'Disconnected',
      connectionError: 'Connection error: {error}',
      failedConnect: 'Failed to connect: {error}',
      sendFailed: 'Send failed: {error}',
      driverUnavailable: '{bus} driver not available in this browser'
    }
  }
};

function getValue(locale, key) {
  const lang = translations[locale] || translations.en;
  return key.split('.').reduce((acc, part) => acc?.[part], lang);
}

export function t(key, params = {}, locale = appState.locale) {
  const fallback = getValue('en', key);
  let value = getValue(locale, key) ?? fallback ?? key;
  if (typeof value !== 'string') return key;
  Object.entries(params).forEach(([param, replacement]) => {
    value = value.replace(new RegExp(`\\{${param}\\}`, 'g'), String(replacement));
  });
  return value;
}

export function busLabel(bus, locale = appState.locale) {
  switch (bus) {
    case BusType.Serial:
      return t('toolbar.uart', {}, locale);
    case BusType.Bluetooth:
      return t('toolbar.ble', {}, locale);
    case BusType.WebSocket:
      return 'WebSocket';
    case BusType.MQTT:
      return 'MQTT';
    case BusType.UDP:
      return 'UDP';
    default:
      return bus;
  }
}

export function modeLabel(mode, locale = appState.locale) {
  switch (mode) {
    case OperationMode.QuickPlot:
      return t('sidebar.quickPlot', {}, locale);
    case OperationMode.DeviceSendsJSON:
      return t('sidebar.deviceSendsJson', {}, locale);
    case OperationMode.ProjectFile:
      return t('sidebar.projectFile', {}, locale);
    case OperationMode.STM32Binary:
      return 'STM32 Binary';
    default:
      return mode;
  }
}

export function applyTheme(theme = appState.theme) {
  const normalized = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = normalized;
  document.documentElement.lang = appState.locale === 'zh-CN' ? 'zh-CN' : 'en';
}
