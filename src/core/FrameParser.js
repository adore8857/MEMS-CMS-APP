/**
 * FrameParser - Frame detection and data parsing
 */
import { eventBus } from './EventBus.js';
import { appState, OperationMode } from './AppState.js';

const STM32_BEARING_FRAMES = {
  legacy: {
    FULL_SIZE: 5732,
    PAYLOAD_SIZE: 5728,
    LENGTH_FIELD_BIAS: null,
    VIBRATION_OFFSET: 12,
    VIBRATION_SAMPLES: 2132,
    STRAIN_SAMPLES: 160,
    STRAIN1_OFFSET: 4276,
    STRAIN2_OFFSET: 4756,
    STRAIN3_OFFSET: 5236,
    TEMP_OFFSET: 5716,
    TMP117_OFFSET: 5719,
    STRAIN_GAIN: null,
    STRAIN_GAUGE_FACTOR: null,
    STRAIN_BRIDGE_EXCITATION: null,
    TAIL_OFFSET: 5730,
    MAX_BUFFER_WITHOUT_TAIL: 15000
  },
  v2: {
    FULL_SIZE: 1468,
    PAYLOAD_SIZE: 1464,
    LENGTH_FIELD_BIAS: 7,
    LEGACY_LENGTH_FIELD_FULL_SIZE: 2748,
    VIBRATION_OFFSET: null,
    VIBRATION_SAMPLES: 0,
    STRAIN_SAMPLES: 160,
    STRAIN1_OFFSET: 12,
    STRAIN2_OFFSET: 492,
    STRAIN3_OFFSET: 972,
    TEMP_OFFSET: 1452,
    TMP117_OFFSET: null,
    STRAIN_GAIN: 100,
    STRAIN_GAUGE_FACTOR: 2,
    STRAIN_BRIDGE_EXCITATION: 2.5,
    TEMP_MODE: 'ADS124S08_RTD',
    TAIL_OFFSET: 1466,
    MAX_BUFFER_WITHOUT_TAIL: 8192
  },
  gearbox: {
    PARSER: 'gearbox',
    FULL_SIZE: null,
    MIN_FULL_SIZE: 22,
    PAYLOAD_SIZE: null,
    HEADER_LEN_OFFSET: 4,
    CHANNEL_COUNT_OFFSET: 5,
    SAMPLE_BYTES_OFFSET: 6,
    PROTO_ID_OFFSET: 7,
    SAMPLE_RATE_OFFSET: 14,
    PAYLOAD_LEN_OFFSET: 18,
    VALID_SAMPLES_OFFSET: 20,
    PAYLOAD_OFFSET: 32,
    TEMPERATURE1_OFFSET: 32,
    TEMPERATURE2_OFFSET: 35,
    VIBRATION_OFFSET: 38,
    CHECKSUM_SIZE: 1,
    DEFAULT_SAMPLES: 512,
    DEFAULT_CHANNEL_COUNT: 4,
    SAMPLE_BYTES: 3,
    MAX_BUFFER_WITHOUT_TAIL: 65536
  }
};

export class FrameParser {
  constructor() {
    this._buffer = new Uint8Array(0);
    this._mqttBinaryBuffer = new Uint8Array(0);
    this._mqttHexBuffer = '';
    this._frameCount = 0;
    this._frameRateCounter = 0;
    this._frameRateTimer = null;
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

    // MQTT preserves message boundaries. When Serial Studio publishes STM32
    // frames over MQTT it emits the frame payload without the start/end
    // delimiters, so we can parse exact-size messages directly and avoid
    // misalignment caused by buffering across messages.
    if (this._tryParseDirectSTM32MqttMessage(newData)) {
      return;
    }

    // Append to buffer
    const combined = new Uint8Array(this._buffer.length + newData.length);
    combined.set(this._buffer);
    combined.set(newData, this._buffer.length);
    this._buffer = combined;

    this._parse();
  }

