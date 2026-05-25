/**
 * DataSimulator - Built-in data generator for demo mode
 */
import { eventBus } from '../core/EventBus.js';
import { appState, ConnectionState } from '../core/AppState.js';
import { t } from '../core/i18n.js';
import { FrameParser } from '../core/FrameParser.js?v=fft-analysis-20260525-1';

export class DataSimulator {
  constructor() {
    this._running = false;
    this._timer = null;
    this._parser = new FrameParser();
    this._t = 0;
    this._fps = 20; // 20 Hz update rate
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._t = 0;
    this._parser.reset();
    this._parser.startStats();
    appState.connectionState = ConnectionState.Connected;
    eventBus.emit('toast', { type: 'success', message: t('messages.demoRunning') });

    this._timer = setInterval(() => {
      this._t += 0.05;
      const data = this._generateFrame();
      this._parser.processData(data);
    }, 1000 / this._fps);
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    clearInterval(this._timer);
    this._timer = null;
    this._parser.stopStats();
    appState.connectionState = ConnectionState.Disconnected;
    eventBus.emit('toast', { type: 'info', message: t('messages.demoStopped') });
  }

  toggle() {
    if (this._running) this.stop();
    else this.start();
  }

  get isRunning() { return this._running; }

  _generateFrame() {
    if (appState.operationMode === 'STM32Binary') {
      return this._generateSTM32Frame();
    }

    const temp = 24 + Math.sin(this._t * 1.2) * 6;
    const humidity = 58 + Math.cos(this._t * 0.8) * 12;
    const pressure = 1012 + Math.sin(this._t * 0.35) * 8;
    const accelX = Math.sin(this._t * 2.6) * 1.1;
    const accelY = Math.cos(this._t * 2.1) * 0.9;
    const accelZ = 9.81 + Math.sin(this._t * 1.7) * 0.3;
    const heading = (this._t * 24) % 360;
    const voltage = 3.7 + Math.sin(this._t * 0.25) * 0.08;

    const csv = [
      temp.toFixed(2),
      humidity.toFixed(1),
      pressure.toFixed(1),
      accelX.toFixed(3),
      accelY.toFixed(3),
      accelZ.toFixed(3),
      heading.toFixed(1),
      voltage.toFixed(3)
    ].join(',') + '\n';

    const encoder = new TextEncoder();
    return encoder.encode(csv);
  }

  _generateSTM32Frame() {
    const protocol = String(appState.project?.protocol || '').toLowerCase();
    return protocol === 'stm32binaryv2'
      ? this._generateSTM32V2Frame()
      : this._generateSTM32LegacyFrame();
  }

  _generateSTM32LegacyFrame() {
    const FRAME_SIZE = 5732;
    const buffer = new Uint8Array(FRAME_SIZE);
    const view = new DataView(buffer.buffer);

    // Header
    buffer.set([0x5A, 0xA5, 0x16, 0x5D, 0x02, 0xDD, 0x08, 0x54, 0x00, 0xA0, 0x00, 0x02], 0);

    // Vibration (uint16_t[2132]) - Sine wave + noise
    for (let i = 0; i < 2132; i++) {
      const val = 2048 + Math.sin(this._t * 5 + i * 0.05) * 1000 + (Math.random() - 0.5) * 100;
      view.setUint16(12 + i * 2, Math.floor(val), true);
    }

    const setSigned24 = (offset, value) => {
      const raw = Math.max(-0x800000, Math.min(0x7FFFFF, Math.round(value)));
      const unsigned = raw < 0 ? raw + 0x1000000 : raw;
      buffer[offset] = (unsigned >> 16) & 0xFF;
      buffer[offset + 1] = (unsigned >> 8) & 0xFF;
      buffer[offset + 2] = unsigned & 0xFF;
    };

    for (let i = 0; i < 160; i++) {
      setSigned24(4276 + i * 3, Math.sin(this._t * 2 + i * 0.02) * 220000);
      setSigned24(4756 + i * 3, Math.cos(this._t * 1.5 + i * 0.02) * 180000);
      setSigned24(5236 + i * 3, Math.sin(this._t * 3 + i * 0.01) * 200000);
    }

    setSigned24(5716, 900000 + Math.sin(this._t * 0.1) * 80000);
    view.setInt16(5719, Math.round((30 + Math.cos(this._t * 0.1) * 3) / 0.0078125), false);

    // Tail
    buffer.set([0xDD, 0xEE], 5730);

    return buffer;
  }

  _generateSTM32V2Frame() {
    const FRAME_SIZE = 1468;
    const STRAIN_SAMPLES = 160;
    const STRAIN1_OFFSET = 12;
    const STRAIN2_OFFSET = 492;
    const STRAIN3_OFFSET = 972;
    const TEMP_OFFSET = 1452;
    const TAIL_OFFSET = 1466;
    const buffer = new Uint8Array(FRAME_SIZE);

    // Header
    buffer.set([0x5A, 0xA5, 0xB5, 0x0A, 0x02, 0xDD, 0x80, 0x02, 0xA0, 0x00, 0x01, 0x00], 0);

    const setSigned24 = (offset, value) => {
      const raw = Math.max(-0x800000, Math.min(0x7FFFFF, Math.round(value)));
      const unsigned = raw < 0 ? raw + 0x1000000 : raw;
      buffer[offset] = (unsigned >> 16) & 0xFF;
      buffer[offset + 1] = (unsigned >> 8) & 0xFF;
      buffer[offset + 2] = unsigned & 0xFF;
    };

    const temperatureToAds124S08Code = (temperatureC) => {
      const A = 3.9083e-3;
      const B = -5.775e-7;
      return (1 + (A * temperatureC) + (B * temperatureC * temperatureC)) / 2.980232e-6;
    };

    // Strain 1, 2, 3 (160 samples each, signed 24-bit big-endian).
    for (let i = 0; i < STRAIN_SAMPLES; i++) {
      const s1 = Math.sin(this._t * 2 + i * 0.04) * 220000;
      const s2 = Math.cos(this._t * 1.5 + i * 0.035) * 180000;
      const s3 = Math.sin(this._t * 3 + i * 0.03 + 0.8) * 200000;
      setSigned24(STRAIN1_OFFSET + i * 3, s1);
      setSigned24(STRAIN2_OFFSET + i * 3, s2);
      setSigned24(STRAIN3_OFFSET + i * 3, s3);
    }

    // Temperature (one 24-bit ADS124S08 RTD code; remaining payload is zero padding).
    setSigned24(TEMP_OFFSET, temperatureToAds124S08Code(27 + Math.cos(this._t * 0.1) * 2));

    // Tail
    buffer.set([0xDD, 0xEE], TAIL_OFFSET);

    return buffer;
  }

  destroy() {
    this.stop();
    this._parser.destroy();
  }
}
