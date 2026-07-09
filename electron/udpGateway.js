const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const GATEWAY_MAGIC = Buffer.from('MUG1');
const COMMAND_MAGIC = Buffer.from('MUC1');
const PROTOCOL_VERSION = 1;

function portNumber(value, fallback) {
  const port = Number.parseInt(value ?? fallback, 10);
  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : fallback;
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_error) {
    return fallback;
  }
}

function saveJson(file, data) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, file);
}

function hexToBuffer(value, fallback = '') {
  const text = String(value || fallback).replace(/[^0-9a-fA-F]/g, '');
  return text ? Buffer.from(text, 'hex') : Buffer.alloc(0);
}

function sourceKey(ip, port, includePort) {
  const base = `udp-${String(ip).replace(/\./g, '-')}`;
  return includePort ? `${base}-${port}` : base;
}

function encodeGatewayPacket(metadata, payload) {
  const meta = Buffer.from(JSON.stringify(metadata), 'utf8');
  const header = Buffer.alloc(8);
  GATEWAY_MAGIC.copy(header, 0);
  header.writeUInt32LE(meta.length, 4);
  return Buffer.concat([header, meta, Buffer.from(payload)]);
}

function decodeCommandPacket(packet) {
  if (!Buffer.isBuffer(packet) || packet.length < 8 || !packet.subarray(0, 4).equals(COMMAND_MAGIC)) return null;
  const metaLength = packet.readUInt32LE(4);
  const payloadOffset = 8 + metaLength;
  if (metaLength <= 0 || payloadOffset > packet.length) throw new Error('Invalid gateway command envelope.');
  return {
    metadata: JSON.parse(packet.subarray(8, payloadOffset).toString('utf8')),
    payload: packet.subarray(payloadOffset)
  };
}

function extractSequence(payload, definition = {}) {
  if (!definition || definition.enabled === false) return null;
  const offset = Number.parseInt(definition.offset ?? 0, 10);
  const size = Number.parseInt(definition.size ?? 4, 10);
  const little = String(definition.byteOrder || 'little').toLowerCase() !== 'big';
  if (![1, 2, 4, 8].includes(size) || offset < 0 || offset + size > payload.length) return null;
  if (size === 1) return payload.readUInt8(offset);
  if (size === 2) return little ? payload.readUInt16LE(offset) : payload.readUInt16BE(offset);
  if (size === 4) return little ? payload.readUInt32LE(offset) : payload.readUInt32BE(offset);
  const value = little ? payload.readBigUInt64LE(offset) : payload.readBigUInt64BE(offset);
  return Number(value);
}

function updateSequenceStats(stats, sequence, bits) {
  if (!Number.isFinite(sequence)) return;
  const modulus = 2 ** Math.max(1, Math.min(bits || 32, 52));
  if (!Number.isFinite(stats.lastSequence)) {
    stats.lastSequence = sequence;
    return;
  }
  const expected = (stats.lastSequence + 1) % modulus;
  if (sequence === stats.lastSequence) {
    stats.duplicates += 1;
    return;
  }
  if (sequence === expected) {
    stats.lastSequence = sequence;
    return;
  }
  const forward = (sequence - expected + modulus) % modulus;
  const backward = (expected - sequence + modulus) % modulus;
  if (forward < backward) {
    stats.lost += forward;
    stats.lastSequence = sequence;
  } else {
    stats.outOfOrder += 1;
  }
}

class FrameReassembler {
  constructor(definition = {}) {
    this.start = hexToBuffer(definition.startDelimiter, '5A A5');
    this.end = hexToBuffer(definition.endDelimiter, 'DD EE');
    this.frameLength = Math.max(0, Number.parseInt(definition.frameLength || 0, 10));
    this.timeoutMs = Math.max(100, Number.parseInt(definition.timeoutMs || 2000, 10));
    this.maxBufferBytes = Math.max(1024, Number.parseInt(definition.maxBufferBytes || 65536, 10));
    this.buffer = Buffer.alloc(0);
    this.lastUpdate = 0;
  }

  feed(payload, now) {
    const result = this.expire(now);
    if (payload.length) {
      this.buffer = Buffer.concat([this.buffer, payload]);
      this.lastUpdate = now;
    }
    this.extract(result);
    if (this.buffer.length > this.maxBufferBytes) {
      const overflow = this.buffer.length - this.maxBufferBytes;
      result.droppedBytes += overflow;
      result.invalidFrames += 1;
      this.buffer = this.buffer.subarray(overflow);
    }
    if (!this.buffer.length) this.lastUpdate = 0;
    return result;
  }