  _tryParseDirectSTM32MqttMessage(newData) {
    if (!this._isSTM32Protocol() || appState.busType !== 'MQTT') return false;

    const payloadSize = this._stm32PayloadSize();
    if (payloadSize && newData.length >= payloadSize && newData.length % payloadSize === 0) {
      for (let offset = 0; offset < newData.length; offset += payloadSize) {
        const payload = newData.slice(offset, offset + payloadSize);
        this._emitSTM32BearingFrame(payload, true, payload.length);
      }
      return true;
    }

    if (newData.length >= 4 && newData[0] === 0x5A && newData[1] === 0xA5) {
      const last = newData.length - 2;
      if (newData[last] === 0xDD && newData[last + 1] === 0xEE) {
        this._emitSTM32BearingFrame(newData, false, newData.length);
        return true;
      }
    }

    const text = new TextDecoder().decode(newData);
    if (this._looksLikeHexAscii(text)) {
      this._mqttHexBuffer += text.replace(/[^0-9a-fA-F]/g, '');
      this._drainMqttHexToBinary();
      this._drainMqttBinaryFrames();
      return true;
    }

    this._appendMqttBinary(newData);
    this._drainMqttBinaryFrames();
    return true;
  }

  _looksLikeHexAscii(text) {
    if (!text) return false;
    return /^[\s0-9a-fA-F]+$/.test(text);
  }

  _drainMqttHexToBinary() {
    const evenLen = this._mqttHexBuffer.length - (this._mqttHexBuffer.length % 2);
    if (evenLen <= 0) return;

    const bytes = this._hexToBytes(this._mqttHexBuffer.slice(0, evenLen));
    if (bytes) {
      this._appendMqttBinary(bytes);
      this._mqttHexBuffer = this._mqttHexBuffer.slice(evenLen);
    }
  }

  _appendMqttBinary(bytes) {
    const combined = new Uint8Array(this._mqttBinaryBuffer.length + bytes.length);
    combined.set(this._mqttBinaryBuffer);
    combined.set(bytes, this._mqttBinaryBuffer.length);
    this._mqttBinaryBuffer = combined;
  }

  _drainMqttBinaryFrames() {
    const frameConfig = this._stm32FrameConfig();
    const payloadSize = frameConfig.PAYLOAD_SIZE;
    const minFrameSize = frameConfig.MIN_FULL_SIZE || ((payloadSize || 0) + 4);

    while (this._mqttBinaryBuffer.length >= minFrameSize) {
      let headerPos = -1;
      for (let i = 0; i <= this._mqttBinaryBuffer.length - 2; i++) {
        if (this._mqttBinaryBuffer[i] === 0x5A && this._mqttBinaryBuffer[i + 1] === 0xA5) {
          headerPos = i;
          break;
        }
      }

      if (headerPos !== -1) {
        if (headerPos > 0) {
          this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(headerPos);
        }

        const expectedFrameSize = this._stm32FrameSizeFromHeader(this._mqttBinaryBuffer, 0);

        if (this._mqttBinaryBuffer.length < expectedFrameSize) {
          return;
        }

        const tailPos = expectedFrameSize - 2;
        if (this._mqttBinaryBuffer[tailPos] !== 0xDD || this._mqttBinaryBuffer[tailPos + 1] !== 0xEE) {
          if (this._mqttBinaryBuffer.length > minFrameSize * 2) {
            this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(2);
          }
          return;
        }

        const frame = this._mqttBinaryBuffer.slice(0, expectedFrameSize);
        this._emitSTM32BearingFrame(frame, false, frame.length);
        this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(expectedFrameSize);
        continue;
      }

      if (!payloadSize) {
        if (this._mqttBinaryBuffer.length > frameConfig.MAX_BUFFER_WITHOUT_TAIL) {
          this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(-1);
        }
        return;
      }

      const aligned = this._alignMqttPayloadStream();
      if (!aligned) {
        if (this._mqttBinaryBuffer.length > payloadSize * 3) {
          this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(-(payloadSize * 2));
        }
        return;
      }

      if (aligned > 0) {
        this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(aligned);
      }

      if (this._mqttBinaryBuffer.length < payloadSize) {
        return;
      }

      const payload = this._mqttBinaryBuffer.slice(0, payloadSize);
      this._emitSTM32BearingFrame(payload, true, payload.length);
      this._mqttBinaryBuffer = this._mqttBinaryBuffer.slice(payloadSize);
    }
  }

  _alignMqttPayloadStream() {
    const frameConfig = this._stm32FrameConfig();
    const payloadSize = frameConfig.PAYLOAD_SIZE;
    if (this._mqttBinaryBuffer.length < payloadSize) {
      return -1;
    }

    const maxStart = Math.min(this._mqttBinaryBuffer.length - payloadSize, payloadSize - 1);
    for (let start = 0; start <= maxStart; start++) {
      if (this._looksLikeBearingPayloadAt(start)) {
        return start;
      }
    }

    return -1;
  }

