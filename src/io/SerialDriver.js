/**
 * SerialDriver — Web Serial API driver
 */
import { appState } from '../core/AppState.js';

export class SerialDriver {
  constructor() {
    this._port = null;
    this._reader = null;
    this._writer = null;
    this._reading = false;
    this._callbacks = { data: [], error: [], close: [] };
  }

  on(event, cb) { this._callbacks[event]?.push(cb); }
  off(event, cb) {
    if (!this._callbacks[event]) return;
    this._callbacks[event] = this._callbacks[event].filter(c => c !== cb);
  }
  _emit(event, data) { this._callbacks[event]?.forEach(cb => cb(data)); }

  async connect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API not supported. Please use Chrome or Edge.');
    }

    this._port = await navigator.serial.requestPort();
    const cfg = appState.serialConfig;
    await this._port.open({
      baudRate: cfg.baudRate,
      dataBits: cfg.dataBits,
      stopBits: cfg.stopBits,
      parity: cfg.parity,
      flowControl: cfg.flowControl
    });

    this._reading = true;
    this._readLoop();
  }

  async _readLoop() {
    const decoder = new TextDecoder();
    while (this._port?.readable && this._reading) {
      this._reader = this._port.readable.getReader();
      try {
        while (this._reading) {
          const { value, done } = await this._reader.read();
          if (done) break;
          if (value) {
            this._emit('data', value);
          }
        }
      } catch (err) {
        if (this._reading) this._emit('error', err);
      } finally {
        try { this._reader.releaseLock(); } catch (e) { /* ignore */ }
        this._reader = null;
      }
    }
    if (this._reading) {
      this._reading = false;
      this._emit('close');
    }
  }

  async send(data) {
    if (!this._port?.writable) throw new Error('Port not writable');
    const writer = this._port.writable.getWriter();
    try {
      const payload = data instanceof Uint8Array
        ? data
        : (data instanceof ArrayBuffer ? new Uint8Array(data) : new TextEncoder().encode(String(data)));
      await writer.write(payload);
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect() {
    this._reading = false;
    try {
      if (this._reader) {
        await this._reader.cancel();
        this._reader.releaseLock();
      }
    } catch (e) { /* ignore */ }
    try {
      if (this._port) await this._port.close();
    } catch (e) { /* ignore */ }
    this._port = null;
    this._reader = null;
  }
}
