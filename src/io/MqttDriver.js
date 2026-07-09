/**
 * MqttDriver - MQTT connection driver using mqtt.js via WebSocket
 */
import { appState } from '../core/AppState.js';

function getProtocolOptions(version) {
  if (version === '3.1') {
    return { protocolId: 'MQIsdp', protocolVersion: 3 };
  }
  if (version === '5.0') {
    return { protocolId: 'MQTT', protocolVersion: 5 };
  }
  return { protocolId: 'MQTT', protocolVersion: 4 };
}

function buildBrokerUrl(cfg) {
  const rawUrl = (cfg.brokerUrl || '').trim();
  if (rawUrl) {
    if (rawUrl.startsWith('ws://') || rawUrl.startsWith('wss://')) return rawUrl;
    if (rawUrl.startsWith('mqtt://') || rawUrl.startsWith('tcp://')) {
      throw new Error('Browser MQTT requires a ws:// or wss:// endpoint, not mqtt:// or tcp://.');
    }
  }

  const host = (cfg.host || '').trim();
  if (!host) {
    throw new Error('MQTT host is required.');
  }

  const scheme = cfg.useSSL ? 'wss' : 'ws';
  const path = (cfg.path || '/mqtt').trim() || '/mqtt';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const port = Number(cfg.port) || (cfg.useSSL ? 8084 : 8083);
  return `${scheme}://${host}:${port}${normalizedPath}`;
}

function buildTcpBrokerUrl(cfg) {
  const rawUrl = (cfg.brokerUrl || '').trim();
  if (rawUrl) {
    if (rawUrl.startsWith('mqtt://') || rawUrl.startsWith('mqtts://')) return rawUrl;
    if (rawUrl.startsWith('tcp://')) return `mqtt://${rawUrl.slice('tcp://'.length)}`;
    if (rawUrl.startsWith('tls://')) return `mqtts://${rawUrl.slice('tls://'.length)}`;
  }

  const host = (cfg.host || '').trim();
  if (!host) {
    throw new Error('MQTT host is required.');
  }

  const scheme = cfg.useSSL ? 'mqtts' : 'mqtt';
  const port = Number(cfg.port) || (cfg.useSSL ? 8883 : 1883);
  return `${scheme}://${host}:${port}`;
}

