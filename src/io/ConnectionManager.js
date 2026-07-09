/**
 * ConnectionManager — Manages connection lifecycle and routes data
 */
import { eventBus } from '../core/EventBus.js';
import { appState, BusType, ConnectionState, OperationMode } from '../core/AppState.js';
import { busLabel, t } from '../core/i18n.js';
import { FrameParser } from '../core/FrameParser.js?v=full-frame-parser-20260708-1';
import { SerialDriver } from './SerialDriver.js?v=protocol-editor-v6-20260706-1';
import { WebSocketDriver } from './WebSocketDriver.js';
import { MqttDriver } from './MqttDriver.js?v=electron-mqtt-tcp-20260709-1';
import { UdpDriver } from './UdpDriver.js?v=multi-udp-gateway-routing-20260619-2';

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

export class ConnectionManager {
  constructor() {
    this._driver = null;
    this._parser = new FrameParser();
    this._mqttParsers = new Map();
    this._udpParsers = new Map();
    this._connectHandler = (data) => this._handleDriverData(data);
    this._statusHandler = (status) => eventBus.emit('gateway:status', status);
    this._gatewayCommandUnsubscribe = eventBus.on('gateway:command', (command) => {
      if (appState.busType !== BusType.UDP || !this._driver?.sendControl) return;
      this._driver.sendControl(command).catch((error) => {
        eventBus.emit('gateway:status', { type: 'gateway.error', message: error.message || String(error) });
      });
    });
    this._projectCommandUnsubscribe = eventBus.on('project:sendCommand', (message = {}) => {
      const data = message?.data instanceof Uint8Array
        ? message.data
        : (message?.data instanceof ArrayBuffer ? new Uint8Array(message.data) : message?.data);
      this.sendData(data).catch((error) => {
        eventBus.emit('toast', { type: 'error', message: t('messages.sendFailed', { error: error?.message || error }) });
      });
    });
    this._errorHandler = (err) => {
      console.error('Driver error:', err);
      eventBus.emit('toast', { type: 'error', message: t('messages.connectionError', { error: err.message || err }) });
    };
    this._closeHandler = () => {
      if (!this._disconnecting) this.disconnect();
    };
    this._disconnecting = false;
  }

  get isConnected() { return appState.isConnected; }

  _handleDriverData(data) {
    if (appState.busType === BusType.MQTT && data && typeof data === 'object' && data.payload) {
      this._processMqttData(data);
      return;
    }

    if (appState.busType === BusType.UDP && data && typeof data === 'object' && data.payload) {
      this._processUdpData(data);
      return;
    }

    this._parser.processData(data);
  }

  _sourceMatchesSubscription(source, packet) {
    const sourceId = source?.sourceId;
    if (packet.sourceId !== undefined && packet.sourceId !== null && packet.sourceId !== '') {
      return String(sourceId) === String(packet.sourceId);
    }

    const topic = String(packet.topic || '');
    const sourceTopic = String(source?.topic || source?.mqttTopic || '');
    return sourceTopic && mqttTopicMatches(sourceTopic, topic);
  }

  _sourceForMqttPacket(packet) {
    const sources = Array.isArray(appState.project?.sources) ? appState.project.sources : [];
    return sources.find((source) => this._sourceMatchesSubscription(source, packet)) || null;
  }

  _mqttParserForPacket(packet) {
    const source = this._sourceForMqttPacket(packet);
    const sourceId = packet.sourceId ?? source?.sourceId ?? packet.topic ?? 'default';
    const key = String(sourceId);
    if (!this._mqttParsers.has(key)) {
      this._mqttParsers.set(key, new FrameParser({
        operationMode: OperationMode.ProjectFile,
        project: appState.project,
        source,
        sourceId,
        topic: packet.topic
      }));
    }
    return this._mqttParsers.get(key);
  }

  _processMqttData(packet) {
    const parser = this._mqttParserForPacket(packet);
    parser.processData(packet.payload, {
      topic: packet.topic,
      sourceId: packet.sourceId,
      subscription: packet.subscription
    });
  }

  _sourceForUdpPacket(packet) {
    const sources = Array.isArray(appState.project?.sources) ? appState.project.sources : [];
    return sources.find((source) => String(source?.sourceId ?? '') === String(packet.sourceId ?? '')) || null;
  }

