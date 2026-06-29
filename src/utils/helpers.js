/**
 * Utility functions — colors, formatters, CSV export
 */

// ── Dataset Colors ──
export const DATASET_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1',
  '#a855f7', '#84cc16', '#e11d48', '#0ea5e9', '#d946ef'
];

export function getDatasetColor(index) {
  return DATASET_COLORS[index % DATASET_COLORS.length];
}

export function getDatasetColorAlpha(index, alpha = 0.2) {
  const hex = DATASET_COLORS[index % DATASET_COLORS.length];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Number Formatting ──
export function formatValue(val, min = 0, max = 100) {
  const abs = Math.abs(val);
  let decimals;
  if (abs >= 1e4) decimals = 0;
  else if (abs >= 1e2) decimals = 1;
  else if (abs >= 1) decimals = 2;
  else if (abs >= 0.01) decimals = 4;
  else decimals = 6;
  return val.toFixed(decimals);
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export function formatTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

// ── CSV Export ──
export class CSVExporter {
  constructor() {
    this._headers = [];
    this._rows = [];
    this._recording = false;
  }

  start(headers) {
    this._headers = ['Timestamp', ...headers];
    this._rows = [];
    this._recording = true;
  }

  addRow(values) {
    if (!this._recording) return;
    this._rows.push([formatTime(Date.now()), ...values]);
  }

  stop() {
    this._recording = false;
  }

  download(filename = 'serial-studio-export') {
    const csv = [this._headers.join(','), ...this._rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  get isRecording() { return this._recording; }
  get rowCount() { return this._rows.length; }
}

// ── SVG Icon Helper ──
export const Icons = {
  serial: '⚡', network: '🌐', mqtt: '📡',
  connect: '🔌', disconnect: '⛓️‍💥', play: '▶', pause: '⏸', stop: '⏹',
  settings: '⚙️', project: '📁', editor: '✏️', csv: '📊',
  console: '💻', dashboard: '📈', refresh: '🔄', download: '⬇️',
  close: '✕', minimize: '─', maximize: '□', menu: '☰',
  add: '+', remove: '−', info: 'ℹ', warning: '⚠',
  gauge: '🔘', compass: '🧭', led: '💡', chart: '📉',
  gps: '📍', accel: '📐', gyro: '🔄', fft: '〰️',
  grid: '▦', bar: '▮', sim: '🎲', send: '↗',
  clear: '🗑', copy: '📋', expand: '⤢', collapse: '⤡'
};