  _looksLikeBearingPayloadAt(start) {
    const buf = this._mqttBinaryBuffer;
    const frameConfig = this._stm32FrameConfig();
    const payloadSize = frameConfig.PAYLOAD_SIZE;
    if (!payloadSize) return false;
    if (start < 0 || start + payloadSize > buf.length) {
      return false;
    }

    const declaredFrameSize = this._stm32FrameSizeFromPayload(buf, start);
    if (declaredFrameSize !== frameConfig.FULL_SIZE) {
      return false;
    }

    const strainStart = start + frameConfig.STRAIN1_OFFSET - 2;
    const tempStart = start + frameConfig.TEMP_OFFSET - 2;
    let nonZeroStrain = 0;
    for (let i = strainStart; i < tempStart; i++) {
      if (buf[i] !== 0x00) nonZeroStrain++;
    }
    if (nonZeroStrain < 120) {
      return false;
    }

    const paddingStart = tempStart + (frameConfig.TMP117_OFFSET === null ? 3 : 5);
    const paddingEnd = start + payloadSize;
    let zeroPadding = 0;
    for (let i = paddingStart; i < paddingEnd; i++) {
      if (buf[i] === 0x00) zeroPadding++;
    }

    return zeroPadding >= 8;
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

    if (this._isSTM32Protocol()) {
      if (this._findSTM32Header() !== -1) {
        this._parseSTM32Binary();
      }
      return;
    }

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

  _isSTM32Protocol() {
    const mode = appState.operationMode;
    const protocol = this._projectProtocol();
    return mode === OperationMode.STM32Binary ||
      (mode === OperationMode.ProjectFile && (
        protocol.startsWith('stm32binary') ||
        protocol === 'gearboxbinary'
      ));
  }

  _stm32FrameConfig() {
    const protocol = this._projectProtocol();
    if (protocol === 'gearboxbinary') return STM32_BEARING_FRAMES.gearbox;
    return protocol === 'stm32binaryv2'
      ? STM32_BEARING_FRAMES.v2
      : STM32_BEARING_FRAMES.legacy;
  }

  _parseProjectFile() {
    const protocol = this._projectProtocol();
    if (protocol === 'json' || protocol === 'devicesendsjson') {
      this._parseJSON();
      return;
    }

    this._parseWithDelimiters();
  }

  _parseSTM32Binary() {
    const frameConfig = this._stm32FrameConfig();
    const HEADER_0 = 0x5A;
    const HEADER_1 = 0xA5;
    const TAIL_0 = 0xDD;
    const TAIL_1 = 0xEE;
    const EXPECTED_MIN_SIZE = frameConfig.MIN_FULL_SIZE || frameConfig.FULL_SIZE;

    while (this._buffer.length >= 4) {
      // Find header
      let startIdx = -1;
      for (let i = 0; i <= this._buffer.length - 2; i++) {
        if (this._buffer[i] === HEADER_0 && this._buffer[i + 1] === HEADER_1) {
          startIdx = i;
          break;
        }
      }

      if (startIdx === -1) {
        // No header found, clear buffer except last 1 byte which might be start of header
        this._buffer = this._buffer.slice(-1);
        break;
      }

      if (this._buffer.length - startIdx < EXPECTED_MIN_SIZE) {
        if (startIdx > 0) this._buffer = this._buffer.slice(startIdx);
        break;
      }

      const frameSize = this._stm32FrameSizeFromHeader(this._buffer, startIdx);
      const tailIdx = startIdx + frameSize - 2;
      if (tailIdx + 1 >= this._buffer.length) {
        if (this._buffer.length - startIdx > frameConfig.MAX_BUFFER_WITHOUT_TAIL) {
          this._buffer = this._buffer.slice(startIdx + 2);
          continue;
        }
        break;
      }

      if (this._buffer[tailIdx] !== TAIL_0 || this._buffer[tailIdx + 1] !== TAIL_1) {
        this._buffer = this._buffer.slice(startIdx + 2);
        continue;
      }

      // Extract frame
      const frameData = this._buffer.slice(startIdx, startIdx + frameSize);
      this._buffer = this._buffer.slice(startIdx + frameSize);

      this._emitSTM32BearingFrame(frameData, false, frameSize);
    }
  }

  _findSTM32Header() {
    if (this._buffer.length < 2) return -1;
    for (let i = 0; i <= this._buffer.length - 2; i++) {
      if (this._buffer[i] === 0x5A && this._buffer[i + 1] === 0xA5) {
        return i;
      }
    }
    return -1;
  }

  _stm32PayloadSize() {
    return this._stm32FrameConfig().PAYLOAD_SIZE;
  }

  _stm32FrameSizeFromHeader(buffer, start) {
    const frameConfig = this._stm32FrameConfig();
    if (frameConfig.PARSER === 'gearbox') {
      return this._gearboxFrameSizeFromHeader(buffer, start);
    }
    if (start + 3 >= buffer.length || frameConfig.LENGTH_FIELD_BIAS === null) {
      return frameConfig.FULL_SIZE;
    }
    const declared = buffer[start + 2] | (buffer[start + 3] << 8);
    const frameSize = declared + frameConfig.LENGTH_FIELD_BIAS;
    if (frameSize === frameConfig.FULL_SIZE) return frameSize;
    if (frameSize === frameConfig.LEGACY_LENGTH_FIELD_FULL_SIZE) return frameConfig.FULL_SIZE;
    return frameConfig.FULL_SIZE;
  }

  _gearboxFrameSizeFromHeader(buffer, start) {
    const frameConfig = STM32_BEARING_FRAMES.gearbox;
    const payloadLenOffset = start + frameConfig.PAYLOAD_LEN_OFFSET;
    const validSamplesOffset = start + frameConfig.VALID_SAMPLES_OFFSET;

    if (validSamplesOffset + 1 >= buffer.length) {
      return frameConfig.MIN_FULL_SIZE;
    }

    const payloadLen = buffer[payloadLenOffset] | (buffer[payloadLenOffset + 1] << 8);
    const validSamples = buffer[validSamplesOffset] | (buffer[validSamplesOffset + 1] << 8);
    const channelCount = buffer[start + frameConfig.CHANNEL_COUNT_OFFSET] || frameConfig.DEFAULT_CHANNEL_COUNT;
    const sampleBytes = buffer[start + frameConfig.SAMPLE_BYTES_OFFSET] || frameConfig.SAMPLE_BYTES;
    const expectedPayloadLen = 6 + (validSamples * channelCount * sampleBytes);
    const trustedPayloadLen = payloadLen > 0 ? payloadLen : expectedPayloadLen;
    const frameSize = frameConfig.PAYLOAD_OFFSET + trustedPayloadLen + frameConfig.CHECKSUM_SIZE + 2;

    if (frameSize >= 41 && frameSize <= frameConfig.MAX_BUFFER_WITHOUT_TAIL) {
      return frameSize;
    }

    const defaultPayloadLen = 6 + (
      frameConfig.DEFAULT_SAMPLES *
      frameConfig.DEFAULT_CHANNEL_COUNT *
      frameConfig.SAMPLE_BYTES
    );
    return frameConfig.PAYLOAD_OFFSET + defaultPayloadLen + frameConfig.CHECKSUM_SIZE + 2;
  }

  _stm32FrameSizeFromPayload(buffer, start) {
    const frameConfig = this._stm32FrameConfig();
    if (frameConfig.LENGTH_FIELD_BIAS === null) return frameConfig.FULL_SIZE;
    if (start + 1 >= buffer.length) return 0;
    const declared = buffer[start] | (buffer[start + 1] << 8);
    const frameSize = declared + frameConfig.LENGTH_FIELD_BIAS;
    if (frameSize === frameConfig.LEGACY_LENGTH_FIELD_FULL_SIZE) return frameConfig.FULL_SIZE;
    return frameSize;
  }

  _emitSTM32BearingFrame(frameData, payloadOnly = false, frameSize = frameData.length) {
    const frameConfig = this._stm32FrameConfig();
    if (frameConfig.PARSER === 'gearbox') {
      this._emitGearboxFrame(frameData, payloadOnly, frameSize);
      return;
    }

    const requiredSize = payloadOnly ? frameConfig.PAYLOAD_SIZE : frameConfig.FULL_SIZE;
    if (frameData.length < requiredSize) return;

    const view = new DataView(frameData.buffer, frameData.byteOffset, frameData.byteLength);
    const shift = payloadOnly ? -2 : 0;
    const adjusted = (offset) => offset + shift;
    const parseSigned24BitRaw = (offset) => {
      const pos = adjusted(offset);
      const msb = frameData[pos];
      const mid = frameData[pos + 1];
      const lsb = frameData[pos + 2];
      let val = (msb << 16) | (mid << 8) | lsb;
      if (val & 0x800000) val -= 0x1000000;
      return val;
    };

    const convertAds24ToVoltage = (raw) => (raw * 2.5) / 8388608.0;
    const convertAds124S08CodeToTemperature = (code) => {
      const A = 3.9083e-3;
      const B = -5.775e-7;
      const scale = 2.980232e-6;
      const discriminant = (A * A) - (4 * B * (1 - (code * scale)));
      if (discriminant < 0) return NaN;
      return (-A + Math.sqrt(discriminant)) / (2 * B);
    };
    const convertVoltageToStrain = (voltage) => {
      if (!frameConfig.STRAIN_GAIN) return voltage;
      return (4 * voltage) /
        (frameConfig.STRAIN_GAIN * frameConfig.STRAIN_GAUGE_FACTOR * frameConfig.STRAIN_BRIDGE_EXCITATION);
    };

    const datasets = [];

    if (frameConfig.VIBRATION_SAMPLES > 0 && frameConfig.VIBRATION_OFFSET !== null) {
      const accelScale = 0.000488;
      const toAccelG = (raw, removeGravity = false) => {
        const accelG = raw * accelScale;
        if (!removeGravity) return accelG;
        if (accelG === 0) return 0;
        return accelG - Math.sign(accelG);
      };

      // Legacy frames include acceleration waveform data before strain data.
      const accelZ = [];
      for (let i = 0; i < frameConfig.VIBRATION_SAMPLES; i++) {
        const raw = view.getInt16(adjusted(frameConfig.VIBRATION_OFFSET) + i * 2, true);
        accelZ.push(toAccelG(raw, true));
      }

      datasets.push({
        title: 'Accel Z',
        value: accelZ[accelZ.length - 1],
        index: datasets.length,
        buffer: accelZ
      });
    }

    // Extract Strain 1, 2, 3 (each is 160 samples of 24-bit signed data).
    const str1 = [];
    const str2 = [];
    const str3 = [];
    for (let i = 0; i < frameConfig.STRAIN_SAMPLES; i++) {
      str1.push(convertVoltageToStrain(convertAds24ToVoltage(parseSigned24BitRaw(frameConfig.STRAIN1_OFFSET + i * 3))));
      str2.push(convertVoltageToStrain(convertAds24ToVoltage(parseSigned24BitRaw(frameConfig.STRAIN2_OFFSET + i * 3))));
      str3.push(convertVoltageToStrain(convertAds24ToVoltage(parseSigned24BitRaw(frameConfig.STRAIN3_OFFSET + i * 3))));
    }

    datasets.push(
      { title: 'Strain 1', value: str1[str1.length - 1], index: datasets.length, buffer: str1 },
      { title: 'Strain 2', value: str2[str2.length - 1], index: datasets.length + 1, buffer: str2 },
      { title: 'Strain 3', value: str3[str3.length - 1], index: datasets.length + 2, buffer: str3 }
    );

    // Extract temperature channels.
    const tempRaw = parseSigned24BitRaw(frameConfig.TEMP_OFFSET);
    const temp1 = frameConfig.TEMP_MODE === 'ADS124S08_RTD'
      ? convertAds124S08CodeToTemperature(tempRaw)
      : convertAds24ToVoltage(tempRaw);
    let temp2 = null;
    if (frameConfig.TMP117_OFFSET !== null) {
      const tmp117_msb = frameData[adjusted(frameConfig.TMP117_OFFSET)];
      const tmp117_lsb = frameData[adjusted(frameConfig.TMP117_OFFSET) + 1];
      let tmp117_val = (tmp117_msb << 8) | tmp117_lsb;
      if (tmp117_val & 0x8000) tmp117_val -= 0x10000;
      temp2 = tmp117_val * 0.0078125;
    }

    datasets.push({
      title: frameConfig.TEMP_MODE === 'ADS124S08_RTD' ? 'Temperature' : 'ADC Temp',
      value: temp1,
      index: datasets.length
    });

    if (temp2 !== null) {
      datasets.push({
        title: frameConfig.STRAIN_GAIN ? 'Temperature 2' : 'TMP117',
        value: temp2,
        index: 5
      });
    }

    this._emitFrame({
      title: 'STM32 Bearing Data',
      datasets,
      raw: (payloadOnly ? 'Binary Payload' : 'Binary Frame') + ` (${frameSize} bytes)`,
      timestamp: Date.now()
    });
  }

  _emitGearboxFrame(frameData, payloadOnly = false, frameSize = frameData.length) {
    if (payloadOnly) return;

    const frameConfig = STM32_BEARING_FRAMES.gearbox;
    if (frameData.length < frameConfig.PAYLOAD_OFFSET + 9) return;

    const readUInt16LE = (offset) => frameData[offset] | (frameData[offset + 1] << 8);
    const readUInt32LE = (offset) =>
      (frameData[offset] |
        (frameData[offset + 1] << 8) |
        (frameData[offset + 2] << 16) |
        (frameData[offset + 3] << 24)) >>> 0;
    const readSigned24BE = (offset) => {
      let val = (frameData[offset] << 16) | (frameData[offset + 1] << 8) | frameData[offset + 2];
      if (val & 0x800000) val -= 0x1000000;
      return val;
    };
    const convertRtdCodeToTemperature = (code) => {
      const A = 3.9083e-3;
      const B = -5.775e-7;
      const scale = 0.0002980232 / 100;
      const discriminant = (A * A) - (4 * B * (1 - (code * scale)));
      if (discriminant < 0) return NaN;
      return (-A + Math.sqrt(discriminant)) / (2 * B);
    };

    const payloadLen = readUInt16LE(frameConfig.PAYLOAD_LEN_OFFSET);
    const validSamples = readUInt16LE(frameConfig.VALID_SAMPLES_OFFSET);
    const channelCount = frameData[frameConfig.CHANNEL_COUNT_OFFSET] || frameConfig.DEFAULT_CHANNEL_COUNT;
    const sampleBytes = frameData[frameConfig.SAMPLE_BYTES_OFFSET] || frameConfig.SAMPLE_BYTES;
    const samplesFromPayload = Math.floor(Math.max(0, payloadLen - 6) / Math.max(1, channelCount * sampleBytes));
    const sampleCount = Math.min(validSamples || samplesFromPayload, samplesFromPayload);
    const requiredEnd = frameConfig.VIBRATION_OFFSET + (channelCount * sampleCount * sampleBytes);

    if (sampleBytes !== 3 || channelCount < 4 || sampleCount <= 0 || frameData.length < requiredEnd + 3) {
      return;
    }

    const temp1 = convertRtdCodeToTemperature(readSigned24BE(frameConfig.TEMPERATURE1_OFFSET));
    const temp2 = convertRtdCodeToTemperature(readSigned24BE(frameConfig.TEMPERATURE2_OFFSET));

    const vibration3 = [];
    const vibration4 = [];
    const vibration3Offset = frameConfig.VIBRATION_OFFSET + (2 * sampleCount * sampleBytes);
    const vibration4Offset = frameConfig.VIBRATION_OFFSET + (3 * sampleCount * sampleBytes);

    for (let i = 0; i < sampleCount; i++) {
      vibration3.push(readSigned24BE(vibration3Offset + (i * sampleBytes)) * 2.3841858e-6);
      vibration4.push(readSigned24BE(vibration4Offset + (i * sampleBytes)) * 1.1920929e-5);
    }

    this._emitFrame({
      title: 'Gearbox Monitoring Data',
      datasets: [
        { title: 'Temperature 1', value: temp1, index: 0 },
        { title: 'Temperature 2', value: temp2, index: 1 },
        { title: 'Low-frequency Vibration', value: vibration3[vibration3.length - 1], index: 2, buffer: vibration3 },
        { title: 'General Vibration', value: vibration4[vibration4.length - 1], index: 3, buffer: vibration4 }
      ],
      meta: {
        sequence: readUInt32LE(10),
        sampleRate: readUInt32LE(frameConfig.SAMPLE_RATE_OFFSET),
        validSamples: sampleCount,
        payloadLength: payloadLen
      },
      raw: `Gearbox Binary Frame (${frameSize} bytes, ${sampleCount} samples)`,
      timestamp: Date.now()
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

  _parseFrameContent(content, separator = appState.frameConfig.separator || ',') {
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

  reset() {
    this._buffer = new Uint8Array(0);
    this._mqttBinaryBuffer = new Uint8Array(0);
    this._mqttHexBuffer = '';
    this._frameCount = 0;
    this._frameRateCounter = 0;
  }
}
