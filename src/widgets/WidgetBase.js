/**
 * WidgetBase - Base class for all dashboard widgets (with drag + resize)
 */
export class WidgetBase {
  constructor(config = {}) {
    this.config = {
      title: config.title || 'Widget',
      icon: config.icon || 'W',
      x: config.x || 0,
      y: config.y || 0,
      w: config.w || 380,
      h: config.h || 260,
      ...config
    };
    this._el = null;
    this._body = null;
    this._destroyed = false;
    this._unsubscribe = null;
  }

  mount(container) {
    this._el = document.createElement('div');
    this._el.className = 'widget animate-fadeInUp';
    this._el.style.cssText = `
      left: ${this.config.x}px;
      top: ${this.config.y}px;
      width: ${this.config.w}px;
      height: ${this.config.h}px;
    `;
    this._el.innerHTML = `
      <div class="widget-header">
        <div class="widget-title">
          <span class="widget-title-icon">${this.config.icon}</span>
          <span>${this.config.title}</span>
        </div>
        <div class="widget-actions">
          ${this._supportsExport() ? '<button class="widget-action-btn widget-export-btn" data-action="export" title="导出">导出</button>' : ''}
          <button class="widget-action-btn" data-action="refresh" title="Reset data">R</button>
          <button class="widget-action-btn" data-action="minimize" title="Minimize">-</button>
        </div>
      </div>
      <div class="widget-body"></div>
      <div class="widget-resize-handle" title="Drag to resize"></div>
    `;

    this._body = this._el.querySelector('.widget-body');
    this._el.querySelector('[data-action="refresh"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this.reset();
    });
    this._el.querySelector('[data-action="export"]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleExportMenu();
    });
    this._el.querySelector('[data-action="minimize"]').addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMinimize();
    });

    this._render(this._body);
    container.appendChild(this._el);
    this._subscribe();
    this._setupDragResize();
    return this._el;
  }

  _supportsExport() { return false; }

  _exportParsedData() { return null; }

  _exportRawFrames() { return null; }

  _toggleExportMenu() {
    const existing = this._el?.querySelector('.widget-export-menu');
    if (existing) {
      existing.remove();
      return;
    }

    const actions = this._el?.querySelector('.widget-actions');
    if (!actions) return;

    const menu = document.createElement('div');
    menu.className = 'widget-export-menu';
    menu.innerHTML = `
      <button type="button" data-export-kind="parsed">导出解析数据</button>
      <button type="button" data-export-kind="raw">导出原始帧</button>
    `;
    actions.appendChild(menu);

    const close = (event) => {
      if (menu.contains(event.target) || event.target?.dataset?.action === 'export') return;
      menu.remove();
      document.removeEventListener('mousedown', close);
    };

    menu.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const payload = button.dataset.exportKind === 'raw'
          ? this._exportRawFrames()
          : this._exportParsedData();
        menu.remove();
        document.removeEventListener('mousedown', close);
        this._downloadCsvPayload(payload);
      });
    });

    setTimeout(() => document.addEventListener('mousedown', close), 0);
  }

  _downloadCsvPayload(payload) {
    if (!payload || !Array.isArray(payload.rows) || payload.rows.length === 0) {
      window.alert('当前图表没有可导出的数据');
      return;
    }

    const csv = payload.rows
      .map((row) => row.map((cell) => this._csvCell(cell)).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = payload.filename || `${this._safeFileName(this.config.title || 'widget')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  _csvCell(value) {
    if (value === undefined || value === null) return '';
    const text = String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  _safeFileName(name) {
    return String(name || 'widget')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80) || 'widget';
  }

  _toggleMinimize() {
    const body = this._el.querySelector('.widget-body');
    const minimized = body.style.display === 'none';
    body.style.display = minimized ? '' : 'none';
    this._el.style.height = minimized ? `${this.config.h}px` : 'auto';
    const btn = this._el.querySelector('[data-action="minimize"]');
    if (btn) btn.textContent = minimized ? '-' : '+';
  }

  _setupDragResize() {
    const header = this._el.querySelector('.widget-header');
    const resizeHandle = this._el.querySelector('.widget-resize-handle');
    const el = this._el;

    let dragStartX;
    let dragStartY;
    let elStartLeft;
    let elStartTop;

    header.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.widget-actions')) return;
      e.preventDefault();
      el.classList.add('dragging');
      el.style.zIndex = '50';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      elStartLeft = parseInt(el.style.left, 10) || 0;
      elStartTop = parseInt(el.style.top, 10) || 0;

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - dragStartX;
        const dy = moveEvent.clientY - dragStartY;
        const newLeft = Math.max(0, elStartLeft + dx);
        const newTop = Math.max(0, elStartTop + dy);
        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
        const container = el.parentElement;
        if (container) {
          const minH = newTop + el.offsetHeight + 20;
          if ((parseInt(container.style.minHeight, 10) || 0) < minH) {
            container.style.minHeight = `${minH}px`;
          }
        }
      };

      const onUp = () => {
        el.classList.remove('dragging');
        el.style.zIndex = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    if (resizeHandle) {
      let resizeStartX;
      let resizeStartY;
      let resizeStartW;
      let resizeStartH;

      resizeHandle.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        el.classList.add('resizing');
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        resizeStartW = el.offsetWidth;
        resizeStartH = el.offsetHeight;

        const onMove = (moveEvent) => {
          const newW = Math.max(240, resizeStartW + (moveEvent.clientX - resizeStartX));
          const newH = Math.max(180, resizeStartH + (moveEvent.clientY - resizeStartY));
          el.style.width = `${newW}px`;
          el.style.height = `${newH}px`;
          this.config.w = newW;
          this.config.h = newH;
          this._onResize?.();
        };

        const onUp = () => {
          el.classList.remove('resizing');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          this._onResize?.();
          const canvas = el.querySelector('canvas');
          if (canvas?.__chartjs) {
            canvas.__chartjs.resize();
          }
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  }

  _render(body) {}

  _subscribe() {}

  _onResize() {}

  reset() {}

  destroy() {
    this._destroyed = true;
    if (this._unsubscribe) this._unsubscribe();
    if (this._el) this._el.remove();
  }
}