  expire(now) {
    const result = { frames: [], droppedBytes: 0, incompleteFrames: 0, invalidFrames: 0 };
    if (this.buffer.length && this.lastUpdate && now - this.lastUpdate > this.timeoutMs) {
      result.droppedBytes += this.buffer.length;
      result.incompleteFrames += 1;
      this.buffer = Buffer.alloc(0);
      this.lastUpdate = 0;
    }
    return result;
  }

  resync(result) {
    const index = this.buffer.indexOf(this.start);
    if (index >= 0) {
      if (index > 0) {
        result.droppedBytes += index;
        this.buffer = this.buffer.subarray(index);
      }
      return true;
    }
    const keep = Math.min(this.buffer.length, Math.max(0, this.start.length - 1));
    const drop = this.buffer.length - keep;
    if (drop > 0) {
      result.droppedBytes += drop;
      this.buffer = this.buffer.subarray(drop);
    }
    return false;
  }

  extract(result) {
    while (this.resync(result)) {
      if (this.frameLength) {
        if (this.buffer.length < this.frameLength) return;
        const endOffset = this.frameLength - this.end.length;
        if (this.buffer.subarray(endOffset, this.frameLength).equals(this.end)) {
          result.frames.push(this.buffer.subarray(0, this.frameLength));
          this.buffer = this.buffer.subarray(this.frameLength);
          continue;
        }
        result.invalidFrames += 1;
        const nextStart = this.buffer.indexOf(this.start, 1);
        const drop = nextStart >= 0 ? nextStart : 1;
        result.droppedBytes += drop;
        this.buffer = this.buffer.subarray(drop);
        continue;
      }
      const endIndex = this.buffer.indexOf(this.end, this.start.length);
      if (endIndex < 0) return;
      const frameEnd = endIndex + this.end.length;
      result.frames.push(this.buffer.subarray(0, frameEnd));
      this.buffer = this.buffer.subarray(frameEnd);
    }
  }
}

class DeviceRegistry {
  constructor(config) {
    const routing = config.routing || {};
    this.unknownPolicy = String(routing.unknownDevices || 'ip').toLowerCase();
    this.defaultSequence = routing.sequence || {};
    const numbering = routing.frameNumbering || {};
    this.numberingEnabled = numbering.enabled !== false;
    this.numberingStart = Math.max(0, Number.parseInt(numbering.start || 0, 10));
    this.devices = (routing.devices || []).map((item, index) => ({
      sourceId: String(item.sourceId || item.deviceId || `device-${index + 1}`),
      title: String(item.title || item.sourceId || `device-${index + 1}`),
      ip: String(item.ip || ''),
      port: item.port == null ? null : portNumber(item.port, 0),
      commandPort: item.commandPort == null ? null : portNumber(item.commandPort, 0),
      sequence: item.sequence || routing.sequence || {}
    }));
    this.stats = new Map();
    this.devices.forEach((device) => this.stats.set(device.sourceId, this.createStats(device, [device.ip, device.port || 0])));
  }

  createStats(device, addr) {
    return {
      sourceId: device.sourceId,
      title: device.title,
      ip: addr[0],
      port: addr[1],
      packets: 0,
      bytes: 0,
      frames: 0,
      frameBytes: 0,
      bufferedBytes: 0,
      reassemblyDroppedBytes: 0,
      incompleteFrames: 0,
      invalidFrames: 0,
      lost: 0,
      duplicates: 0,
      outOfOrder: 0,
      lastSequence: null,
      frameNumber: this.numberingStart - 1,
      lastSeen: 0
    };
  }

  resolve(addr) {
    const [ip, port] = addr;
    const fixed = this.devices.find((device) => device.ip === ip && (device.port == null || device.port === port));
    if (fixed) return fixed;
    if (this.unknownPolicy === 'drop') return null;
    const includePort = this.unknownPolicy === 'ip-port';
    const sourceId = sourceKey(ip, port, includePort);
    return { sourceId, title: sourceId, ip, port, commandPort: null, sequence: this.defaultSequence };
  }

  deviceStats(device, addr) {
    if (!this.stats.has(device.sourceId)) this.stats.set(device.sourceId, this.createStats(device, addr));
    const stats = this.stats.get(device.sourceId);
    stats.title = device.title;
    stats.ip = addr[0];
    stats.port = addr[1];
    return stats;
  }

