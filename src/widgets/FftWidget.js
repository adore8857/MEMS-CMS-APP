/**
 * FftWidget - engineering-oriented frequency magnitude view for sampled data.
 */
import FFT from 'https://cdn.jsdelivr.net/npm/fft.js@4.0.4/lib/fft.js/+esm';
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';
import { getDatasetColor } from '../utils/helpers.js';

const FFT_SIZES = [128, 256, 512, 1024];
const DB_FLOOR = -120;

function fftSizeFor(dataset) {
  const size = Number(dataset.fftPoints);
  return FFT_SIZES.includes(size) ? size : 128;
}

function positiveNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
}

function formatFrequency(value) {
  if (!Number.isFinite(value)) return '--';
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)} kHz`;
  return `${value.toFixed(value >= 100 ? 1 : 2)} Hz`;
}

function formatAmplitude(value, mode) {
  if (!Number.isFinite(value)) return '--';
  return mode === 'db' ? `${value.toFixed(1)} dB` : value.toPrecision(4);
}

export class FftWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'FFT', icon: 'FFT', ...config });
    this._datasets = config.datasets || [];
    this._histories = this._datasets.map(() => []);
    this._spectra = this._datasets.map(() => null);
    this._engines = new Map();
    this._canvas = null;
    this._ctx = null;
    this._raf = null;
  }

  _render(body) {
    body.style.padding = '8px';
    this._canvas = document.createElement('canvas');
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    body.appendChild(this._canvas);
    this._resizeCanvas();
    this._draw();
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', (frame) => {
      if (this._destroyed) return;
      this._datasets.forEach((dataset, index) => {
        const received = frame.datasets?.[dataset.index];
        if (!received) return;
        const incoming = Array.isArray(received.buffer) && received.buffer.length
          ? received.buffer.map(Number).filter(Number.isFinite)
          : [Number(received.value)].filter(Number.isFinite);
        if (!incoming.length) return;

        const size = fftSizeFor(dataset);
        const history = this._histories[index];
        history.push(...incoming);
        if (history.length > size) history.splice(0, history.length - size);
        if (history.length < size) {
          this._spectra[index] = {
            pending: true,
            received: history.length,
            size,
            sampleRate: positiveNumber(received.sampleRate, dataset.fftSampleRate)
          };
          return;
        }

        this._spectra[index] = this._computeSpectrum(history, dataset, received);
      });
      this._scheduleDraw();
    });
  }

  _computeSpectrum(samples, dataset, received) {
    const n = fftSizeFor(dataset);
    const sampleRate = positiveNumber(received.sampleRate, dataset.fftSampleRate);
    const windowName = String(dataset.fftWindow || 'Hann').toLowerCase();
    const magnitudeMode = String(dataset.fftMagnitudeMode || 'linear').toLowerCase() === 'db' ? 'db' : 'linear';
    const mean = samples.reduce((sum, value) => sum + value, 0) / n;
    const input = new Array(n);
    let windowSum = 0;

    for (let i = 0; i < n; i += 1) {
      const windowValue = windowName === 'none'
        ? 1
        : 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
      windowSum += windowValue;
      input[i] = (samples[i] - mean) * windowValue;
    }

    let engine = this._engines.get(n);
    if (!engine) {
      engine = new FFT(n);
      this._engines.set(n, engine);
    }

    const output = engine.createComplexArray();
    engine.realTransform(output, input);
    const gain = Math.max(windowSum / n, Number.EPSILON);
    const bins = [];

    for (let bin = 1; bin <= n / 2; bin += 1) {
      const real = output[bin * 2] || 0;
      const imag = output[(bin * 2) + 1] || 0;
      const correction = bin === n / 2 ? 1 : 2;
      const magnitude = correction * Math.hypot(real, imag) / (n * gain);
      const displayMagnitude = magnitudeMode === 'db'
        ? Math.max(DB_FLOOR, 20 * Math.log10(Math.max(magnitude, Number.EPSILON)))
        : magnitude;
      bins.push({
        bin,
        frequency: sampleRate ? (bin * sampleRate) / n : bin,
        magnitude,
        displayMagnitude
      });
    }

    const peak = bins.reduce((best, point) => (
      !best || point.magnitude > best.magnitude ? point : best
    ), null);

    return {
      bins,
      peak,
      n,
      sampleRate,
      magnitudeMode,
      amplitudeUnit: String(dataset.fftAmplitudeUnit || dataset.units || '').trim(),
      windowName: windowName === 'none' ? 'None' : 'Hann'
    };
  }

  _scheduleDraw() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this._draw();
    });
  }

  _resizeCanvas() {
    if (!this._canvas) return;
    const rect = this._canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    if (this._canvas.width !== width || this._canvas.height !== height) {
      this._canvas.width = width;
      this._canvas.height = height;
    }
    this._ctx = this._canvas.getContext('2d');
  }

  _draw() {
    this._resizeCanvas();
    const ctx = this._ctx;
    const canvas = this._canvas;
    if (!ctx || !canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const laneHeight = h / Math.max(1, this._datasets.length);

    this._spectra.forEach((spectrum, index) => {
      const top = laneHeight * index;
      const dataset = this._datasets[index];
      const color = getDatasetColor(index);
      const left = 72 * ratio;
      const right = 12 * ratio;
      const chartTop = top + (28 * ratio);
      const chartBottom = top + laneHeight - (39 * ratio);
      const chartWidth = Math.max(1, w - left - right);
      const chartHeight = Math.max(1, chartBottom - chartTop);

      ctx.font = `${11 * ratio}px sans-serif`;
      ctx.fillStyle = 'rgba(203,213,225,.92)';
      ctx.fillText(dataset?.title || `Ch ${index + 1}`, 8 * ratio, top + 16 * ratio);

      if (!spectrum || spectrum.pending) {
        ctx.fillStyle = 'rgba(148,163,184,.75)';
        const text = spectrum?.pending
          ? `Collecting ${spectrum.received}/${spectrum.size} samples`
          : 'Waiting for samples';
        ctx.fillText(text, left, chartTop + 18 * ratio);
        return;
      }

      const values = spectrum.bins.map((point) => point.displayMagnitude);
      const yAxisTitle = spectrum.magnitudeMode === 'db'
        ? `dB${spectrum.amplitudeUnit ? ` re 1 ${spectrum.amplitudeUnit}` : ''}`
        : (spectrum.amplitudeUnit || 'Amplitude');
      const maxValue = spectrum.magnitudeMode === 'db'
        ? Math.max(...values, 0)
        : Math.max(...values, Number.EPSILON);
      const minValue = spectrum.magnitudeMode === 'db'
        ? Math.max(DB_FLOOR, maxValue - 80)
        : 0;
      const range = Math.max(maxValue - minValue, Number.EPSILON);

      ctx.strokeStyle = 'rgba(148,163,184,.13)';
      ctx.lineWidth = ratio;
      ctx.save();
      ctx.translate(10 * ratio, chartTop + chartHeight / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(148,163,184,.88)';
      ctx.fillText(yAxisTitle, 0, 0);
      ctx.restore();
      for (let tick = 0; tick <= 2; tick += 1) {
        const y = chartTop + (chartHeight * tick / 2);
        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + chartWidth, y);
        ctx.stroke();
        const yValue = maxValue - (range * tick / 2);
        ctx.fillStyle = 'rgba(148,163,184,.82)';
        ctx.fillText(spectrum.magnitudeMode === 'db' ? yValue.toFixed(0) : yValue.toPrecision(2), 4 * ratio, y + 4 * ratio);
      }

      const count = spectrum.bins.length;
      const gap = Math.min(2 * ratio, chartWidth / Math.max(2, count * 3));
      const barWidth = Math.max(1, (chartWidth - gap * (count - 1)) / count);
      ctx.fillStyle = color;
      spectrum.bins.forEach((point, binIndex) => {
        const height = Math.max(1, ((point.displayMagnitude - minValue) / range) * chartHeight);
        const x = left + binIndex * (barWidth + gap);
        ctx.fillRect(x, chartBottom - height, barWidth, height);
      });

      ctx.fillStyle = 'rgba(148,163,184,.88)';
      const xMax = spectrum.sampleRate ? spectrum.sampleRate / 2 : spectrum.n / 2;
      const xLabels = [0, xMax / 2, xMax];
      xLabels.forEach((label, tick) => {
        const x = left + (chartWidth * tick / 2);
        const text = spectrum.sampleRate ? formatFrequency(label) : `bin ${label.toFixed(0)}`;
        const align = tick === 0 ? 'left' : tick === 2 ? 'right' : 'center';
        ctx.textAlign = align;
        ctx.fillText(text, x, chartBottom + 16 * ratio);
      });
      ctx.textAlign = 'center';
      ctx.fillText(spectrum.sampleRate ? 'Frequency (Hz)' : 'Frequency (bin)', left + chartWidth / 2, chartBottom + 31 * ratio);
      ctx.textAlign = 'left';

      if (spectrum.peak) {
        const magnitude = spectrum.magnitudeMode === 'db'
          ? `${spectrum.peak.displayMagnitude.toFixed(1)} dB${spectrum.amplitudeUnit ? ` re 1 ${spectrum.amplitudeUnit}` : ''}`
          : `${formatAmplitude(spectrum.peak.displayMagnitude, spectrum.magnitudeMode)}${spectrum.amplitudeUnit ? ` ${spectrum.amplitudeUnit}` : ''}`;
        const peakFrequency = spectrum.sampleRate ? formatFrequency(spectrum.peak.frequency) : `bin ${spectrum.peak.bin}`;
        const label = `Peak ${peakFrequency}  ${magnitude}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'right';
        ctx.fillText(label, w - right, top + 16 * ratio);
        ctx.textAlign = 'left';
      }
    });
  }

  _onResize() {
    this._draw();
  }

  reset() {
    this._histories = this._datasets.map(() => []);
    this._spectra = this._datasets.map(() => null);
    this._draw();
  }

  destroy() {
    if (this._raf) cancelAnimationFrame(this._raf);
    super.destroy();
  }
}
