const { app, BrowserWindow, Menu, shell, session, ipcMain } = require('electron');
const path = require('path');
const mqtt = require('mqtt');
const { startIntegratedUdpGateway } = require('./udpGateway');

const isSmokeTest = process.env.ELECTRON_SMOKE_TEST === '1';
let udpGatewayServer = null;
const mqttSessions = new Map();

function ipcPayloadToBuffer(payload, payloadBase64) {
  if (payloadBase64) return Buffer.from(String(payloadBase64), 'base64');
  if (Buffer.isBuffer(payload)) return Buffer.from(payload);
  if (payload instanceof ArrayBuffer) return Buffer.from(new Uint8Array(payload));
  if (ArrayBuffer.isView(payload)) return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength);
  if (Array.isArray(payload)) return Buffer.from(payload);
  return Buffer.from(String(payload ?? ''), 'utf8');
}

function mqttProtocolOptions(version) {
  if (version === '3.1') return { protocolId: 'MQIsdp', protocolVersion: 3 };
  if (version === '5.0') return { protocolId: 'MQTT', protocolVersion: 5 };
  return { protocolId: 'MQTT', protocolVersion: 4 };
}

function mqttBrokerUrl(cfg = {}) {
  const rawUrl = String(cfg.brokerUrl || '').trim();
  if (rawUrl) {
    if (rawUrl.startsWith('tcp://')) return `mqtt://${rawUrl.slice('tcp://'.length)}`;
    if (rawUrl.startsWith('tls://')) return `mqtts://${rawUrl.slice('tls://'.length)}`;
    if (rawUrl.startsWith('mqtt://') || rawUrl.startsWith('mqtts://')) return rawUrl;
  }
  const host = String(cfg.host || '').trim();
  if (!host) throw new Error('MQTT host is required.');
  const useSSL = !!cfg.useSSL;
  const port = Number(cfg.port) || (useSSL ? 8883 : 1883);
  return `${useSSL ? 'mqtts' : 'mqtt'}://${host}:${port}`;
}

function closeMqttSession(sessionId) {
  const session = mqttSessions.get(sessionId);
  if (!session) return;
  session.clients.forEach((client) => {
    try { client.end(true); } catch (_error) { /* already closed */ }
  });
  mqttSessions.delete(sessionId);
}

