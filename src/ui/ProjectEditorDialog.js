import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { defaultProject } from '../core/ProjectModel.js';
import { t } from '../core/i18n.js?v=csv-autosave-20260424-1';

function cloneProject(project) {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project));
}

function getLabels(locale) {
  const fixedZhLabels = {
    title: '项目编辑器',
    addGroup: '添加分组',
    addDataset: '添加数据集',
    removeSelection: '删除当前项',
    loadDefault: '载入默认项目',
    apply: '应用到仪表盘',
    projectNode: '项目',
    groups: '分组',
    projectSettings: '项目设置',
    groupSettings: '分组设置',
    datasetSettings: '数据集设置',
    titleField: '标题',
    protocol: '协议',
    separator: '分隔符',
    frameStart: '帧起始',
    frameEnd: '帧结束',
    frameDetection: '帧检测',
    widget: '控件',
    index: '索引',
    units: '单位',
    min: '最小值',
    max: '最大值',
    alarm: '报警值',
    features: '启用功能',
    plot: '曲线',
    bar: '柱状图',
    gauge: '仪表',
    led: 'LED',
    fft: 'FFT',
    compass: '罗盘',
    selectionHint: '左侧选择项目、分组或数据集后即可编辑属性。',
    noGroupHint: '当前还没有分组，先添加一个分组。',
    noDatasetHint: '当前分组还没有数据集，可以先添加一个。',
    projectApplied: '项目编辑器内容已应用到仪表盘',
    invalidProject: '项目结构无效，无法应用',
    confirmDeleteGroup: '删除这个分组以及其下所有数据集？',
    confirmDeleteDataset: '删除这个数据集？'
  };

  const zhLabels = {
    title: '\u9879\u76ee\u7f16\u8f91\u5668',
    addGroup: '\u6dfb\u52a0\u5206\u7ec4',
    addDataset: '\u6dfb\u52a0\u6570\u636e\u96c6',
    removeSelection: '\u5220\u9664\u5f53\u524d\u9879',
    loadDefault: '\u8f7d\u5165\u9ed8\u8ba4\u9879\u76ee',
    apply: '\u5e94\u7528\u5230\u4eea\u8868\u76d8',
    projectNode: '\u9879\u76ee',
    groups: '\u5206\u7ec4',
    projectSettings: '\u9879\u76ee\u8bbe\u7f6e',
    groupSettings: '\u5206\u7ec4\u8bbe\u7f6e',
    datasetSettings: '\u6570\u636e\u96c6\u8bbe\u7f6e',
    titleField: '\u6807\u9898',
    protocol: '\u534f\u8bae',
    separator: '\u5206\u9694\u7b26',
    frameStart: '\u5e27\u8d77\u59cb',
    frameEnd: '\u5e27\u7ed3\u675f',
    frameDetection: '\u5e27\u68c0\u6d4b',
    widget: '\u63a7\u4ef6',
    index: '\u7d22\u5f15',
    units: '\u5355\u4f4d',
    min: '\u6700\u5c0f\u503c',
    max: '\u6700\u5927\u503c',
    alarm: '\u62a5\u8b66\u503c',
    features: '\u542f\u7528\u529f\u80fd',
    plot: '\u66f2\u7ebf',
    bar: '\u67f1\u72b6\u56fe',
    gauge: '\u4eea\u8868',
    led: 'LED',
    fft: 'FFT',
    compass: '\u7f57\u76d8',
    selectionHint: '\u5de6\u4fa7\u9009\u62e9\u9879\u76ee\u3001\u5206\u7ec4\u6216\u6570\u636e\u96c6\u540e\u5373\u53ef\u7f16\u8f91\u5c5e\u6027\u3002',
    noGroupHint: '\u5f53\u524d\u8fd8\u6ca1\u6709\u5206\u7ec4\uff0c\u5148\u6dfb\u52a0\u4e00\u4e2a\u5206\u7ec4\u3002',
    noDatasetHint: '\u5f53\u524d\u5206\u7ec4\u8fd8\u6ca1\u6709\u6570\u636e\u96c6\uff0c\u53ef\u4ee5\u5148\u6dfb\u52a0\u4e00\u4e2a\u3002',
    projectApplied: '\u9879\u76ee\u7f16\u8f91\u5668\u5185\u5bb9\u5df2\u5e94\u7528\u5230\u4eea\u8868\u76d8',
    invalidProject: '\u9879\u76ee\u7ed3\u6784\u65e0\u6548\uff0c\u65e0\u6cd5\u5e94\u7528',
    confirmDeleteGroup: '\u5220\u9664\u8fd9\u4e2a\u5206\u7ec4\u4ee5\u53ca\u5176\u4e0b\u6240\u6709\u6570\u636e\u96c6\uff1f',
    confirmDeleteDataset: '\u5220\u9664\u8fd9\u4e2a\u6570\u636e\u96c6\uff1f'
  };

  if (locale === 'zh-CN') return zhLabels;

  if (locale === 'zh-CN') {
    return {
      title: '项目编辑器',
      addGroup: '添加分组',
      addDataset: '添加数据集',
      removeSelection: '删除当前项',
      loadDefault: '载入默认项目',
      apply: '应用到仪表盘',
      projectNode: '项目',
      groups: '分组',
      projectSettings: '项目设置',
      groupSettings: '分组设置',
      datasetSettings: '数据集设置',
      titleField: '标题',
      protocol: '协议',
      separator: '分隔符',
      frameStart: '帧起始',
      frameEnd: '帧结束',
      frameDetection: '帧检测',
      widget: '控件',
      index: '索引',
      units: '单位',
      min: '最小值',
      max: '最大值',
      alarm: '报警值',
      features: '启用功能',
      plot: '曲线',
      bar: '柱状图',
      gauge: '仪表',
      led: 'LED',
      fft: 'FFT',
      compass: '罗盘',
      selectionHint: '左侧选择项目、分组或数据集后即可编辑属性。',
      noGroupHint: '当前还没有分组，先添加一个分组。',
      noDatasetHint: '当前分组还没有数据集，可以先添加一个。',
      projectApplied: '项目编辑器内容已应用到仪表盘',
      invalidProject: '项目结构无效，无法应用',
      confirmDeleteGroup: '删除这个分组以及其下所有数据集？',
      confirmDeleteDataset: '删除这个数据集？'
    };
  }

  if (locale === 'zh-CN') {
    return {
      title: '项目编辑器',
      addGroup: '添加分组',
      addDataset: '添加数据集',
      removeSelection: '删除当前项',
      loadDefault: '载入默认项目',
      apply: '应用到仪表盘',
      projectNode: '项目',
      groups: '分组',
      projectSettings: '项目设置',
      groupSettings: '分组设置',
      datasetSettings: '数据集设置',
      titleField: '标题',
      protocol: '协议',
      separator: '分隔符',
      frameStart: '帧起始',
      frameEnd: '帧结束',
      frameDetection: '帧检测',
      widget: '控件',
      index: '索引',
      units: '单位',
      min: '最小值',
      max: '最大值',
      alarm: '报警值',
      features: '启用功能',
      plot: '曲线',
      bar: '柱状图',
      gauge: '仪表',
      led: 'LED',
      fft: 'FFT',
      compass: '罗盘',
      selectionHint: '左侧选择项目、分组或数据集后即可编辑属性。',
      noGroupHint: '当前还没有分组，先添加一个分组。',
      noDatasetHint: '当前分组还没有数据集，可以先添加一个。',
      projectApplied: '项目编辑器内容已应用到仪表盘',
      invalidProject: '项目结构无效，无法应用',
      confirmDeleteGroup: '删除这个分组以及其下所有数据集？',
      confirmDeleteDataset: '删除这个数据集？'
    };
  }

  return {
    title: 'Project Editor',
    addGroup: 'Add Group',
    addDataset: 'Add Dataset',
    removeSelection: 'Delete Selection',
    loadDefault: 'Load Default',
    apply: 'Apply to Dashboard',
    projectNode: 'Project',
    groups: 'Groups',
    projectSettings: 'Project Settings',
    groupSettings: 'Group Settings',
    datasetSettings: 'Dataset Settings',
    titleField: 'Title',
    protocol: 'Protocol',
    separator: 'Separator',
    frameStart: 'Frame Start',
    frameEnd: 'Frame End',
    frameDetection: 'Frame Detection',
    widget: 'Widget',
    index: 'Index',
    units: 'Units',
    min: 'Min',
    max: 'Max',
    alarm: 'Alarm',
    features: 'Features',
    plot: 'Plot',
    bar: 'Bar',
    gauge: 'Gauge',
    led: 'LED',
    fft: 'FFT',
    compass: 'Compass',
    selectionHint: 'Select the project, a group, or a dataset on the left to edit its properties.',
    noGroupHint: 'No groups yet. Add a group to start building the project.',
    noDatasetHint: 'This group has no datasets yet. Add one to continue.',
    projectApplied: 'Project editor changes applied to the dashboard',
    invalidProject: 'The project structure is invalid and could not be applied',
    confirmDeleteGroup: 'Delete this group and all of its datasets?',
    confirmDeleteDataset: 'Delete this dataset?'
  };
}

const GROUP_WIDGETS = ['DataGrid', 'MultiPlot', 'Plot', 'Bar', 'Gauge', 'Gauges', 'Compass', 'Accelerometer'];
const DATASET_WIDGETS = ['Bar', 'Gauge', 'Plot', 'Compass', 'DataGrid'];
const FRAME_DETECTIONS = ['EndDelimiterOnly', 'StartAndEndDelimiter', 'NoDelimiters'];
const PROTOCOL_FIELD_KINDS = ['byte', 'frameHeader', 'frameTail', 'frameSequence', 'frameId', 'frameLength', 'fixedArray', 'variableArray', 'checksum'];
const FIELD_TYPES = ['uint8', 'int8', 'uint16', 'int16', 'uint24', 'int24', 'uint32', 'int32', 'float32', 'float64'];
const COMMAND_FIELD_TYPES = [...FIELD_TYPES, 'hex', 'ascii'];
const BYTE_ORDERS = ['LE', 'BE'];
const ARRAY_ORDERS = ['channelFirst', 'interleaved'];
const CHECKSUM_TYPES = ['none', 'sum8', 'sum16', 'xor8', 'crc8', 'crc16modbus', 'crc16ccitt'];
const FRAME_LENGTH_SIZES = ['1', '2', '4'];
const FFT_POINTS = ['128', '256', '512', '1024'];
const FFT_WINDOWS = ['Hann', 'None'];
const FFT_MAGNITUDE_MODES = ['linear', 'db'];
const FORMULA_TEMPLATES = {
  raw: 'raw',
  linear: 'raw * (fields.scale ?? 1) + (fields.offset ?? 0)',
  adc24Voltage: 'raw * 2.5 / 8388608',
  adc24Bipolar: 'raw * 5 / 16777216',
  milliVolt: 'raw / 1000',
  pt100: '(() => {\n  const A = 3.9083e-3;\n  const B = -5.775e-7;\n  const r0 = 100;\n  const resistance = raw;\n  const d = A * A - 4 * B * (1 - resistance / r0);\n  return d < 0 ? NaN : (-A + Math.sqrt(d)) / (2 * B);\n})()',
  arrayOffset: 'raw - fields.zero_offset',
  custom: ''
};

const CALIBRATION_PRESETS = [
  { key: 'adc24_2v5', nameZh: '24bit ADC 2.5V', nameEn: '24-bit ADC 2.5V', formula: 'raw * 2.5 / 8388608.0', unit: 'V' },
  { key: 'pt100_code', nameZh: 'PT100 Code 温度', nameEn: 'PT100 Code Temperature', formula: '(() => {\n  const A = 3.9083e-3;\n  const B = -5.775e-7;\n  const ratio = raw * 0.0002980232 / 100;\n  const d = A * A - 4 * B * (1 - ratio);\n  return d < 0 ? NaN : (-A + Math.sqrt(d)) / (2 * B);\n})()', unit: '°C' },
  { key: 'raw_offset_scale', nameZh: '零点与比例标定', nameEn: 'Offset / Scale Calibration', formula: '(raw - (params.zero ?? 0)) * (params.scale ?? 1)', unit: '' }
];

const PROJECT_TEMPLATES = [
  {
    id: 'binary-basic',
    nameZh: '\u56fa\u5b9a\u4e8c\u8fdb\u5236\u5e27',
    nameEn: 'Fixed Binary Frame',
    descriptionZh: '\u9002\u5408\u5e27\u5934+\u5e27\u5c3e+\u56fa\u5b9a\u5b57\u6bb5\u7684\u4e8c\u8fdb\u5236\u534f\u8bae\u3002',
    descriptionEn: 'For binary protocols with fixed fields, start delimiter and end delimiter.',
    project: () => ({
      title: '\u56fa\u5b9a\u4e8c\u8fdb\u5236\u5e27',
      protocol: 'Delimited',
      separator: ',',
      frameStart: '5A A5',
      frameEnd: 'DD EE',
      frameDetection: 'StartAndEndDelimiter',
      hexadecimalDelimiters: true,
      protocolFields: [
        { name: 'frameId', type: 'uint32', offset: 0, count: 1, endian: 'LE' },
        { name: 'value1_raw', type: 'int24', offset: 4, count: 1, endian: 'BE' }
      ],
      groups: [
        {
          title: '\u6570\u636e',
          widget: 'MultiPlot',
          datasets: [
            { title: 'Value 1', index: 0, sourceField: 'value1_raw', formula: 'raw', units: '', min: -100, max: 100, plot: true, graph: true }
          ]
        }
      ],
      sources: []
    })
  },
  {
    id: 'three-strain-no-vibration',
    nameZh: '\u4e09\u5e94\u53d8\u65e0\u632f\u52a8',
    nameEn: 'Three Strain, No Vibration',
    descriptionZh: '3\u8def int24 \u5e94\u53d8\u6570\u7ec4 + PT100 + TMP117\uff0c\u9002\u5408\u8f74\u74e6\u8282\u70b9\u3002',
    descriptionEn: 'Three int24 strain arrays with PT100 and TMP117 temperatures.',
    project: () => ({
      title: '\u8f74\u74e6\uff08\u4e09\u5e94\u53d8\u65e0\u632f\u52a8\uff09',
      protocol: 'Delimited',
      separator: ',',
      frameStart: '5A A5 02 B5 0A 02 DD 80 02',
      frameEnd: 'DD EE',
      frameDetection: 'StartAndEndDelimiter',
      hexadecimalDelimiters: true,
      protocolFields: [
        { name: 'frameId', type: 'uint32', offset: 0, count: 1, endian: 'LE' },
        { name: 'strain1', type: 'int24', offset: 4, count: 160, endian: 'BE' },
        { name: 'strain2', type: 'int24', offset: 484, count: 160, endian: 'BE' },
        { name: 'strain3', type: 'int24', offset: 964, count: 160, endian: 'BE' },
        { name: 'pt100Temperature', type: 'int24', offset: 1444, count: 1, endian: 'BE' },
        { name: 'tmp117Temperature', type: 'int16', offset: 1447, count: 1, endian: 'BE' },
        { name: 'reserved', type: 'uint8', offset: 1449, count: 8, endian: 'BE' },
        { name: 'checksum', type: 'uint8', offset: 1457, count: 1, endian: 'BE' }
      ],
      groups: [
        {
          title: '\u4e09\u5e94\u53d8',
          widget: 'MultiPlot',
          datasets: [
            { title: '\u5e94\u53d81', index: 0, sourceField: 'strain1', formula: 'raw * 2.5 / 8388608.0', units: '', min: -3, max: 3, plot: true, graph: true },
            { title: '\u5e94\u53d82', index: 1, sourceField: 'strain2', formula: 'raw * 2.5 / 8388608.0', units: '', min: -3, max: 3, plot: true, graph: true },
            { title: '\u5e94\u53d83', index: 2, sourceField: 'strain3', formula: 'raw * 2.5 / 8388608.0', units: '', min: -3, max: 3, plot: true, graph: true }
          ]
        },
        {
          title: '\u6e29\u5ea6',
          widget: 'Gauges',
          datasets: [
            {
              title: 'PT100\u6e29\u5ea6',
              index: 3,
              sourceField: 'pt100Temperature',
              formula: '(() => { const A = 3.9083e-3; const B = -5.775e-7; const d = A * A - 4 * B * (1 - ((raw * 0.0002980232) / 100)); return d < 0 ? NaN : (-A + Math.sqrt(d)) / (2 * B); })()',
              units: '\u00b0C',
              min: -50,
              max: 150,
              gauge: true,
              graph: false
            },
            { title: 'TMP117\u6e29\u5ea6', index: 4, sourceField: 'tmp117Temperature', formula: 'raw * 0.0078125', units: '\u00b0C', min: -50, max: 150, gauge: true, graph: false }
          ]
        }
      ],
      sources: []
    })
  },
  {
    id: 'csv-quick',
    nameZh: 'CSV \u5feb\u901f\u7ed8\u56fe',
    nameEn: 'CSV Quick Plot',
    descriptionZh: '\u9002\u5408\u9017\u53f7\u5206\u9694\u7684\u6587\u672c\u6570\u636e\uff0c\u5982 1.2,3.4,5.6\\n\u3002',
    descriptionEn: 'For comma-separated text frames, e.g. 1.2,3.4,5.6\\n.',
    project: () => ({
      title: 'CSV Quick Plot',
      protocol: 'Delimited',
      separator: ',',
      frameStart: '',
      frameEnd: '\\n',
      frameDetection: 'EndDelimiterOnly',
      hexadecimalDelimiters: false,
      protocolFields: [],
      groups: [
        {
          title: 'CSV Data',
          widget: 'MultiPlot',
          datasets: [
            { title: 'Ch 1', index: 0, units: '', min: -100, max: 100, plot: true, graph: true },
            { title: 'Ch 2', index: 1, units: '', min: -100, max: 100, plot: true, graph: true },
            { title: 'Ch 3', index: 2, units: '', min: -100, max: 100, plot: true, graph: true }
          ]
        }
      ],
      sources: [],
      frameParser: '',
      frameParserCode: ''
    })
  },
  {
    id: 'multi-udp-nodes',
    nameZh: '\u591a UDP \u8282\u70b9\u6a21\u677f',
    nameEn: 'Multi UDP Nodes',
    descriptionZh: '\u9884\u7f6e node-01/node-02/node-03 sourceId\uff0c\u4fbf\u4e8e\u7f51\u5173\u56fa\u5b9a\u6620\u5c04\u548c\u591a\u8282\u70b9\u7ed8\u56fe\u3002',
    descriptionEn: 'Predefines node-01/node-02/node-03 sourceIds for gateway mapping and multi-node charts.',
    project: () => ({
      title: '\u591a UDP \u8282\u70b9\u76d1\u6d4b',
      protocol: 'Delimited',
      separator: ',',
      frameStart: '5A A5',
      frameEnd: 'DD EE',
      frameDetection: 'StartAndEndDelimiter',
      hexadecimalDelimiters: true,
      protocolValidation: {
        frameLength: { enabled: false, offset: 0, size: 2, endian: 'BE', adjustment: 0 },
        checksum: { type: 'none', offset: -1, length: 1, endian: 'BE', rangeStart: 0, rangeLength: 0 }
      },
      sourceIdMap: [
        { sourceId: 'node-01', title: '\u8282\u70b901', ip: '192.168.1.251', udpPort: 1030 },
        { sourceId: 'node-02', title: '\u8282\u70b902', ip: '192.168.1.253', udpPort: 1030 },
        { sourceId: 'node-03', title: '\u8282\u70b903', ip: '192.168.1.255', udpPort: 1030 }
      ],
      calibrationParameters: [
        { name: 'scale', value: 1, unit: '' },
        { name: 'zero', value: 0, unit: '' }
      ],
      protocolFields: [
        { name: 'value_raw', type: 'int24', offset: 0, count: 1, endian: 'BE' }
      ],
      groups: [
        {
          title: '\u8282\u70b9\u6570\u636e',
          widget: 'MultiPlot',
          datasets: [
            { title: '\u8282\u70b901', index: 0, sourceId: 'node-01', sourceField: 'value_raw', formula: 'raw', units: '', min: -100, max: 100, plot: true, graph: true },
            { title: '\u8282\u70b902', index: 1, sourceId: 'node-02', sourceField: 'value_raw', formula: 'raw', units: '', min: -100, max: 100, plot: true, graph: true },
            { title: '\u8282\u70b903', index: 2, sourceId: 'node-03', sourceField: 'value_raw', formula: 'raw', units: '', min: -100, max: 100, plot: true, graph: true }
          ]
        }
      ],
      sources: []
    })
  }
];

function byteLengthForType(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized.endsWith('8')) return 1;
  if (normalized.endsWith('16')) return 2;
  if (normalized.endsWith('24')) return 3;
  if (normalized.endsWith('32')) return 4;
  if (normalized.endsWith('64')) return 8;
  return 1;
}

function hexByteLength(hexText) {
  const clean = String(hexText || '').replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
  return clean.length >= 2 && clean.length % 2 === 0 ? clean.length / 2 : 0;
}

function fieldByteSize(field) {
  const kind = String(field?.kind || 'byte');
  if (kind === 'frameHeader' || kind === 'frameTail') {
    const fixedLength = hexByteLength(field?.fixedValue || field?.value || '');
    if (fixedLength > 0) return fixedLength;
  }
  if (kind === 'fixedArray' || kind === 'variableArray') {
    const explicitLength = Math.max(0, Number(field?.byteLength) || 0);
    if (explicitLength > 0) return explicitLength;
  }
  const samples = Math.max(1, Number(field?.count) || 1);
  const channels = (kind === 'fixedArray' || kind === 'variableArray') ? Math.max(1, Number(field?.channels) || 1) : 1;
  return byteLengthForType(field?.type) * samples * channels;
}

function fieldEndOffset(field) {
  return Math.max(0, Number(field?.offset) || 0) + fieldByteSize(field);
}