  commandDestination(sourceId, outbound = {}) {
    const device = this.devices.find((item) => item.sourceId === sourceId);
    const stats = this.stats.get(sourceId);
    if (device) {
      const port = device.commandPort || device.port || stats?.port;
      return port ? [device.ip, port] : null;
    }
    if (stats?.port) return [stats.ip, stats.port];
    if (outbound.host && portNumber(outbound.port, 0)) return [outbound.host, portNumber(outbound.port, 0)];
    return null;
  }
}

class GatewaySession {
  constructor(rootDir, wsServer) {
    this.rootDir = rootDir;
    this.configPath = path.join(rootDir, 'scripts', 'multi_udp_gateway.json');
    this.wsServer = wsServer;
    this.config = this.loadConfig();
    this.registry = new DeviceRegistry(this.config);
    this.clients = new Set();
    this.socket = null;
    this.reassemblers = new Map();
    this.startedAt = Date.now();
    this.receivedPackets = 0;
    this.receivedBytes = 0;
    this.forwardedFrames = 0;
    this.forwardedBytes = 0;
    this.droppedPackets = 0;
    this.commands = 0;
    this.commandErrors = 0;
    this.statusTimer = null;
  }

  loadConfig() {
    return loadJson(this.configPath, {
      name: 'MEMS-CMS Multi UDP Gateway',
      udp: { host: '0.0.0.0', port: 4000 },
      websocket: { host: '127.0.0.1', port: 8765 },
      routing: { unknownDevices: 'ip', devices: [], frameNumbering: { enabled: true, start: 0 } },
      aggregation: { mode: 'realtime' },
      status: { intervalMs: 1000, offlineAfterMs: 5000 },
      outbound: { defaultSourceId: '', host: '', port: 0 },
      control: { allowRemote: false }
    });
  }

  async ensureSocket() {
    if (this.socket) return;
    const udp = this.config.udp || {};
    this.socket = dgram.createSocket('udp4');
    this.socket.on('message', (message, rinfo) => this.receive(message, [rinfo.address, rinfo.port]));
    this.socket.on('error', (error) => this.broadcast({ type: 'gateway.error', message: error.message }));
    await new Promise((resolve, reject) => {
      this.socket.once('error', reject);
      this.socket.bind(portNumber(udp.port, 4000), String(udp.host || '0.0.0.0'), () => {
        this.socket.off('error', reject);
        resolve();
      });
    });
    this.statusTimer = setInterval(() => this.broadcast(this.statusMessage()), Math.max(200, Number(this.config.status?.intervalMs || 1000)));
  }

  async addClient(ws) {
    await this.ensureSocket();
    this.clients.add(ws);
    this.send(ws, {
      type: 'gateway.hello',
      version: PROTOCOL_VERSION,
      gateway: this.config.name || 'MEMS-CMS Multi UDP Gateway',
      udp: { host: this.config.udp?.host || '0.0.0.0', port: portNumber(this.config.udp?.port, 4000) }
    });
    this.send(ws, this.statusMessage());
    ws.on('message', (message, isBinary) => this.handleMessage(ws, message, isBinary));
    ws.on('close', () => this.clients.delete(ws));
  }

  handleMessage(ws, message, isBinary) {
    try {
      if (!isBinary) {
        const text = String(message);
        let request = null;
        try { request = JSON.parse(text); } catch (_error) { /* ordinary text command */ }
        if (request && this.handleControl(ws, request)) return;
        this.routeCommand(Buffer.from(text, 'utf8'));
        return;
      }
      const packet = decodeCommandPacket(Buffer.from(message));
      if (packet) {
        this.routeCommand(packet.payload, packet.metadata.sourceId || '');
        return;
      }
      this.routeCommand(Buffer.from(message));
    } catch (error) {
      this.commandErrors += 1;
      this.send(ws, { type: 'gateway.command.result', ok: false, message: error.message });
    }
  }

  handleControl(ws, request) {
    if (request.type === 'gateway.status.request') {
      this.send(ws, this.statusMessage());
      return true;
    }
    if (request.type === 'gateway.config.request') {
      this.send(ws, { type: 'gateway.config', config: this.publicConfig() });
      return true;
    }
    if (request.type === 'gateway.config.update') {
      try {
        this.updateConfig(request.config || {});
        this.send(ws, { type: 'gateway.config.saved', config: this.publicConfig(), restartRequired: false });
      } catch (error) {
        this.send(ws, { type: 'gateway.error', message: error.message });
      }
      return true;
    }
    if (request.type === 'gateway.command') {
      const payload = request.payloadBase64
        ? Buffer.from(String(request.payloadBase64), 'base64')
        : (request.payloadHex ? Buffer.from(String(request.payloadHex).replace(/\s+/g, ''), 'hex') : Buffer.from(String(request.payloadText || ''), 'utf8'));
      this.routeCommand(payload, request.sourceId || '');
      return true;
    }
    return false;
  }

