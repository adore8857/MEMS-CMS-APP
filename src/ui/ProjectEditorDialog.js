import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { defaultProject } from '../core/ProjectModel.js';
import { t } from '../core/i18n.js?v=csv-autosave-20260424-1';

function cloneProject(project) {
  if (typeof structuredClone === 'function') return structuredClone(project);
  return JSON.parse(JSON.stringify(project));
}

function getLabels(locale) {
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
const FIELD_TYPES = ['uint8', 'int8', 'uint16', 'int16', 'uint24', 'int24', 'uint32', 'int32', 'float32', 'float64'];
const BYTE_ORDERS = ['LE', 'BE'];
const FFT_POINTS = ['128', '256', '512', '1024'];
const FFT_WINDOWS = ['Hann', 'None'];
const FFT_MAGNITUDE_MODES = ['linear', 'db'];

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
      ? '\u53ef\u4f7f\u7528 raw\u3001fields\u3001bytes\u3001Math\u3001index\u3002\u793a\u4f8b\uff1araw * 2.5 / 8388608\u3002'
      : 'Use raw, fields, bytes, Math and index. Example: raw * 2.5 / 8388608.',
    fieldHelp: zh
      ? '\u6309\u5b57\u8282\u504f\u79fb\u5b9a\u4e49\u6570\u636e\u5e27\u5b57\u6bb5\uff0c\u5e94\u7528\u65f6\u4f1a\u81ea\u52a8\u751f\u6210\u89e3\u6790\u51fd\u6570\u5e76\u5c06\u7ed3\u679c\u4f20\u7ed9\u6570\u636e\u96c6\u516c\u5f0f\u3002'
      : 'Define payload fields by byte offset. The generated parser reads these fields and feeds dataset formulas.',
    addField: zh ? '\u6dfb\u52a0\u5b57\u6bb5' : 'Add Field',
    openProject: zh ? '\u6253\u5f00\u9879\u76ee' : 'Open Project',
    saveProject: zh ? '\u4fdd\u5b58\u9879\u76ee' : 'Save Project',
    projectLoaded: zh ? '\u9879\u76ee\u5df2\u8f7d\u5165\u7f16\u8f91\u5668' : 'Project loaded into editor',
    projectSaved: zh ? '\u9879\u76ee\u5df2\u4fdd\u5b58' : 'Project saved',
    hexDelimiters: zh ? '\u5341\u516d\u8fdb\u5236\u5e27\u5934/\u5e27\u5c3e' : 'Hex Delimiters',
    fieldName: zh ? '\u540d\u79f0' : 'Name',
    fieldType: zh ? '\u7c7b\u578b' : 'Type',
    fieldOffset: zh ? '\u504f\u79fb' : 'Offset',
    fieldCount: zh ? '\u6570\u91cf' : 'Count',
    fieldEndian: zh ? '\u5b57\u8282\u5e8f' : 'Endian',
    noFields: zh ? '\u5c1a\u672a\u5b9a\u4e49\u5b57\u6bb5' : 'No fields defined yet.',
    none: zh ? '\u65e0' : 'None',
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

    this._draft = cloneProject(this._projectModel.project || defaultProject());
    if (!Array.isArray(this._draft.groups)) this._draft.groups = [];
    this._selected = { type: 'project' };

    this._el = document.createElement('div');
    this._el.className = 'modal-overlay animate-fadeIn';
    this._el.innerHTML = `
      <div class="modal" style="max-width:1040px">
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
      this._draft = cloneProject(defaultProject());
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
          this._draft = cloneProject(loaded);
          if (!Array.isArray(this._draft.groups)) this._draft.groups = [];
          if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
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
    this._el?.querySelector('#protocol-field-add')?.addEventListener('click', () => {
      if (!Array.isArray(this._draft.protocolFields)) this._draft.protocolFields = [];
      const index = this._draft.protocolFields.length;
      this._draft.protocolFields.push({
        name: `field${index + 1}`,
        type: 'uint16',
        offset: 0,
        count: 1,
        endian: 'LE'
      });
      this._refreshBody();
    });

    this._el?.querySelectorAll('[data-protocol-field]').forEach((node) => {
      const index = Number(node.dataset.index);
      const field = node.dataset.protocolField;
      if (!Number.isInteger(index) || !field) return;

      node.addEventListener(node.tagName === 'SELECT' ? 'change' : 'input', () => {
        const item = this._draft.protocolFields?.[index];
        if (!item) return;
        if (field === 'offset' || field === 'count') {
          item[field] = Math.max(field === 'count' ? 1 : 0, Number(node.value) || 0);
        } else {
          item[field] = node.value;
        }
      });
    });

    this._el?.querySelectorAll('[data-protocol-remove]').forEach((node) => {
      node.addEventListener('click', () => {
        const index = Number(node.dataset.protocolRemove);
        if (!Number.isInteger(index)) return;
        this._draft.protocolFields?.splice(index, 1);
        this._refreshBody();
      });
    });
  }

  _resolveGroupIndex() {
    if (this._selected.type === 'group' || this._selected.type === 'dataset') {
      const groupIndex = Number(this._selected.groupIndex);
      if (Number.isInteger(groupIndex) && this._draft.groups[groupIndex]) return groupIndex;
    }
    return 0;
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
    const fields = Array.isArray(project.protocolFields) ? project.protocolFields : [];
    const datasets = (project.groups || []).flatMap((group) => group.datasets || []);
    const formulaDatasets = datasets.filter((dataset) => dataset.sourceField && dataset.formula);
    if (!fields.length || !formulaDatasets.length) return;

    const parserCode = this._generateParserCode(project);
    project.frameParserCode = parserCode;
    project.frameParser = parserCode;
    project.frameParserLanguage = 0;
    if (!Array.isArray(project.sources)) project.sources = [];
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

  _generateParserCode(project) {
    const fields = (project.protocolFields || []).map((field) => ({
      name: String(field.name || '') || 'field',
      type: field.type || 'uint16',
      offset: Math.max(0, Number(field.offset) || 0),
      count: Math.max(1, Number(field.count) || 1),
      endian: field.endian === 'BE' ? 'BE' : 'LE'
    }));
    const datasets = (project.groups || [])
      .flatMap((group) => group.datasets || [])
      .filter((dataset) => dataset.sourceField && dataset.formula)
      .map((dataset) => ({
        index: Number(dataset.index) || 0,
        title: dataset.title || `Dataset ${Number(dataset.index) || 0}`,
        sourceField: dataset.sourceField,
        formula: dataset.formula || 'raw',
        fftSampleRate: Number(dataset.fftSampleRate) > 0 ? Number(dataset.fftSampleRate) : 0,
        fftSampleRateField: dataset.fftSampleRateField || ''
      }));

    return `function parse(frame) {
  const text = String(frame || '');
  const cleanHex = text.replace(/[^0-9a-f]/gi, '');
  const bytes = [];
  if (cleanHex.length >= 2 && cleanHex.length % 2 === 0) {
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes.push(parseInt(cleanHex.slice(i, i + 2), 16));
    }
  } else {
    for (let i = 0; i < text.length; i += 1) bytes.push(text.charCodeAt(i) & 0xFF);
  }

  const fieldDefs = ${JSON.stringify(fields, null, 2)};
  const datasetDefs = ${JSON.stringify(datasets, null, 2)};
  const byteLength = (type) => {
    if (type.endsWith('8')) return 1;
    if (type.endsWith('16')) return 2;
    if (type.endsWith('24')) return 3;
    if (type.endsWith('32')) return 4;
    if (type.endsWith('64')) return 8;
    return 1;
  };
  const requiredLength = fieldDefs.reduce((max, def) => {
    return Math.max(max, def.offset + (Math.max(1, def.count || 1) * byteLength(def.type)));
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
  const readOne = (def, offset) => {
    const length = byteLength(def.type);
    if (def.type === 'float32' || def.type === 'float64') {
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      for (let i = 0; i < length; i += 1) view.setUint8(i, bytes[offset + i] || 0);
      return def.type === 'float32'
        ? view.getFloat32(0, def.endian === 'LE')
        : view.getFloat64(0, def.endian === 'LE');
    }
    return readInt(offset, length, def.type.startsWith('int'), def.endian);
  };
  const fields = {};
  fieldDefs.forEach((def) => {
    const length = byteLength(def.type);
    const values = [];
    for (let i = 0; i < def.count; i += 1) values.push(readOne(def, def.offset + i * length));
    fields[def.name] = def.count > 1 ? values : values[0];
  });
  const datasets = datasetDefs.map((def) => {
    const raw = fields[def.sourceField];
    const applyFormula = (item, index) => {
      try {
        return Function('raw', 'fields', 'bytes', 'Math', 'index', '"use strict"; return (' + def.formula + ');')(item, fields, bytes, Math, index);
      } catch (error) {
        return NaN;
      }
    };
    const result = Array.isArray(raw) ? raw.map((item, index) => applyFormula(item, index)) : applyFormula(raw, 0);
    const value = Array.isArray(result) ? result[result.length - 1] : result;
    const dataset = { index: def.index, title: def.title, value };
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
            ${this._renderTextField(this._labels.frameStart, 'frameStart', selected.frameStart || '')}
            ${this._renderTextField(this._labels.frameEnd, 'frameEnd', selected.frameEnd || '\\n')}
            ${this._renderCheckboxField(this._labels.hexDelimiters, 'hexadecimalDelimiters', !!selected.hexadecimalDelimiters)}
          </div>
        </div>
        ${this._renderFieldEditor()}`;
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
        </div>
        ${this._renderTextAreaField(this._labels.formula, 'formula', selected.formula || 'raw')}
        <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5">
          ${this._labels.formulaHelp}
        </div>
      </div>
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.displayEditor}</div>
        <div class="editor-form-grid">
          ${this._renderTextField(this._labels.titleField, 'title', selected.title || '', true)}
          ${this._renderNumberField(this._labels.index, 'index', selected.index ?? 0)}
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

  _renderFieldEditor() {
    const fields = Array.isArray(this._draft.protocolFields) ? this._draft.protocolFields : [];
    return `
      <div class="editor-form-section">
        <div class="editor-form-section-title">${this._labels.fieldEditor}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="font-size:var(--font-size-xs);color:var(--text-muted);line-height:1.5">
            ${this._labels.fieldHelp}
          </div>
          <button class="btn" id="protocol-field-add" type="button">${this._labels.addField}</button>
        </div>
        <div style="overflow:auto;border:1px solid var(--border-subtle);border-radius:var(--radius-md)">
          <table class="protocol-field-table">
            <thead>
              <tr>
                <th>#</th>
                <th>${this._labels.fieldName}</th>
                <th>${this._labels.fieldType}</th>
                <th>${this._labels.fieldOffset}</th>
                <th>${this._labels.fieldCount}</th>
                <th>${this._labels.fieldEndian}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${fields.length ? fields.map((field, index) => this._renderProtocolFieldRow(field, index)).join('') : `
                <tr><td colspan="7" style="color:var(--text-muted);text-align:center;padding:14px">${this._labels.noFields}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  _renderProtocolFieldRow(field, index) {
    const type = field.type || 'uint16';
    const endian = field.endian || 'LE';
    return `
      <tr>
        <td class="protocol-field-index">${index}</td>
        <td><input class="form-input" data-protocol-field="name" data-index="${index}" value="${this._escapeAttr(field.name || `field${index + 1}`)}"></td>
        <td>
          <select class="form-select" data-protocol-field="type" data-index="${index}">
            ${FIELD_TYPES.map((option) => `<option value="${option}" ${option === type ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><input class="form-input" type="number" min="0" data-protocol-field="offset" data-index="${index}" value="${Number(field.offset) || 0}"></td>
        <td><input class="form-input" type="number" min="1" data-protocol-field="count" data-index="${index}" value="${Math.max(1, Number(field.count) || 1)}"></td>
        <td>
          <select class="form-select" data-protocol-field="endian" data-index="${index}">
            ${BYTE_ORDERS.map((option) => `<option value="${option}" ${option === endian ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn" type="button" data-protocol-remove="${index}">-</button></td>
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
