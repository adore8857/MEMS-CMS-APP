/**
 * UdpDriver - UDP transport through a local WebSocket bridge.
 *
 * Browsers do not expose raw UDP sockets. The Electron desktop build starts
 * an integrated Node.js UDP gateway; the browser build can still use a bridge.
 */
import { appState } from '../core/AppState.js';

const GATEWAY_MAGIC = [0x4d, 0x55, 0x47, 0x31]; // MUG1
const COMMAND_MAGIC = [0x4d, 0x55, 0x43, 0x31]; // MUC1

function isGatewayPacket(bytes) {
  return bytes.length >= 8 && GATEWAY_MAGIC.every((value, index) => bytes[index] === value);
}

function decodeGatewayPacket(bytes) {
  if (!isGatewayPacket(bytes)) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const metadataLength = view.getUint32(4, true);
  const payloadOffset = 8 + metadataLength;
  if (metadataLength <= 0 || payloadOffset > bytes.length) {
    throw new Error('Invalid multi-UDP gateway packet header.');
  }
  const metadataText = new TextDecoder().decode(bytes.subarray(8, payloadOffset));
  const metadata = JSON.parse(metadataText);
  const payload = bytes.slice(payloadOffset);
  if (Number.isFinite(Number(metadata.payloadLength)) && Number(metadata.payloadLength) !== payload.length) {
    throw new Error(`Gateway payload length mismatch (${payload.length}/${metadata.payloadLength}).`);
  }
  return { ...metadata, payload };
}

function encodeGatewayCommand(data, sourceId) {
  const payload = data instanceof Uint8Array
    ? data
    : (data instanceof ArrayBuffer ? new Uint8Array(data) : new TextEncoder().encode(String(data)));
  const metadata = new TextEncoder().encode(JSON.stringify({
    type: 'gateway.command',
    sourceId: sourceId || ''
  }));
  const packet = new Uint8Array(8 + metadata.length + payload.length);
  packet.set(COMMAND_MAGIC, 0);
  new DataView(packet.buffer).setUint32(4, metadata.length, true);
  packet.set(metadata, 8);
  packet.set(payload, 8 + metadata.length);
  return packet;
}

function buildBridgeUrl(cfg) {
  const raw = (cfg.bridgeUrl || '').trim() || 'ws://localhost:8765';
  if (!raw.startsWith('ws://') && !raw.startsWith('wss://')) {
    throw new Error('UDP bridge URL must start with ws:// or wss://.');
  }

  const url = new URL(raw);
  if (cfg.mode === 'gateway') {
    url.searchParams.set('client', 'mems-cms');
    return url.toString();
  }
  url.searchParams.set('remoteHost', (cfg.remoteHost || '').trim());
  url.searchParams.set('remotePort', String(Number(cfg.remotePort) || 0));
  url.searchParams.set('localHost', (cfg.localHost || '0.0.0.0').trim());
  url.searchParams.set('localPort', String(Number(cfg.localPort) || 0));
  return url.toString();
}

export class UdpDriver {
  constructor() {
    this._ws = null;
    this._callbacks = { data: [], status: [], error: [], close: [] };
  }

  on(event, cb) { this._callbacks[event]?.push(cb); }
  off(event, cb) {
    if (!this._callbacks[event]) return;
    this._callbacks[event] = this._callbacks[event].filter(c => c !== cb);
  }
  _emit(event, data) { this._callbacks[event]?.forEach(cb => cb(data)); }

  async connect() {
    const url = buildBridgeUrl(appState.udpConfig);

    return new Promise((resolve, reject) => {
      try {
        this._ws = new WebSocket(url);
        this._ws.binaryType = 'arraybuffer';

        this._ws.onopen = () => resolve();
        this._ws.onerror = (e) => {
          this._emit('error', e);
          const hint = window.memsCmsDesktop
            ? 'The integrated Electron UDP gateway is not reachable.'
            : 'Start scripts/udp_ws_bridge.py first.';
          reject(new Error(`UDP bridge connection failed (${url}). ${hint}`));
        };
        this._ws.onclose = () => this._emit('close');
        this._ws.onmessage = async (e) => {
          if (typeof e.data === 'string') {
            try {
              const message = JSON.parse(e.data);
              if (String(message?.type || '').startsWith('gateway.')) {
                this._emit('status', message);
                return;
              }
            } catch (_error) {
              // A legacy bridge may forward ordinary text payloads.
            }
            this._emit('data', new TextEncoder().encode(e.data));
            return;
          }
          let bytes;
          if (e.data instanceof Blob) {
            bytes = new Uint8Array(await e.data.arrayBuffer());
          } else {
            bytes = new Uint8Array(e.data);
          }
          try {
            const packet = decodeGatewayPacket(bytes);
            this._emit('data', packet || bytes);
          } catch (error) {
            this._emit('error', error);
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  async send(data) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      throw new Error('UDP bridge not connected');
    }
    if (appState.udpConfig.mode === 'gateway') {
      this._ws.send(encodeGatewayCommand(data, appState.udpConfig.commandSourceId));
      return;
    }
    this._ws.send(data);
  }

  async sendControl(message) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      throw new Error('UDP gateway not connected');
    }
    this._ws.send(JSON.stringify(message));
  }

  async disconnect() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }
}