function extendProtocolLabels(labels, locale) {
  const zh = locale === 'zh-CN';
  return {
    ...labels,
    fieldEditor: zh ? '\u5b57\u6bb5\u7f16\u8f91\u5668' : 'Field Editor',
    formulaEditor: zh ? '\u516c\u5f0f\u7f16\u8f91\u5668' : 'Formula Editor',
    displayEditor: zh ? '\u663e\u793a\u7f16\u8f91\u5668' : 'Display Editor',
    sourceField: zh ? '\u6765\u6e90\u5b57\u6bb5' : 'Source Field',
    formula: zh ? '\u6362\u7b97\u516c\u5f0f' : 'Formula',
    formulaHelp: zh
      ? '\u53ef\u4f7f\u7528 raw\u3001fields\u3001bytes\u3001Math\u3001index\u3001params\u3002\u793a\u4f8b\uff1araw * 2.5 / 8388608\u3002'
      : 'Use raw, fields, bytes, Math, index and params. Example: raw * 2.5 / 8388608.',
    fieldHelp: zh
      ? '\u6309 JCom \u98ce\u683c\u5b9a\u4e49\u5e27\u5934\u3001\u5e27\u5c3e\u3001\u5e27\u5e8f\u53f7\u3001\u5e27ID\u3001\u5e27\u957f\u5ea6\u548c BYTE \u5b57\u6bb5\uff0c\u5e94\u7528\u65f6\u4f1a\u4fdd\u5b58\u4e3a\u7ed3\u6784\u5316 JSON \u5e76\u81ea\u52a8\u751f\u6210 parser\u3002'
      : 'Define header, tail, sequence, frame ID, frame length and byte fields. The editor saves structured JSON and generates the parser automatically.',
    addField: zh ? '\u6dfb\u52a0\u5b57\u6bb5' : 'Add Field',
    autoOffset: zh ? '\u81ea\u52a8\u504f\u79fb' : 'Auto Offset',
    sortByOffset: zh ? '\u6309\u504f\u79fb\u6392\u5e8f' : 'Sort by Offset',
    generateParser: zh ? '\u751f\u6210\u89e3\u6790\u5668' : 'Generate Parser',
    duplicate: zh ? '\u590d\u5236' : 'Duplicate',
    openProject: zh ? '\u6253\u5f00\u9879\u76ee' : 'Open Project',
    saveProject: zh ? '\u4fdd\u5b58\u9879\u76ee' : 'Save Project',
    projectLoaded: zh ? '\u9879\u76ee\u5df2\u8f7d\u5165\u7f16\u8f91\u5668' : 'Project loaded into editor',
    projectSaved: zh ? '\u9879\u76ee\u5df2\u4fdd\u5b58' : 'Project saved',
    hexDelimiters: zh ? '\u5341\u516d\u8fdb\u5236\u5e27\u5934/\u5e27\u5c3e' : 'Hex Delimiters',
    fieldName: zh ? '\u540d\u79f0' : 'Name',
    fieldKind: zh ? '\u5b57\u6bb5\u7c7b\u578b' : 'Field Kind',
    fieldType: zh ? '\u7c7b\u578b' : 'Type',
    fieldOffset: zh ? '\u504f\u79fb' : 'Offset',
    fieldCount: zh ? '\u6570\u91cf' : 'Count',
    fieldEndian: zh ? '\u5b57\u8282\u5e8f' : 'Endian',
    fieldFixedValue: zh ? '\u56fa\u5b9a\u503c/HEX' : 'Fixed Value / HEX',
    fieldFormula: zh ? '\u5b57\u6bb5\u516c\u5f0f' : 'Field Formula',
    arrayChannels: zh ? '\u901a\u9053' : 'Channels',
    arrayOrder: zh ? '\u6570\u7ec4\u6392\u5217' : 'Array Order',
    arrayLengthField: zh ? '\u957f\u5ea6\u5b57\u6bb5' : 'Length Field',
    fieldBytes: zh ? '\u5b57\u8282' : 'Bytes',
    fieldRange: zh ? '\u8303\u56f4' : 'Range',
    noFields: zh ? '\u5c1a\u672a\u5b9a\u4e49\u5b57\u6bb5' : 'No fields defined yet.',
    none: zh ? '\u65e0' : 'None',
    sourceId: zh ? '\u6570\u636e\u6e90 sourceId' : 'Source ID',
    formulaTemplate: zh ? '\u516c\u5f0f\u6a21\u677f' : 'Formula Template',
    applyTemplate: zh ? '\u5957\u7528\u6a21\u677f' : 'Apply Template',
    testFormula: zh ? '\u6d4b\u8bd5\u516c\u5f0f' : 'Test Formula',
    testRaw: zh ? '\u6d4b\u8bd5 raw' : 'Test raw',
    testIndex: zh ? '\u6d4b\u8bd5 index' : 'Test index',
    formulaResult: zh ? '\u8ba1\u7b97\u7ed3\u679c' : 'Formula result',
    recognizedParser: zh ? '\u5df2\u4ece\u89e3\u6790\u5668\u8bc6\u522b\u5b57\u6bb5/\u6570\u636e\u96c6' : 'Recognized fields/datasets from parser',
    parserGenerated: zh ? '\u89e3\u6790\u5668\u5df2\u6839\u636e\u5b57\u6bb5\u8868\u751f\u6210' : 'Parser generated from field table',
    parserNeedsFields: zh ? '\u9700\u8981\u81f3\u5c11\u4e00\u4e2a\u5b57\u6bb5\u548c\u4e00\u4e2a\u5df2\u7ed1\u5b9a\u6765\u6e90\u5b57\u6bb5\u7684\u6570\u636e\u96c6' : 'At least one field and one dataset with source field are required',
    projectWizard: zh ? '\u65b0\u5efa\u89e3\u6790\u6587\u4ef6\u5411\u5bfc' : 'New Parser Wizard',
    templateLibrary: zh ? '\u6a21\u677f\u5e93' : 'Template Library',
    templateHelp: zh ? '\u9009\u62e9\u6a21\u677f\u540e\u53ef\u5feb\u901f\u751f\u6210\u5b57\u6bb5\u3001\u6570\u636e\u96c6\u548c\u57fa\u7840\u5e27\u914d\u7f6e\u3002' : 'Select a template to quickly create fields, datasets and frame settings.',
    createFromTemplate: zh ? '\u4ece\u6a21\u677f\u65b0\u5efa' : 'Create from Template',
    batchGenerator: zh ? '\u6279\u91cf\u751f\u6210\u5b57\u6bb5\u548c\u6570\u636e\u96c6' : 'Batch Generate Fields & Datasets',
    batchPrefix: zh ? '\u540d\u79f0\u524d\u7f00' : 'Name Prefix',
    batchCount: zh ? '\u901a\u9053\u6570' : 'Channels',
    batchStartOffset: zh ? '\u8d77\u59cb\u504f\u79fb' : 'Start Offset',
    batchSamples: zh ? '\u6bcf\u901a\u9053\u91c7\u6837\u70b9' : 'Samples / Channel',
    batchFormula: zh ? '\u6279\u91cf\u516c\u5f0f' : 'Batch Formula',
    batchUnits: zh ? '\u6279\u91cf\u5355\u4f4d' : 'Batch Units',
    batchWidget: zh ? '\u5206\u7ec4\u63a7\u4ef6' : 'Group Widget',
    batchApply: zh ? '\u6279\u91cf\u751f\u6210' : 'Generate Batch',
    sampleTester: zh ? '\u6837\u4f8b HEX \u89e3\u6790\u6d4b\u8bd5' : 'Sample HEX Parser Test',
    sampleHex: zh ? '\u6837\u4f8b HEX \u6570\u636e' : 'Sample HEX',
    runSampleTest: zh ? '\u89e3\u6790\u6d4b\u8bd5' : 'Run Test',
    sampleResult: zh ? '\u89e3\u6790\u7ed3\u679c' : 'Parse Result',
    layoutView: zh ? '\u5b57\u8282\u5e03\u5c40\u89c6\u56fe' : 'Byte Layout View',
    layoutEmpty: zh ? '\u6682\u65e0\u5b57\u6bb5\uff0c\u6dfb\u52a0\u5b57\u6bb5\u540e\u663e\u793a\u5b57\u8282\u5e03\u5c40\u3002' : 'No fields yet. Add fields to show the byte layout.',
    batchCreated: zh ? '\u6279\u91cf\u5b57\u6bb5\u548c\u6570\u636e\u96c6\u5df2\u751f\u6210' : 'Batch fields and datasets generated',
    templateApplied: zh ? '\u6a21\u677f\u5df2\u5e94\u7528\u5230\u7f16\u8f91\u5668' : 'Template applied to editor',
    parserTestPassed: zh ? '\u6837\u4f8b\u89e3\u6790\u6210\u529f' : 'Sample parsed successfully',
    parserTestFailed: zh ? '\u6837\u4f8b\u89e3\u6790\u5931\u8d25' : 'Sample parse failed',
    professionalSettings: zh ? '\u4e13\u4e1a\u534f\u8bae\u914d\u7f6e' : 'Professional Protocol Settings',
    checksumConfig: zh ? '\u6821\u9a8c\u7801\u914d\u7f6e' : 'Checksum Configuration',
    checksumType: zh ? '\u6821\u9a8c\u7c7b\u578b' : 'Checksum Type',
    checksumOffset: zh ? '\u6821\u9a8c\u504f\u79fb' : 'Checksum Offset',
    checksumLength: zh ? '\u6821\u9a8c\u5b57\u8282' : 'Checksum Bytes',
    checksumRangeStart: zh ? '\u6821\u9a8c\u8d77\u59cb' : 'Checksum Range Start',
    checksumRangeLength: zh ? '\u6821\u9a8c\u957f\u5ea6' : 'Checksum Range Length',
    frameLengthConfig: zh ? '\u5e27\u957f\u5ea6\u5b57\u6bb5\u914d\u7f6e' : 'Frame Length Field',
    frameLengthEnabled: zh ? '\u542f\u7528\u5e27\u957f\u5ea6\u6821\u9a8c' : 'Enable frame length check',
    frameLengthOffset: zh ? '\u957f\u5ea6\u5b57\u6bb5\u504f\u79fb' : 'Length Field Offset',
    frameLengthSize: zh ? '\u957f\u5ea6\u5b57\u8282' : 'Length Bytes',
    frameLengthEndian: zh ? '\u957f\u5ea6\u5b57\u8282\u5e8f' : 'Length Endian',
    frameLengthAdjustment: zh ? '\u957f\u5ea6\u4fee\u6b63\u503c' : 'Length Adjustment',
    sourceIdEditor: zh ? '\u591a sourceId \u7f16\u8f91' : 'Multi Source ID Editor',
    sourceTitle: zh ? '\u663e\u793a\u540d\u79f0' : 'Display Name',
    sourceIp: zh ? '\u8bbe\u5907 IP' : 'Device IP',
    sourceUdpPort: zh ? 'UDP \u7aef\u53e3' : 'UDP Port',
    addSource: zh ? '\u6dfb\u52a0 sourceId' : 'Add Source ID',
    calibrationLibrary: zh ? '\u516c\u5f0f\u5e93\u548c\u6807\u5b9a\u53c2\u6570\u5e93' : 'Formula & Calibration Library',
    calibrationPreset: zh ? '\u516c\u5f0f\u9884\u8bbe' : 'Formula Preset',
    applyCalibrationPreset: zh ? '\u5957\u7528\u5230\u5f53\u524d\u6570\u636e\u96c6' : 'Apply to Current Dataset',
    calibrationName: zh ? '\u53c2\u6570\u540d' : 'Parameter',
    calibrationValue: zh ? '\u53c2\u6570\u503c' : 'Value',
    calibrationUnit: zh ? '\u5355\u4f4d' : 'Unit',
    addCalibration: zh ? '\u6dfb\u52a0\u6807\u5b9a\u53c2\u6570' : 'Add Calibration',
    protocolImport: zh ? '\u5bfc\u5165\u534f\u8bae\u8868\u683c' : 'Import Protocol Table',
    importHelp: zh ? '\u53ef\u7c98\u8d34 Excel/Word \u8868\u683c\uff0c\u6216\u5bfc\u5165 CSV/TSV/TXT\u3002\u8868\u5934\u5efa\u8bae\uff1aname,type,offset,count,endian,title,units,formula,widget\u3002' : 'Paste an Excel/Word table or import CSV/TSV/TXT. Suggested headers: name,type,offset,count,endian,title,units,formula,widget.',
    importTable: zh ? '\u7c98\u8d34\u8868\u683c' : 'Paste Table',
    importFile: zh ? '\u5bfc\u5165\u6587\u4ef6' : 'Import File',
    importApply: zh ? '\u751f\u6210\u5b57\u6bb5/\u6570\u636e\u96c6' : 'Generate Fields/Datasets',
    importUnsupported: zh ? '\u5f53\u524d\u6d4f\u89c8\u5668\u7aef\u6682\u4e0d\u76f4\u63a5\u89e3\u6790 xlsx/docx\uff0c\u8bf7\u4ece Excel/Word \u590d\u5236\u8868\u683c\u540e\u7c98\u8d34\u3002' : 'Direct xlsx/docx parsing is not enabled in this browser build. Copy the table from Excel/Word and paste it here.',
    importCreated: zh ? '\u8868\u683c\u5b57\u6bb5\u548c\u6570\u636e\u96c6\u5df2\u751f\u6210' : 'Imported fields and datasets generated',
    sendFrameEditor: zh ? '\u53d1\u9001\u5e27\u7f16\u8f91\u5668' : 'Send Frame Editor',
    commandFrame: zh ? '\u547d\u4ee4\u5e27' : 'Command Frame',
    addCommand: zh ? '\u6dfb\u52a0\u547d\u4ee4' : 'Add Command',
    deleteCommand: zh ? '\u5220\u9664\u547d\u4ee4' : 'Delete Command',
    commandName: zh ? '\u547d\u4ee4\u540d\u79f0' : 'Command Name',
    autoLength: zh ? '\u81ea\u52a8\u957f\u5ea6' : 'Auto Length',
    autoChecksum: zh ? '\u81ea\u52a8\u6821\u9a8c' : 'Auto Checksum',
    checksumAppend: zh ? '\u504f\u79fb -1 \u8868\u793a\u81ea\u52a8\u8ffd\u52a0\u5230\u5e27\u5c3e\u524d' : 'Offset -1 appends before frame tail',
    commandParameters: zh ? '\u547d\u4ee4\u53c2\u6570' : 'Command Parameters',
    addParameter: zh ? '\u6dfb\u52a0\u53c2\u6570' : 'Add Parameter',
    paramName: zh ? '\u53c2\u6570\u540d' : 'Param Name',
    paramLabel: zh ? '\u63a7\u4ef6\u540d\u79f0' : 'Control Label',
    paramType: zh ? '\u53c2\u6570\u7c7b\u578b' : 'Param Type',
    paramValue: zh ? '\u9ed8\u8ba4\u503c' : 'Default Value',
    commandPreview: zh ? '\u7ec4\u5305 HEX \u9884\u89c8' : 'Packet HEX Preview',
    sendCommand: zh ? '\u4e00\u952e\u53d1\u9001\u547d\u4ee4' : 'Send Command',
    commandSent: zh ? '\u547d\u4ee4\u5e27\u5df2\u53d1\u9001' : 'Command frame sent',
    commandSendNeedsConnection: zh ? '\u8bf7\u5148\u8fde\u63a5\u8bbe\u5907\u6216\u7f51\u5173\u540e\u518d\u53d1\u9001' : 'Connect a device or gateway before sending',
    commandFrameHelp: zh
      ? '\u6309 JCom \u601d\u8def\u7ec4\u5305\uff1a\u5e27\u5934 + \u53c2\u6570\u63a7\u4ef6 + \u81ea\u52a8\u957f\u5ea6 + \u81ea\u52a8 CRC/SUM/XOR + \u5e27\u5c3e\u3002\u4fdd\u5b58\u540e\u5199\u5165 JSON \u7684 commandFrames\u3002'
      : 'JCom-style packet builder: header + parameter controls + auto length + auto CRC/SUM/XOR + tail. Saved into commandFrames.',
    receiveFormatEditor: zh ? '\u63a5\u6536\u89e3\u6790\u683c\u5f0f' : 'Receive Parser Format',
    receiveFormatHelp: zh
      ? '\u6309 JCom \u65b9\u5f0f\u6dfb\u52a0\u5b57\u6bb5\uff1a\u5de6\u4fa7\u662f\u5e27\u5b57\u6bb5\u987a\u5e8f\uff0c\u53f3\u4fa7\u7f16\u8f91\u5f53\u524d\u5b57\u6bb5\u7684\u5b57\u8282\u6570\u3001\u8f6c\u6362\u65b9\u5f0f\u3001\u540d\u79f0\u548c FIFO \u901a\u9053\u3002'
      : 'JCom-style receive format editor: add fields on top, edit field order on the left and byte/count/FIFO channel settings on the right.',
    byteCountSetting: zh ? '\u5b57\u8282\u6570\u8bbe\u7f6e' : 'Byte Count',
    dataTransform: zh ? '\u6570\u636e\u8f6c\u6362' : 'Data Transform',
    dataName: zh ? '\u6570\u636e\u540d\u79f0' : 'Data Name',
    fifoChannels: zh ? 'FIFO\u901a\u9053\u5b9a\u4e49' : 'FIFO Channels',
    channelName: zh ? '\u901a\u9053\u540d' : 'Channel',
    highByteFirst: zh ? '\u9ad8\u5728\u524d' : 'High First',
    calculateFormula: zh ? '\u8ba1\u7b97\u516c\u5f0f' : 'Formula',
    panelDisplay: zh ? '\u9762\u677f\u663e\u793a' : 'Panel Display',
    showPanel: zh ? '\u663e\u793a\u5230\u9762\u677f' : 'Show on Panel',
    fixedValueHex: zh ? '\u56fa\u5b9a\u503c/HEX' : 'Fixed / HEX',
    loadField: zh ? '\u52a0\u8f7d' : 'Load',
    channelArrange: zh ? 'FIFO/\u901a\u9053\u6392\u5217\u65b9\u5f0f' : 'FIFO / Channel Order',
    arrangeByChannel: zh ? '\u6309\u901a\u9053\u6392\u5217' : 'By Channel',
    arrangeByIndex: zh ? '\u6309\u7d22\u5f15\u6392\u5217' : 'By Index',
    arrangeHelp: zh ? '\u6392\u5217\u8bf4\u660e' : 'Order Help',
    generateParserAndApply: zh ? '\u751f\u6210\u89e3\u6790\u5668' : 'Generate Parser',
    addSendField: zh ? '\u6dfb\u52a0\u5b57\u6bb5' : 'Add Field',
    controlArea: zh ? '\u63a7\u4ef6\u533a' : 'Control Area',
    triggerSend: zh ? '\u63a7\u4ef6\u89e6\u53d1\u53d1\u9001' : 'Control Trigger Send',
    packetFieldList: zh ? '\u7ec4\u5305\u5b57\u6bb5' : 'Packet Fields',
    fieldValueHex: zh ? '\u5b57\u6bb5\u503c' : 'Field Value',
    checksumNames: {
      none: zh ? '\u65e0' : 'None',
      sum8: 'SUM8',
      sum16: 'SUM16',
      xor8: 'XOR8',
      crc8: 'CRC8',
      crc16modbus: 'CRC16 Modbus',
      crc16ccitt: 'CRC16 CCITT'
    },
    fieldKindNames: {
      byte: zh ? '\u666e\u901a BYTE \u5b57\u6bb5' : 'Byte Field',
      frameHeader: zh ? '\u5e27\u5934' : 'Frame Header',
      frameTail: zh ? '\u5e27\u5c3e' : 'Frame Tail',
      frameSequence: zh ? '\u5e27\u5e8f\u53f7' : 'Frame Sequence',
      frameId: zh ? '\u5e27 ID' : 'Frame ID',
      frameLength: zh ? '\u5e27\u957f\u5ea6' : 'Frame Length',
      fixedArray: zh ? '\u5b9a\u957f\u6570\u7ec4' : 'Fixed Array',
      variableArray: zh ? '\u53d8\u957f\u6570\u7ec4' : 'Variable Array',
      checksum: zh ? '\u6821\u9a8c' : 'Checksum'
    },
    arrayOrderNames: {
      channelFirst: zh ? '\u6309\u901a\u9053\u6392\u5217' : 'Channel First',
      interleaved: zh ? '\u6309\u91c7\u6837\u70b9\u4ea4\u9519' : 'Interleaved'
    },
    formulaTemplateNames: {
      raw: zh ? '\u539f\u59cb\u503c raw' : 'Raw value',
      linear: zh ? '\u7ebf\u6027\u6362\u7b97 raw * scale + offset' : 'Linear scale',
      adc24Voltage: zh ? '24bit ADC \u7535\u538b 2.5V' : '24-bit ADC voltage 2.5V',
      adc24Bipolar: zh ? '24bit ADC \u53cc\u6781\u6027 5V' : '24-bit ADC bipolar 5V',
      milliVolt: zh ? '\u6beb\u4f0f\u8f6c\u4f0f' : 'mV to V',
      pt100: zh ? 'PT100 \u6e29\u5ea6' : 'PT100 temperature',
      arrayOffset: zh ? '\u6570\u7ec4\u6263\u96f6\u70b9' : 'Array minus zero offset',
      custom: zh ? '\u4e0d\u5957\u7528' : 'Do not apply'
    },
    fftSettings: zh ? 'FFT \u8bbe\u7f6e' : 'FFT Settings',
    fftSampleRate: zh ? '\u56fa\u5b9a\u91c7\u6837\u7387 (Hz)' : 'Fixed Sample Rate (Hz)',
    fftSampleRateField: zh ? '\u91c7\u6837\u7387\u5b57\u6bb5' : 'Sample Rate Field',
    fftPoints: zh ? 'FFT \u70b9\u6570' : 'FFT Points',
    fftWindow: zh ? '\u7a97\u51fd\u6570' : 'Window',
    fftMagnitudeMode: zh ? '\u5e45\u503c\u663e\u793a' : 'Magnitude Display',
    fftAmplitudeUnit: zh ? '\u5e45\u503c\u5355\u4f4d' : 'Amplitude Unit',
    fftHelp: zh
      ? '\u91c7\u6837\u7387\u5b57\u6bb5\u4f18\u5148\u4e8e\u56fa\u5b9a\u91c7\u6837\u7387\uff1b\u586b\u5199\u540e FFT \u6a2a\u8f74\u5c06\u4ee5 Hz \u663e\u793a\u3002dB \u4e3a\u76f8\u5bf9 1 \u5355\u4f4d\u7684\u5e45\u503c\u3002'
      : 'Sample rate field overrides the fixed rate. With a rate, the FFT axis displays Hz. dB is relative to 1 amplitude unit.'
  };
}

export class ProjectEditorDialog {
  constructor(modalRoot, projectModel, options = {}) {
    this._root = modalRoot;
    this._projectModel = projectModel;
    this._onApply = options.onApply || (() => {});
    this._el = null;
    this._draft = null;
    this._selected = { type: 'project' };
    this._onKeyDown = null;

    eventBus.on('ui:openEditor', () => this.open());
  }

  open() {
    if (this._el) this.close();

    this._draft = this._normalizeDraftForEditing(cloneProject(this._projectModel.project || defaultProject()));
    this._selected = { type: 'project' };

    this._el = document.createElement('div');
    this._el.className = 'modal-overlay animate-fadeIn';
    this._el.innerHTML = `
      <div class="modal project-editor-modal">
        <div class="modal-header">
          <div class="modal-title">${this._labels.title}</div>
          <button class="btn btn-icon" id="project-editor-close" style="font-size:18px">X</button>
        </div>
        <div class="modal-body" id="project-editor-body">${this._renderBody()}</div>
        <div class="modal-footer">
          <button class="btn" id="project-editor-open">${this._labels.openProject}</button>
          <button class="btn" id="project-editor-save">${this._labels.saveProject}</button>
          <button class="btn" id="project-editor-default">${this._labels.loadDefault}</button>
          <button class="btn" id="project-editor-cancel">${t('common.close')}</button>
          <button class="btn btn-primary" id="project-editor-apply">${this._labels.apply}</button>
        </div>
      </div>`;

    this._root.appendChild(this._el);
    this._bindStaticEvents();
    this._bindBodyEvents();
  }