  _udpParserForPacket(packet) {
    const source = this._sourceForUdpPacket(packet);
    const sourceId = packet.sourceId ?? source?.sourceId ?? `${packet.sourceIp || 'udp'}:${packet.sourcePort || 0}`;
    const key = String(sourceId);
    if (!this._udpParsers.has(key)) {
      this._udpParsers.set(key, new FrameParser({
        operationMode: appState.operationMode,
        project: appState.project,
        source,
        sourceId
      }));
    }
    return this._udpParsers.get(key);
  }

  _processUdpData(packet) {
    const parser = this._udpParserForPacket(packet);
    parser.processData(packet.payload, {
      sourceId: packet.sourceId,
      sourceIp: packet.sourceIp,
      sourcePort: packet.sourcePort,
      sequence: packet.sequence,
      frameNumber: packet.frameNumber,
      deviceSequence: packet.deviceSequence,
      gatewayTimestamp: packet.timestamp
    });
  }

  async connect() {
    if (appState.isConnected) return;

    try {
      appState.connectionState = ConnectionState.Connecting;
      this._parser.reset();
      this._mqttParsers.forEach((parser) => parser.destroy());
      this._mqttParsers.clear();
      this._udpParsers.forEach((parser) => parser.destroy());
      this._udpParsers.clear();

      const bus = appState.busType;
      if (bus === BusType.Serial) {
        this._driver = new SerialDriver();
      } else if (bus === BusType.WebSocket) {
        this._driver = new WebSocketDriver();
      } else if (bus === BusType.MQTT) {
        this._driver = new MqttDriver();
      } else if (bus === BusType.UDP) {
        this._driver = new UdpDriver();
      } else {
        // Fallback to simulated driver for demo
        this._driver = null;
        appState.connectionState = ConnectionState.Error;
        eventBus.emit('toast', { type: 'error', message: t('messages.driverUnavailable', { bus: busLabel(bus) }) });
        return;
      }

      this._parser.startStats();
      this._driver.on('data', this._connectHandler);
      this._driver.on('status', this._statusHandler);
      this._driver.on('error', this._errorHandler);
      this._driver.on('close', this._closeHandler);

      await this._driver.connect();
      appState.connectionState = ConnectionState.Connected;
      eventBus.emit('toast', { type: 'success', message: t('messages.connected') });

    } catch (err) {
      console.error('Connection failed:', err);
      if (this._driver) {
        const driver = this._driver;
        this._driver = null;
        driver.off?.('data', this._connectHandler);
        driver.off?.('status', this._statusHandler);
        driver.off?.('error', this._errorHandler);
        driver.off?.('close', this._closeHandler);
        await driver.disconnect?.().catch((error) => console.warn('Disconnect after failed connect error:', error));
      }
      this._parser.stopStats();
      appState.connectionState = ConnectionState.Error;
      setTimeout(() => {
        appState.connectionState = ConnectionState.Disconnected;
      }, 2000);
      eventBus.emit('toast', { type: 'error', message: t('messages.failedConnect', { error: err.message || err }) });
    }
  }

  async disconnect() {
    if (this._disconnecting) return;
    this._disconnecting = true;
    try {
      if (this._driver) {
        const driver = this._driver;
        this._driver = null;
        driver.off?.('data', this._connectHandler);
        driver.off?.('status', this._statusHandler);
        driver.off?.('error', this._errorHandler);
        driver.off?.('close', this._closeHandler);
        await driver.disconnect();
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
    this._parser.stopStats();
    this._mqttParsers.forEach((parser) => parser.destroy());
    this._mqttParsers.clear();
    this._udpParsers.forEach((parser) => parser.destroy());
    this._udpParsers.clear();
    eventBus.emit('gateway:status', { type: 'gateway.disconnected' });
    appState.connectionState = ConnectionState.Disconnected;
    eventBus.emit('toast', { type: 'info', message: t('messages.disconnected') });
    this._disconnecting = false;
  }

  async toggleConnection() {
    if (appState.isConnected) {
      await this.disconnect();
    } else {
      await this.connect();
    }
  }

  async sendData(data) {
    if (!this._driver || !appState.isConnected) return;
    try {
      await this._driver.send(data);
      eventBus.emit('console:data', { data, direction: 'tx', timestamp: Date.now() });
    } catch (err) {
      eventBus.emit('toast', { type: 'error', message: t('messages.sendFailed', { error: err.message }) });
    }
  }

  destroy() {
    this._gatewayCommandUnsubscribe?.();
    this._projectCommandUnsubscribe?.();
    this.disconnect();
    this._parser.destroy();
    this._mqttParsers.forEach((parser) => parser.destroy());
    this._mqttParsers.clear();
    this._udpParsers.forEach((parser) => parser.destroy());
    this._udpParsers.clear();
  }
}