function setupMqttIpc() {
  ipcMain.handle('mqtt-tcp:connect', async (event, options = {}) => {
    const sessionId = String(options.sessionId || 'default');
    closeMqttSession(sessionId);
    const plans = Array.isArray(options.plans) ? options.plans : [];
    if (!plans.length) throw new Error('MQTT connection plan is empty.');

    const owner = event.sender;
    const session = { clients: [], owner };
    mqttSessions.set(sessionId, session);

    const connectPlan = (plan = {}, index) => new Promise((resolve, reject) => {
      let settled = false;
      const cfg = plan.cfg || {};
      const brokerUrl = mqttBrokerUrl(cfg);
      const clientIdBase = String(cfg.clientId || '').trim() || `mems_cms_${Math.random().toString(16).slice(2, 8)}`;
      const client = mqtt.connect(brokerUrl, {
        keepalive: Math.max(5, Number(cfg.keepalive) || 60),
        clientId: `${clientIdBase}_${index + 1}`,
        clean: cfg.clean !== false,
        connectTimeout: 5000,
        reconnectPeriod: 0,
        username: cfg.username || undefined,
        password: cfg.password || undefined,
        ...mqttProtocolOptions(cfg.version)
      });

      session.clients.push(client);
      client.on('connect', () => {
        const shouldSubscribe = (cfg.mode || 'PubSub') !== 'PublishOnly';
        if (!shouldSubscribe) {
          settled = true;
          resolve();
          return;
        }
        const subscriptions = Array.isArray(plan.subscriptions) ? plan.subscriptions : [];
        if (!subscriptions.length) {
          settled = true;
          client.end(true);
          reject(new Error('MQTT topic is required for subscribe mode.'));
          return;
        }
        const topicMap = subscriptions.reduce((acc, subscription) => {
          acc[subscription.topic] = { qos: Number(subscription.qos) || 0 };
          return acc;
        }, {});
        client.subscribe(topicMap, (error) => {
          if (error) {
            settled = true;
            client.end(true);
            reject(new Error(`MQTT subscribe failed: ${error.message || error}`));
            return;
          }
          settled = true;
          resolve();
        });
      });

      client.on('message', (topic, message) => {
        owner.send('mqtt-tcp:data', {
          sessionId,
          topic,
          payloadBase64: Buffer.from(message).toString('base64'),
          subscriptions: plan.subscriptions || [],
          brokerUrl
        });
      });
      client.on('error', (error) => {
        owner.send('mqtt-tcp:error', { sessionId, message: error.message || String(error), brokerUrl });
        if (!settled) {
          settled = true;
          reject(new Error(`MQTT TCP connection failed (${brokerUrl}): ${error.message || error}`));
        }
      });
      client.on('close', () => {
        owner.send('mqtt-tcp:close', { sessionId, brokerUrl });
        if (!settled) {
          settled = true;
          reject(new Error(`MQTT TCP connection closed before handshake completed (${brokerUrl}).`));
        }
      });
    });

    try {
      await Promise.all(plans.map((plan, index) => connectPlan(plan, index)));
      return { ok: true };
    } catch (error) {
      closeMqttSession(sessionId);
      throw error;
    }
  });

  ipcMain.handle('mqtt-tcp:publish', async (_event, options = {}) => {
    const sessionId = String(options.sessionId || 'default');
    const session = mqttSessions.get(sessionId);
    const client = session?.clients.find((item) => item.connected);
    if (!client) throw new Error('MQTT TCP not connected.');
    const topic = String(options.topic || '').trim();
    if (!topic) throw new Error('MQTT topic is required.');
    const payload = ipcPayloadToBuffer(options.payload, options.payloadBase64);
    await new Promise((resolve, reject) => {
      client.publish(topic, payload, {
        qos: Number(options.qos) || 0,
        retain: !!options.retain
      }, (error) => (error ? reject(error) : resolve()));
    });
    return { ok: true };
  });

  ipcMain.handle('mqtt-tcp:disconnect', async (_event, sessionId = 'default') => {
    closeMqttSession(String(sessionId || 'default'));
    return { ok: true };
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function serialDisplayName(port) {
  return port.displayName || port.portName || port.portId || 'Serial Port';
}

function serialMeta(port) {
  const items = [];
  if (port.portName) items.push(`端口 ${port.portName}`);
  if (port.portId && port.portId !== port.portName) items.push(`ID ${port.portId}`);
  if (port.vendorId) items.push(`VID ${port.vendorId}`);
  if (port.productId) items.push(`PID ${port.productId}`);
  if (port.serialNumber) items.push(`SN ${port.serialNumber}`);
  return items.join(' · ') || '串口设备';
}

function buildSerialPickerHtml(portList) {
  const rows = portList.map((port, index) => `
    <button class="port-row ${index === 0 ? 'selected' : ''}" data-port-id="${escapeHtml(port.portId)}">
      <span class="port-index">${index + 1}</span>
      <span class="port-main">
        <span class="port-title">${escapeHtml(serialDisplayName(port))}</span>
        <span class="port-meta">${escapeHtml(serialMeta(port))}</span>
      </span>
      <span class="port-badge">${escapeHtml(port.portName || port.portId || 'COM')}</span>
    </button>
  `).join('');

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <style>
    :root {
      color-scheme: light;
      --accent:#004769;
      --accent-2:#006b88;
      --border:#d8e0e7;
      --text:#000;
      --muted:#4b5563;
      --panel:#fff;
      --soft:#f4f8fb;
    }
    * { box-sizing:border-box; }
    body {
      margin:0;
      font-family:"Microsoft YaHei UI","Segoe UI",Arial,sans-serif;
      background:#fff;
      color:var(--text);
      font-size:14px;
      overflow:hidden;
    }
    .titlebar {
      height:36px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding:0 12px;
      border-bottom:1px solid var(--border);
      background:#f7fbfd;
      font-weight:700;
    }
    .titlebar span:first-child::before {
      content:"";
      display:inline-block;
      width:9px;
      height:9px;
      margin-right:9px;
      background:var(--accent);
      transform:rotate(45deg);
      border-radius:2px;
      vertical-align:1px;
    }
    .close {
      border:0;
      background:transparent;
      color:#111827;
      font-size:20px;
      line-height:1;
      cursor:pointer;
      width:28px;
      height:28px;
    }
    .content { padding:18px 20px 16px; }
    .hint {
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom:14px;
      color:#111827;
      font-weight:600;
    }
    .hint-icon {
      width:30px;
      height:30px;
      border-radius:7px;
      background:var(--accent);
      color:white;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      font-weight:800;
      font-family:Georgia,serif;
    }
    .list {
      max-height:300px;
      overflow:auto;
      border:1px solid var(--border);
      border-radius:8px;
      background:var(--panel);
    }
    .port-row {
      width:100%;
      display:grid;
      grid-template-columns:34px minmax(0,1fr) auto;
      gap:10px;
      align-items:center;
      min-height:54px;
      padding:8px 10px;
      border:0;
      border-bottom:1px solid var(--border);
      background:#fff;
      color:var(--text);
      text-align:left;
      cursor:pointer;
      font:inherit;
    }
    .port-row:last-child { border-bottom:0; }
    .port-row:hover,
    .port-row.selected {
      background:#eef6fa;
      outline:1px solid rgba(0,71,105,.35);
      outline-offset:-1px;
    }
    .port-index {
      width:24px;
      height:24px;
      border-radius:5px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      background:var(--accent);
      color:#fff;
      font-weight:800;
      font-size:12px;
    }
    .port-main { min-width:0; display:flex; flex-direction:column; gap:3px; }
    .port-title { font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .port-meta { color:var(--muted); font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .port-badge {
      max-width:190px;
      padding:4px 8px;
      border-radius:5px;
      background:var(--soft);
      border:1px solid var(--border);
      color:var(--accent);
      font-weight:700;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .footer {
      display:flex;
      justify-content:flex-end;
      gap:10px;
      margin-top:14px;
    }
    .btn {
      min-width:82px;
      height:34px;
      border-radius:6px;
      border:1px solid var(--border);
      background:#fff;
      color:#111827;
      font-weight:700;
      cursor:pointer;
    }
    .btn.primary {
      border-color:var(--accent);
      background:var(--accent);
      color:#fff;
    }
  </style>
</head>
<body>
  <div class="titlebar"><span>选择串口</span><button class="close" id="close">×</button></div>
  <div class="content">
    <div class="hint"><span class="hint-icon">i</span><span>请选择要连接的串口设备</span></div>
    <div class="list" id="list">${rows}</div>
    <div class="footer">
      <button class="btn" id="cancel">取消</button>
      <button class="btn primary" id="ok">连接</button>
    </div>
  </div>
  <script>
    let selected = document.querySelector('.port-row.selected')?.dataset.portId || '';
    document.querySelectorAll('.port-row').forEach((row) => {
      row.addEventListener('click', () => {
        document.querySelectorAll('.port-row').forEach((item) => item.classList.remove('selected'));
        row.classList.add('selected');
        selected = row.dataset.portId || '';
      });
      row.addEventListener('dblclick', () => window.serialPicker.choose(row.dataset.portId || ''));
    });
    document.getElementById('ok').addEventListener('click', () => window.serialPicker.choose(selected));
    document.getElementById('cancel').addEventListener('click', () => window.serialPicker.cancel());
    document.getElementById('close').addEventListener('click', () => window.serialPicker.cancel());
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') window.serialPicker.cancel();
      if (event.key === 'Enter') window.serialPicker.choose(selected);
    });
  </script>
</body>
</html>`;
}

function showSerialPicker(parent, portList) {
  return new Promise((resolve) => {
    if (!portList.length) {
      resolve('');
      return;
    }

    const picker = new BrowserWindow({
      width: 760,
      height: 430,
      minWidth: 620,
      minHeight: 340,
      parent,
      modal: !!parent,
      title: '选择串口',
      backgroundColor: '#ffffff',
      autoHideMenuBar: true,
      resizable: true,
      webPreferences: {
        preload: path.join(__dirname, 'serialPickerPreload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    });

    let settled = false;
    const settle = (portId) => {
      if (settled) return;
      settled = true;
      ipcMain.removeListener('serial-picker:choose', chooseHandler);
      ipcMain.removeListener('serial-picker:cancel', cancelHandler);
      if (!picker.isDestroyed()) picker.close();
      resolve(portId || '');
    };
    const chooseHandler = (event, portId) => {
      if (event.sender === picker.webContents) settle(portId);
    };
    const cancelHandler = (event) => {
      if (event.sender === picker.webContents) settle('');
    };
    ipcMain.on('serial-picker:choose', chooseHandler);
    ipcMain.on('serial-picker:cancel', cancelHandler);
    picker.on('closed', () => settle(''));
    picker.loadURL(`data:text/html;charset=UTF-8,${encodeURIComponent(buildSerialPickerHtml(portList))}`);
  });
}

function configureSerialPermissions() {
  const ses = session.defaultSession;

  ses.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === 'serial') return true;
    return false;
  });

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'serial');
  });

  if (typeof ses.setDevicePermissionHandler === 'function') {
    ses.setDevicePermissionHandler(({ deviceType }) => deviceType === 'serial');
  }

  ses.on('select-serial-port', (event, portList, webContents, callback) => {
    event.preventDefault();

    if (!portList.length) {
      callback('');
      return;
    }

    if (portList.length === 1 || isSmokeTest) {
      callback(portList[0].portId);
      return;
    }

    const parent = BrowserWindow.fromWebContents(webContents);
    showSerialPicker(parent, portList).then(callback).catch(() => callback(''));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    title: 'MEMS-CMS',
    icon: path.join(__dirname, '..', 'src', 'assets', 'cms-icon.png'),
    backgroundColor: '#ffffff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  win.once('ready-to-show', () => {
    if (!isSmokeTest) win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    if (current && url !== current && /^https?:\/\//i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isSmokeTest) {
    win.webContents.once('did-finish-load', async () => {
      try {
        const result = await win.webContents.executeJavaScript(`({
          title: document.title,
          hasApp: !!document.querySelector('#app'),
          hasSerialApi: !!navigator.serial,
          hasToolbarRoot: !!document.querySelector('#toolbar-root'),
          hasDashboardArea: !!document.querySelector('#dashboard-area'),
          hasProjectEditorButton: !!document.querySelector('#btn-project-editor'),
          hasChart: !!window.Chart,
          hasMqtt: !!window.mqtt
        })`);
        const projectJson = await win.webContents.executeJavaScript(`(async () => {
          const { ProjectModel } = await import('./src/core/ProjectModel.js?v=electron-smoke-20260709-1');
          const model = new ProjectModel();
          const ok = model.loadFromJSON({
            title: 'Smoke Project',
            frameStart: '',
            frameEnd: '\\\\n',
            frameDetection: 'EndDelimiterOnly',
            groups: [
              {
                title: 'Sensor Data',
                datasets: [
                  {
                    title: 'Temperature',
                    units: 'degC',
                    index: 0,
                    widget: 'Plot',
                    graph: true,
                    min: 0,
                    max: 100
                  }
                ]
              }
            ]
          });
          return {
            ok,
            title: model.project?.title || '',
            groups: model.project?.groups?.length || 0,
            datasets: model.project?.groups?.[0]?.datasets?.length || 0
          };
        })()`);
        result.projectJson = projectJson;
        const udpGateway = await win.webContents.executeJavaScript(`new Promise((resolve) => {
          let done = false;
          const finish = (value) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            try { ws?.close(); } catch (_error) {}
            resolve(value);
          };
          let ws = null;
          const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), 2000);
          try {
            ws = new WebSocket('ws://127.0.0.1:8765?client=mems-cms');
            ws.addEventListener('message', (event) => {
              try {
                const message = JSON.parse(event.data);
                if (message.type === 'gateway.hello') {
                  finish({ ok: true, type: message.type, udp: message.udp });
                }
              } catch (_error) {
                // Ignore non-status payloads.
              }
            });
            ws.addEventListener('error', () => finish({ ok: false, error: 'websocket error' }));
          } catch (error) {
            finish({ ok: false, error: error.message || String(error) });
          }
        })`);
        result.udpGateway = udpGateway;
        console.log(JSON.stringify(result, null, 2));
        app.exit(result.title === 'MEMS-CMS' && result.hasApp && projectJson.ok && udpGateway.ok ? 0 : 1);
      } catch (error) {
        console.error(error);
        app.exit(1);
      }
    });
  }

  win.loadFile(path.join(__dirname, '..', 'index.html'));
  return win;
}

app.whenReady().then(() => {
  setupMqttIpc();
  configureSerialPermissions();
  udpGatewayServer = startIntegratedUdpGateway({ rootDir: path.join(__dirname, '..') });
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (udpGatewayServer) udpGatewayServer.close();
  mqttSessions.forEach((_session, sessionId) => closeMqttSession(sessionId));
  if (process.platform !== 'darwin') app.quit();
});