  updateConfig(nextConfig) {
    const sanitized = JSON.parse(JSON.stringify(nextConfig));
    saveJson(this.configPath, sanitized);
    const udpChanged = sanitized.udp?.host !== this.config.udp?.host || Number(sanitized.udp?.port) !== Number(this.config.udp?.port);
    this.config = sanitized;
    this.registry = new DeviceRegistry(this.config);
    this.reassemblers.clear();
    if (udpChanged) this.restartSocket();
  }

  restartSocket() {
    if (this.statusTimer) clearInterval(this.statusTimer);
    this.statusTimer = null;
    if (this.socket) this.socket.close();
    this.socket = null;
    this.ensureSocket().catch((error) => this.broadcast({ type: 'gateway.error', message: error.message }));
  }

  publicConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  receive(payload, addr) {
    const device = this.registry.resolve(addr);
    if (!device) {
      this.droppedPackets += 1;
      return;
    }
    const now = Date.now();
    const stats = this.registry.deviceStats(device, addr);
    stats.packets += 1;
    stats.bytes += payload.length;
    stats.lastSeen = now;
    this.receivedPackets += 1;
    this.receivedBytes += payload.length;

    let frames = [payload];
    if (String(this.config.aggregation?.mode || 'realtime') === 'frame') {
      let reassembler = this.reassemblers.get(device.sourceId);
      if (!reassembler) {
        reassembler = new FrameReassembler(this.config.aggregation?.frame || {});
        this.reassemblers.set(device.sourceId, reassembler);
      }
      const result = reassembler.feed(payload, now);
      stats.bufferedBytes = reassembler.buffer.length;
      stats.reassemblyDroppedBytes += result.droppedBytes;
      stats.incompleteFrames += result.incompleteFrames;
      stats.invalidFrames += result.invalidFrames;
      frames = result.frames;
    }

    frames.forEach((frame) => this.forwardFrame(device, stats, frame, addr, now));
  }

  forwardFrame(device, stats, payload, addr, now) {
    const sequence = extractSequence(payload, device.sequence);
    const sequenceSize = Number.parseInt(device.sequence?.size || 4, 10);
    updateSequenceStats(stats, sequence, sequenceSize * 8);
    if (this.registry.numberingEnabled) stats.frameNumber += 1;
    stats.frames += 1;
    stats.frameBytes += payload.length;
    this.forwardedFrames += 1;
    this.forwardedBytes += payload.length;
    const frameNumber = this.registry.numberingEnabled ? stats.frameNumber : null;
    const metadata = {
      type: 'gateway.data',
      version: PROTOCOL_VERSION,
      sourceId: device.sourceId,
      sourceTitle: device.title,
      sourceIp: addr[0],
      sourcePort: addr[1],
      frameNumber,
      deviceSequence: sequence,
      sequence: sequence ?? frameNumber,
      sequenceSource: sequence == null ? 'gateway' : 'device',
      timestamp: now,
      payloadLength: payload.length,
      aggregationMode: this.config.aggregation?.mode || 'realtime',
      reassembled: String(this.config.aggregation?.mode || 'realtime') === 'frame'
    };
    const packet = encodeGatewayPacket(metadata, payload);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) client.send(packet);
    }
  }

  routeCommand(payload, sourceId = '') {
    const outbound = this.config.outbound || {};
    const targetSource = sourceId || outbound.defaultSourceId || '';
    const destination = this.registry.commandDestination(targetSource, outbound);
    if (!destination || !this.socket) throw new Error(`No command route for sourceId '${targetSource}'.`);
    this.socket.send(payload, destination[1], destination[0]);
    this.commands += 1;
    this.broadcast({ type: 'gateway.command.result', ok: true, sourceId: targetSource, host: destination[0], port: destination[1] });
  }

  statusMessage() {
    const offlineAfterMs = Math.max(1000, Number(this.config.status?.offlineAfterMs || 5000));
    const now = Date.now();
    const devices = [...this.registry.stats.values()].map((stats) => {
      const ageMs = stats.lastSeen ? now - stats.lastSeen : null;
      return {
        ...stats,
        lastFrameNumber: stats.frameNumber,
        ageMs,
        online: ageMs != null && ageMs <= offlineAfterMs
      };
    });
    return {
      type: 'gateway.status',
      version: PROTOCOL_VERSION,
      gateway: this.config.name || 'MEMS-CMS Multi UDP Gateway',
      aggregationMode: this.config.aggregation?.mode || 'realtime',
      configPath: this.configPath,
      uptimeMs: now - this.startedAt,
      clients: this.clients.size,
      packets: this.receivedPackets,
      bytes: this.receivedBytes,
      frames: this.forwardedFrames,
      frameBytes: this.forwardedBytes,
      bufferedBytes: devices.reduce((sum, device) => sum + (device.bufferedBytes || 0), 0),
      reassemblyDroppedBytes: devices.reduce((sum, device) => sum + (device.reassemblyDroppedBytes || 0), 0),
      incompleteFrames: devices.reduce((sum, device) => sum + (device.incompleteFrames || 0), 0),
      invalidFrames: devices.reduce((sum, device) => sum + (device.invalidFrames || 0), 0),
      dropped: this.droppedPackets,
      lost: devices.reduce((sum, device) => sum + (device.lost || 0), 0),
      duplicates: devices.reduce((sum, device) => sum + (device.duplicates || 0), 0),
      outOfOrder: devices.reduce((sum, device) => sum + (device.outOfOrder || 0), 0),
      commands: this.commands,
      commandErrors: this.commandErrors,
      onlineDevices: devices.filter((device) => device.online).length,
      knownDevices: devices.length,
      devices,
      timestamp: now
    };
  }

  send(ws, data) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
  }

  broadcast(data) {
    const text = JSON.stringify(data);
    for (const client of this.clients) {
      if (client.readyState === client.OPEN) client.send(text);
    }
  }

  close() {
    if (this.statusTimer) clearInterval(this.statusTimer);
    this.statusTimer = null;
    if (this.socket) {
      try { this.socket.close(); } catch (_error) { /* already closed */ }
      this.socket = null;
    }
    this.clients.clear();
  }
}