function base64ToBytes(text) {
  const binary = atob(String(text || ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(data) {
  const bytes = data instanceof Uint8Array ? data : messageToBytes(data);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function messageToBytes(message) {
  if (typeof message === 'string') return new TextEncoder().encode(message);
  if (message instanceof ArrayBuffer) return new Uint8Array(message);
  if (ArrayBuffer.isView(message)) {
    return new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
  }
  return new TextEncoder().encode(String(message ?? ''));
}

function normalizeSubscription(item, fallbackQos = 0) {
  if (!item) return null;
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed ? { topic: trimmed, qos: fallbackQos } : null;
  }

  const topic = String(item.topic || item.mqttTopic || '').trim();
  if (!topic) return null;
  return {
    ...item,
    topic,
    sourceId: item.sourceId ?? item.source ?? item.parserSourceId ?? '',
    qos: Number.isFinite(Number(item.qos)) ? Number(item.qos) : fallbackQos
  };
}

function dedupeSubscriptions(subscriptions) {
  const seen = new Set();
  return subscriptions.filter((subscription) => {
    const key = `${subscription.topic}:${subscription.sourceId ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mqttTopicMatches(filter, topic) {
  const filterParts = String(filter || '').split('/');
  const topicParts = String(topic || '').split('/');
  for (let i = 0; i < filterParts.length; i += 1) {
    const part = filterParts[i];
    if (part === '#') return i === filterParts.length - 1;
    if (part !== '+' && part !== topicParts[i]) return false;
  }
  return filterParts.length === topicParts.length;
}

function sourceConnectionConfig(baseCfg, source = {}) {
  const nested = source.connection || source.mqtt || {};
  const direct = {};
  [
    'version', 'mode', 'keepalive', 'host', 'port', 'path', 'username', 'password',
    'clientId', 'useSSL', 'brokerUrl', 'clean', 'retain', 'qos', 'transport'
  ].forEach((key) => {
    if (source[key] !== undefined) direct[key] = source[key];
  });
  return { ...baseCfg, ...nested, ...direct };
}

function connectionKey(cfg) {
  const transport = cfg.transport || 'websocket';
  return [
    transport,
    cfg.brokerUrl || '',
    transport === 'tcp' ? (cfg.useSSL ? 'mqtts' : 'mqtt') : (cfg.useSSL ? 'wss' : 'ws'),
    cfg.host || '',
    Number(cfg.port) || '',
    transport === 'tcp' ? '' : (cfg.path || '/mqtt'),
    cfg.username || ''
  ].join('|');
}

function addPlan(planMap, cfg, subscriptions) {
  const cleanSubscriptions = dedupeSubscriptions((subscriptions || []).filter(Boolean));
  if (!cleanSubscriptions.length) return;
  const key = connectionKey(cfg);
  if (!planMap.has(key)) {
    planMap.set(key, { cfg, subscriptions: [] });
  }
  const plan = planMap.get(key);
  plan.subscriptions = dedupeSubscriptions([...plan.subscriptions, ...cleanSubscriptions]);
}

function buildConnectionPlans(cfg) {
  const fallbackQos = Number(cfg.qos) || 0;
  const plans = new Map();

  if (Array.isArray(cfg.connections)) {
    cfg.connections.forEach((connection, index) => {
      const connectionCfg = { ...cfg, ...connection, clientId: connection.clientId || `${cfg.clientId || 'web-serial-studio'}-${index + 1}` };
      const subscriptions = Array.isArray(connection.subscriptions)
        ? connection.subscriptions.map((item) => normalizeSubscription(item, fallbackQos)).filter(Boolean)
        : [normalizeSubscription({ topic: connection.topic || connection.mqttTopic, qos: connection.qos ?? fallbackQos }, fallbackQos)].filter(Boolean);
      addPlan(plans, connectionCfg, subscriptions);
    });
  }

  const configSubscriptions = Array.isArray(cfg.subscriptions)
    ? cfg.subscriptions.map((item) => normalizeSubscription(item, fallbackQos)).filter(Boolean)
    : [];
  const singleSubscription = normalizeSubscription({ topic: cfg.topic, qos: fallbackQos }, fallbackQos);
  if (configSubscriptions.length || singleSubscription) {
    addPlan(plans, cfg, configSubscriptions.length ? configSubscriptions : [singleSubscription]);
  }

  const sources = Array.isArray(appState.project?.sources) ? appState.project.sources : [];
  sources.forEach((source) => {
    const type = String(source.type || source.busType || source.bus || '').toLowerCase();
    const topic = source.topic || source.mqttTopic;
    if (!topic && type !== 'mqtt') return;
    const sourceCfg = sourceConnectionConfig(cfg, source);
    const subscription = normalizeSubscription({
      topic,
      sourceId: source.sourceId,
      title: source.title,
      qos: source.qos ?? fallbackQos
    }, fallbackQos);
    addPlan(plans, sourceCfg, [subscription]);
  });

  return [...plans.values()];
}

export class MqttDriver {
  constructor() {
    this._client = null;
    this._clients = [];
    this._callbacks = { data: [], error: [], close: [] };
    this._subscriptions = [];
    this._desktopMqttUnsubscribers = [];
    this._sessionId = '';
    this._transport = 'websocket';
  }

  on(event, cb) { this._callbacks[event]?.push(cb); }
  off(event, cb) {
    if (!this._callbacks[event]) return;
    this._callbacks[event] = this._callbacks[event].filter(c => c !== cb);
  }
  _emit(event, data) { this._callbacks[event]?.forEach(cb => cb(data)); }

  _clearDesktopMqttListeners() {
    this._desktopMqttUnsubscribers.forEach((unsubscribe) => {
      try { unsubscribe?.(); } catch (_error) { /* ignore */ }
    });
    this._desktopMqttUnsubscribers = [];
  }

  async _connectDesktopTcp(cfg, plans) {
    const api = window.memsCmsDesktop?.mqtt;
    if (!api) {
      throw new Error('MQTT TCP direct connection is only available in the desktop app.');
    }

    this._transport = 'tcp';
    this._sessionId = `mqtt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    this._subscriptions = dedupeSubscriptions(plans.flatMap((plan) => plan.subscriptions || []));
    this._clearDesktopMqttListeners();

    this._desktopMqttUnsubscribers.push(api.onData((message) => {
      if (!message || message.sessionId !== this._sessionId) return;
      const subscription = (message.subscriptions || []).find((item) => mqttTopicMatches(item.topic, message.topic)) || { topic: message.topic };
      this._emit('data', {
        payload: base64ToBytes(message.payloadBase64),
        topic: message.topic,
        sourceId: subscription.sourceId,
        subscription,
        brokerUrl: message.brokerUrl
      });
    }));
    this._desktopMqttUnsubscribers.push(api.onError((message) => {
      if (!message || message.sessionId !== this._sessionId) return;
      this._emit('error', new Error(message.message || 'MQTT TCP error'));
    }));
    this._desktopMqttUnsubscribers.push(api.onClose((message) => {
      if (!message || message.sessionId !== this._sessionId) return;
      this._emit('close');
    }));

    const tcpPlans = plans.map((plan) => ({
      cfg: {
        ...plan.cfg,
        brokerUrl: buildTcpBrokerUrl(plan.cfg)
      },
      subscriptions: plan.subscriptions || []
    }));
    await api.connect({ sessionId: this._sessionId, plans: tcpPlans });
  }

  async connect() {
    const cfg = window.memsCmsDesktop?.mqtt
      ? {
        ...appState.mqttConfig,
        transport: 'tcp',
        useSSL: !!appState.mqttConfig.useSSL,
        port: Number(appState.mqttConfig.port) || (appState.mqttConfig.useSSL ? 8883 : 1883),
        brokerUrl: ''
      }
      : { ...appState.mqttConfig, transport: 'websocket' };

    const connectPlan = (plan, planIndex) => new Promise((resolve, reject) => {
      let settled = false;
      try {
        const planCfg = plan.cfg;
        const brokerUrl = buildBrokerUrl(planCfg);
        const options = {
          keepalive: Math.max(5, Number(planCfg.keepalive) || 60),
          clientId: (planCfg.clientId || '').trim() || ('serial_studio_' + Math.random().toString(16).substring(2, 8)) + `_${planIndex + 1}`,
          clean: planCfg.clean !== false,
          connectTimeout: 5000,
          reconnectPeriod: 0,
          ...getProtocolOptions(planCfg.version),
        };

        if (planCfg.username) options.username = planCfg.username;
        if (planCfg.password) options.password = planCfg.password;

        const client = window.mqtt.connect(brokerUrl, options);
        this._clients.push(client);
        if (!this._client) this._client = client;

        client.on('connect', () => {
          const shouldSubscribe = (planCfg.mode || 'PubSub') !== 'PublishOnly';
          if (shouldSubscribe) {
            const subscriptions = plan.subscriptions || [];
            if (!subscriptions.length) {
              if (!settled) {
                settled = true;
                reject(new Error('MQTT topic is required for subscribe mode.'));
              }
              client.end(true);
              return;
            }

            this._subscriptions = dedupeSubscriptions([...this._subscriptions, ...subscriptions]);
            const topicMap = subscriptions.reduce((acc, subscription) => {
              acc[subscription.topic] = { qos: Number(subscription.qos) || 0 };
              return acc;
            }, {});

            client.subscribe(topicMap, (err) => {
              if (err) {
                this._emit('error', err);
                if (!settled) {
                  settled = true;
                  reject(new Error(`MQTT subscribe failed: ${err.message || err}`));
                }
                client.end(true);
                return;
              }
              if (!settled) {
                settled = true;
                resolve();
              }
            });
            return;
          }

          if (!settled) {
            settled = true;
            resolve();
          }
        });

        client.on('message', (topic, message) => {
          const subscription = (plan.subscriptions || []).find((item) => mqttTopicMatches(item.topic, topic)) || { topic };
          this._emit('data', {
            payload: messageToBytes(message),
            topic,
            sourceId: subscription.sourceId,
            subscription,
            brokerUrl
          });
        });

        client.on('error', (e) => {
          this._emit('error', e);
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT connection failed (${brokerUrl}). Browser mode requires a WebSocket MQTT endpoint.`));
          }
        });

        client.on('close', () => {
          this._emit('close');
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT connection closed before handshake completed (${brokerUrl}).`));
          }
        });

        client.on('offline', () => {
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT client went offline while connecting (${brokerUrl}).`));
          }
        });

      } catch (err) {
        reject(err);
      }
    });

    const plans = buildConnectionPlans(cfg);
    if (!plans.length) {
      if ((cfg.mode || 'PubSub') === 'PublishOnly') {
        plans.push({ cfg, subscriptions: [] });
      } else {
        throw new Error('MQTT topic is required for subscribe mode.');
      }
    }

    if (cfg.transport === 'tcp') {
      await this._connectDesktopTcp(cfg, plans);
      return;
    }

    this._transport = 'websocket';
    if (!window.mqtt) {
      throw new Error('MQTT library not loaded in browser.');
    }

    await Promise.all(plans.map((plan, index) => connectPlan(plan, index)));
  }

  async send(data) {
    const cfg = window.memsCmsDesktop?.mqtt
      ? {
        ...appState.mqttConfig,
        transport: 'tcp',
        useSSL: !!appState.mqttConfig.useSSL,
        port: Number(appState.mqttConfig.port) || (appState.mqttConfig.useSSL ? 8883 : 1883)
      }
      : appState.mqttConfig;
    const topic = (cfg.publishTopic || cfg.topic || '').trim();
    if (!topic) throw new Error('MQTT topic is required');

    if (this._transport === 'tcp') {
      const api = window.memsCmsDesktop?.mqtt;
      if (!api || !this._sessionId) throw new Error('MQTT TCP not connected');
      await api.publish({
        sessionId: this._sessionId,
        topic,
        payloadBase64: bytesToBase64(data),
        qos: Number(cfg.qos) || 0,
        retain: !!cfg.retain
      });
      return;
    }

    const client = this._clients.find((item) => item?.connected) || this._client;
    if (!client || !client.connected) {
      throw new Error('MQTT not connected');
    }
    client.publish(topic, data, {
      qos: Number(cfg.qos) || 0,
      retain: !!cfg.retain
    });
  }

  async disconnect() {
    this._clearDesktopMqttListeners();
    if (this._transport === 'tcp' && this._sessionId) {
      try { await window.memsCmsDesktop?.mqtt?.disconnect(this._sessionId); } catch (_error) { /* ignore */ }
    }
    this._clients.forEach((client) => client?.end(true));
    this._clients = [];
    this._client = null;
    this._subscriptions = [];
    this._sessionId = '';
    this._transport = 'websocket';
  }
}
