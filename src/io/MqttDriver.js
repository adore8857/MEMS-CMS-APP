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

function messageToBytes(message) {
  if (typeof message === 'string') return new TextEncoder().encode(message);
  if (message instanceof ArrayBuffer) return new Uint8Array(message);
  if (ArrayBuffer.isView(message)) {
    return new Uint8Array(message.buffer, message.byteOffset, message.byteLength);
  }
  return new TextEncoder().encode(String(message ?? ''));
}

export class MqttDriver {
  constructor() {
    this._client = null;
    this._callbacks = { data: [], error: [], close: [] };
  }

  on(event, cb) { this._callbacks[event]?.push(cb); }
  off(event, cb) {
    if (!this._callbacks[event]) return;
    this._callbacks[event] = this._callbacks[event].filter(c => c !== cb);
  }
  _emit(event, data) { this._callbacks[event]?.forEach(cb => cb(data)); }

  async connect() {
    const cfg = appState.mqttConfig;

    if (!window.mqtt) {
      throw new Error('MQTT library not loaded in browser.');
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      try {
        const brokerUrl = buildBrokerUrl(cfg);
        const options = {
          keepalive: Math.max(5, Number(cfg.keepalive) || 60),
          clientId: (cfg.clientId || '').trim() || ('serial_studio_' + Math.random().toString(16).substring(2, 8)),
          clean: cfg.clean !== false,
          connectTimeout: 5000,
          reconnectPeriod: 0,
          ...getProtocolOptions(cfg.version),
        };

        if (cfg.username) options.username = cfg.username;
        if (cfg.password) options.password = cfg.password;

        this._client = window.mqtt.connect(brokerUrl, options);

        this._client.on('connect', () => {
          const shouldSubscribe = (cfg.mode || 'PubSub') !== 'PublishOnly';
          if (shouldSubscribe) {
            const topic = (cfg.topic || '').trim();
            if (!topic) {
              if (!settled) {
                settled = true;
                reject(new Error('MQTT topic is required for subscribe mode.'));
              }
              this._client?.end(true);
              return;
            }

            this._client.subscribe(topic, { qos: Number(cfg.qos) || 0 }, (err) => {
              if (err) {
                this._emit('error', err);
                if (!settled) {
                  settled = true;
                  reject(new Error(`MQTT subscribe failed: ${err.message || err}`));
                }
                this._client?.end(true);
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

        this._client.on('message', (topic, message) => {
          this._emit('data', messageToBytes(message));
        });

        this._client.on('error', (e) => {
          this._emit('error', e);
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT connection failed (${brokerUrl}). Browser mode requires a WebSocket MQTT endpoint.`));
          }
        });

        this._client.on('close', () => {
          this._emit('close');
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT connection closed before handshake completed (${brokerUrl}).`));
          }
        });

        this._client.on('offline', () => {
          if (!settled) {
            settled = true;
            reject(new Error(`MQTT client went offline while connecting (${brokerUrl}).`));
          }
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  async send(data) {
    if (!this._client || !this._client.connected) {
      throw new Error('MQTT not connected');
    }
    const cfg = appState.mqttConfig;
    const topic = (cfg.topic || '').trim();
    if (!topic) throw new Error('MQTT topic is required');
    this._client.publish(topic, data, {
      qos: Number(cfg.qos) || 0,
      retain: !!cfg.retain
    });
  }

  async disconnect() {
    if (this._client) {
      this._client.end(true);
      this._client = null;
    }
  }
}
