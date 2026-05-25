/**
 * ConnectionManager — Manages connection lifecycle and routes data
 */
import { eventBus } from '../core/EventBus.js';
import { appState, BusType, ConnectionState } from '../core/AppState.js';
import { busLabel, t } from '../core/i18n.js';
import { FrameParser } from '../core/FrameParser.js?v=fft-analysis-20260525-1';
import { SerialDriver } from './SerialDriver.js';
import { WebSocketDriver } from './WebSocketDriver.js';
import { MqttDriver } from './MqttDriver.js?v=mqtt-check-20260519-1';
import { UdpDriver } from './UdpDriver.js';

export class ConnectionManager {
  constructor() {
    this._driver = null;
    this._parser = new FrameParser();
    this._connectHandler = (data) => this._parser.processData(data);
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
        driver.off?.('error', this._errorHandler);
        driver.off?.('close', this._closeHandler);
        await driver.disconnect();
      }
    } catch (e) {
      console.warn('Disconnect error:', e);
    }
    this._parser.stopStats();
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
    this.disconnect();
    this._parser.destroy();
  }
}
