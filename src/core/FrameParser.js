/**
 * FrameParser - Frame detection and data parsing
 */
import { eventBus } from './EventBus.js';
import { appState, OperationMode } from './AppState.js';

export class FrameParser {
  constructor() {
    this._buffer = new Uint8Array(0);
    this._frameCount = 0;
    this._frameRateCounter = 0;
    this._frameRateTimer = null;
    this._projectParserWorker = null;
    this._projectParserKey = '';
    this._projectParserSeq = 0;
    this._projectParserPending = new Map();
  }

  startStats() {
    if (this._frameRateTimer) return;
    this._frameRateCounter = 0;
    appState.dataRate = 0;
    this._frameRateTimer = setInterval(() => {
      appState.dataRate = this._frameRateCounter;
      this._frameRateCounter = 0;
    }, 1000);
  }

  stopStats({ resetRate = true } = {}) {
    if (this._frameRateTimer) {
      clearInterval(this._frameRateTimer);
      this._frameRateTimer = null;
    }
    this._frameRateCounter = 0;
    if (resetRate) appState.dataRate = 0;
  }

  destroy() {
    this.stopStats();
    this._terminateProjectParserWorker();
  }

  /**
   * Feed raw data into parser. Emits 'frame:received' for each complete frame.
   */
  processData(newData) {
    // newData is expected to be Uint8Array from drivers
    if (!(newData instanceof Uint8Array)) {
      if (typeof newData === 'string') {
        const encoder = new TextEncoder();
        newData = encoder.encode(newData);
      } else {
        return;
      }
    }

    // Emit raw data for console (convert to string for display if needed)
    eventBus.emit('console:data', { data: newData, direction: 'rx', timestamp: Date.now() });

    // Append to buffer
    const combined = new Uint8Array(this._buffer.length + newData.length);
    combined.set(this._buffer);
    combined.set(newData, this._buffer.length);
    this._buffer = combined;

    this._parse();
  }