  close() {
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = null;
    }
    if (!this._el) return;
    this._el.remove();
    this._el = null;
  }

  get _labels() {
    return extendProtocolLabels(getLabels(appState.locale), appState.locale);
  }

  _bindStaticEvents() {
    this._el.addEventListener('click', (e) => {
      if (e.target === this._el) this.close();
    });

    this._el.querySelector('#project-editor-close')?.addEventListener('click', () => this.close());
    this._el.querySelector('#project-editor-cancel')?.addEventListener('click', () => this.close());
    this._el.querySelector('#project-editor-open')?.addEventListener('click', () => this._openProjectFile());
    this._el.querySelector('#project-editor-save')?.addEventListener('click', () => this._saveProjectFile());
    this._el.querySelector('#project-editor-default')?.addEventListener('click', () => {
      this._draft = this._normalizeDraftForEditing(cloneProject(defaultProject()));
      this._selected = { type: 'project' };
      this._refreshBody();
    });
    this._el.querySelector('#project-editor-apply')?.addEventListener('click', () => {
      try {
        const project = cloneProject(this._draft);
        this._prepareProjectForApply(project);
        this._onApply(project);
        this.close();
        eventBus.emit('toast', { type: 'success', message: this._labels.projectApplied });
      } catch (error) {
        eventBus.emit('toast', { type: 'error', message: error?.message || this._labels.invalidProject });
      }
    });

    this._onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };

    document.addEventListener('keydown', this._onKeyDown);
  }

  _openProjectFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        try {
          const loaded = JSON.parse(String(readerEvent.target?.result || '{}'));
          this._draft = this._normalizeDraftForEditing(cloneProject(loaded));
          this._selected = { type: 'project' };
          this._refreshBody();
          eventBus.emit('toast', { type: 'success', message: this._labels.projectLoaded });
        } catch (error) {
          eventBus.emit('toast', { type: 'error', message: error?.message || this._labels.invalidProject });
        }
      };
      reader.readAsText(file);
    });
    input.click();
  }

  _saveProjectFile() {
    const project = cloneProject(this._draft);
    this._prepareProjectForApply(project);
    this._draft = this._normalizeDraftForEditing(cloneProject(project));
    this._projectModel?.loadFromJSON?.(project);
    this._refreshBody();
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    const title = String(project.title || 'project').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'project';
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    eventBus.emit('toast', { type: 'success', message: this._labels.projectSaved });
  }

  _normalizeDraftForEditing(project) {
    if (!project || typeof project !== 'object') project = defaultProject();
    if (!Array.isArray(project.groups)) project.groups = [];
    if (!Array.isArray(project.protocolFields)) project.protocolFields = [];
    this._ensureProfessionalConfig(project);
    this._ensureCommandFrames(project);

    const parserCode = this._primaryParserCode(project);
    const fieldDefs = this._extractConstArray(parserCode, 'fieldDefs');
    const datasetDefs = this._extractConstArray(parserCode, 'datasetDefs');
    const schemaFields = Array.isArray(project.protocolSchema?.fields) ? project.protocolSchema.fields : [];

    if (!project.protocolFields.length && schemaFields.length) {
      project.protocolFields = schemaFields.map((field, index) => this._normalizeProtocolField(field, index));
    } else if (!project.protocolFields.length && Array.isArray(fieldDefs) && fieldDefs.length) {
      project.protocolFields = fieldDefs.map((field, index) => this._normalizeProtocolField(field, index));
    } else {
      project.protocolFields = project.protocolFields.map((field, index) => this._normalizeProtocolField(field, index));
    }
    this._syncProtocolSchema(project);

    project.groups.forEach((group, groupIndex) => {
      if (!Array.isArray(group.datasets)) group.datasets = [];
      group.datasets.forEach((dataset, datasetIndex) => {
        if (!Number.isInteger(Number(dataset.index))) dataset.index = datasetIndex;
        dataset.index = Number(dataset.index);
        dataset.sourceId = dataset.sourceId ?? dataset.source ?? group.sourceId ?? group.source ?? '';
        dataset.sourceField = dataset.sourceField || '';
        dataset.formula = dataset.formula || '';
        dataset.fftSampleRate = Number(dataset.fftSampleRate) > 0 ? Number(dataset.fftSampleRate) : 0;
        dataset.fftSampleRateField = dataset.fftSampleRateField || '';
        dataset.fftPoints = [128, 256, 512, 1024].includes(Number(dataset.fftPoints)) ? Number(dataset.fftPoints) : 128;
        dataset.fftWindow = dataset.fftWindow === 'None' ? 'None' : 'Hann';
        dataset.fftMagnitudeMode = dataset.fftMagnitudeMode === 'db' ? 'db' : 'linear';
        dataset.fftAmplitudeUnit = dataset.fftAmplitudeUnit || dataset.units || '';
      });
      if (!group.title) group.title = `Group ${groupIndex + 1}`;
      if (!group.widget) group.widget = 'DataGrid';
    });

    if (Array.isArray(datasetDefs) && datasetDefs.length) {
      this._mergeDatasetDefinitions(project, datasetDefs);
    }

    return project;
  }

  _ensureCommandFrames(project) {
    if (!Array.isArray(project.commandFrames)) project.commandFrames = [];
    if (!project.commandFrames.length) {
      project.commandFrames.push({
        title: 'Command 1',
        frameStart: project.frameStart || '',
        frameEnd: project.frameEnd || '',
        triggerSend: false,
        autoLength: false,
        lengthOffset: 0,
        lengthSize: 2,
        lengthEndian: 'BE',
        lengthAdjustment: 0,
        autoChecksum: false,
        checksumType: 'none',
        checksumOffset: -1,
        checksumLength: 1,
        checksumEndian: 'BE',
        checksumRangeStart: 0,
        checksumRangeLength: 0,
        parameters: []
      });
    }

    project.commandFrames = project.commandFrames.map((command, index) => ({
      title: String(command?.title || command?.name || `Command ${index + 1}`),
      frameStart: String(command?.frameStart ?? project.frameStart ?? ''),
      frameEnd: String(command?.frameEnd ?? project.frameEnd ?? ''),
      triggerSend: !!command?.triggerSend,
      autoLength: !!command?.autoLength,
      lengthOffset: Math.max(0, Number(command?.lengthOffset) || 0),
      lengthSize: [1, 2, 4].includes(Number(command?.lengthSize)) ? Number(command.lengthSize) : 2,
      lengthEndian: command?.lengthEndian === 'LE' ? 'LE' : 'BE',
      lengthAdjustment: Number(command?.lengthAdjustment) || 0,
      autoChecksum: !!command?.autoChecksum,
      checksumType: CHECKSUM_TYPES.includes(command?.checksumType) ? command.checksumType : 'none',
      checksumOffset: Number.isFinite(Number(command?.checksumOffset)) ? Number(command.checksumOffset) : -1,
      checksumLength: Math.max(1, Number(command?.checksumLength) || 1),
      checksumEndian: command?.checksumEndian === 'LE' ? 'LE' : 'BE',
      checksumRangeStart: Math.max(0, Number(command?.checksumRangeStart) || 0),
      checksumRangeLength: Math.max(0, Number(command?.checksumRangeLength) || 0),
      parameters: Array.isArray(command?.parameters)
        ? command.parameters.map((param, paramIndex) => this._normalizeCommandParameter(param, paramIndex))
        : []
    }));
  }

  _normalizeCommandParameter(param, index = 0) {
    return {
      name: String(param?.name || `param${index + 1}`).trim() || `param${index + 1}`,
      label: String(param?.label || param?.title || param?.name || `Param ${index + 1}`).trim() || `Param ${index + 1}`,
      type: COMMAND_FIELD_TYPES.includes(param?.type) ? param.type : 'uint8',
      value: String(param?.value ?? param?.defaultValue ?? 0),
      endian: param?.endian === 'LE' ? 'LE' : 'BE'
    };
  }

  _ensureProfessionalConfig(project) {
    if (!project.protocolValidation || typeof project.protocolValidation !== 'object') {
      project.protocolValidation = {};
    }

    const frameLength = project.protocolValidation.frameLength || {};
    project.protocolValidation.frameLength = {
      enabled: !!frameLength.enabled,
      offset: Math.max(0, Number(frameLength.offset) || 0),
      size: [1, 2, 4].includes(Number(frameLength.size)) ? Number(frameLength.size) : 2,
      endian: frameLength.endian === 'LE' ? 'LE' : 'BE',
      adjustment: Number(frameLength.adjustment) || 0
    };

    const checksum = project.protocolValidation.checksum || {};
    project.protocolValidation.checksum = {
      type: CHECKSUM_TYPES.includes(checksum.type) ? checksum.type : 'none',
      offset: Number.isFinite(Number(checksum.offset)) ? Number(checksum.offset) : -1,
      length: Math.max(1, Number(checksum.length) || 1),
      endian: checksum.endian === 'LE' ? 'LE' : 'BE',
      rangeStart: Math.max(0, Number(checksum.rangeStart) || 0),
      rangeLength: Math.max(0, Number(checksum.rangeLength) || 0)
    };

    if (!Array.isArray(project.sourceIdMap)) project.sourceIdMap = [];
    project.sourceIdMap = project.sourceIdMap.map((item, index) => ({
      sourceId: String(item?.sourceId ?? item?.id ?? `node-${String(index + 1).padStart(2, '0')}`),
      title: String(item?.title ?? item?.name ?? `Node ${index + 1}`),
      ip: String(item?.ip ?? item?.host ?? ''),
      udpPort: Number(item?.udpPort ?? item?.port ?? 0) || 0
    }));

    if (!Array.isArray(project.calibrationParameters)) project.calibrationParameters = [];
    project.calibrationParameters = project.calibrationParameters.map((item, index) => ({
      name: String(item?.name || `param${index + 1}`).trim() || `param${index + 1}`,
      value: Number(item?.value) || 0,
      unit: String(item?.unit || item?.units || '')
    }));
  }

  _syncProtocolSchema(project) {
    if (!project.protocolSchema || typeof project.protocolSchema !== 'object') {
      project.protocolSchema = {};
    }

    project.protocolSchema.frameStart = project.frameStart || '';
    project.protocolSchema.frameEnd = project.frameEnd || '';
    project.protocolSchema.frameDetection = project.frameDetection || 'EndDelimiterOnly';
    project.protocolSchema.hexadecimalDelimiters = !!project.hexadecimalDelimiters;
    project.protocolSchema.fields = (project.protocolFields || []).map((field, index) => this._normalizeProtocolField(field, index));
    project.protocolSchema.validation = project.protocolValidation || {};
    project.protocolSchema.commandFrames = project.commandFrames || [];
  }

  _primaryParserCode(project) {
    const firstSource = Array.isArray(project.sources) ? project.sources[0] : null;
    return String(project.frameParserCode || project.frameParser || firstSource?.frameParserCode || firstSource?.frameParser || '');
  }

  _extractConstArray(code, name) {
    const text = String(code || '');
    const marker = new RegExp(`(?:const|let|var)\\s+${name}\\s*=`, 'g');
    const match = marker.exec(text);
    if (!match) return null;

    const start = text.indexOf('[', match.index + match[0].length);
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let quote = '';
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const ch = text[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === quote) {
          inString = false;
          quote = '';
        }
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        quote = ch;
        continue;
      }

      if (ch === '[') depth += 1;
      if (ch === ']') {
        depth -= 1;
        if (depth === 0) {
          const literal = text.slice(start, i + 1);
          try {
            return JSON.parse(literal);
          } catch (error) {
            return null;
          }
        }
      }
    }

    return null;
  }

  _normalizeProtocolField(field, index = 0) {
    const kind = this._protocolFieldKindFromText(field?.kind);
    const defaultType = kind === 'frameSequence' || kind === 'frameId' || kind === 'frameLength' ? 'uint16' : 'uint16';
    return {
      ...field,
      kind,
      name: String(field?.name || `field${index + 1}`).trim() || `field${index + 1}`,
      title: String(field?.title || field?.displayName || field?.name || `field${index + 1}`).trim() || `field${index + 1}`,
      type: FIELD_TYPES.includes(field?.type) ? field.type : defaultType,
      offset: Math.max(0, Number(field?.offset) || 0),
      count: Math.max(1, Number(field?.count) || 1),
      endian: field?.endian === 'BE' ? 'BE' : 'LE',
      fixedValue: String(field?.fixedValue ?? field?.value ?? ''),
      formula: String(field?.formula || ''),
      units: String(field?.units || ''),
      panelDisplay: !!field?.panelDisplay,
      byteLength: Math.max(0, Number(field?.byteLength) || 0),
      channels: Math.max(1, Number(field?.channels) || 1),
      arrayOrder: ARRAY_ORDERS.includes(field?.arrayOrder) ? field.arrayOrder : 'channelFirst',
      lengthField: String(field?.lengthField || '')
    };
  }

  _mergeDatasetDefinitions(project, datasetDefs) {
    let changed = false;
    const byKey = new Map();
    const bySource = new Map();
    const byIndex = new Map();
    (project.groups || []).forEach((group) => {
      (group.datasets || []).forEach((dataset) => {
        const index = Number(dataset.index);
        if (dataset.sourceField) {
          byKey.set(this._datasetSyncKey(dataset), dataset);
          if (!bySource.has(dataset.sourceField)) bySource.set(dataset.sourceField, dataset);
        }
        if (Number.isInteger(index) && !byIndex.has(index)) byIndex.set(index, dataset);
      });
    });

    if (!project.groups.length) {
      project.groups.push({ title: 'Parsed Data', widget: 'MultiPlot', datasets: [] });
    }

    datasetDefs.forEach((def, fallbackIndex) => {
      const index = Number.isInteger(Number(def.index)) ? Number(def.index) : fallbackIndex;
      const sourceField = String(def.sourceField || '');
      let dataset = sourceField
        ? (byKey.get(`${sourceField}|${index}`) || bySource.get(sourceField))
        : null;
      if (!dataset) dataset = byIndex.get(index);
      if (!dataset) {
        dataset = {
          title: def.title || `Dataset ${index}`,
          index,
          units: def.units || '',
          widget: 'Plot',
          min: 0,
          max: 100,
          alarm: 0,
          led: false,
          fft: false,
          plot: true,
          bar: false,
          gauge: false,
          compass: false
        };
        project.groups[0].datasets.push(dataset);
        byIndex.set(index, dataset);
        if (sourceField) {
          byKey.set(`${sourceField}|${index}`, dataset);
          bySource.set(sourceField, dataset);
        }
        changed = true;
      }

      ['title', 'sourceField', 'formula', 'fftSampleRate', 'fftSampleRateField', 'units'].forEach((key) => {
        if ((dataset[key] === undefined || dataset[key] === '') && def[key] !== undefined && def[key] !== '') {
          dataset[key] = def[key];
          changed = true;
        }
      });
    });

    return changed;
  }

  _refreshBody() {
    const body = this._el?.querySelector('#project-editor-body');
    if (!body) return;
    body.innerHTML = this._renderBody();
    this._bindBodyEvents();
  }

  _bindBodyEvents() {
    this._el?.querySelectorAll('[data-editor-select]').forEach((node) => {
      node.addEventListener('click', () => {
        this._selected = {
          type: node.dataset.type,
          groupIndex: node.dataset.groupIndex !== undefined ? parseInt(node.dataset.groupIndex, 10) : undefined,
          datasetIndex: node.dataset.datasetIndex !== undefined ? parseInt(node.dataset.datasetIndex, 10) : undefined
        };
        this._refreshBody();
      });
    });

    this._el?.querySelector('#project-editor-add-group')?.addEventListener('click', () => {
      this._draft.groups.push({
        title: `Group ${this._draft.groups.length + 1}`,
        widget: 'DataGrid',
        datasets: []
      });
      this._selected = { type: 'group', groupIndex: this._draft.groups.length - 1 };
      this._refreshBody();
    });

    this._el?.querySelector('#project-editor-add-dataset')?.addEventListener('click', () => {
      if (!this._draft.groups.length) {
        this._draft.groups.push({ title: 'Group 1', widget: 'DataGrid', datasets: [] });
      }

      const groupIndex = this._resolveGroupIndex();
      const group = this._draft.groups[groupIndex];
      if (!Array.isArray(group.datasets)) group.datasets = [];

      group.datasets.push({
        title: `Dataset ${group.datasets.length + 1}`,
        index: group.datasets.length,
        units: '',
        widget: 'Bar',
        sourceField: '',
        formula: 'raw',
        min: 0,
        max: 100,
        alarm: 0,
        led: false,
        fft: false,
        fftSampleRate: 0,
        fftSampleRateField: '',
        fftPoints: 128,
        fftWindow: 'Hann',
        fftMagnitudeMode: 'linear',
        fftAmplitudeUnit: '',
        plot: true,
        bar: true,
        gauge: false,
        compass: false
      });

      this._selected = {
        type: 'dataset',
        groupIndex,
        datasetIndex: group.datasets.length - 1
      };
      this._refreshBody();
    });

    this._el?.querySelector('#project-editor-remove')?.addEventListener('click', () => {
      if (this._selected.type === 'group') {
        if (!window.confirm(this._labels.confirmDeleteGroup)) return;
        this._draft.groups.splice(this._selected.groupIndex, 1);
        this._selected = { type: 'project' };
        this._refreshBody();
        return;
      }

      if (this._selected.type === 'dataset') {
        if (!window.confirm(this._labels.confirmDeleteDataset)) return;
        const group = this._draft.groups[this._selected.groupIndex];
        group?.datasets?.splice(this._selected.datasetIndex, 1);
        this._reindexDatasets(group);
        this._selected = { type: 'group', groupIndex: this._selected.groupIndex };
        this._refreshBody();
      }
    });

    this._bindFormFields();
    this._bindProtocolEditorEvents();
  }

  _bindFormFields() {
    const target = this._getSelectedTarget();
    if (!target) return;

    this._el?.querySelectorAll('[data-field]').forEach((fieldEl) => {
      const syncValue = () => {
        const field = fieldEl.dataset.field;
        const kind = fieldEl.dataset.kind || 'string';
        let value;

        if (kind === 'boolean') {
          value = !!fieldEl.checked;
        } else if (kind === 'number') {
          value = Number(fieldEl.value);
          if (Number.isNaN(value)) value = 0;
        } else {
          value = fieldEl.value;
        }

        target[field] = value;

        if (this._selected.type === 'dataset' && ['min', 'max', 'alarm', 'index'].includes(field)) {
          target[field] = Number.isFinite(target[field]) ? target[field] : 0;
        }
      };

      const rerenderIfNeeded = () => {
        if (fieldEl.dataset.refresh === 'true') this._refreshBody();
      };

      const eventName = fieldEl.type === 'checkbox' || fieldEl.tagName === 'SELECT' ? 'change' : 'input';
      fieldEl.addEventListener(eventName, syncValue);
      if (eventName !== 'change') fieldEl.addEventListener('change', () => {
        syncValue();
        rerenderIfNeeded();
      });
      if (eventName === 'change') fieldEl.addEventListener('change', rerenderIfNeeded);
    });
  }

  _bindProtocolEditorEvents() {
    this._el?.querySelector('#project-template-apply')?.addEventListener('click', () => {
      const templateId = this._el?.querySelector('#project-template-select')?.value || PROJECT_TEMPLATES[0]?.id;
      const template = PROJECT_TEMPLATES.find((item) => item.id === templateId) || PROJECT_TEMPLATES[0];
      if (!template) return;
      this._draft = this._normalizeDraftForEditing(cloneProject(template.project()));
      this._selected = { type: 'project' };
      this._refreshBody();
      eventBus.emit('toast', { type: 'success', message: this._labels.templateApplied });
    });

    this._el?.querySelector('#project-batch-generate')?.addEventListener('click', () => {
      this._batchGenerateFieldsAndDatasets();
      this._selected = { type: 'project' };
      this._refreshBody();
      eventBus.emit('toast', { type: 'success', message: this._labels.batchCreated });
    });

    this._el?.querySelector('#project-sample-test-run')?.addEventListener('click', () => {
      this._runSampleHexTest();
    });

    this._bindProfessionalConfigEvents();
    this._bindJcomFormatEvents();

    this._el?.querySelector('#protocol-field-add')?.addEventListener('click', () => {
      if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
      const index = this._draft.protocolFields.length;
      const previous = this._draft.protocolFields[index - 1];
      const offset = previous ? fieldEndOffset(previous) : 0;
      this._draft.protocolFields.push({
        kind: 'byte',
        name: `field${index + 1}`,
        title: `field${index + 1}`,
        type: 'uint16',
        offset,
        count: 1,
        endian: 'LE',
        fixedValue: '',
        formula: '',
        units: '',
        channels: 1,
        arrayOrder: 'channelFirst',
        lengthField: ''
      });
      this._syncProtocolSchema(this._draft);
      this._refreshBody();
    });

    this._el?.querySelector('#protocol-field-auto-offset')?.addEventListener('click', () => {
      this._autoAssignFieldOffsets();
      this._refreshBody();
    });

    this._el?.querySelector('#protocol-field-sort')?.addEventListener('click', () => {
      if (!Array.isArray(this._draft.protocolFields)) return;
      this._draft.protocolFields.sort((a, b) => (Number(a.offset) || 0) - (Number(b.offset) || 0));
      this._syncProtocolSchema(this._draft);
      this._refreshBody();
    });

    this._el?.querySelector('#protocol-parser-generate')?.addEventListener('click', () => {
      if (!this._canGenerateParser(this._draft)) {
        eventBus.emit('toast', { type: 'warning', message: this._labels.parserNeedsFields });
        return;
      }
      this._syncGeneratedParser(this._draft);
      eventBus.emit('toast', { type: 'success', message: this._labels.parserGenerated });
    });

    this._el?.querySelectorAll('[data-protocol-field]').forEach((node) => {
      const index = Number(node.dataset.index);
      const field = node.dataset.protocolField;
      if (!Number.isInteger(index) || !field) return;

      node.addEventListener(node.tagName === 'SELECT' ? 'change' : 'input', () => {
        const item = this._draft.protocolFields?.[index];
        if (!item) return;
        if (field === 'offset' || field === 'count' || field === 'channels') {
          item[field] = Math.max(field === 'count' ? 1 : 0, Number(node.value) || 0);
        } else {
          item[field] = node.value;
        }
        if (field === 'kind') this._applyProtocolFieldKindDefaults(item);
        if (field === 'kind' || field === 'fixedValue') this._syncFrameDelimiterFromField(item);
        if (field === 'kind' || field === 'offset' || field === 'count' || field === 'channels' || field === 'type' || field === 'endian') {
          this._syncFrameLengthFromField(item);
        }
        this._syncProtocolSchema(this._draft);
      });
    });

    this._el?.querySelectorAll('[data-protocol-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.dataset.protocolRemove);
        if (!Number.isInteger(index)) return;
        this._draft.protocolFields?.splice(index, 1);
        this._syncProtocolSchema(this._draft);
        this._refreshBody();
      });
    });

    this._el?.querySelectorAll('[data-protocol-duplicate]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.dataset.protocolDuplicate);
        const item = this._draft.protocolFields?.[index];
        if (!item) return;
        const copy = this._normalizeProtocolField({
          ...item,
          name: `${item.name || 'field'}_copy`,
          offset: fieldEndOffset(item)
        }, index + 1);
        this._draft.protocolFields.splice(index + 1, 0, copy);
        this._syncProtocolSchema(this._draft);
        this._refreshBody();
      });
    });

    this._bindFormulaTools();
  }

  _bindProfessionalConfigEvents() {
    this._el?.querySelectorAll('[data-professional-field]').forEach((node) => {
      node.addEventListener(node.tagName === 'SELECT' || node.type === 'checkbox' ? 'change' : 'input', () => {
        this._setProfessionalValue(node.dataset.professionalField, node.type === 'checkbox' ? node.checked : node.value);
      });
    });

    this._el?.querySelector('#source-id-add')?.addEventListener('click', () => {
      this._ensureProfessionalConfig(this._draft);
      const index = this._draft.sourceIdMap.length + 1;
      this._draft.sourceIdMap.push({
        sourceId: `node-${String(index).padStart(2, '0')}`,
        title: `Node ${index}`,
        ip: '',
        udpPort: 0
      });
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-source-map-field]').forEach((node) => {
      node.addEventListener('input', () => {
        const index = Number(node.dataset.index);
        const field = node.dataset.sourceMapField;
        const item = this._draft.sourceIdMap?.[index];
        if (!item || !field) return;
        item[field] = field === 'udpPort' ? (Number(node.value) || 0) : node.value;
      });
    });

    this._el?.querySelectorAll('[data-source-map-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.dataset.sourceMapRemove);
        if (!Number.isInteger(index)) return;
        this._draft.sourceIdMap?.splice(index, 1);
        this._refreshBody();
      });
    });

    this._el?.querySelector('#calibration-add')?.addEventListener('click', () => {
      this._ensureProfessionalConfig(this._draft);
      const index = this._draft.calibrationParameters.length + 1;
      this._draft.calibrationParameters.push({ name: `param${index}`, value: 0, unit: '' });
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-calibration-field]').forEach((node) => {
      node.addEventListener('input', () => {
        const index = Number(node.dataset.index);
        const field = node.dataset.calibrationField;
        const item = this._draft.calibrationParameters?.[index];
        if (!item || !field) return;
        item[field] = field === 'value' ? (Number(node.value) || 0) : node.value;
      });
    });

    this._el?.querySelectorAll('[data-calibration-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.dataset.calibrationRemove);
        if (!Number.isInteger(index)) return;
        this._draft.calibrationParameters?.splice(index, 1);
        this._refreshBody();
      });
    });

    this._el?.querySelector('#calibration-preset-apply')?.addEventListener('click', () => {
      const selected = this._getSelectedTarget();
      if (this._selected.type !== 'dataset' || !selected) return;
      const key = this._el?.querySelector('#calibration-preset-select')?.value || '';
      const preset = CALIBRATION_PRESETS.find((item) => item.key === key);
      if (!preset) return;
      selected.formula = preset.formula;
      selected.units = selected.units || preset.unit || '';
      this._refreshBody();
    });

    this._el?.querySelector('#protocol-import-apply')?.addEventListener('click', () => {
      this._importProtocolTable(this._el?.querySelector('#protocol-import-table')?.value || '');
    });

    this._el?.querySelector('#protocol-import-file')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (/\.(xlsx|docx)$/i.test(file.name)) {
        eventBus.emit('toast', { type: 'warning', message: this._labels.importUnsupported });
        return;
      }
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const textarea = this._el?.querySelector('#protocol-import-table');
        if (textarea) textarea.value = String(readerEvent.target?.result || '');
      };
      reader.readAsText(file);
    });
  }

  _bindCommandFrameEvents() {
    this._ensureCommandFrames(this._draft);

    this._el?.querySelector('#command-frame-select')?.addEventListener('change', (event) => {
      this._commandFrameIndex = Math.max(0, Number(event.target.value) || 0);
      this._refreshBody();
    });

    this._el?.querySelector('#command-frame-add')?.addEventListener('click', () => {
      this._draft.commandFrames.push({
        title: `Command ${this._draft.commandFrames.length + 1}`,
        frameStart: this._draft.frameStart || '',
        frameEnd: this._draft.frameEnd || '',
        triggerSend: false,
        autoLength: false,
        lengthOffset: 0,
        lengthSize: 2,
        lengthEndian: 'BE',
        lengthAdjustment: 0,
        autoChecksum: false,
        checksumType: 'none',
        checksumOffset: -1,
        checksumLength: 1,
        checksumEndian: 'BE',
        checksumRangeStart: 0,
        checksumRangeLength: 0,
        parameters: []
      });
      this._commandFrameIndex = this._draft.commandFrames.length - 1;
      this._refreshBody();
    });

    this._el?.querySelector('#command-frame-delete')?.addEventListener('click', () => {
      if (this._draft.commandFrames.length <= 1) return;
      const index = this._selectedCommandFrameIndex();
      this._draft.commandFrames.splice(index, 1);
      this._commandFrameIndex = Math.max(0, index - 1);
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-command-field]').forEach((node) => {
      const field = node.dataset.commandField;
      node.addEventListener(node.type === 'checkbox' || node.tagName === 'SELECT' ? 'change' : 'input', () => {
        const command = this._selectedCommandFrame();
        if (!command || !field) return;
        if (node.type === 'checkbox') {
          command[field] = !!node.checked;
        } else if (['lengthOffset', 'lengthSize', 'lengthAdjustment', 'checksumOffset', 'checksumLength', 'checksumRangeStart', 'checksumRangeLength'].includes(field)) {
          command[field] = Number(node.value) || 0;
        } else {
          command[field] = node.value;
        }
        this._updateCommandPreview();
      });
    });

    this._el?.querySelector('#command-param-add')?.addEventListener('click', () => {
      const command = this._selectedCommandFrame();
      if (!command) return;
      if (!Array.isArray(command.parameters)) command.parameters = [];
      command.parameters.push(this._normalizeCommandParameter({}, command.parameters.length));
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-command-add-field]').forEach((node) => {
      node.addEventListener('click', () => {
        this._addCommandFieldByKind(node.dataset.commandAddField);
      });
    });

    this._el?.querySelectorAll('[data-command-param-field]').forEach((node) => {
      const index = Number(node.dataset.index);
      const field = node.dataset.commandParamField;
      node.addEventListener(node.tagName === 'SELECT' ? 'change' : 'input', () => {
        const param = this._selectedCommandFrame()?.parameters?.[index];
        if (!param || !field) return;
        param[field] = node.value;
        this._updateCommandPreview();
      });
    });

    this._el?.querySelectorAll('[data-command-control-index]').forEach((node) => {
      const index = Number(node.dataset.commandControlIndex);
      node.addEventListener(node.type === 'checkbox' ? 'change' : 'input', () => {
        const command = this._selectedCommandFrame();
        const param = command?.parameters?.[index];
        if (!command || !param) return;
        if (node.dataset.bit !== undefined) {
          const bit = Number(node.dataset.bit);
          let value = Math.max(0, Number(param.value) || 0);
          value = node.checked ? (value | (1 << bit)) : (value & ~(1 << bit));
          param.value = String(value);
        } else {
          param.value = node.value;
        }
        this._syncCommandControlValue(index, param.value);
        this._updateCommandPreview();
        if (command.triggerSend) this._sendCommandFrame(command, false);
      });
    });

    this._el?.querySelectorAll('[data-command-param-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const command = this._selectedCommandFrame();
        const index = Number(node.dataset.commandParamRemove);
        if (!command || !Number.isInteger(index)) return;
        command.parameters.splice(index, 1);
        this._refreshBody();
      });
    });

    this._el?.querySelector('#command-frame-send')?.addEventListener('click', () => {
      this._sendCommandFrame(this._selectedCommandFrame(), true);
    });
  }

  _addCommandFieldByKind(kind) {
    const command = this._selectedCommandFrame();
    if (!command) return;
    if (!Array.isArray(command.parameters)) command.parameters = [];
    const addParam = (type, label) => {
      const index = command.parameters.length + 1;
      command.parameters.push(this._normalizeCommandParameter({
        name: `${label || 'data'}${index}`,
        label: `${label || this._labels.paramValue}${index}`,
        type,
        value: 0,
        endian: 'LE'
      }, command.parameters.length));
    };

    if (kind === 'header') {
      command.frameStart = command.frameStart || 'AA 55';
    } else if (kind === 'tail') {
      command.frameEnd = command.frameEnd || 'DD EE';
    } else if (kind === 'sequence') {
      addParam('uint16', 'seq');
    } else if (kind === 'id') {
      addParam('uint16', 'id');
    } else if (kind === 'length') {
      const offset = this._hexStringToBytes(command.frameStart || '').length
        + (command.parameters || []).reduce((sum, param) => sum + this._commandParameterBytes(param).length, 0);
      addParam('uint16', 'len');
      command.autoLength = true;
      command.lengthOffset = offset;
      command.lengthSize = 2;
      command.lengthEndian = 'LE';
    } else if (kind === 'checksum') {
      command.autoChecksum = true;
      command.checksumType = command.checksumType && command.checksumType !== 'none' ? command.checksumType : 'sum8';
      command.checksumOffset = -1;
      command.checksumLength = 1;
    } else if (kind === '1byte') {
      addParam('uint8', 'data');
    } else if (kind === '2byte') {
      addParam('uint16', 'data');
    } else if (kind === '3byte') {
      addParam('uint24', 'data');
    } else if (kind === '4byte') {
      addParam('uint32', 'data');
    } else if (kind === '8byte') {
      addParam('float64', 'data');
    }
    this._refreshBody();
  }

  _syncCommandControlValue(index, value) {
    this._el?.querySelectorAll(`[data-index="${index}"][data-command-param-field="value"]`).forEach((input) => {
      input.value = value;
    });
    this._el?.querySelectorAll(`[data-command-control-index="${index}"]`).forEach((input) => {
      if (input.dataset.bit !== undefined || input.type === 'checkbox') return;
      input.value = value;
    });
  }

  _sendCommandFrame(command, showToast = true) {
    if (!appState.isConnected) {
      if (showToast) eventBus.emit('toast', { type: 'warning', message: this._labels.commandSendNeedsConnection });
      return;
    }
    if (!command) return;
    try {
      const bytes = new Uint8Array(this._buildCommandFrameBytes(command));
      eventBus.emit('project:sendCommand', { data: bytes, command });
      if (showToast) eventBus.emit('toast', { type: 'success', message: this._labels.commandSent });
    } catch (error) {
      eventBus.emit('toast', { type: 'error', message: error?.message || String(error) });
    }
  }

  _selectedCommandFrameIndex() {
    const frames = this._draft?.commandFrames || [];
    const index = Math.max(0, Number(this._commandFrameIndex) || 0);
    return Math.min(index, Math.max(0, frames.length - 1));
  }

  _selectedCommandFrame() {
    this._ensureCommandFrames(this._draft);
    return this._draft.commandFrames[this._selectedCommandFrameIndex()] || null;
  }

  _updateCommandPreview() {
    const preview = this._el?.querySelector('#command-frame-preview');
    if (!preview) return;
    try {
      preview.textContent = this._formatHex(this._buildCommandFrameBytes(this._selectedCommandFrame()));
      preview.dataset.state = 'ok';
    } catch (error) {
      preview.textContent = error?.message || String(error);
      preview.dataset.state = 'error';
    }
  }

  _bindJcomFormatEvents() {
    this._el?.querySelectorAll('[data-jcom-add-field]').forEach((node) => {
      node.addEventListener('click', () => {
        this._addJcomField(node.dataset.jcomAddField);
      });
    });

    this._el?.querySelectorAll('[data-jcom-select]').forEach((node) => {
      node.addEventListener('click', () => {
        this._jcomFieldIndex = Math.max(0, Number(node.dataset.jcomSelect) || 0);
        this._refreshBody();
      });
    });

    this._el?.querySelectorAll('[data-jcom-inline-value]').forEach((node) => {
      node.addEventListener('click', (event) => event.stopPropagation());
      node.addEventListener('input', () => {
        const index = Number(node.dataset.index);
        const field = this._draft.protocolFields?.[index];
        if (!field) return;
        this._setJcomInlineValue(field, node.value);
      });
    });

    this._el?.querySelectorAll('[data-jcom-remove]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.stopPropagation();
        const index = Number(node.dataset.jcomRemove);
        if (!Number.isInteger(index)) return;
        this._draft.protocolFields?.splice(index, 1);
        this._jcomFieldIndex = Math.max(0, Math.min(index, (this._draft.protocolFields?.length || 1) - 1));
        this._syncProtocolSchema(this._draft);
        this._refreshBody();
      });
    });

    this._el?.querySelector('#jcom-field-load')?.addEventListener('click', () => {
      this._syncProtocolSchema(this._draft);
      this._refreshBody();
    });

    this._el?.querySelector('#jcom-parser-generate')?.addEventListener('click', () => {
      this._autoAssignFieldOffsets();
      if (!this._canGenerateParser(this._draft)) {
        eventBus.emit('toast', { type: 'warning', message: this._labels.parserNeedsFields });
        return;
      }
      this._syncGeneratedParser(this._draft);
      this._syncProtocolSchema(this._draft);
      this._refreshBody();
      eventBus.emit('toast', { type: 'success', message: this._labels.parserGenerated });
    });

    this._el?.querySelectorAll('[data-jcom-field]').forEach((node) => {
      const key = node.dataset.jcomField;
      node.addEventListener(node.type === 'checkbox' || node.type === 'radio' || node.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (node.type === 'radio' && !node.checked) return;
        const value = node.type === 'checkbox' ? node.checked : node.value;
        this._setJcomFieldValue(key, value);
      });
    });

    this._el?.querySelector('#jcom-channel-add')?.addEventListener('click', () => {
      const field = this._selectedJcomField();
      if (!field) return;
      const channels = this._ensureJcomChannelDefs(field);
      channels.push({ name: `Ch${channels.length + 1}`, type: field.type || 'int16', endian: field.endian || 'BE', formula: field.formula || 'raw' });
      field.channels = channels.length;
      this._syncJcomArrayByteLength(field);
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-jcom-channel-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const field = this._selectedJcomField();
        if (!field) return;
        const channels = this._ensureJcomChannelDefs(field);
        if (channels.length <= 1) return;
        const index = Number(node.dataset.jcomChannelRemove);
        if (!Number.isInteger(index)) return;
        channels.splice(index, 1);
        field.channels = channels.length;
        field.type = channels[0]?.type || field.type;
        field.endian = channels[0]?.endian || field.endian;
        field.formula = channels[0]?.formula || field.formula;
        this._syncJcomArrayByteLength(field);
        this._syncProtocolSchema(this._draft);
        this._refreshBody();
      });
    });

    this._el?.querySelectorAll('[data-jcom-channel-field]').forEach((node) => {
      node.addEventListener(node.type === 'checkbox' || node.tagName === 'SELECT' ? 'change' : 'input', () => {
        const field = this._selectedJcomField();
        if (!field) return;
        const channels = this._ensureJcomChannelDefs(field);
        const index = Number(node.dataset.index);
        const key = node.dataset.jcomChannelField;
        const channel = channels[index];
        if (!channel || !key) return;
        channel[key] = node.type === 'checkbox' ? (node.checked ? 'BE' : 'LE') : node.value;
        field.channels = channels.length;
        if (index === 0) {
          field.type = channel.type || field.type;
          field.endian = channel.endian || field.endian;
          field.formula = channel.formula || field.formula;
        }
        this._syncJcomArrayByteLength(field);
        this._syncProtocolSchema(this._draft);
        this._updateJcomPreview();
      });
    });
  }

  _setJcomInlineValue(field, value) {
    if (!field) return;
    field.fixedValue = String(value || '').trim();
    const byteLength = hexByteLength(field.fixedValue);
    if (byteLength > 0) {
      field.count = byteLength;
      if (byteLength === 1) field.type = 'uint8';
      if (byteLength === 2) field.type = 'uint16';
      if (byteLength === 3) field.type = 'uint24';
      if (byteLength === 4) field.type = 'uint32';
      if (byteLength === 8) field.type = 'float64';
    }
    this._syncFrameDelimiterFromField(field);
    if (field.kind === 'frameLength') this._syncFrameLengthFromField(field);
    if (field.kind === 'checksum') {
      this._ensureProfessionalConfig(this._draft);
      this._draft.protocolValidation.checksum.offset = Math.max(0, Number(field.offset) || 0);
      this._draft.protocolValidation.checksum.length = Math.max(1, byteLength || fieldByteSize(field));
    }
    this._syncProtocolSchema(this._draft);
    this._updateJcomPreview();
  }

  _ensureJcomChannelDefs(field) {
    const count = Math.max(1, Number(field?.channels) || 1);
    if (!Array.isArray(field.channelDefs)) field.channelDefs = [];
    for (let i = field.channelDefs.length; i < count; i += 1) {
      field.channelDefs.push({
        name: `Ch${i + 1}`,
        type: field.type || 'int16',
        endian: field.endian || 'BE',
        formula: field.formula || 'raw'
      });
    }
    if (field.channelDefs.length > count) field.channelDefs = field.channelDefs.slice(0, count);
    return field.channelDefs;
  }

  _addJcomField(kind) {
    if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
    const offset = this._draft.protocolFields.length
      ? fieldEndOffset(this._draft.protocolFields[this._draft.protocolFields.length - 1])
      : 0;
    const names = this._labels.fieldKindNames || {};
    const create = (field) => this._normalizeProtocolField({
      kind: 'byte',
      name: `field${this._draft.protocolFields.length + 1}`,
      title: `field${this._draft.protocolFields.length + 1}`,
      type: 'uint8',
      offset,
      count: 1,
      endian: 'BE',
      fixedValue: '',
      formula: '',
      units: '',
      channels: 1,
      arrayOrder: 'channelFirst',
      lengthField: '',
      ...field
    }, this._draft.protocolFields.length);

    const map = {
      frameHeader: () => create({ kind: 'frameHeader', name: 'frameHeader', title: names.frameHeader || 'Header', fixedValue: this._draft.frameStart || '5A A5', count: Math.max(1, hexByteLength(this._draft.frameStart || '5A A5')) }),
      frameSequence: () => create({ kind: 'frameSequence', name: 'frameSequence', title: names.frameSequence || 'Sequence', type: 'uint16', endian: 'LE' }),
      frameId: () => create({ kind: 'frameId', name: 'frameId', title: names.frameId || 'Frame ID', type: 'uint32', endian: 'LE' }),
      frameLength: () => create({ kind: 'frameLength', name: 'frameLength', title: names.frameLength || 'Length', type: 'uint16', endian: 'LE' }),
      byte1: () => create({ kind: 'byte', type: 'uint8', title: '1Byte' }),
      byte2: () => create({ kind: 'byte', type: 'uint16', title: '2Byte', endian: 'LE' }),
      byte3: () => create({ kind: 'byte', type: 'int24', title: '3Byte', endian: 'BE' }),
      byte4: () => create({ kind: 'byte', type: 'uint32', title: '4Byte', endian: 'LE' }),
      byte8: () => create({ kind: 'byte', type: 'float64', title: '8Byte', endian: 'LE' }),
      fixedArray: () => create({ kind: 'fixedArray', name: `fifo${this._draft.protocolFields.length + 1}`, title: names.fixedArray || 'Fixed Array', type: 'int24', count: 1, channels: 1, endian: 'BE', dataConversion: 'FIFO' }),
      variableArray: () => create({ kind: 'variableArray', name: `var${this._draft.protocolFields.length + 1}`, title: names.variableArray || 'Variable Array', type: 'int24', count: 1, channels: 1, endian: 'BE', lengthField: 'frameLength', dataConversion: 'FIFO' }),
      checksum: () => create({ kind: 'checksum', name: 'checksum', title: names.checksum || 'Checksum', type: 'uint8', count: 1, endian: 'BE' }),
      frameTail: () => create({ kind: 'frameTail', name: 'frameTail', title: names.frameTail || 'Tail', fixedValue: this._draft.frameEnd || 'DD EE', count: Math.max(1, hexByteLength(this._draft.frameEnd || 'DD EE')) })
    };

    const field = (map[kind] || map.byte1)();
    this._applyProtocolFieldKindDefaults(field);
    this._draft.protocolFields.push(field);
    this._jcomFieldIndex = this._draft.protocolFields.length - 1;
    this._autoAssignFieldOffsets();
    this._syncFrameDelimiterFromField(field);
    this._syncFrameLengthFromField(field);
    if (field.kind === 'checksum') {
      this._ensureProfessionalConfig(this._draft);
      this._draft.protocolValidation.checksum = {
        ...this._draft.protocolValidation.checksum,
        type: this._draft.protocolValidation.checksum.type === 'none' ? 'sum8' : this._draft.protocolValidation.checksum.type,
        offset: field.offset,
        length: fieldByteSize(field)
      };
    }
    this._syncProtocolSchema(this._draft);
    this._refreshBody();
  }

  _selectedJcomFieldIndex() {
    const fields = this._draft?.protocolFields || [];
    const index = Math.max(0, Number(this._jcomFieldIndex) || 0);
    return Math.min(index, Math.max(0, fields.length - 1));
  }

  _selectedJcomField() {
    return this._draft?.protocolFields?.[this._selectedJcomFieldIndex()] || null;
  }

  _syncJcomArrayByteLength(field) {
    if (!field || (field.kind !== 'fixedArray' && field.kind !== 'variableArray')) return;
    const channels = this._ensureJcomChannelDefs(field);
    const unit = Math.max(1, channels.reduce((sum, channel) => (
      sum + byteLengthForType(channel.type || field.type || 'uint8')
    ), 0));
    field.byteLength = Math.max(1, Number(field.count) || 1) * unit;
  }

  _setJcomFieldValue(key, value) {
    const field = this._selectedJcomField();
    if (!field || !key) return;
    if (key === 'byteLength') {
      const bytes = Math.max(1, Number(value) || 1);
      if (field.kind === 'fixedArray' || field.kind === 'variableArray') {
        field.byteLength = bytes;
        const channels = this._ensureJcomChannelDefs(field);
        const unit = Math.max(1, channels.reduce((sum, channel) => (
          sum + byteLengthForType(channel.type || field.type || 'uint8')
        ), 0));
        field.count = Math.max(1, Math.floor(bytes / unit) || 1);
      } else {
        const unit = Math.max(1, byteLengthForType(field.type) * Math.max(1, Number(field.channels) || 1));
        field.count = Math.max(1, Math.ceil(bytes / unit));
      }
    } else if (['count', 'channels'].includes(key)) {
      field[key] = Math.max(1, Number(value) || 1);
      if (key === 'count' && (field.kind === 'fixedArray' || field.kind === 'variableArray')) {
        this._syncJcomArrayByteLength(field);
      }
    } else if (key === 'offset') {
      field.offset = Math.max(0, Number(value) || 0);
    } else if (key === 'endian') {
      field.endian = value === true || String(value).toUpperCase() === 'BE' ? 'BE' : 'LE';
    } else if (key === 'arrayOrderByIndex') {
      field.arrayOrder = String(value) === 'interleaved' ? 'interleaved' : 'channelFirst';
    } else if (key === 'checksumTypeProxy') {
      this._ensureProfessionalConfig(this._draft);
      this._draft.protocolValidation.checksum.type = CHECKSUM_TYPES.includes(value) ? value : 'sum8';
    } else {
      field[key] = value;
    }
    if (key === 'title') field.name = this._safeFieldName(value, field.name);
    if (key === 'fixedValue') this._syncFrameDelimiterFromField(field);
    if (field.kind === 'frameLength') this._syncFrameLengthFromField(field);
    if (field.kind === 'checksum') {
      this._ensureProfessionalConfig(this._draft);
      this._draft.protocolValidation.checksum.offset = Math.max(0, Number(field.offset) || 0);
      this._draft.protocolValidation.checksum.length = fieldByteSize(field);
    }
    this._syncProtocolSchema(this._draft);
    this._updateJcomPreview();
  }

  _safeFieldName(value, fallback = 'field') {
    const text = String(value || fallback || 'field').trim();
    return text
      .replace(/[^\w\u4e00-\u9fa5]+/g, '_')
      .replace(/^_+|_+$/g, '') || fallback || 'field';
  }

  _updateJcomPreview() {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    this._el?.querySelectorAll('.jcom-field-row').forEach((row) => {
      const index = Number(row.dataset.jcomSelect);
      const field = fields[index];
      if (!field) return;
      const kind = row.querySelector('.jcom-field-kind');
      const value = row.querySelector('.jcom-field-value');
      if (kind) kind.textContent = this._jcomFieldKindLabel(field);
      if (value) {
        const input = value.querySelector('input');
        if (input && document.activeElement !== input) input.value = this._jcomFieldValuePreview(field);
        if (!input) value.textContent = this._jcomFieldValuePreview(field);
      }
    });
  }

  _setProfessionalValue(path, value) {
    this._ensureProfessionalConfig(this._draft);
    const parts = String(path || '').split('.').filter(Boolean);
    if (!parts.length) return;
    let target = this._draft;
    for (let i = 0; i < parts.length - 1; i += 1) {
      target = target[parts[i]];
      if (!target) return;
    }
    const key = parts[parts.length - 1];
    if (['enabled'].includes(key)) {
      target[key] = !!value;
    } else if (['offset', 'size', 'adjustment', 'length', 'rangeStart', 'rangeLength'].includes(key)) {
      target[key] = Number(value) || 0;
    } else {
      target[key] = value;
    }
  }

  _applyProtocolFieldKindDefaults(field) {
    const kind = field?.kind || 'byte';
    const canRename = !field.name || /^field\d+$/i.test(String(field.name));
    if (kind === 'frameHeader') {
      if (canRename) field.name = 'frameHeader';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.frameHeader || 'Frame Header') : field.title;
      field.fixedValue = field.fixedValue || this._draft.frameStart || '';
      field.type = 'uint8';
      field.count = Math.max(1, hexByteLength(field.fixedValue) || Number(field.count) || 1);
      return;
    }
    if (kind === 'frameTail') {
      if (canRename) field.name = 'frameTail';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.frameTail || 'Frame Tail') : field.title;
      field.fixedValue = field.fixedValue || this._draft.frameEnd || '';
      field.type = 'uint8';
      field.count = Math.max(1, hexByteLength(field.fixedValue) || Number(field.count) || 1);
      return;
    }
    if (kind === 'frameSequence') {
      if (canRename) field.name = 'frameSequence';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.frameSequence || 'Frame Sequence') : field.title;
    } else if (kind === 'frameId') {
      if (canRename) field.name = 'frameId';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.frameId || 'Frame ID') : field.title;
    } else if (kind === 'frameLength') {
      if (canRename) field.name = 'frameLength';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.frameLength || 'Frame Length') : field.title;
    } else if (kind === 'checksum') {
      if (canRename) field.name = 'checksum';
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.checksum || 'Checksum') : field.title;
      field.type = field.type || 'uint8';
      field.count = Math.max(1, Number(field.count) || 1);
    } else if (kind === 'fixedArray' || kind === 'variableArray') {
      field.title = !field.title || /^field\d+$/i.test(String(field.title)) ? (this._labels.fieldKindNames?.[kind] || field.name || 'Array') : field.title;
      field.channels = Math.max(1, Number(field.channels) || 1);
      field.count = Math.max(1, Number(field.count) || 1);
      field.arrayOrder = ARRAY_ORDERS.includes(field.arrayOrder) ? field.arrayOrder : 'channelFirst';
      if (kind === 'variableArray') field.lengthField = field.lengthField || 'frameLength';
    }
    if (!FIELD_TYPES.includes(field.type)) field.type = 'uint16';
  }

  _syncFrameLengthFromField(field) {
    if (!field || field.kind !== 'frameLength') return;
    this._ensureProfessionalConfig(this._draft);
    this._draft.protocolValidation.frameLength = {
      ...this._draft.protocolValidation.frameLength,
      enabled: true,
      offset: Math.max(0, Number(field.offset) || 0),
      size: byteLengthForType(field.type),
      endian: field.endian === 'LE' ? 'LE' : 'BE'
    };
  }

  _syncFrameDelimiterFromField(field) {
    if (!field) return;
    if (field.kind === 'frameHeader' && field.fixedValue) {
      this._draft.frameStart = field.fixedValue;
      this._draft.hexadecimalDelimiters = true;
      if (this._draft.frameDetection !== 'StartAndEndDelimiter') this._draft.frameDetection = 'StartAndEndDelimiter';
    }
    if (field.kind === 'frameTail' && field.fixedValue) {
      this._draft.frameEnd = field.fixedValue;
      this._draft.hexadecimalDelimiters = true;
      if (this._draft.frameDetection !== 'StartAndEndDelimiter') this._draft.frameDetection = 'StartAndEndDelimiter';
    }
  }

  _bindFormulaTools() {
    const templateSelect = this._el?.querySelector('#formula-template-select');
    const formulaArea = this._el?.querySelector('[data-field="formula"]');
    this._el?.querySelector('#formula-template-apply')?.addEventListener('click', () => {
      const key = templateSelect?.value || 'custom';
      const formula = FORMULA_TEMPLATES[key];
      if (formula === undefined || key === 'custom' || !formulaArea) return;
      formulaArea.value = formula;
      formulaArea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    this._el?.querySelector('#formula-test-run')?.addEventListener('click', () => {
      const resultEl = this._el?.querySelector('#formula-test-result');
      if (!resultEl || !formulaArea) return;
      const raw = Number(this._el?.querySelector('#formula-test-raw')?.value || 0);
      const index = Number(this._el?.querySelector('#formula-test-index')?.value || 0);
      const fields = this._sampleFieldsForFormula(raw);
      const params = {};
      (this._draft.calibrationParameters || []).forEach((item) => {
        if (!item?.name) return;
        params[String(item.name)] = Number(item.value) || 0;
      });
      try {
        const value = Function('raw', 'fields', 'bytes', 'Math', 'index', 'params', '"use strict"; return (' + formulaArea.value + ');')(
          raw,
          fields,
          [],
          Math,
          index,
          params
        );
        resultEl.textContent = Array.isArray(value) ? JSON.stringify(value.slice(0, 8)) : String(value);
        resultEl.dataset.state = 'ok';
      } catch (error) {
        resultEl.textContent = error?.message || String(error);
        resultEl.dataset.state = 'error';
      }
    });
  }

  _batchGenerateFieldsAndDatasets() {
    if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
    if (!Array.isArray(this._draft.groups)) this._draft.groups = [];

    const read = (selector, fallback = '') => this._el?.querySelector(selector)?.value ?? fallback;
    const prefix = String(read('#batch-prefix', 'ch')).trim() || 'ch';
    const count = Math.max(1, Number(read('#batch-count', 3)) || 3);
    const startOffset = Math.max(0, Number(read('#batch-start-offset', 0)) || 0);
    const samples = Math.max(1, Number(read('#batch-samples', 1)) || 1);
    const type = FIELD_TYPES.includes(read('#batch-type', 'int24')) ? read('#batch-type', 'int24') : 'int24';
    const endian = read('#batch-endian', 'BE') === 'LE' ? 'LE' : 'BE';
    const formula = String(read('#batch-formula', 'raw')).trim() || 'raw';
    const units = String(read('#batch-units', '')).trim();
    const widget = read('#batch-widget', 'MultiPlot') || 'MultiPlot';
    const groupTitle = String(read('#batch-group-title', prefix)).trim() || prefix;
    const sampleRate = Math.max(0, Number(read('#batch-sample-rate', 0)) || 0);
    const byteStep = byteLengthForType(type) * samples;
    const nextDatasetIndex = this._nextDatasetIndex();

    const fields = [];
    const datasets = [];
    for (let i = 0; i < count; i += 1) {
      const channel = i + 1;
      const fieldName = `${prefix}${channel}`;
      fields.push({
        name: fieldName,
        type,
        offset: startOffset + (i * byteStep),
        count: samples,
        endian
      });
      datasets.push({
        title: `${prefix}${channel}`,
        index: nextDatasetIndex + i,
        units,
        widget: widget === 'Gauges' ? 'Gauge' : 'Plot',
        sourceField: fieldName,
        formula,
        min: -100,
        max: 100,
        alarm: 0,
        led: false,
        fft: false,
        fftSampleRate: sampleRate,
        fftSampleRateField: '',
        fftPoints: 128,
        fftWindow: 'Hann',
        fftMagnitudeMode: 'linear',
        fftAmplitudeUnit: units,
        plot: widget !== 'Gauges',
        graph: widget !== 'Gauges',
        bar: false,
        gauge: widget === 'Gauges',
        compass: false
      });
    }

    this._draft.protocolFields.push(...fields.map((field, index) => this._normalizeProtocolField(field, this._draft.protocolFields.length + index)));
    this._draft.groups.push({
      title: groupTitle,
      widget,
      datasets
    });
  }

  _nextDatasetIndex() {
    const indices = [];
    (this._draft.groups || []).forEach((group) => {
      (group.datasets || []).forEach((dataset) => {
        const index = Number(dataset.index);
        if (Number.isFinite(index)) indices.push(index);
      });
    });
    return indices.length ? Math.max(...indices) + 1 : 0;
  }

  _importProtocolTable(text) {
    const rows = this._parseProtocolTable(text);
    if (!rows.length) return;
    if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
    if (!Array.isArray(this._draft.groups)) this._draft.groups = [];

    const nextDatasetIndex = this._nextDatasetIndex();
    const fields = [];
    const datasets = [];
    const cell = (row, keys, fallback = '') => {
      for (const key of keys) {
        const normalized = key.toLowerCase().replace(/\s+/g, '');
        if (row[normalized] !== undefined && row[normalized] !== '') return row[normalized];
      }
      return fallback;
    };

    rows.forEach((row, rowIndex) => {
      const fieldName = String(cell(row, ['name', 'field', 'fieldName'], `field${rowIndex + 1}`)).trim();
      if (!fieldName) return;
      const typeText = String(cell(row, ['type'], 'uint16')).toLowerCase();
      const type = FIELD_TYPES.includes(typeText) ? typeText : 'uint16';
      const kind = this._protocolFieldKindFromText(cell(row, ['kind', 'fieldKind', '字段类型'], 'byte'));
      const field = this._normalizeProtocolField({
        kind,
        name: fieldName,
        title: String(cell(row, ['title', 'displayName', 'dataset', 'label'], fieldName)).trim(),
        type,
        offset: Number(cell(row, ['offset', 'byteOffset', 'start'], 0)) || 0,
        count: Number(cell(row, ['count', 'samples', 'length'], 1)) || 1,
        endian: String(cell(row, ['endian', 'byteOrder'], 'BE')).toUpperCase() === 'LE' ? 'LE' : 'BE',
        fixedValue: String(cell(row, ['fixedValue', 'hex', 'value'], '')),
        formula: String(cell(row, ['formula', 'expression'], '')),
        units: String(cell(row, ['units', 'unit'], ''))
      }, this._draft.protocolFields.length + fields.length);
      fields.push(field);

      const title = String(cell(row, ['title', 'dataset', 'label'], fieldName)).trim();
      const formula = String(cell(row, ['formula', 'expression'], 'raw')).trim();
      if (!['frameHeader', 'frameTail', 'checksum'].includes(kind) && (title || formula)) {
        const widget = String(cell(row, ['widget'], 'Plot')).trim();
        datasets.push({
          title: title || fieldName,
          index: Number(cell(row, ['index', 'datasetIndex'], nextDatasetIndex + datasets.length)) || 0,
          sourceId: String(cell(row, ['sourceId'], '')),
          units: String(cell(row, ['units', 'unit'], '')),
          widget: DATASET_WIDGETS.includes(widget) ? widget : 'Plot',
          sourceField: fieldName,
          formula: formula || 'raw',
          min: Number(cell(row, ['min'], -100)) || -100,
          max: Number(cell(row, ['max'], 100)) || 100,
          alarm: Number(cell(row, ['alarm'], 0)) || 0,
          plot: true,
          graph: true,
          bar: false,
          gauge: widget === 'Gauge',
          led: false,
          fft: false,
          compass: false
        });
      }
    });

    if (!fields.length) return;
    this._draft.protocolFields.push(...fields);
    if (datasets.length) {
      this._draft.groups.push({
        title: 'Imported Protocol',
        widget: 'MultiPlot',
        datasets
      });
    }
    this._selected = { type: 'project' };
    this._refreshBody();
    eventBus.emit('toast', { type: 'success', message: this._labels.importCreated });
  }

  _parseProtocolTable(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    const split = (line) => line.split(delimiter).map((part) => part.trim());
    const first = split(lines[0]).map((item) => item.toLowerCase());
    const knownHeaders = ['name', 'field', 'fieldname', 'kind', 'fieldkind', '字段类型', 'type', 'offset', 'byteoffset', 'start', 'count', 'samples', 'length', 'endian', 'byteorder', 'title', 'displayname', 'units', 'unit', 'formula', 'expression', 'widget', 'sourceid', 'index', 'fixedvalue', 'hex', 'value'];
    const hasHeader = first.some((item) => knownHeaders.includes(item.replace(/\s+/g, '')));
    const headers = hasHeader
      ? first.map((item) => item.replace(/\s+/g, ''))
      : ['name', 'type', 'offset', 'count', 'endian', 'title', 'units', 'formula', 'widget'];
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const parts = split(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = parts[index] ?? '';
      });
      if (row.sourceid !== undefined) row.sourceId = row.sourceid;
      return row;
    });
  }

  _protocolFieldKindFromText(value) {
    const text = String(value || '').trim().toLowerCase().replace(/\s+/g, '');
    const map = {
      byte: 'byte',
      normal: 'byte',
      data: 'byte',
      '普通byte': 'byte',
      '普通byte字段': 'byte',
      '帧头': 'frameHeader',
      header: 'frameHeader',
      frameheader: 'frameHeader',
      '帧尾': 'frameTail',
      tail: 'frameTail',
      trailer: 'frameTail',
      frametail: 'frameTail',
      '帧序号': 'frameSequence',
      sequence: 'frameSequence',
      framesequence: 'frameSequence',
      '帧id': 'frameId',
      frameid: 'frameId',
      id: 'frameId',
      '帧长度': 'frameLength',
      length: 'frameLength',
      framelength: 'frameLength',
      checksum: 'checksum',
      crc: 'checksum',
      sum: 'checksum',
      '定长数组': 'fixedArray',
      fixedarray: 'fixedArray',
      array: 'fixedArray',
      '变长数组': 'variableArray',
      variablearray: 'variableArray',
      vararray: 'variableArray'
    };
    return map[text] || (PROTOCOL_FIELD_KINDS.includes(value) ? value : 'byte');
  }

  _runSampleHexTest() {
    const resultEl = this._el?.querySelector('#project-sample-test-result');
    const input = this._el?.querySelector('#project-sample-hex');
    if (!resultEl || !input) return;

    try {
      const rawHex = String(input.value || '');
      const code = this._canGenerateParser(this._draft)
        ? this._generateParserCode(this._draft)
        : String(this._draft.frameParserCode || this._draft.frameParser || '');
      if (!code.trim()) throw new Error('No parser code available.');

      const parse = Function(`${code}; return (typeof parse === "function") ? parse : null;`)();
      if (typeof parse !== 'function') throw new Error('Parser must define function parse(frame).');

      const stripped = this._stripFrameDelimiters(rawHex);
      const candidates = stripped && stripped !== rawHex ? [stripped, rawHex] : [rawHex];

      let parsed = null;
      let usedCandidate = '';
      for (const candidate of candidates) {
        const value = parse(candidate);
        const datasets = Array.isArray(value?.datasets) ? value.datasets : (Array.isArray(value) ? value : []);
        if (datasets.length) {
          parsed = value;
          usedCandidate = candidate;
          break;
        }
        if (parsed === null) {
          parsed = value;
          usedCandidate = candidate;
        }
      }

      const normalized = this._summarizeParseResult(parsed, usedCandidate);
      resultEl.textContent = JSON.stringify(normalized, null, 2);
      resultEl.dataset.state = 'ok';
      eventBus.emit('toast', { type: 'success', message: this._labels.parserTestPassed });
    } catch (error) {
      resultEl.textContent = error?.message || String(error);
      resultEl.dataset.state = 'error';
      eventBus.emit('toast', { type: 'error', message: this._labels.parserTestFailed });
    }
  }

  _stripFrameDelimiters(hexText) {
    const bytes = this._hexStringToBytes(hexText);
    if (!bytes.length) return '';
    const start = this._hexStringToBytes(this._draft.frameStart || '');
    const end = this._hexStringToBytes(this._draft.frameEnd || '');
    let from = 0;
    let to = bytes.length;

    if (start.length && this._bytesMatch(bytes, start, 0)) from = start.length;
    if (end.length && to >= end.length && this._bytesMatch(bytes, end, to - end.length)) to -= end.length;
    if (from >= to) return '';
    return bytes.slice(from, to).map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
  }

  _hexStringToBytes(hexText) {
    const clean = String(hexText || '').replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
    if (clean.length < 2 || clean.length % 2 !== 0) return [];
    const bytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      const byte = parseInt(clean.slice(i, i + 2), 16);
      if (Number.isNaN(byte)) return [];
      bytes.push(byte);
    }
    return bytes;
  }

  _formatHex(bytes) {
    return Array.from(bytes || []).map((byte) => (byte & 0xFF).toString(16).padStart(2, '0').toUpperCase()).join(' ');
  }

  _numberToBytes(value, type = 'uint8', endian = 'BE') {
    const littleEndian = endian === 'LE';
    if (type === 'float32' || type === 'float64') {
      const length = type === 'float64' ? 8 : 4;
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      if (type === 'float64') view.setFloat64(0, Number(value) || 0, littleEndian);
      else view.setFloat32(0, Number(value) || 0, littleEndian);
      return Array.from(new Uint8Array(buffer));
    }

    const signed = type.startsWith('int');
    const length = byteLengthForType(type);
    let number = Math.trunc(Number(value) || 0);
    const max = 2 ** (length * 8);
    if (signed && number < 0) number = max + number;
    number = ((number % max) + max) % max;
    const bytes = [];
    for (let i = 0; i < length; i += 1) {
      const power = littleEndian ? i : (length - 1 - i);
      bytes.push(Math.floor(number / (256 ** power)) & 0xFF);
    }
    return bytes;
  }

  _commandParameterBytes(param) {
    const normalized = this._normalizeCommandParameter(param);
    if (normalized.type === 'hex') return this._hexStringToBytes(normalized.value);
    if (normalized.type === 'ascii') return Array.from(new TextEncoder().encode(String(normalized.value || '')));
    return this._numberToBytes(normalized.value, normalized.type, normalized.endian);
  }

  _writeNumberBytes(bytes, offset, value, size, endian = 'BE') {
    const target = Math.max(0, Number(offset) || 0);
    const length = [1, 2, 4].includes(Number(size)) ? Number(size) : 2;
    if (target + length > bytes.length) {
      throw new Error(`Length/checksum offset ${target} exceeds packet size ${bytes.length}.`);
    }
    const encoded = this._numberToBytes(value, `uint${length * 8}`, endian);
    for (let i = 0; i < length; i += 1) bytes[target + i] = encoded[i] || 0;
  }

  _checksumValue(type, bytes) {
    const data = Array.from(bytes || []);
    if (!type || type === 'none') return 0;
    if (type === 'sum8') return data.reduce((sum, byte) => (sum + byte) & 0xFF, 0);
    if (type === 'sum16') return data.reduce((sum, byte) => (sum + byte) & 0xFFFF, 0);
    if (type === 'xor8') return data.reduce((sum, byte) => (sum ^ byte) & 0xFF, 0);
    if (type === 'crc8') {
      let crc = 0;
      data.forEach((byte) => {
        crc ^= byte;
        for (let i = 0; i < 8; i += 1) crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) : (crc << 1);
        crc &= 0xFF;
      });
      return crc & 0xFF;
    }
    if (type === 'crc16modbus') {
      let crc = 0xFFFF;
      data.forEach((byte) => {
        crc ^= byte;
        for (let i = 0; i < 8; i += 1) crc = (crc & 1) ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
      });
      return crc & 0xFFFF;
    }
    if (type === 'crc16ccitt') {
      let crc = 0xFFFF;
      data.forEach((byte) => {
        crc ^= byte << 8;
        for (let i = 0; i < 8; i += 1) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
          crc &= 0xFFFF;
        }
      });
      return crc & 0xFFFF;
    }
    return 0;
  }

  _buildCommandFrameBytes(command) {
    if (!command) return [];
    const body = [];
    (command.parameters || []).forEach((param) => body.push(...this._commandParameterBytes(param)));

    const start = this._hexStringToBytes(command.frameStart || '');
    const end = this._hexStringToBytes(command.frameEnd || '');
    const bytes = [...start, ...body, ...end];
    const needsChecksum = command.autoChecksum && command.checksumType && command.checksumType !== 'none';
    const checksumLength = needsChecksum
      ? Math.max(1, Number(command.checksumLength) || (command.checksumType === 'sum16' || String(command.checksumType).startsWith('crc16') ? 2 : 1))
      : 0;
    let checksumOffset = Number(command.checksumOffset);

    if (needsChecksum && checksumOffset < 0) {
      checksumOffset = end.length ? bytes.length - end.length : bytes.length;
      bytes.splice(checksumOffset, 0, ...Array(checksumLength).fill(0));
    }

    if (command.autoLength) {
      const lengthValue = bytes.length + (Number(command.lengthAdjustment) || 0);
      this._writeNumberBytes(bytes, command.lengthOffset, lengthValue, command.lengthSize, command.lengthEndian);
    }

    if (needsChecksum) {
      if (checksumOffset + checksumLength > bytes.length) {
        throw new Error(`Checksum offset ${checksumOffset} exceeds packet size ${bytes.length}.`);
      }
      const packetWithoutChecksum = bytes.slice();
      packetWithoutChecksum.splice(checksumOffset, checksumLength);
      const rangeStart = Math.max(0, Number(command.checksumRangeStart) || 0);
      const rangeEnd = Number(command.checksumRangeLength) > 0
        ? Math.min(packetWithoutChecksum.length, rangeStart + Number(command.checksumRangeLength))
        : packetWithoutChecksum.length;
      const value = this._checksumValue(command.checksumType, packetWithoutChecksum.slice(rangeStart, rangeEnd));
      this._writeNumberBytes(bytes, checksumOffset, value, checksumLength, command.checksumEndian);
    }

    return bytes;
  }

  _bytesMatch(bytes, pattern, offset) {
    if (offset < 0 || offset + pattern.length > bytes.length) return false;
    return pattern.every((byte, index) => bytes[offset + index] === byte);
  }

  _summarizeParseResult(result, usedCandidate) {
    const datasets = Array.isArray(result?.datasets)
      ? result.datasets
      : (Array.isArray(result) ? result.map((value, index) => ({ index, value })) : []);
    return {
      title: result?.title || this._draft.title || 'Parse Result',
      bytesUsed: this._hexStringToBytes(usedCandidate).length,
      datasetCount: datasets.length,
      datasets: datasets.map((dataset, fallbackIndex) => {
        const value = dataset?.value ?? dataset;
        return {
          index: dataset?.index ?? fallbackIndex,
          title: dataset?.title || `Dataset ${fallbackIndex + 1}`,
          value,
          units: dataset?.units || '',
          bufferLength: Array.isArray(dataset?.buffer) ? dataset.buffer.length : 0
        };
      })
    };
  }

  _resolveGroupIndex() {
    if (this._selected.type === 'group' || this._selected.type === 'dataset') {
      const groupIndex = Number(this._selected.groupIndex);
      if (Number.isInteger(groupIndex) && this._draft.groups[groupIndex]) return groupIndex;
    }
    return 0;
  }

  _autoAssignFieldOffsets() {
    if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
    let offset = 0;
    this._draft.protocolFields = this._draft.protocolFields.map((field, index) => {
      const normalized = this._normalizeProtocolField(field, index);
      normalized.offset = offset;
      offset += fieldByteSize(normalized);
      this._syncFrameLengthFromField(normalized);
      return normalized;
    });
    this._syncProtocolSchema(this._draft);
  }

  _canGenerateParser(project) {
    const fields = Array.isArray(project.protocolFields) ? project.protocolFields : [];
    const datasets = (project.groups || []).flatMap((group) => group.datasets || []);
    return fields.some((field) => !['frameHeader', 'frameTail'].includes(field.kind || 'byte')) ||
      datasets.some((dataset) => dataset.sourceField && dataset.formula);
  }

  _syncGeneratedParser(project) {
    project.protocolFields = (project.protocolFields || []).map((field, index) => this._normalizeProtocolField(field, index));
    this._syncProtocolSchema(project);
    const parserCode = this._generateParserCode(project);
    project.frameParserCode = parserCode;
    project.frameParser = parserCode;
    project.frameParserLanguage = 0;
    if (!Array.isArray(project.sources)) project.sources = [];
    if (Array.isArray(project.sourceIdMap) && project.sourceIdMap.length) {
      project.sources = project.sourceIdMap.map((source, index) => ({
        ...(project.sources[index] || {}),
        title: source.title || source.sourceId || `Source ${index + 1}`,
        sourceId: source.sourceId || index,
        ip: source.ip || '',
        udpPort: Number(source.udpPort) || 0,
        frameParserLanguage: 0,
        frameParserCode: parserCode
      }));
      return;
    }
    if (!project.sources.length) {
      project.sources.push({ title: project.title || 'Source 1', sourceId: 0, frameParserLanguage: 0 });
    }
    project.sources[0] = {
      ...project.sources[0],
      title: project.sources[0].title || project.title || 'Source 1',
      sourceId: project.sources[0].sourceId ?? 0,
      frameParserLanguage: 0,
      frameParserCode: parserCode
    };
  }

  _sampleFieldsForFormula(raw) {
    const fields = {};
    (this._draft.protocolFields || []).forEach((field) => {
      fields[field.name] = Math.max(1, Number(field.count) || 1) > 1 ? [raw] : raw;
    });
    fields.zero_offset = fields.zero_offset ?? 0;
    fields.scale = fields.scale ?? 1;
    fields.offset = fields.offset ?? 0;
    return fields;
  }

  _getSelectedTarget() {
    if (this._selected.type === 'project') return this._draft;
    if (this._selected.type === 'group') return this._draft.groups[this._selected.groupIndex] || null;
    if (this._selected.type === 'dataset') {
      return this._draft.groups[this._selected.groupIndex]?.datasets?.[this._selected.datasetIndex] || null;
    }
    return null;
  }

  _reindexDatasets(group) {
    if (!group?.datasets) return;
    group.datasets.forEach((dataset, index) => {
      if (!Number.isInteger(dataset.index) || dataset.index < 0 || dataset.index >= group.datasets.length) {
        dataset.index = index;
      }
    });
  }

  _prepareProjectForApply(project) {
    this._normalizeDraftForEditing(project);
    this._syncProtocolSchema(project);
    this._syncProtocolPanelDatasets(project);
    this._reindexProjectDatasets(project);
    if (!this._canGenerateParser(project)) return;
    this._syncGeneratedParser(project);
  }

  _datasetSyncKey(dataset) {
    return `${dataset?.sourceField || ''}|${Number(dataset?.index) || 0}`;
  }

  _reindexProjectDatasets(project) {
    let nextIndex = 0;
    (project.groups || []).forEach((group) => {
      if (!Array.isArray(group.datasets)) group.datasets = [];
      group.datasets.forEach((dataset) => {
        dataset.index = nextIndex;
        nextIndex += 1;
      });
    });
  }

  _displaySourceFieldsForProtocolField(field) {
    if (!field?.panelDisplay || ['frameHeader', 'frameTail', 'checksum'].includes(field.kind)) return [];
    const isArray = field.kind === 'fixedArray' || field.kind === 'variableArray';
    const channels = isArray ? Math.max(1, Number(field.channels) || 1) : 1;
    return Array.from({ length: channels }, (_, channelIndex) => ({
      title: channels > 1 ? `${field.title || field.name} Ch${channelIndex + 1}` : (field.title || field.name),
      units: field.units || '',
      sourceField: channels > 1 ? `${field.name}_ch${channelIndex + 1}` : field.name,
      formula: field.formula || 'raw'
    }));
  }

  _syncProtocolPanelDatasets(project) {
    if (!Array.isArray(project.protocolFields) || !project.protocolFields.length) return;
    const desired = project.protocolFields.flatMap((field) => this._displaySourceFieldsForProtocolField(field));
    if (!desired.length) return;

    if (!project.groups.length) project.groups.push({ title: 'Sensor Data', widget: 'MultiPlot', datasets: [] });
    const defaultGroup = project.groups[0];
    defaultGroup.title = defaultGroup.title || 'Sensor Data';
    defaultGroup.widget = defaultGroup.widget || 'MultiPlot';

    const byKey = new Map();
    const bySource = new Map();
    (project.groups || []).forEach((group) => {
      if (!Array.isArray(group.datasets)) group.datasets = [];
      group.datasets.forEach((dataset) => {
        if (!dataset.sourceField) return;
        byKey.set(this._datasetSyncKey(dataset), dataset);
        if (!bySource.has(dataset.sourceField)) bySource.set(dataset.sourceField, dataset);
      });
    });

    desired.forEach((def, index) => {
      const key = `${def.sourceField}|${index}`;
      let dataset = byKey.get(key) || bySource.get(def.sourceField);
      if (!dataset) {
        dataset = {
          title: def.title || `Dataset ${index + 1}`,
          index,
          units: def.units || '',
          widget: 'Plot',
          min: 0,
          max: 100,
          alarm: 0,
          led: false,
          fft: false,
          plot: true,
          graph: true,
          bar: false,
          gauge: false,
          compass: false,
          sourceField: def.sourceField,
          formula: def.formula || 'raw'
        };
        defaultGroup.datasets.push(dataset);
      }

      dataset.index = Number.isInteger(Number(dataset.index)) ? Number(dataset.index) : index;
      dataset.sourceField = dataset.sourceField || def.sourceField;
      dataset.formula = dataset.formula || def.formula || 'raw';
      dataset.title = dataset.title || def.title || `Dataset ${index + 1}`;
      dataset.units = dataset.units ?? def.units ?? '';
      dataset.widget = dataset.widget || 'Plot';
      dataset.min = dataset.min ?? 0;
      dataset.max = dataset.max ?? 100;
      dataset.alarm = dataset.alarm ?? 0;
      dataset.led = dataset.led ?? false;
      dataset.fft = dataset.fft ?? false;
      dataset.fftSampleRate = Number(dataset.fftSampleRate) > 0 ? Number(dataset.fftSampleRate) : 0;
      dataset.fftSampleRateField = dataset.fftSampleRateField || '';
      dataset.fftPoints = [128, 256, 512, 1024].includes(Number(dataset.fftPoints)) ? Number(dataset.fftPoints) : 128;
      dataset.fftWindow = dataset.fftWindow === 'None' ? 'None' : 'Hann';
      dataset.fftMagnitudeMode = dataset.fftMagnitudeMode === 'db' ? 'db' : 'linear';
      dataset.fftAmplitudeUnit = dataset.fftAmplitudeUnit || dataset.units || def.units || '';
      dataset.plot = dataset.plot ?? dataset.graph ?? true;
      dataset.graph = dataset.graph ?? dataset.plot ?? true;
      dataset.bar = dataset.bar ?? false;
      dataset.gauge = dataset.gauge ?? false;
      dataset.compass = dataset.compass ?? false;
      byKey.set(this._datasetSyncKey(dataset), dataset);
      if (dataset.sourceField && !bySource.has(dataset.sourceField)) bySource.set(dataset.sourceField, dataset);
    });
  }

  _generateParserCode(project) {
    this._ensureProfessionalConfig(project);
    const normalizedFields = (project.protocolFields || []).map((field, index) => this._normalizeProtocolField(field, index));
    const fields = normalizedFields
      .map((field) => ({
      kind: field.kind || 'byte',
      name: String(field.name || '') || 'field',
      title: field.title || field.name || 'field',
      type: field.type || 'uint16',
      offset: Math.max(0, Number(field.offset) || 0),
      count: Math.max(1, Number(field.count) || 1),
      endian: field.endian === 'BE' ? 'BE' : 'LE',
      formula: field.formula || '',
      units: field.units || '',
      byteLength: Math.max(0, Number(field.byteLength) || 0),
      channels: Math.max(1, Number(field.channels) || 1),
      channelDefs: Array.isArray(field.channelDefs) ? field.channelDefs.map((channel, channelIndex) => ({
        name: String(channel?.name || `Ch${channelIndex + 1}`),
        type: FIELD_TYPES.includes(channel?.type) ? channel.type : (field.type || 'uint16'),
        endian: channel?.endian === 'LE' ? 'LE' : 'BE',
        formula: String(channel?.formula || field.formula || 'raw')
      })) : [],
      arrayOrder: ARRAY_ORDERS.includes(field.arrayOrder) ? field.arrayOrder : 'channelFirst',
      lengthField: field.lengthField || ''
    }));
    const configuredDatasets = (project.groups || [])
      .flatMap((group) => group.datasets || [])
      .filter((dataset) => dataset.sourceField && dataset.formula)
      .map((dataset) => ({
        index: Number(dataset.index) || 0,
        title: dataset.title || `Dataset ${Number(dataset.index) || 0}`,
        units: dataset.units || '',
        sourceId: dataset.sourceId || '',
        sourceField: dataset.sourceField,
        formula: dataset.formula || 'raw',
        fftSampleRate: Number(dataset.fftSampleRate) > 0 ? Number(dataset.fftSampleRate) : 0,
        fftSampleRateField: dataset.fftSampleRateField || ''
      }));
    const datasets = configuredDatasets;
    const validation = JSON.parse(JSON.stringify(project.protocolValidation || {}));
    const calibrationParameters = {};
    (project.calibrationParameters || []).forEach((item) => {
      if (!item?.name) return;
      calibrationParameters[String(item.name)] = Number(item.value) || 0;
    });

    return `function parse(frame) {
  const toBytes = (input) => {
    if (Array.isArray(input)) return input.map((value) => Number(value) & 0xFF);
    if (typeof Uint8Array !== 'undefined' && input instanceof Uint8Array) return Array.from(input);
    if (input && input.buffer instanceof ArrayBuffer) {
      return Array.from(new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength));
    }
    const text = String(input || '');
    const cleanHex = text.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
    const looksLikeHex = cleanHex.length >= 2 && cleanHex.length % 2 === 0 && /^[0-9a-f]+$/i.test(cleanHex);
    if (looksLikeHex) {
      const result = [];
      for (let i = 0; i < cleanHex.length; i += 2) result.push(parseInt(cleanHex.slice(i, i + 2), 16));
      return result;
    }
    const result = [];
    for (let i = 0; i < text.length; i += 1) result.push(text.charCodeAt(i) & 0xFF);
    return result;
  };
  const bytes = toBytes(frame);

  const fieldDefs = ${JSON.stringify(fields, null, 2)};
  const datasetDefs = ${JSON.stringify(datasets, null, 2)};
  const validation = ${JSON.stringify(validation, null, 2)};
  const params = ${JSON.stringify(calibrationParameters, null, 2)};
  const frameStart = ${JSON.stringify(project.frameStart || '')};
  const frameEnd = ${JSON.stringify(project.frameEnd || '')};
  const hexToBytes = (hex) => {
    const clean = String(hex || '').replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
    const out = [];
    if (clean.length < 2 || clean.length % 2 !== 0) return out;
    for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
    return out;
  };
  const startsWithBytes = (source, pattern) => pattern.length && source.length >= pattern.length && pattern.every((byte, index) => source[index] === byte);
  const endsWithBytes = (source, pattern) => pattern.length && source.length >= pattern.length && pattern.every((byte, index) => source[source.length - pattern.length + index] === byte);
  const startBytes = hexToBytes(frameStart);
  const endBytes = hexToBytes(frameEnd);
  if (startBytes.length && !startsWithBytes(bytes, startBytes)) return [];
  if (endBytes.length && !endsWithBytes(bytes, endBytes)) return [];
  const byteLength = (type) => {
    if (type.endsWith('8')) return 1;
    if (type.endsWith('16')) return 2;
    if (type.endsWith('24')) return 3;
    if (type.endsWith('32')) return 4;
    if (type.endsWith('64')) return 8;
    return 1;
  };
  const requiredLength = fieldDefs.reduce((max, def) => {
    const channels = (def.kind === 'fixedArray' || def.kind === 'variableArray') ? Math.max(1, Number(def.channels) || 1) : 1;
    const count = def.kind === 'variableArray' ? 1 : Math.max(1, def.count || 1);
    const explicitLength = Math.max(0, Number(def.byteLength) || 0);
    const channelDefs = Array.from({ length: channels }, (_, channelIndex) => {
      const configured = Array.isArray(def.channelDefs) ? def.channelDefs[channelIndex] : null;
      return configured || { type: def.type };
    });
    const groupSize = channelDefs.reduce((sum, channel) => sum + byteLength(channel.type || def.type), 0) || byteLength(def.type);
    const size = explicitLength > 0 ? explicitLength : (count * groupSize);
    return Math.max(max, def.offset + size);
  }, 0);
  if (bytes.length < requiredLength) return [];
  const readInt = (offset, length, signed, endian) => {
    let value = 0;
    if (endian === 'LE') {
      for (let i = 0; i < length; i += 1) value += (bytes[offset + i] || 0) * Math.pow(2, 8 * i);
    } else {
      for (let i = 0; i < length; i += 1) value = (value * 256) + (bytes[offset + i] || 0);
    }
    if (signed) {
      const signBit = Math.pow(2, (length * 8) - 1);
      const full = Math.pow(2, length * 8);
      if (value >= signBit) value -= full;
    }
    return value;
  };
  const readUnsigned = (offset, length, endian) => readInt(offset, length, false, endian);
  const validateFrameLength = () => {
    const cfg = validation.frameLength || {};
    if (!cfg.enabled) return true;
    const size = Number(cfg.size) || 0;
    const offset = Number(cfg.offset) || 0;
    if (size <= 0 || offset < 0 || offset + size > bytes.length) return false;
    const declared = readUnsigned(offset, size, cfg.endian === 'LE' ? 'LE' : 'BE');
    const expected = declared + (Number(cfg.adjustment) || 0);
    return expected <= 0 || expected === bytes.length;
  };
  const checksumValue = (type, start, end) => {
    const from = Math.max(0, start);
    const to = Math.min(bytes.length, end);
    if (type === 'xor8') {
      let value = 0;
      for (let i = from; i < to; i += 1) value ^= bytes[i] || 0;
      return value & 0xFF;
    }
    if (type === 'crc16modbus') {
      let crc = 0xFFFF;
      for (let i = from; i < to; i += 1) {
        crc ^= bytes[i] || 0;
        for (let bit = 0; bit < 8; bit += 1) {
          crc = (crc & 1) ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
        }
      }
      return crc & 0xFFFF;
    }
    if (type === 'crc16ccitt') {
      let crc = 0xFFFF;
      for (let i = from; i < to; i += 1) {
        crc ^= (bytes[i] || 0) << 8;
        for (let bit = 0; bit < 8; bit += 1) {
          crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
          crc &= 0xFFFF;
        }
      }
      return crc & 0xFFFF;
    }
    if (type === 'crc8') {
      let crc = 0;
      for (let i = from; i < to; i += 1) {
        crc ^= bytes[i] || 0;
        for (let bit = 0; bit < 8; bit += 1) {
          crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) : (crc << 1);
          crc &= 0xFF;
        }
      }
      return crc & 0xFF;
    }
    let sum = 0;
    for (let i = from; i < to; i += 1) sum += bytes[i] || 0;
    return type === 'sum16' ? (sum & 0xFFFF) : (sum & 0xFF);
  };
  const validateChecksum = () => {
    const cfg = validation.checksum || {};
    const type = cfg.type || 'none';
    if (type === 'none') return true;
    const length = Math.max(1, Number(cfg.length) || 1);
    const offset = Number(cfg.offset) >= 0 ? Number(cfg.offset) : bytes.length - length;
    if (offset < 0 || offset + length > bytes.length) return false;
    const rangeStart = Math.max(0, Number(cfg.rangeStart) || 0);
    const rangeLength = Math.max(0, Number(cfg.rangeLength) || 0);
    const rangeEnd = rangeLength > 0 ? rangeStart + rangeLength : offset;
    const expected = readUnsigned(offset, length, cfg.endian === 'LE' ? 'LE' : 'BE');
    return checksumValue(type, rangeStart, rangeEnd) === expected;
  };
  if (!validateFrameLength() || !validateChecksum()) return [];
  const readOne = (def, offset, channelDef = null) => {
    const type = channelDef?.type || def.type;
    const endian = channelDef?.endian || def.endian;
    const length = byteLength(type);
    if (type === 'float32' || type === 'float64') {
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      for (let i = 0; i < length; i += 1) view.setUint8(i, bytes[offset + i] || 0);
      return type === 'float32'
        ? view.getFloat32(0, endian === 'LE')
        : view.getFloat64(0, endian === 'LE');
    }
    return readInt(offset, length, type.startsWith('int'), endian);
  };
  const fields = {};
  const applyFormulaValue = (formula, rawValue) => {
    if (!formula) return rawValue;
    const applyOne = (item, index) => {
      try {
        return Function('raw', 'fields', 'bytes', 'Math', 'index', 'params', '"use strict"; return (' + formula + ');')(item, fields, bytes, Math, index, params);
      } catch (error) {
        return NaN;
      }
    };
    return Array.isArray(rawValue) ? rawValue.map((item, index) => applyOne(item, index)) : applyOne(rawValue, 0);
  };
  fieldDefs.forEach((def) => {
    const length = byteLength(def.type);
    const isArray = def.kind === 'fixedArray' || def.kind === 'variableArray';
    if (isArray) {
      const channels = Math.max(1, Number(def.channels) || 1);
      const channelDefs = Array.from({ length: channels }, (_, channelIndex) => {
        const configured = Array.isArray(def.channelDefs) ? def.channelDefs[channelIndex] : null;
        return {
          name: configured?.name || \`Ch\${channelIndex + 1}\`,
          type: configured?.type || def.type,
          endian: configured?.endian || def.endian,
          formula: configured?.formula || def.formula || 'raw'
        };
      });
      const channelSizes = channelDefs.map((channel) => byteLength(channel.type || def.type));
      const groupSize = channelSizes.reduce((sum, size) => sum + size, 0) || length;
      const declared = Number(fields[def.lengthField]);
      const explicitLength = Math.max(0, Number(def.byteLength) || 0);
      const explicitCount = explicitLength > 0 ? Math.max(1, Math.floor(explicitLength / groupSize)) : 0;
      const count = def.kind === 'variableArray' && Number.isFinite(declared) && declared > 0
        ? Math.min(Math.max(1, explicitCount || Number(def.count) || declared), declared)
        : Math.max(1, explicitCount || Number(def.count) || 1);
      const channelValues = Array.from({ length: channels }, () => []);
      if (def.arrayOrder === 'interleaved') {
        for (let sample = 0; sample < count; sample += 1) {
          let sampleOffset = def.offset + (sample * groupSize);
          for (let channel = 0; channel < channels; channel += 1) {
            channelValues[channel].push(readOne(def, sampleOffset, channelDefs[channel]));
            sampleOffset += channelSizes[channel];
          }
        }
      } else {
        let channelBase = def.offset;
        for (let channel = 0; channel < channels; channel += 1) {
          const channelSize = channelSizes[channel];
          for (let sample = 0; sample < count; sample += 1) {
            channelValues[channel].push(readOne(def, channelBase + (sample * channelSize), channelDefs[channel]));
          }
          channelBase += count * channelSize;
        }
      }
      channelValues.forEach((values, channelIndex) => {
        const formula = channelDefs[channelIndex]?.formula || def.formula || 'raw';
        fields[\`\${def.name}_ch\${channelIndex + 1}\`] = applyFormulaValue(formula, values);
      });
      fields[def.name] = channels === 1 ? fields[\`\${def.name}_ch1\`] : channelValues.map((_, channelIndex) => fields[\`\${def.name}_ch\${channelIndex + 1}\`]);
      return;
    }
    const values = [];
    for (let i = 0; i < def.count; i += 1) values.push(readOne(def, def.offset + i * length));
    const rawValue = def.count > 1 ? values : values[0];
    fields[def.name] = applyFormulaValue(def.formula, rawValue);
  });
  fields.params = params;
  const datasets = datasetDefs.map((def) => {
    const raw = fields[def.sourceField];
    const applyFormula = (item, index) => {
      try {
        return Function('raw', 'fields', 'bytes', 'Math', 'index', 'params', '"use strict"; return (' + def.formula + ');')(item, fields, bytes, Math, index, params);
      } catch (error) {
        return NaN;
      }
    };
    const result = Array.isArray(raw) ? raw.map((item, index) => applyFormula(item, index)) : applyFormula(raw, 0);
    const value = Array.isArray(result) ? result[result.length - 1] : result;
    const dataset = { index: def.index, title: def.title, units: def.units || '', sourceId: def.sourceId || '', value };
    if (Array.isArray(result)) dataset.buffer = result;
    const fieldSampleRate = Number(fields[def.fftSampleRateField]);
    const sampleRate = Number.isFinite(fieldSampleRate) && fieldSampleRate > 0 ? fieldSampleRate : Number(def.fftSampleRate);
    if (Number.isFinite(sampleRate) && sampleRate > 0) dataset.sampleRate = sampleRate;
    return dataset;
  });
  return { title: ${JSON.stringify(project.title || 'Project Data')}, datasets };
}
`;
  }

  _renderBody() {
    return `
      <div class="editor-layout">
        <div style="width:260px;display:flex;flex-direction:column;gap:10px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <button class="btn" id="project-editor-add-group">${this._labels.addGroup}</button>
            <button class="btn" id="project-editor-add-dataset">${this._labels.addDataset}</button>
          </div>
          <button class="btn" id="project-editor-remove" ${this._selected.type === 'project' ? 'disabled' : ''}>${this._labels.removeSelection}</button>
          <div class="editor-tree">
            ${this._renderTree()}
          </div>
        </div>
        <div class="editor-form">
          ${this._renderForm()}
        </div>
      </div>`;
  }

  _renderTree() {
    const items = [
      `<div class="editor-tree-item group ${this._selected.type === 'project' ? 'active' : ''}" data-editor-select="true" data-type="project">
        <span class="editor-tree-icon">#</span>
        <span>${this._escape(this._draft.title || this._labels.projectNode)}</span>
      </div>`
    ];

    if (!this._draft.groups.length) {
      items.push(`<div class="editor-tree-item" style="cursor:default;color:var(--text-muted)">${this._labels.noGroupHint}</div>`);
    }

    this._draft.groups.forEach((group, groupIndex) => {
      items.push(`
        <div class="editor-tree-item group ${this._isSelected('group', groupIndex) ? 'active' : ''}" data-editor-select="true" data-type="group" data-group-index="${groupIndex}">
          <span class="editor-tree-icon">G</span>
          <span>${this._escape(group.title || `${this._labels.groups} ${groupIndex + 1}`)}</span>
        </div>`);

      if (!group.datasets?.length) {
        items.push(`<div class="editor-tree-item dataset" style="cursor:default;color:var(--text-muted)">${this._labels.noDatasetHint}</div>`);
      }

      group.datasets?.forEach((dataset, datasetIndex) => {
        items.push(`
          <div class="editor-tree-item dataset ${this._isSelected('dataset', groupIndex, datasetIndex) ? 'active' : ''}" data-editor-select="true" data-type="dataset" data-group-index="${groupIndex}" data-dataset-index="${datasetIndex}">
            <span class="editor-tree-icon">D</span>
            <span>${this._escape(dataset.title || `Dataset ${datasetIndex + 1}`)}</span>
          </div>`);
      });
    });

    return items.join('');
  }

  _renderForm() {
    const selected = this._getSelectedTarget();
    if (!selected) {
      return `<div style="color:var(--text-muted);line-height:1.6">${this._labels.selectionHint}</div>`;
    }

    if (this._selected.type === 'project') {
      return `
        <div class="editor-form-section">
          <div class="editor-form-section-title">${this._labels.projectSettings}</div>
          <div class="editor-form-grid">
            ${this._renderTextField(this._labels.titleField, 'title', selected.title || '', true)}
            ${this._renderTextField(this._labels.protocol, 'protocol', selected.protocol || '')}
            ${this._renderTextField(this._labels.separator, 'separator', selected.separator || ',')}
            ${this._renderSelectField(this._labels.frameDetection, 'frameDetection', selected.frameDetection || 'EndDelimiterOnly', FRAME_DETECTIONS)}
            ${this._renderCheckboxField(this._labels.hexDelimiters, 'hexadecimalDelimiters', !!selected.hexadecimalDelimiters)}
          </div>
        </div>
        ${this._renderJcomFormatEditor()}
        ${this._renderByteLayoutView()}
        ${this._renderSampleTester()}`;
    }

    if (this._selected.type === 'group') {
      return `
        <div class="editor-form-section">
          <div class="editor-form-section-title">${this._labels.groupSettings}</div>
          <div class="editor-form-grid">
            ${this._renderTextField(this._labels.titleField, 'title', selected.title || '', true)}
            ${this._renderSelectField(this._labels.widget, 'widget', selected.widget || 'DataGrid', GROUP_WIDGETS)}
          </div>
        </div>`;
    }

    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.formulaEditor}</div>
        <div class="editor-form-grid">
          ${this._renderFieldSelect(this._labels.sourceField, 'sourceField', selected.sourceField || '')}
          ${this._renderFormulaTemplateSelect()}
        </div>
        ${this._renderTextAreaField(this._labels.formula, 'formula', selected.formula || 'raw')}
        ${this._renderFormulaTestPanel()}
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5">
          ${this._labels.formulaHelp}
        </div>
      </div>
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.displayEditor}</div>
        <div class="editor-form-grid">
          ${this._renderTextField(this._labels.titleField, 'title', selected.title || '', true)}
          ${this._renderNumberField(this._labels.index, 'index', selected.index ?? 0)}
          ${this._renderTextField(this._labels.sourceId, 'sourceId', selected.sourceId || '')}
          ${this._renderTextField(this._labels.units, 'units', selected.units || '')}
          ${this._renderSelectField(this._labels.widget, 'widget', selected.widget || 'Bar', DATASET_WIDGETS)}
          ${this._renderNumberField(this._labels.min, 'min', selected.min ?? 0)}
          ${this._renderNumberField(this._labels.max, 'max', selected.max ?? 100)}
          ${this._renderNumberField(this._labels.alarm, 'alarm', selected.alarm ?? 0)}
        </div>
      </div>
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.features}</div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(120px,1fr));gap:10px">
          ${this._renderCheckboxField(this._labels.plot, 'plot', !!selected.plot)}
          ${this._renderCheckboxField(this._labels.bar, 'bar', !!selected.bar)}
          ${this._renderCheckboxField(this._labels.gauge, 'gauge', !!selected.gauge)}
          ${this._renderCheckboxField(this._labels.led, 'led', !!selected.led)}
          ${this._renderCheckboxField(this._labels.fft, 'fft', !!selected.fft)}
          ${this._renderCheckboxField(this._labels.compass, 'compass', !!selected.compass)}
        </div>
      </div>
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.fftSettings}</div>
        <div class="editor-form-grid">
          ${this._renderNumberField(this._labels.fftSampleRate, 'fftSampleRate', selected.fftSampleRate ?? 0)}
          ${this._renderFieldSelect(this._labels.fftSampleRateField, 'fftSampleRateField', selected.fftSampleRateField || '')}
          ${this._renderSelectField(this._labels.fftPoints, 'fftPoints', String(selected.fftPoints || 128), FFT_POINTS)}
          ${this._renderSelectField(this._labels.fftWindow, 'fftWindow', selected.fftWindow || 'Hann', FFT_WINDOWS)}
          ${this._renderSelectField(this._labels.fftMagnitudeMode, 'fftMagnitudeMode', selected.fftMagnitudeMode || 'linear', FFT_MAGNITUDE_MODES)}
          ${this._renderTextField(this._labels.fftAmplitudeUnit, 'fftAmplitudeUnit', selected.fftAmplitudeUnit || selected.units || '')}
        </div>
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5">
          ${this._labels.fftHelp}
        </div>
      </div>`;
  }

  _renderTextField(label, field, value, refresh = false) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" data-field="${field}" data-kind="string" ${refresh ? 'data-refresh="true"' : ''} value="${this._escapeAttr(value)}">
      </div>`;
  }

  _renderTextAreaField(label, field, value) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <textarea class="form-input" data-field="${field}" data-kind="string" style="min-height:72px;resize:vertical;font-family:var(--font-mono);line-height:1.45">${this._escape(value)}</textarea>
      </div>`;
  }

  _renderNumberField(label, field, value) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" type="number" data-field="${field}" data-kind="number" value="${Number(value) || 0}">
      </div>`;
  }

  _renderSelectField(label, field, value, options) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" data-field="${field}" data-kind="string">
          ${options.map((option) => `<option value="${this._escapeAttr(option)}" ${option === value ? 'selected' : ''}>${this._escape(option)}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderFieldSelect(label, field, value) {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" data-field="${field}" data-kind="string">
          <option value="">${this._labels.none}</option>
          ${fields.map((item) => {
            const name = item.name || '';
            return `<option value="${this._escapeAttr(name)}" ${name === value ? 'selected' : ''}>${this._escape(name)}</option>`;
          }).join('')}
        </select>
      </div>`;
  }

  _renderFormulaTemplateSelect() {
    const names = this._labels.formulaTemplateNames || {};
    return `
      <div class="form-row">
        <div class="form-label">${this._labels.formulaTemplate}</div>
        <div style="display:grid;grid-template-columns:1fr auto;gap:6px">
          <select class="form-select" id="formula-template-select">
            ${Object.keys(FORMULA_TEMPLATES).map((key) => (
              `<option value="${this._escapeAttr(key)}">${this._escape(names[key] || key)}</option>`
            )).join('')}
          </select>
          <button class="btn" type="button" id="formula-template-apply">${this._labels.applyTemplate}</button>
        </div>
      </div>`;
  }

  _renderFormulaTestPanel() {
    return `
      <div class="formula-test-panel">
        <div class="form-row">
          <div class="form-label">${this._labels.testRaw}</div>
          <input class="form-input" id="formula-test-raw" type="number" value="1">
        </div>
        <div class="form-row">
          <div class="form-label">${this._labels.testIndex}</div>
          <input class="form-input" id="formula-test-index" type="number" value="0">
        </div>
        <button class="btn" type="button" id="formula-test-run">${this._labels.testFormula}</button>
        <div class="formula-test-result" id="formula-test-result">
          <span>${this._labels.formulaResult}</span>
        </div>
      </div>`;
  }

  _renderProfessionalSettings() {
    this._ensureProfessionalConfig(this._draft);
    const frameLength = this._draft.protocolValidation.frameLength;
    const checksum = this._draft.protocolValidation.checksum;
    const checksumNames = this._labels.checksumNames || {};
    return `
      <details class="editor-collapse-section">
        <summary>${this._labels.professionalSettings}</summary>
        <div class="professional-config-grid">
          <div class="professional-config-card">
            <div class="professional-config-title">${this._labels.frameLengthConfig}</div>
            ${this._renderProfessionalCheckbox(this._labels.frameLengthEnabled, 'protocolValidation.frameLength.enabled', frameLength.enabled)}
            <div class="editor-form-grid">
              ${this._renderProfessionalInput(this._labels.frameLengthOffset, 'protocolValidation.frameLength.offset', frameLength.offset, 'number')}
              ${this._renderProfessionalSelect(this._labels.frameLengthSize, 'protocolValidation.frameLength.size', String(frameLength.size), FRAME_LENGTH_SIZES)}
              ${this._renderProfessionalSelect(this._labels.frameLengthEndian, 'protocolValidation.frameLength.endian', frameLength.endian, BYTE_ORDERS)}
              ${this._renderProfessionalInput(this._labels.frameLengthAdjustment, 'protocolValidation.frameLength.adjustment', frameLength.adjustment, 'number')}
            </div>
          </div>
          <div class="professional-config-card">
            <div class="professional-config-title">${this._labels.checksumConfig}</div>
            <div class="editor-form-grid">
              ${this._renderProfessionalSelect(this._labels.checksumType, 'protocolValidation.checksum.type', checksum.type, CHECKSUM_TYPES, checksumNames)}
              ${this._renderProfessionalInput(this._labels.checksumOffset, 'protocolValidation.checksum.offset', checksum.offset, 'number')}
              ${this._renderProfessionalInput(this._labels.checksumLength, 'protocolValidation.checksum.length', checksum.length, 'number')}
              ${this._renderProfessionalSelect(this._labels.fieldEndian, 'protocolValidation.checksum.endian', checksum.endian, BYTE_ORDERS)}
              ${this._renderProfessionalInput(this._labels.checksumRangeStart, 'protocolValidation.checksum.rangeStart', checksum.rangeStart, 'number')}
              ${this._renderProfessionalInput(this._labels.checksumRangeLength, 'protocolValidation.checksum.rangeLength', checksum.rangeLength, 'number')}
            </div>
          </div>
        </div>
      </details>`;
  }

  _renderJcomFormatEditor() {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    const selectedIndex = this._selectedJcomFieldIndex();
    const selected = fields[selectedIndex] || null;
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.receiveFormatEditor}</div>
        ${this._renderJcomAddButtons()}
        <div class="jcom-format-layout">
          <div class="jcom-field-pane">
            <div id="jcom-field-list" class="jcom-field-list">
              ${this._renderJcomFieldRows(selectedIndex)}
            </div>
          </div>
          <div class="jcom-prop-pane">
            ${selected ? this._renderJcomFieldProperties(selected, selectedIndex) : `<div class="byte-layout-empty">${this._labels.noFields}</div>`}
          </div>
        </div>
        <div class="jcom-actions">
          <button class="btn" type="button" id="protocol-field-auto-offset">${this._labels.autoOffset}</button>
          <button class="btn" type="button" id="protocol-field-sort">${this._labels.sortByOffset}</button>
          <button class="btn btn-primary" type="button" id="jcom-parser-generate">${this._labels.generateParserAndApply}</button>
        </div>
      </div>`;
  }

  _renderJcomAddButtons() {
    const names = this._labels.fieldKindNames || {};
    const buttons = [
      ['frameHeader', names.frameHeader || 'Header'],
      ['frameSequence', names.frameSequence || 'Sequence'],
      ['frameId', names.frameId || 'ID'],
      ['frameLength', names.frameLength || 'Length'],
      ['byte1', '1Byte'],
      ['byte2', '2Byte'],
      ['byte3', '3Byte'],
      ['byte4', '4Byte'],
      ['byte8', '8Byte'],
      ['fixedArray', names.fixedArray || 'Fixed Array'],
      ['variableArray', names.variableArray || 'Variable Array'],
      ['checksum', names.checksum || 'Checksum'],
      ['frameTail', names.frameTail || 'Tail']
    ];
    return `
      <div class="jcom-add-strip">
        <div class="jcom-add-title">${this._labels.addField}</div>
        <div class="jcom-add-buttons">
          ${buttons.map(([kind, label]) => `<button class="btn" type="button" data-jcom-add-field="${kind}">${this._escape(label)}</button>`).join('')}
        </div>
      </div>`;
  }

  _renderJcomFieldRowsLegacy(selectedIndex = 0) {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    if (!fields.length) return `<div class="byte-layout-empty">${this._labels.noFields}</div>`;
    return `
      <div class="jcom-list-tools">
        <button class="btn btn-icon" type="button" disabled>▲</button>
        <button class="btn btn-icon" type="button" disabled>▼</button>
        <button class="btn btn-icon" type="button" disabled>▣</button>
      </div>
      ${fields.map((field, index) => `
        <div class="jcom-field-row ${index === selectedIndex ? 'active' : ''}" data-jcom-select="${index}">
          <div class="jcom-field-index">${index}</div>
          <div class="jcom-field-kind">${this._escape(this._jcomFieldKindLabel(field))}</div>
          <div class="jcom-field-value ${this._jcomFieldInlineEditable(field) ? 'editable' : 'readonly'}">
            ${this._jcomFieldInlineEditable(field)
              ? `<input value="${this._escapeAttr(this._jcomFieldValuePreview(field))}" data-jcom-inline-value="true" data-index="${index}">`
              : `<span>${this._escape(this._jcomFieldValuePreview(field))}</span>`}
          </div>
          <button class="btn btn-icon" type="button" data-jcom-remove="${index}">-</button>
        </div>`).join('')}`;
  }

  _jcomFieldInlineEditable(field) {
    return ['frameHeader', 'frameTail', 'frameId', 'frameLength'].includes(field?.kind);
  }

  _renderJcomFieldRows(selectedIndex = 0) {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    if (!fields.length) return `<div class="byte-layout-empty">${this._labels.noFields}</div>`;
    const rows = fields.map((field, index) => {
      const editable = this._jcomFieldInlineEditable(field);
      const value = this._jcomFieldValuePreview(field);
      return `
        <div class="jcom-field-row ${index === selectedIndex ? 'active' : ''} ${editable ? 'can-edit' : 'read-only'}" data-jcom-select="${index}">
          <div class="jcom-field-index">${index}</div>
          <div class="jcom-field-kind">${this._escape(this._jcomFieldKindLabel(field))}</div>
          <div class="jcom-field-value ${editable ? 'editable' : 'readonly'}">
            ${editable
              ? `<input value="${this._escapeAttr(value)}" data-jcom-inline-value="true" data-index="${index}">`
              : `<span>${this._escape(value)}</span>`}
          </div>
          <button class="btn btn-icon" type="button" data-jcom-remove="${index}">-</button>
        </div>`;
    }).join('');
    return `
      <div class="jcom-list-tools">
        <button class="btn btn-icon" type="button" disabled>▲</button>
        <button class="btn btn-icon" type="button" disabled>▼</button>
        <button class="btn btn-icon" type="button" disabled>▣</button>
      </div>
      ${rows}`;
  }

  _jcomFieldKindLabel(field) {
    const kindNames = this._labels.fieldKindNames || {};
    const kind = field?.kind || 'byte';
    if (kind === 'byte') return `${fieldByteSize({ ...field, count: 1, channels: 1 })}Byte`;
    return kindNames[kind] || kind;
  }

  _jcomFieldValuePreview(field) {
    if (!field) return '';
    if (this._jcomFieldInlineEditable(field)) {
      if (field.fixedValue) return field.fixedValue;
      if (field.kind === 'checksum') return this._draft.protocolValidation?.checksum?.type || 'checksum';
    }
    const length = Math.min(18, Math.max(1, fieldByteSize(field)));
    const zeros = Array.from({ length }, () => '00').join(' ');
    return fieldByteSize(field) > length ? `${zeros} ...` : zeros;
  }

  _renderJcomFieldProperties(field, index) {
    const isArray = field.kind === 'fixedArray' || field.kind === 'variableArray';
    const isInline = this._jcomFieldInlineEditable(field);
    const showEndian = byteLengthForType(field.type) > 1;
    const endianControl = showEndian
      ? this._renderJcomSelect(this._labels.fieldEndian, 'endian', field.endian || 'BE', BYTE_ORDERS)
      : '';
    const checksumNames = this._labels.checksumNames || {};
    const commonRows = isArray
      ? `
        ${this._renderJcomInput(this._labels.fieldCount, 'count', Math.max(1, Number(field.count) || 1), 'number')}
        ${this._renderJcomInput(this._labels.byteCountSetting, 'byteLength', fieldByteSize(field), 'number')}
        ${this._renderJcomSelect(this._labels.dataTransform, 'dataConversion', field.dataConversion || 'FIFO', ['FIFO', 'RAW'])}
        ${endianControl}
        ${this._renderJcomCheckbox(this._labels.showPanel, 'panelDisplay', !!field.panelDisplay)}
        ${this._renderJcomInput(this._labels.dataName, 'title', field.title || field.name || `field${index + 1}`)}
      `
      : `
        ${this._renderJcomInput(this._labels.fieldCount, 'count', Math.max(1, Number(field.count) || 1), 'number')}
        ${this._renderJcomInput(this._labels.byteCountSetting, 'byteLength', fieldByteSize(field), 'number')}
        ${endianControl}
        ${this._renderJcomCheckbox(this._labels.showPanel, 'panelDisplay', !!field.panelDisplay)}
        ${this._renderJcomInput(this._labels.dataName, 'title', field.title || field.name || `field${index + 1}`)}
        ${isInline ? this._renderJcomInput(this._labels.fixedValueHex, 'fixedValue', field.fixedValue || '') : ''}
      `;
    return `
      <div class="jcom-prop-title">${this._labels.fieldEditor}</div>
      <div class="jcom-prop-grid">
        ${commonRows}
        ${field.kind === 'checksum' ? this._renderJcomSelect(this._labels.checksumType, 'checksumTypeProxy', this._draft.protocolValidation?.checksum?.type || 'sum8', CHECKSUM_TYPES, checksumNames) : ''}
      </div>
      ${isArray ? this._renderJcomFifoChannels(field) : ''}
      <div class="jcom-load-row">
        <button class="btn" type="button" id="jcom-field-load">${this._labels.loadField}</button>
      </div>`;
  }

  _renderJcomInput(label, field, value, type = 'text') {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" type="${this._escapeAttr(type)}" data-jcom-field="${this._escapeAttr(field)}" value="${this._escapeAttr(value)}">
      </div>`;
  }

  _renderJcomSelect(label, field, value, options, names = {}) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" data-jcom-field="${this._escapeAttr(field)}">
          ${options.map((option) => `<option value="${this._escapeAttr(option)}" ${String(option) === String(value) ? 'selected' : ''}>${this._escape(names[option] || option)}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderJcomCheckbox(label, field, checked) {
    return `
      <label class="checkbox-wrap jcom-checkbox">
        <input type="checkbox" data-jcom-field="${this._escapeAttr(field)}" ${checked ? 'checked' : ''}>
        <span>${label}</span>
      </label>`;
  }

  _renderJcomFifoChannels(field) {
    const channelDefs = this._ensureJcomChannelDefs(field);
    const channelRows = channelDefs.map((channel, index) => `
      <tr>
        <td><input class="form-input" data-jcom-channel-field="name" data-index="${index}" value="${this._escapeAttr(channel.name || `Ch${index + 1}`)}"></td>
        <td>
          <select class="form-select" data-jcom-channel-field="type" data-index="${index}">
            ${FIELD_TYPES.map((type) => `<option value="${type}" ${type === (channel.type || field.type) ? 'selected' : ''}>${type}</option>`).join('')}
          </select>
        </td>
        <td><input type="checkbox" data-jcom-channel-field="endian" data-index="${index}" ${(channel.endian || field.endian || 'BE') === 'BE' ? 'checked' : ''}></td>
        <td><input class="form-input mono" data-jcom-channel-field="formula" data-index="${index}" value="${this._escapeAttr(channel.formula || field.formula || 'raw')}"></td>
        <td><button class="btn btn-icon" type="button" data-jcom-channel-remove="${index}" ${channelDefs.length <= 1 ? 'disabled' : ''}>-</button></td>
      </tr>`).join('');
    return `
      <div class="jcom-fifo-section">
        <div class="jcom-fifo-title">
          <span>${this._labels.fifoChannels}</span>
          <button class="btn btn-icon" type="button" id="jcom-channel-add">+</button>
        </div>
        <table class="jcom-channel-table">
          <thead>
            <tr>
              <th>${this._labels.channelName}</th>
              <th>${this._labels.fieldType}</th>
              <th>${this._labels.highByteFirst}</th>
              <th>${this._labels.calculateFormula}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${channelRows}</tbody>
        </table>
        <div class="jcom-arrange-row">
          <span>${this._labels.channelArrange}</span>
          <label><input type="radio" name="jcom-array-order" value="channelFirst" data-jcom-field="arrayOrderByIndex" ${field.arrayOrder !== 'interleaved' ? 'checked' : ''}> ${this._labels.arrangeByChannel}</label>
          <label><input type="radio" name="jcom-array-order" value="interleaved" data-jcom-field="arrayOrderByIndex" ${field.arrayOrder === 'interleaved' ? 'checked' : ''}> ${this._labels.arrangeByIndex}</label>
        </div>
        <div class="jcom-arrange-help">${this._labels.arrangeHelp}</div>
      </div>`;
  }

  _renderCommandFrameEditor() {
    this._ensureCommandFrames(this._draft);
    const frames = this._draft.commandFrames || [];
    const index = this._selectedCommandFrameIndex();
    const command = frames[index] || frames[0];
    const checksumNames = this._labels.checksumNames || {};
    let preview = '--';
    let previewState = 'ok';
    try {
      preview = this._formatHex(this._buildCommandFrameBytes(command)) || '--';
    } catch (error) {
      preview = error?.message || String(error);
      previewState = 'error';
    }
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.sendFrameEditor}</div>
        <div class="template-help">${this._labels.commandFrameHelp}</div>
        <div class="command-frame-card">
          <div class="command-frame-toolbar">
            <div class="form-row">
              <div class="form-label">${this._labels.commandFrame}</div>
              <select class="form-select" id="command-frame-select">
                ${frames.map((item, frameIndex) => `<option value="${frameIndex}" ${frameIndex === index ? 'selected' : ''}>${this._escape(item.title || `Command ${frameIndex + 1}`)}</option>`).join('')}
              </select>
            </div>
            <button class="btn" type="button" id="command-frame-add">${this._labels.addCommand}</button>
            <button class="btn" type="button" id="command-frame-delete" ${frames.length <= 1 ? 'disabled' : ''}>${this._labels.deleteCommand}</button>
          </div>

          <div class="command-frame-basic-grid">
            ${this._renderCommandInput(this._labels.commandName, 'title', command.title)}
            ${this._renderCommandInput(this._labels.frameStart, 'frameStart', command.frameStart, 'text', '5A A5')}
            ${this._renderCommandInput(this._labels.frameEnd, 'frameEnd', command.frameEnd, 'text', 'DD EE')}
          </div>

          ${this._renderCommandAddButtons()}

          <div class="command-jcom-layout">
            <div class="command-packet-pane">
              <div class="professional-config-title">${this._labels.packetFieldList}</div>
              ${this._renderCommandPacketFields(command)}
            </div>
            <div class="command-control-pane">
              <div class="command-control-head">
                <div class="professional-config-title">${this._labels.controlArea}</div>
                ${this._renderCommandCheckbox(this._labels.triggerSend, 'triggerSend', command.triggerSend)}
              </div>
              ${this._renderCommandControlPanel(command)}
            </div>
          </div>

          <details class="command-advanced-details">
            <summary>${this._labels.frameLengthConfig} / ${this._labels.checksumConfig}</summary>
            <div class="command-frame-grid">
            ${this._renderCommandCheckbox(this._labels.autoLength, 'autoLength', command.autoLength)}
            ${this._renderCommandInput(this._labels.frameLengthOffset, 'lengthOffset', command.lengthOffset, 'number')}
            ${this._renderCommandSelect(this._labels.frameLengthSize, 'lengthSize', String(command.lengthSize), FRAME_LENGTH_SIZES)}
            ${this._renderCommandSelect(this._labels.frameLengthEndian, 'lengthEndian', command.lengthEndian, BYTE_ORDERS)}
            ${this._renderCommandInput(this._labels.frameLengthAdjustment, 'lengthAdjustment', command.lengthAdjustment, 'number')}
            ${this._renderCommandCheckbox(this._labels.autoChecksum, 'autoChecksum', command.autoChecksum)}
            ${this._renderCommandSelect(this._labels.checksumType, 'checksumType', command.checksumType, CHECKSUM_TYPES, checksumNames)}
            ${this._renderCommandInput(this._labels.checksumOffset, 'checksumOffset', command.checksumOffset, 'number')}
            ${this._renderCommandInput(this._labels.checksumLength, 'checksumLength', command.checksumLength, 'number')}
            ${this._renderCommandSelect(this._labels.fieldEndian, 'checksumEndian', command.checksumEndian, BYTE_ORDERS)}
            ${this._renderCommandInput(this._labels.checksumRangeStart, 'checksumRangeStart', command.checksumRangeStart, 'number')}
            ${this._renderCommandInput(this._labels.checksumRangeLength, 'checksumRangeLength', command.checksumRangeLength, 'number')}
            </div>
            <div class="template-help">${this._labels.checksumAppend}</div>
          </details>

          <details class="command-advanced-details">
            <summary>${this._labels.commandParameters}</summary>
            <div class="command-param-header">
              <div class="professional-config-title">${this._labels.commandParameters}</div>
              <button class="btn" type="button" id="command-param-add">${this._labels.addParameter}</button>
            </div>
            <div class="protocol-field-scroll">
              <table class="command-param-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>${this._labels.paramName}</th>
                    <th>${this._labels.paramLabel}</th>
                    <th>${this._labels.paramType}</th>
                    <th>${this._labels.paramValue}</th>
                    <th>${this._labels.fieldEndian}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  ${command.parameters?.length ? command.parameters.map((param, paramIndex) => this._renderCommandParamRow(param, paramIndex)).join('') : `
                    <tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:12px">${this._labels.noFields}</td></tr>`}
                </tbody>
              </table>
            </div>
          </details>

          <div class="command-preview-row">
            <div class="form-row">
              <div class="form-label">${this._labels.commandPreview}</div>
              <pre class="command-preview" id="command-frame-preview" data-state="${previewState}">${this._escape(preview)}</pre>
            </div>
            <button class="btn btn-primary" type="button" id="command-frame-send">${this._labels.sendCommand}</button>
          </div>
        </div>
      </div>`;
  }

  _renderCommandInput(label, field, value, type = 'text', placeholder = '') {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" type="${this._escapeAttr(type)}" data-command-field="${this._escapeAttr(field)}" value="${this._escapeAttr(value)}" placeholder="${this._escapeAttr(placeholder)}">
      </div>`;
  }

  _renderCommandAddButtons() {
    const buttons = [
      ['header', this._labels.fieldKindNames?.frameHeader || 'Header'],
      ['sequence', this._labels.fieldKindNames?.frameSequence || 'Sequence'],
      ['id', this._labels.fieldKindNames?.frameId || 'ID'],
      ['length', this._labels.fieldKindNames?.frameLength || 'Length'],
      ['1byte', '1Byte'],
      ['2byte', '2Byte'],
      ['3byte', '3Byte'],
      ['4byte', '4Byte'],
      ['8byte', '8Byte'],
      ['checksum', this._labels.checksumConfig || 'Checksum'],
      ['tail', this._labels.fieldKindNames?.frameTail || 'Tail']
    ];
    return `
      <div class="command-add-strip">
        <div class="command-add-title">${this._labels.addSendField}</div>
        <div class="command-add-buttons">
          ${buttons.map(([kind, label]) => `<button class="btn" type="button" data-command-add-field="${kind}">${this._escape(label)}</button>`).join('')}
        </div>
      </div>`;
  }

  _renderCommandPacketFields(command) {
    const rows = [];
    const startBytes = this._hexStringToBytes(command.frameStart || '');
    if (startBytes.length) {
      rows.push(this._renderCommandPacketRow(0, this._labels.fieldKindNames?.frameHeader || 'Header', this._formatHex(startBytes), ''));
    }
    (command.parameters || []).forEach((param, index) => {
      const normalized = this._normalizeCommandParameter(param, index);
      const endianBadge = normalized.endian === 'LE' && !['uint8', 'int8', 'hex', 'ascii'].includes(normalized.type) ? ' L' : '';
      rows.push(this._renderCommandPacketRow(rows.length, `${normalized.type}${endianBadge}`, this._formatHex(this._commandParameterBytes(normalized)), `
        <button class="btn btn-icon" type="button" data-command-param-remove="${index}">-</button>
      `, normalized.label));
    });
    if (command.autoChecksum && command.checksumType && command.checksumType !== 'none') {
      rows.push(this._renderCommandPacketRow(rows.length, this._labels.checksumConfig || 'Checksum', command.checksumType, ''));
    }
    const endBytes = this._hexStringToBytes(command.frameEnd || '');
    if (endBytes.length) {
      rows.push(this._renderCommandPacketRow(rows.length, this._labels.fieldKindNames?.frameTail || 'Tail', this._formatHex(endBytes), ''));
    }
    return `
      <div class="command-packet-list">
        <div class="command-packet-tools">
          <button class="btn btn-icon" type="button" disabled>▲</button>
          <button class="btn btn-icon" type="button" disabled>▼</button>
          <button class="btn btn-icon" type="button" disabled>▣</button>
        </div>
        ${rows.length ? rows.join('') : `<div class="byte-layout-empty">${this._labels.noFields}</div>`}
      </div>`;
  }

  _renderCommandPacketRow(index, kind, value, actions = '', title = '') {
    return `
      <div class="command-packet-row">
        <div class="command-packet-index">${index}</div>
        <div class="command-packet-kind">${this._escape(kind)}${title ? `<span>${this._escape(title)}</span>` : ''}</div>
        <div class="command-packet-value">${this._escape(value || '--')}</div>
        <div class="command-packet-actions">${actions}</div>
      </div>`;
  }

  _renderCommandControlPanel(command) {
    const editable = (command.parameters || []).map((param, index) => ({ param: this._normalizeCommandParameter(param, index), index }));
    if (!editable.length) {
      return `<div class="byte-layout-empty">${this._labels.noFields}</div>`;
    }
    return `
      <div class="command-control-list">
        ${editable.map(({ param, index }) => this._renderCommandControl(param, index)).join('')}
      </div>`;
  }

  _renderCommandControl(param, index) {
    const numeric = !['hex', 'ascii'].includes(param.type);
    const value = numeric ? (Number(param.value) || 0) : param.value;
    const bits = param.type === 'uint16' || param.type === 'int16'
      ? Array.from({ length: 16 }, (_, i) => 15 - i)
      : [];
    const max = param.type === 'uint8' ? 255 : (param.type === 'uint16' ? 65535 : 100);
    return `
      <div class="command-control-item">
        <label>${this._escape(param.label || param.name)}</label>
        <input class="form-input command-control-value" data-command-control-index="${index}" value="${this._escapeAttr(value)}">
        ${numeric ? `<input class="command-control-range" type="range" min="0" max="${max}" data-command-control-index="${index}" value="${Math.max(0, Math.min(max, Number(value) || 0))}">` : ''}
        ${bits.length ? `
          <div class="command-bit-grid">
            ${bits.map((bit) => `
              <label>
                <input type="checkbox" data-command-control-index="${index}" data-bit="${bit}" ${(Number(value) & (1 << bit)) ? 'checked' : ''}>
                <span>${String(bit).padStart(2, '0')}</span>
              </label>`).join('')}
          </div>` : ''}
      </div>`;
  }

  _renderCommandSelect(label, field, value, options, names = {}) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" data-command-field="${this._escapeAttr(field)}">
          ${options.map((option) => `<option value="${this._escapeAttr(option)}" ${String(option) === String(value) ? 'selected' : ''}>${this._escape(names[option] || option)}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderCommandCheckbox(label, field, checked) {
    return `
      <label class="checkbox-wrap command-checkbox">
        <input type="checkbox" data-command-field="${this._escapeAttr(field)}" ${checked ? 'checked' : ''}>
        <span>${label}</span>
      </label>`;
  }

  _renderCommandParamRow(param, index) {
    const normalized = this._normalizeCommandParameter(param, index);
    return `
      <tr>
        <td class="protocol-field-index">${index}</td>
        <td><input class="form-input" data-command-param-field="name" data-index="${index}" value="${this._escapeAttr(normalized.name)}"></td>
        <td><input class="form-input" data-command-param-field="label" data-index="${index}" value="${this._escapeAttr(normalized.label)}"></td>
        <td>
          <select class="form-select" data-command-param-field="type" data-index="${index}">
            ${COMMAND_FIELD_TYPES.map((option) => `<option value="${option}" ${option === normalized.type ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input mono" data-command-param-field="value" data-index="${index}" value="${this._escapeAttr(normalized.value)}" placeholder="0 / 01 03 / ON"></td>
        <td>
          <select class="form-select" data-command-param-field="endian" data-index="${index}">
            ${BYTE_ORDERS.map((option) => `<option value="${option}" ${option === normalized.endian ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn" type="button" data-command-param-remove="${index}">-</button></td>
      </tr>`;
  }

  _renderSourceIdEditor() {
    this._ensureProfessionalConfig(this._draft);
    const rows = this._draft.sourceIdMap || [];
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.sourceIdEditor}</div>
        <div class="source-map-list">
          ${rows.map((item, index) => `
            <div class="source-map-row">
              ${this._renderSourceMapInput(this._labels.sourceId, 'sourceId', item.sourceId, index)}
              ${this._renderSourceMapInput(this._labels.sourceTitle, 'title', item.title, index)}
              ${this._renderSourceMapInput(this._labels.sourceIp, 'ip', item.ip, index)}
              ${this._renderSourceMapInput(this._labels.sourceUdpPort, 'udpPort', item.udpPort, index, 'number')}
              <button class="btn" type="button" data-source-map-remove="${index}">-</button>
            </div>`).join('')}
        </div>
        <button class="btn" type="button" id="source-id-add">${this._labels.addSource}</button>
      </div>`;
  }

  _renderProtocolImporter() {
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.protocolImport}</div>
        <div class="template-help">${this._labels.importHelp}</div>
        <div class="form-row">
          <div class="form-label">${this._labels.importTable}</div>
          <textarea class="form-input protocol-import-input" id="protocol-import-table" spellcheck="false" placeholder="name,type,offset,count,endian,title,units,formula,widget"></textarea>
        </div>
        <div class="protocol-import-actions">
          <label class="btn" for="protocol-import-file">${this._labels.importFile}</label>
          <input id="protocol-import-file" type="file" accept=".csv,.tsv,.txt,.xlsx,.docx" style="display:none">
          <button class="btn btn-primary" type="button" id="protocol-import-apply">${this._labels.importApply}</button>
        </div>
      </div>`;
  }

  _renderProfessionalInput(label, field, value, type = 'text') {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" type="${this._escapeAttr(type)}" data-professional-field="${this._escapeAttr(field)}" value="${this._escapeAttr(value)}">
      </div>`;
  }

  _renderProfessionalSelect(label, field, value, options, names = {}) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" data-professional-field="${this._escapeAttr(field)}">
          ${options.map((option) => `<option value="${this._escapeAttr(option)}" ${String(option) === String(value) ? 'selected' : ''}>${this._escape(names[option] || option)}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderProfessionalCheckbox(label, field, checked) {
    return `
      <label class="checkbox-wrap" style="margin:0 0 10px 0">
        <input type="checkbox" data-professional-field="${this._escapeAttr(field)}" ${checked ? 'checked' : ''}>
        <span>${label}</span>
      </label>`;
  }

  _renderSourceMapInput(label, field, value, index, type = 'text') {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" type="${this._escapeAttr(type)}" data-source-map-field="${this._escapeAttr(field)}" data-index="${index}" value="${this._escapeAttr(value)}">
      </div>`;
  }

  _renderTemplateWizard() {
    const zh = appState.locale === 'zh-CN';
    return `
      <details class="editor-collapse-section">
        <summary>${this._labels.projectWizard}</summary>
        <div class="template-wizard">
          <div>
            <div class="form-label">${this._labels.templateLibrary}</div>
            <select class="form-select" id="project-template-select">
              ${PROJECT_TEMPLATES.map((template) => (
                `<option value="${this._escapeAttr(template.id)}">${this._escape(zh ? template.nameZh : template.nameEn)}</option>`
              )).join('')}
            </select>
            <div class="template-help">${this._labels.templateHelp}</div>
          </div>
          <button class="btn btn-primary" type="button" id="project-template-apply">${this._labels.createFromTemplate}</button>
        </div>
        <div class="template-card-grid">
          ${PROJECT_TEMPLATES.map((template) => `
            <div class="template-card">
              <div class="template-card-title">${this._escape(zh ? template.nameZh : template.nameEn)}</div>
              <div class="template-card-desc">${this._escape(zh ? template.descriptionZh : template.descriptionEn)}</div>
            </div>`).join('')}
        </div>
      </details>`;
  }

  _renderBatchGenerator() {
    const nextOffset = (this._draft.protocolFields || []).reduce((max, field) => Math.max(max, fieldEndOffset(field)), 0);
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.batchGenerator}</div>
        <div class="batch-generator-grid">
          ${this._renderPlainInput(this._labels.batchPrefix, 'batch-prefix', 'ch')}
          ${this._renderPlainInput(this._labels.batchCount, 'batch-count', '3', 'number')}
          ${this._renderPlainInput(this._labels.batchStartOffset, 'batch-start-offset', String(nextOffset), 'number')}
          ${this._renderPlainInput(this._labels.batchSamples, 'batch-samples', '1', 'number')}
          ${this._renderPlainSelect(this._labels.fieldType, 'batch-type', 'int24', FIELD_TYPES)}
          ${this._renderPlainSelect(this._labels.fieldEndian, 'batch-endian', 'BE', BYTE_ORDERS)}
          ${this._renderPlainInput(this._labels.batchUnits, 'batch-units', '')}
          ${this._renderPlainInput(this._labels.batchFormula, 'batch-formula', 'raw * 2.5 / 8388608.0')}
          ${this._renderPlainSelect(this._labels.batchWidget, 'batch-widget', 'MultiPlot', ['MultiPlot', 'Plot', 'Gauges', 'DataGrid'])}
          ${this._renderPlainInput(this._labels.groupSettings, 'batch-group-title', 'Batch Data')}
          ${this._renderPlainInput(this._labels.fftSampleRate, 'batch-sample-rate', '0', 'number')}
          <div class="form-row batch-generator-action">
            <button class="btn btn-primary" type="button" id="project-batch-generate">${this._labels.batchApply}</button>
          </div>
        </div>
      </div>`;
  }

  _renderPlainInput(label, id, value = '', type = 'text') {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <input class="form-input" id="${this._escapeAttr(id)}" type="${this._escapeAttr(type)}" value="${this._escapeAttr(value)}">
      </div>`;
  }

  _renderPlainSelect(label, id, value, options) {
    return `
      <div class="form-row">
        <div class="form-label">${label}</div>
        <select class="form-select" id="${this._escapeAttr(id)}">
          ${options.map((option) => `<option value="${this._escapeAttr(option)}" ${option === value ? 'selected' : ''}>${this._escape(option)}</option>`).join('')}
        </select>
      </div>`;
  }

  _renderByteLayoutView() {
    const fields = Array.isArray(this._draft.protocolFields) ? [...this._draft.protocolFields] : [];
    const sorted = fields
      .map((field, index) => ({ ...field, _index: index, offset: Math.max(0, Number(field.offset) || 0) }))
      .sort((a, b) => a.offset - b.offset);
    const total = sorted.reduce((max, field) => Math.max(max, fieldEndOffset(field)), 0);

    if (!sorted.length) {
      return `
        <div class="editor-form-section">
          <div class="editor-form-section-title">${this._labels.layoutView}</div>
          <div class="byte-layout-empty">${this._labels.layoutEmpty}</div>
        </div>`;
    }

    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.layoutView}</div>
        <div class="byte-layout-summary">
          <span>${this._labels.fieldCount}: ${sorted.length}</span>
          <span>${this._labels.fieldBytes}: ${total}</span>
        </div>
        <div class="byte-layout-bar">
          ${sorted.map((field, i) => {
            const size = Math.max(1, fieldByteSize(field));
            const width = Math.max(3, (size / Math.max(1, total)) * 100);
            return `
              <div class="byte-layout-segment color-${i % 8}" style="width:${width}%" title="${this._escapeAttr(`${field.name}: ${field.offset}-${fieldEndOffset(field) - 1}`)}">
                <span>${this._escape(field.name || `field${i + 1}`)}</span>
              </div>`;
          }).join('')}
        </div>
        <div class="byte-layout-list">
          ${sorted.map((field, i) => `
            <div class="byte-layout-item">
              <span class="byte-layout-dot color-${i % 8}"></span>
              <span>${this._escape(field.name || `field${i + 1}`)}</span>
              <span>${field.type || ''}[${Math.max(1, Number(field.count) || 1)}${Number(field.channels) > 1 ? `x${Number(field.channels)}` : ''}]</span>
              <span>${field.offset}-${fieldEndOffset(field) - 1}</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  _renderSampleTester() {
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.sampleTester}</div>
        <div class="form-row">
          <div class="form-label">${this._labels.sampleHex}</div>
          <textarea class="form-input sample-hex-input" id="project-sample-hex" spellcheck="false" placeholder="5A A5 ... DD EE"></textarea>
        </div>
        <div class="sample-test-actions">
          <button class="btn btn-primary" type="button" id="project-sample-test-run">${this._labels.runSampleTest}</button>
        </div>
        <pre class="sample-test-result" id="project-sample-test-result"><span>${this._labels.sampleResult}</span></pre>
      </div>`;
  }

  _renderFieldEditor() {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.fieldEditor}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5">
            ${this._labels.fieldHelp}
          </div>
          <div class="protocol-field-actions">
            <button class="btn" id="protocol-field-add" type="button">${this._labels.addField}</button>
            <button class="btn" id="protocol-field-auto-offset" type="button">${this._labels.autoOffset}</button>
            <button class="btn" id="protocol-field-sort" type="button">${this._labels.sortByOffset}</button>
            <button class="btn btn-primary" id="protocol-parser-generate" type="button">${this._labels.generateParser}</button>
          </div>
        </div>
        <div class="protocol-field-scroll">
          <table class="protocol-field-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${this._labels.fieldKind}</th>
                <th>${this._labels.fieldName}</th>
                <th>${this._labels.fieldType}</th>
                <th>${this._labels.fieldOffset}</th>
                <th>${this._labels.fieldCount}</th>
                <th>${this._labels.arrayChannels}</th>
                <th>${this._labels.arrayOrder}</th>
                <th>${this._labels.arrayLengthField}</th>
                <th>${this._labels.fieldEndian}</th>
                <th>${this._labels.fieldFixedValue}</th>
                <th>${this._labels.fieldFormula}</th>
                <th>${this._labels.units}</th>
                <th>${this._labels.fieldBytes}</th>
                <th>${this._labels.fieldRange}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${fields.length ? fields.map((field, index) => this._renderProtocolFieldRow(field, index)).join('') : `
                <tr><td colspan="16" style="color:var(--text-muted);text-align:center;padding:14px">${this._labels.noFields}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  _renderProtocolFieldRow(field, index) {
    const kind = field.kind || 'byte';
    const type = field.type || 'uint16';
    const endian = field.endian || 'LE';
    const size = fieldByteSize(field);
    const start = Math.max(0, Number(field.offset) || 0);
    const end = fieldEndOffset(field);
    const kindNames = this._labels.fieldKindNames || {};
    const orderNames = this._labels.arrayOrderNames || {};
    return `
      <tr>
        <td class="protocol-field-index">${index}</td>
        <td>
          <select class="form-select" data-protocol-field="kind" data-index="${index}">
            ${PROTOCOL_FIELD_KINDS.map((option) => `<option value="${option}" ${option === kind ? 'selected' : ''}>${this._escape(kindNames[option] || option)}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input" data-protocol-field="name" data-index="${index}" value="${this._escapeAttr(field.name || `field${index + 1}`)}"></td>
        <td>
          <select class="form-select" data-protocol-field="type" data-index="${index}">
            ${FIELD_TYPES.map((option) => `<option value="${option}" ${option === type ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input" type="number" min="0" data-protocol-field="offset" data-index="${index}" value="${Number(field.offset) || 0}"></td>
        <td><input class="form-input" type="number" min="1" data-protocol-field="count" data-index="${index}" value="${Math.max(1, Number(field.count) || 1)}"></td>
        <td><input class="form-input" type="number" min="1" data-protocol-field="channels" data-index="${index}" value="${Math.max(1, Number(field.channels) || 1)}"></td>
        <td>
          <select class="form-select" data-protocol-field="arrayOrder" data-index="${index}">
            ${ARRAY_ORDERS.map((option) => `<option value="${option}" ${option === (field.arrayOrder || 'channelFirst') ? 'selected' : ''}>${this._escape(orderNames[option] || option)}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input" data-protocol-field="lengthField" data-index="${index}" value="${this._escapeAttr(field.lengthField || '')}" placeholder="frameLength"></td>
        <td>
          <select class="form-select" data-protocol-field="endian" data-index="${index}">
            ${BYTE_ORDERS.map((option) => `<option value="${option}" ${option === endian ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input mono" data-protocol-field="fixedValue" data-index="${index}" value="${this._escapeAttr(field.fixedValue || '')}" placeholder="5A A5"></td>
        <td><input class="form-input mono" data-protocol-field="formula" data-index="${index}" value="${this._escapeAttr(field.formula || '')}" placeholder="raw"></td>
        <td><input class="form-input" data-protocol-field="units" data-index="${index}" value="${this._escapeAttr(field.units || '')}"></td>
        <td class="protocol-field-index">${size}</td>
        <td class="protocol-field-index">${start}-${Math.max(start, end - 1)}</td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="btn" type="button" data-protocol-duplicate="${index}" title="${this._labels.duplicate}">+</button>
            <button class="btn" type="button" data-protocol-remove="${index}">-</button>
          </div>
        </td>
      </tr>`;
  }

  _renderCheckboxField(label, field, checked) {
    return `
      <label class="checkbox-wrap" style="margin:0">
        <input type="checkbox" data-field="${field}" data-kind="boolean" ${checked ? 'checked' : ''}>
        <span>${label}</span>
      </label>`;
  }

  _isSelected(type, groupIndex, datasetIndex) {
    if (this._selected.type !== type) return false;
    if (type === 'group') return this._selected.groupIndex === groupIndex;
    if (type === 'dataset') {
      return this._selected.groupIndex === groupIndex && this._selected.datasetIndex === datasetIndex;
    }
    return true;
  }

  _escape(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  _escapeAttr(value) {
    return this._escape(value).replaceAll('\n', '&#10;');
  }
}
