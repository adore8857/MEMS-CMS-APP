/**
 * ConnectionManager — Manages connection lifecycle and routes data
 */
import { eventBus } from '../core/EventBus.js';
import { appState, BusType, ConnectionState } from '../core/AppState.js';
import { busLabel, t } from '../core/i18n.js';
import { FrameParser } from '../core/FrameParser.js?v=protocol-plugin-20260427-1';
import { SerialDriver } from './SerialDriver.js';
import { WebSocketDriver } from './WebSocketDriver.js';
import { MqttDriver } from './MqttDriver.js';
import { UdpDriver } from './UdpDriver.js';

export class ConnectionManager {
  constructor() {
    this._driver = null;
    this._parser = new FrameParser();
    this._connectHandler = (data) => this._parser.processData(data);
  }

  get isConnected() { return appState.isConnected; }

  async connect() {
    if (appState.isConnected) return;

    try {
      appState.connectionState = ConnectionState.Connecting;
      this._parser.reset();

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
      this._driver.on('error', (err) => {
        console.error('Driver error:', err);
        eventBus.emit('toast', { type: 'error', message: t('messages.connectionError', { error: err.message || err }) });
      });
      this._driver.on('close', () => {
        this.disconnect();
      });

      await this._driver.connect();
      appState.connectionState = ConnectionState.Connected;
      eventBus.emit('toast', { type: 'success', message: t('messages.connected') });

    } catch (err) {
      console.error('Connection failed:', err);
      this._parser.stopStats();
      appState.connectionState = ConnectionState.Error;
      setTimeout(() => {
        appState.connectionState = ConnectionState.Disconnected;
      }, 2000);
      eventBus.emit('toast', { type: 'error', message: t('messages.failedConnect', { error: err.message || err }) });
    }
  }

  async disconnect() {
    try {
      if (this._driver) {
        this._driver.off('data', this._connectHandler);
        await this._driver.disconnect();
        this._driver = null;
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
    this._parser.stopStats();
    appState.connectionState = ConnectionState.Disconnected;
    eventBus.emit('toast', { type: 'info', message: t('messages.disconnected') });
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
    this.disconnect();
    this._parser.destroy();
  }
}
