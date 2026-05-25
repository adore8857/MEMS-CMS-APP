/**
 * ProjectModel — Project file data model (JSON schema)
 */

export const defaultProject = () => ({
  title: 'Untitled Project',
  protocol: 'Delimited',
  separator: ',',
  frameStart: '',
  frameEnd: '\\n',
  frameDetection: 'EndDelimiterOnly',
  protocolFields: [],
  frameParser: "function parse(frame) {\n  return frame.split(',').map(Number);\n}\n",
  groups: [
    {
      title: 'Sensor Data',
      widget: 'MultiPlot',
      datasets: [
        { title: 'Temperature', index: 0, units: '°C', widget: 'Gauge', min: -20, max: 80, alarm: 50, led: false, fft: false, plot: true, bar: true, gauge: true, compass: false },
        { title: 'Humidity', index: 1, units: '%', widget: 'Bar', min: 0, max: 100, alarm: 85, led: false, fft: false, plot: true, bar: true, gauge: false, compass: false },
        { title: 'Pressure', index: 2, units: 'hPa', widget: 'Gauge', min: 900, max: 1100, alarm: 0, led: false, fft: false, plot: true, bar: false, gauge: true, compass: false },
      ]
    }
  ]
});

export class ProjectModel {
  constructor() {
    this._project = null;
  }

  get project() { return this._project; }
  get hasProject() { return this._project !== null; }
  get title() { return this._project?.title || 'Untitled'; }
  get groups() { return this._project?.groups || []; }

  loadFromJSON(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this._project = this._validateProject(data);
      return true;
    } catch (e) {
      console.error('ProjectModel: Failed to load project', e);
      return false;
    }
  }

  loadDefault() {
    this._project = defaultProject();
    return true;
  }

  exportJSON() {
    return JSON.stringify(this._project, null, 2);
  }

  addGroup(title = 'New Group') {
    if (!this._project) this._project = defaultProject();
    this._project.groups.push({
      title,
      widget: 'DataGrid',
      datasets: []
    });
  }

  removeGroup(index) {
    if (!this._project) return;
    this._project.groups.splice(index, 1);
  }

  addDataset(groupIndex, title = 'New Dataset') {
    if (!this._project) return;
    const group = this._project.groups[groupIndex];
    if (!group) return;
    const idx = group.datasets.length;
    group.datasets.push({
      title,
      index: idx,
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
  }

  removeDataset(groupIndex, datasetIndex) {
    if (!this._project) return;
    const group = this._project.groups[groupIndex];
    if (!group) return;
    group.datasets.splice(datasetIndex, 1);
  }

  _validateProject(data) {
    const sources = Array.isArray(data.sources) ? data.sources.map((source, index) => ({
      ...source,
      title: source.title || `Source ${index + 1}`,
      sourceId: source.sourceId ?? index,
      frameParserCode: source.frameParserCode || source.frameParser || '',
      frameParserLanguage: source.frameParserLanguage ?? 0
    })) : [];
    const frameParserCode = data.frameParserCode ||
      data.frameParser ||
      sources[0]?.frameParserCode ||
      '';

    return {
      title: data.title || 'Untitled',
      protocol: data.protocol || 'Delimited',
      separator: data.separator || ',',
      frameStart: data.frameStart || '',
      frameEnd: data.frameEnd || '\\n',
      frameDetection: data.frameDetection || 'EndDelimiterOnly',
      hexadecimalDelimiters: data.hexadecimalDelimiters ?? false,
      protocolFields: Array.isArray(data.protocolFields) ? data.protocolFields : [],
      frameParser: data.frameParser || frameParserCode,
      frameParserCode,
      frameParserLanguage: data.frameParserLanguage ?? sources[0]?.frameParserLanguage ?? 0,
      sources,
      groups: (data.groups || []).map(g => {
        const groupWidget = g.widget || 'DataGrid';
        return {
          title: g.title || 'Group',
          widget: groupWidget,
          datasets: (g.datasets || []).map((d, i) => {
            const min = d.min ?? d.widgetMin ?? d.plotMin ?? d.fftMin ?? 0;
            const max = d.max ?? d.widgetMax ?? d.plotMax ?? d.fftMax ?? 100;
            const defaultPlot = ['Plot', 'MultiPlot'].includes(groupWidget);
            const plot = d.plot ?? d.graph ?? defaultPlot;
            return {
              title: d.title || `Dataset ${i + 1}`,
              index: d.index ?? i,
              units: d.units || '',
              widget: d.widget || groupWidget || 'Bar',
              min,
              max,
              alarm: d.alarm ?? d.alarmHigh ?? 0,
              led: d.led ?? false,
              fft: d.fft ?? false,
              fftSampleRate: Number(d.fftSampleRate) > 0 ? Number(d.fftSampleRate) : 0,
              fftSampleRateField: d.fftSampleRateField || '',
              fftPoints: [128, 256, 512, 1024].includes(Number(d.fftPoints)) ? Number(d.fftPoints) : 128,
              fftWindow: d.fftWindow === 'None' ? 'None' : 'Hann',
              fftMagnitudeMode: d.fftMagnitudeMode === 'db' ? 'db' : 'linear',
              fftAmplitudeUnit: d.fftAmplitudeUnit || d.units || '',
              plot,
              graph: d.graph ?? plot,
              bar: d.bar ?? groupWidget === 'Bar',
              gauge: d.gauge ?? groupWidget === 'Gauges',
              compass: d.compass ?? groupWidget === 'Compass',
              sourceField: d.sourceField || '',
              formula: d.formula || ''
            };
          })
        };
      })
    };
  }
}