  _hexToBytes(hex) {
    if (!hex || hex.length % 2 !== 0) return null;

    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.slice(i, i + 2), 16);
      if (Number.isNaN(byte)) return null;
      out[i / 2] = byte;
    }

    return out;
  }

  _parse() {
    const mode = appState.operationMode;

    if (mode === OperationMode.DeviceSendsJSON) {
      this._parseJSON();
    } else if (mode === OperationMode.QuickPlot) {
      this._parseCSV();
    } else if (mode === OperationMode.ProjectFile) {
      this._parseProjectFile();
    } else {
      this._parseWithDelimiters();
    }
  }

  _projectProtocol() {
    return String(appState.project?.protocol || '').trim().toLowerCase();
  }

  _parseProjectFile() {
    const protocol = this._projectProtocol();
    if (protocol === 'json' || protocol === 'devicesendsjson') {
      this._parseJSON();
      return;
    }

    this._parseWithDelimiters();
  }

  _projectFrameParserCode() {
    const project = appState.project || {};
    const firstSource = Array.isArray(project.sources) ? project.sources[0] : null;
    return String(
      firstSource?.frameParserCode ||
      firstSource?.frameParser ||
      project.frameParserCode ||
      project.frameParser ||
      ''
    ).trim();
  }

  _projectFrameParserLanguage() {
    const project = appState.project || {};
    const firstSource = Array.isArray(project.sources) ? project.sources[0] : null;
    return firstSource?.frameParserLanguage ?? project.frameParserLanguage ?? 0;
  }

  _hasProjectFrameParser() {
    if (appState.operationMode !== OperationMode.ProjectFile) return false;
    return this._projectFrameParserCode().length > 0;
  }

  _projectParserIndexBase() {
    const indices = [];
    (appState.project?.groups || []).forEach((group) => {
      (group.datasets || []).forEach((dataset) => {
        if (Number.isInteger(dataset.index)) indices.push(dataset.index);
      });
    });

    if (!indices.length) return 0;
    return Math.min(...indices) >= 1 ? 1 : 0;
  }

  _projectDatasetByIndex() {
    const map = new Map();
    (appState.project?.groups || []).forEach((group) => {
      (group.datasets || []).forEach((dataset) => {
        if (Number.isInteger(dataset.index)) map.set(dataset.index, dataset);
      });
    });
    return map;
  }

  _ensureProjectParserWorker() {
    const code = this._projectFrameParserCode();
    if (!code) return false;

    const language = this._projectFrameParserLanguage();
    const key = `${language}:${code}`;
    if (this._projectParserWorker && this._projectParserKey === key) {
      return true;
    }

    this._terminateProjectParserWorker();
    if (language !== 0) {
      console.warn('FrameParser: Web Worker parser currently supports JavaScript project parsers only.');
      return false;
    }

    try {
      this._projectParserWorker = new Worker(new URL('./FrameParserWorker.js', import.meta.url), { type: 'module' });
      this._projectParserKey = key;
      this._projectParserWorker.onmessage = (event) => this._handleProjectParserMessage(event.data);
      this._projectParserWorker.onerror = (error) => {
        console.warn('FrameParser: Project parser worker failed', error.message || error);
        this._terminateProjectParserWorker();
      };
      this._projectParserWorker.postMessage({ type: 'load', code });
      return true;
    } catch (error) {
      console.warn('FrameParser: Failed to start project parser worker', error);
      this._terminateProjectParserWorker();
      return false;
    }
  }

  _terminateProjectParserWorker() {
    this._projectParserPending.forEach(({ timeout }) => clearTimeout(timeout));
    this._projectParserPending.clear();
    if (this._projectParserWorker) {
      this._projectParserWorker.terminate();
    }
    this._projectParserWorker = null;
    this._projectParserKey = '';
  }

  _parseWithProjectParser(content) {
    if (!this._ensureProjectParserWorker()) {
      this._parseFrameContentAsCSV(content);
      return;
    }

    const id = ++this._projectParserSeq;
    const timeout = setTimeout(() => {
      if (!this._projectParserPending.has(id)) return;
      this._projectParserPending.delete(id);
      console.warn('FrameParser: Project parser timed out; restarting worker.');
      this._terminateProjectParserWorker();
    }, 1000);

    this._projectParserPending.set(id, { raw: content, timeout });
    this._projectParserWorker.postMessage({
      type: 'parse',
      id,
      frame: content,
      code: this._projectFrameParserCode()
    });
  }

  _handleProjectParserMessage(message = {}) {
    if (message.type === 'loaded') return;

    const pending = this._projectParserPending.get(message.id);
    if (pending) {
      clearTimeout(pending.timeout);
      this._projectParserPending.delete(message.id);
    }

    if (message.type === 'error') {
      console.warn('FrameParser: Project parser error', message.message);
      return;
    }

    if (message.type !== 'parsed') return;
    this._emitProjectParserResult(message.result, pending?.raw || '');
  }

  _emitProjectParserResult(result, raw) {
    const frames = Array.isArray(result?.frames) ? result.frames : [];
    const indexBase = this._projectParserIndexBase();
    const datasetByIndex = this._projectDatasetByIndex();

    frames.forEach((frame, frameOffset) => {
      const datasets = [];
      (frame.datasets || []).forEach((dataset, i) => {
        const index = Number.isInteger(dataset.index) ? dataset.index : i + indexBase;
        const configured = datasetByIndex.get(index);
        datasets[index] = {
          title: dataset.title || configured?.title || `Channel ${index + 1}`,
          units: dataset.units ?? configured?.units ?? '',
          index,
          value: typeof dataset.value === 'number' ? dataset.value : parseFloat(dataset.value) || 0,
          ...(Array.isArray(dataset.buffer) ? { buffer: dataset.buffer } : {}),
          ...(Number.isFinite(Number(dataset.sampleRate)) && Number(dataset.sampleRate) > 0
            ? { sampleRate: Number(dataset.sampleRate) }
            : {})
        };
      });

      if (!datasets.length) return;
      this._emitFrame({
        title: frame.title || appState.project?.title || 'Project Data',
        datasets,
        raw,
        timestamp: Date.now() + frameOffset
      });
    });
  }

  _parseCSV() {
    const decoder = new TextDecoder();
    const text = decoder.decode(this._buffer);
    const lines = text.split('\n');
    
    if (lines.length <= 1) return; // Wait for full line

    const lastLine = lines.pop();
    // Update buffer to remaining fragment
    const encoder = new TextEncoder();
    this._buffer = encoder.encode(lastLine);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const values = trimmed.split(',').map(v => {
        const n = parseFloat(v.trim());
        return isNaN(n) ? v.trim() : n;
      });

      if (values.length > 0) {
        this._emitFrame({
          datasets: values.map((v, i) => ({
            title: `Channel ${i + 1}`,
            value: typeof v === 'number' ? v : 0,
            index: i
          })),
          raw: trimmed,
          timestamp: Date.now()
        });
      }
    }
  }

  _parseJSON() {
    const decoder = new TextDecoder();
    const text = decoder.decode(this._buffer);
    
    let startIdx;
    while ((startIdx = text.indexOf('/*')) !== -1) {
      const endIdx = text.indexOf('*/', startIdx + 2);
      if (endIdx === -1) break;

      const jsonStr = text.substring(startIdx + 2, endIdx).trim();
      // Remove processed part from buffer
      const encoder = new TextEncoder();
      const consumedLength = endIdx + 2;
      this._buffer = this._buffer.slice(consumedLength); // This is slightly inefficient but safe

      try {
        const data = JSON.parse(jsonStr);
        eventBus.emit('frame:receivedJSON', data);
        this._emitFrame({
          title: data.t || data.title || 'Telemetry',
          groups: data.g || data.groups || [],
          raw: jsonStr,
          timestamp: Date.now()
        });
      } catch (e) {
        console.warn('FrameParser: Invalid JSON frame', e);
      }
      
      // Since we modified this._buffer, we should re-decode text or break
      break; 
    }
  }

  _parseWithDelimiters() {
    const config = appState.frameConfig;
    const { startDelimiter, endDelimiter, frameDetection } = config;

    if (config.hexadecimalDelimiters) {
      this._parseWithHexDelimiters();
      return;
    }
    
    const decoder = new TextDecoder();
    const text = decoder.decode(this._buffer);
    const endDel = this._resolveDelimiter(endDelimiter);

    if (frameDetection === 'EndDelimiterOnly' || frameDetection === 'StartDelimiterOnly') {
      const frames = text.split(endDel);
      if (frames.length <= 1) return;

      const lastFrame = frames.pop();
      const encoder = new TextEncoder();
      this._buffer = encoder.encode(lastFrame);

      for (const frame of frames) {
        const trimmed = frame.trim();
        if (!trimmed) continue;
        this._parseFrameContent(trimmed);
      }
    } else if (frameDetection === 'StartAndEndDelimiter') {
      const startDel = this._resolveDelimiter(startDelimiter);
      let startPos;
      while ((startPos = text.indexOf(startDel)) !== -1) {
        const endPos = text.indexOf(endDel, startPos + startDel.length);
        if (endPos === -1) break;
        const content = text.substring(startPos + startDel.length, endPos).trim();
        
        const consumedLength = endPos + endDel.length;
        this._buffer = this._buffer.slice(consumedLength);
        
        if (content) this._parseFrameContent(content);
        break; // Re-parse after buffer modification
      }
    } else {
      // NoDelimiters — process entire buffer as string
      if (this._buffer.length > 0) {
        this._parseFrameContent(text);
        this._buffer = new Uint8Array(0);
      }
    }
  }

  _parseWithHexDelimiters() {
    const config = appState.frameConfig;
    const { startDelimiter, endDelimiter, frameDetection } = config;
    const startDel = this._hexDelimiterToBytes(startDelimiter);
    const endDel = this._hexDelimiterToBytes(endDelimiter);

    if (frameDetection === 'EndDelimiterOnly' || frameDetection === 'StartDelimiterOnly') {
      if (!endDel.length) return;
      let endPos = this._indexOfBytes(this._buffer, endDel);
      while (endPos !== -1) {
        const content = this._buffer.slice(0, endPos);
        this._buffer = this._buffer.slice(endPos + endDel.length);
        if (content.length) this._parseFrameContent(this._bytesToHex(content));
        endPos = this._indexOfBytes(this._buffer, endDel);
      }
      return;
    }

    if (frameDetection === 'StartAndEndDelimiter') {
      if (!startDel.length || !endDel.length) return;
      if (this._parseWithFixedHexFrameLength(startDel, endDel)) return;

      let startPos = this._indexOfBytes(this._buffer, startDel);
      while (startPos !== -1) {
        const endPos = this._indexOfBytes(this._buffer, endDel, startPos + startDel.length);
        if (endPos === -1) {
          if (startPos > 0) this._buffer = this._buffer.slice(startPos);
          return;
        }

        const content = this._buffer.slice(startPos + startDel.length, endPos);
        this._buffer = this._buffer.slice(endPos + endDel.length);
        if (content.length) this._parseFrameContent(this._bytesToHex(content));
        startPos = this._indexOfBytes(this._buffer, startDel);
      }

      if (this._buffer.length > startDel.length) {
        const keep = Math.max(0, startDel.length - 1);
        this._buffer = keep > 0 ? this._buffer.slice(-keep) : new Uint8Array(0);
      }
      return;
    }

    if (this._buffer.length > 0) {
      this._parseFrameContent(this._bytesToHex(this._buffer));
      this._buffer = new Uint8Array(0);
    }
  }

  _projectProtocolFieldByteLength(type) {
    const normalized = String(type || '').toLowerCase();
    if (normalized.endsWith('8')) return 1;
    if (normalized.endsWith('16')) return 2;
    if (normalized.endsWith('24')) return 3;
    if (normalized.endsWith('32')) return 4;
    if (normalized.endsWith('64')) return 8;
    return 0;
  }

  _projectFixedContentLength() {
    const fields = appState.project?.protocolFields;
    if (!Array.isArray(fields) || !fields.length) return 0;

    let maxEnd = 0;
    for (const field of fields) {
      const offset = Number(field.offset);
      const count = Math.max(1, Number(field.count) || 1);
      const byteLength = this._projectProtocolFieldByteLength(field.type);
      if (!Number.isFinite(offset) || offset < 0 || byteLength <= 0) return 0;
      maxEnd = Math.max(maxEnd, offset + (count * byteLength));
    }

    return maxEnd;
  }

  _bytesEqualAt(buffer, pattern, offset) {
    if (!pattern?.length || offset < 0 || offset + pattern.length > buffer.length) return false;
    for (let i = 0; i < pattern.length; i += 1) {
      if (buffer[offset + i] !== pattern[i]) return false;
    }
    return true;
  }

  _parseWithFixedHexFrameLength(startDel, endDel) {
    const contentLength = this._projectFixedContentLength();
    if (contentLength <= 0) return false;

    let startPos = this._indexOfBytes(this._buffer, startDel);
    while (startPos !== -1) {
      if (startPos > 0) {
        this._buffer = this._buffer.slice(startPos);
        startPos = 0;
      }

      const endPos = startDel.length + contentLength;
      const requiredLength = endPos + endDel.length;
      if (this._buffer.length < requiredLength) return true;

      if (this._bytesEqualAt(this._buffer, endDel, endPos)) {
        const content = this._buffer.slice(startDel.length, endPos);
        this._buffer = this._buffer.slice(requiredLength);
        if (content.length) this._parseFrameContent(this._bytesToHex(content));
        startPos = this._indexOfBytes(this._buffer, startDel);
        continue;
      }

      const nextStart = this._indexOfBytes(this._buffer, startDel, 1);
      if (nextStart === -1) {
        const keep = Math.max(0, startDel.length - 1);
        this._buffer = keep > 0 ? this._buffer.slice(-keep) : new Uint8Array(0);
        return true;
      }

      this._buffer = this._buffer.slice(nextStart);
      startPos = 0;
    }

    if (this._buffer.length > startDel.length) {
      const keep = Math.max(0, startDel.length - 1);
      this._buffer = keep > 0 ? this._buffer.slice(-keep) : new Uint8Array(0);
    }

    return true;
  }

  _parseFrameContent(content, separator = appState.frameConfig.separator || ',') {
    if (this._hasProjectFrameParser()) {
      this._parseWithProjectParser(content);
      return;
    }

    this._parseFrameContentAsCSV(content, separator);
  }

  _parseFrameContentAsCSV(content, separator = appState.frameConfig.separator || ',') {
    const resolvedSeparator = this._resolveDelimiter(separator) || ',';
    const values = content.split(resolvedSeparator).map(v => {
      const n = parseFloat(v.trim());
      return isNaN(n) ? v.trim() : n;
    });

    this._emitFrame({
      datasets: values.map((v, i) => ({
        title: `Channel ${i + 1}`,
        value: typeof v === 'number' ? v : 0,
        index: i
      })),
      raw: content,
      timestamp: Date.now()
    });
  }

  _emitFrame(frame) {
    this._frameCount++;
    this._frameRateCounter++;
    appState.frameCount = this._frameCount;
    eventBus.emit('frame:received', frame);
  }

  _resolveDelimiter(str) {
    if (!str) return '\n';
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  _hexDelimiterToBytes(str) {
    const normalized = String(str || '').replace(/[^0-9a-fA-F]/g, '');
    if (!normalized || normalized.length % 2 !== 0) return new Uint8Array(0);
    return this._hexToBytes(normalized) || new Uint8Array(0);
  }

  _indexOfBytes(buffer, pattern, from = 0) {
    if (!pattern?.length || buffer.length < pattern.length) return -1;
    for (let i = Math.max(0, from); i <= buffer.length - pattern.length; i++) {
      let found = true;
      for (let j = 0; j < pattern.length; j++) {
        if (buffer[i + j] !== pattern[j]) {
          found = false;
          break;
        }
      }
      if (found) return i;
    }
    return -1;
  }

  _bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  reset() {
    this._buffer = new Uint8Array(0);
    this._terminateProjectParserWorker();
    this._frameCount = 0;
    this._frameRateCounter = 0;
  }
}