class LegacyBridgeSession {
  constructor(ws, params) {
    this.ws = ws;
    this.params = params;
    this.socket = dgram.createSocket('udp4');
  }

  async start() {
    const localHost = this.params.get('localHost') || '0.0.0.0';
    const localPort = portNumber(this.params.get('localPort'), 4000);
    const remoteHost = this.params.get('remoteHost') || '192.168.1.252';
    const remotePort = portNumber(this.params.get('remotePort'), 1030);
    this.socket.on('message', (message) => {
      if (this.ws.readyState === this.ws.OPEN) this.ws.send(message);
    });
    this.socket.on('error', (error) => {
      if (this.ws.readyState === this.ws.OPEN) this.ws.send(JSON.stringify({ type: 'gateway.error', message: error.message }));
    });
    await new Promise((resolve, reject) => {
      this.socket.once('error', reject);
      this.socket.bind(localPort, localHost, () => {
        this.socket.off('error', reject);
        resolve();
      });
    });
    this.ws.on('message', (message) => this.socket.send(Buffer.from(message), remotePort, remoteHost));
    this.ws.on('close', () => this.close());
  }

  close() {
    try { this.socket.close(); } catch (_error) { /* already closed */ }
  }
}

function startIntegratedUdpGateway({ rootDir, host = '127.0.0.1', port = 8765 } = {}) {
  const server = new WebSocketServer({ host, port });
  const gateway = new GatewaySession(rootDir, server);
  const legacySessions = new Set();

  server.on('connection', async (ws, request) => {
    try {
      const url = new URL(request.url || '/', `ws://${request.headers.host || `${host}:${port}`}`);
      if (url.searchParams.get('client') === 'mems-cms' || url.searchParams.get('mode') === 'gateway') {
        await gateway.addClient(ws);
        return;
      }
      const legacy = new LegacyBridgeSession(ws, url.searchParams);
      legacySessions.add(legacy);
      ws.on('close', () => legacySessions.delete(legacy));
      await legacy.start();
    } catch (error) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: 'gateway.error', message: error.message }));
      ws.close();
    }
  });

  server.on('listening', () => {
    console.log(`[udp-gateway] listening on ws://${host}:${port}`);
  });
  server.on('error', (error) => {
    console.warn(`[udp-gateway] ${error.message}`);
  });

  const closeWebSocketServer = server.close.bind(server);
  server.close = (callback) => {
    gateway.close();
    for (const legacy of legacySessions) legacy.close();
    legacySessions.clear();
    return closeWebSocketServer(callback);
  };
  return server;
}

module.exports = { startIntegratedUdpGateway };
