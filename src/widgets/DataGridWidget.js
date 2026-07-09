/**
 * DataGridWidget - Live data table widget
 */
import { WidgetBase } from './WidgetBase.js';
import { eventBus } from '../core/EventBus.js';
import { getDatasetColor, formatValue } from '../utils/helpers.js';
import { datasetFromFrame } from './datasetSource.js';

export class DataGridWidget extends WidgetBase {
  constructor(config = {}) {
    super({ title: config.title || 'Data Grid', icon: 'GRID', spanCols: 2, ...config });
    this._datasets = config.datasets || [];
    this._values = {};
    this._cells = {};
  }

  _render(body) {
    body.style.overflow = 'auto';
    body.style.padding = '0';
    const table = document.createElement('table');
    table.className = 'datagrid-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Value</th>
          <th>Units</th>
          <th>Min</th>
          <th>Max</th>
        </tr>
      </thead>
      <tbody id="datagrid-body"></tbody>`;
    body.appendChild(table);
    const tbody = table.querySelector('tbody');

    this._datasets.forEach((ds, i) => {
      const color = getDatasetColor(i);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="color:${color};font-weight:600">${i + 1}</span></td>
        <td>${ds.title}</td>
        <td class="mono value-cell" style="color:${color}">--</td>
        <td class="text-muted">${ds.units || '--'}</td>
        <td class="mono text-muted min-cell">--</td>
        <td class="mono text-muted max-cell">--</td>`;
      tbody.appendChild(tr);
      this._cells[i] = {
        value: tr.querySelector('.value-cell'),
        min: tr.querySelector('.min-cell'),
        max: tr.querySelector('.max-cell')
      };
      this._values[i] = { current: 0, min: Infinity, max: -Infinity };
    });
  }

  _subscribe() {
    this._unsubscribe = eventBus.on('frame:received', (frame) => {
      if (this._destroyed) return;
      this._datasets.forEach((ds, i) => {
        const fds = datasetFromFrame(frame, ds, i);
        if (!fds) return;
        const v = typeof fds.value === 'number' ? fds.value : parseFloat(fds.value) || 0;
        const stat = this._values[i];
        stat.current = v;
        stat.min = Math.min(stat.min, v);
        stat.max = Math.max(stat.max, v);
        const cell = this._cells[i];
        if (cell) {
          const decimals = Number.isInteger(ds.decimals) ? ds.decimals : ds.precision;
          cell.value.textContent = formatValue(v, stat.min, stat.max, decimals);
          cell.min.textContent = isFinite(stat.min) ? formatValue(stat.min, undefined, undefined, decimals) : '--';
          cell.max.textContent = isFinite(stat.max) ? formatValue(stat.max, undefined, undefined, decimals) : '--';
        }
      });
    });
  }

  reset() {
    this._values = {};
    this._datasets.forEach((_, i) => {
      this._values[i] = { current: 0, min: Infinity, max: -Infinity };
      if (this._cells[i]) {
        this._cells[i].value.textContent = '--';
        this._cells[i].min.textContent = '--';
        this._cells[i].max.textContent = '--';
      }
    });
  }
}
