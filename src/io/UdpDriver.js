/**
 * UdpDriver - UDP transport through a local WebSocket bridge.
 *
 * Browsers do not expose raw UDP sockets. Run scripts/udp_ws_bridge.py and
 * this driver will exchange binary UDP datagrams through that bridge.
 */
import { appState } from '../core/AppState.js';

function buildBridgeUrl(cfg) {
  const raw = (cfg.bridgeUrl || '').trim() || 'ws://localhost:8765';
  if (!raw.startsWith('ws://') && !raw.startsWith('wss://')) {
    throw new Error('UDP bridge URL must start with ws:// or wss://.');
  }

  const url = new URL(raw);
  url.searchParams.set('remoteHost', (cfg.remoteHost || '').trim());
  url.searchParams.set('remotePort', String(Number(cfg.remotePort) || 0));
  url.searchParams.set('localHost', (cfg.localHost || '0.0.0.0').trim());
  url.searchParams.set('localPort', String(Number(cfg.localPort) || 0));
  return url.toString();
}

export class UdpDriver {
  constructor() {
    this._ws = null;
    this._callbacks = { data: [], error: [], close: [] };
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
          reject(new Error(`UDP bridge connection failed (${url}). Start scripts/udp_ws_bridge.py first.`));
        };
        this._ws.onclose = () => this._emit('close');
        this._ws.onmessage = async (e) => {
          if (typeof e.data === 'string') {
            this._emit('data', new TextEncoder().encode(e.data));
            return;
          }
          if (e.data instanceof Blob) {
            this._emit('data', new Uint8Array(await e.data.arrayBuffer()));
            return;
          }
          this._emit('data', new Uint8Array(e.data));
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
    this._ws.send(data);
  }

  async disconnect() {
    if (this._ws) {
      this._ws.close();
      this._ws = null;
    }
  }
}
