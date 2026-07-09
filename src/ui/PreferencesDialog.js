/**
 * PreferencesDialog - Application preferences modal
 */
import { eventBus } from '../core/EventBus.js';
import { appState } from '../core/AppState.js';
import { applyTheme, t } from '../core/i18n.js?v=mems-cms-brand-20260525-2';
import { csvSessionManager } from '../core/CsvSessionManager.js';

export class PreferencesDialog {
  constructor(modalRoot) {
    this._root = modalRoot;
    this._el = null;
    eventBus.on('ui:openPreferences', () => this.open());
  }

  open() {
    if (this._el) this.close();
    const zh = appState.locale === 'zh-CN';

    this._el = document.createElement('div');
    this._el.className = 'modal-overlay animate-fadeIn';
    this._el.innerHTML = `
      <div class="modal" style="max-width:620px">
        <div class="modal-header">
          <div class="modal-title">${t('preferences.title')}</div>
          <button class="btn btn-icon" id="pref-close" style="font-size:18px">X</button>
        </div>
        <div class="modal-body">
          <div class="editor-form-section" style="margin-bottom:20px">
            <div class="editor-form-section-title">${t('preferences.display')}</div>
            <div class="editor-form-grid">
              <div class="form-row">
                <div class="form-label">${t('preferences.plotHistoryPoints')}</div>
                <input class="form-input" id="pref-points" type="number" min="10" max="10000" value="${appState.points}">
              </div>
              <div class="form-row">
                <div class="form-label">${t('common.language')}</div>
                <select class="form-select" id="pref-language">
                  <option value="zh-CN" ${appState.locale === 'zh-CN' ? 'selected' : ''}>${t('common.chinese')}</option>
                  <option value="en" ${appState.locale === 'en' ? 'selected' : ''}>${t('common.english')}</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('common.theme')}</div>
                <select class="form-select" id="pref-theme">
                  <option value="dark" ${appState.theme === 'dark' ? 'selected' : ''}>${t('common.darkTheme')}</option>
                  <option value="light" ${appState.theme === 'light' ? 'selected' : ''}>${t('common.lightTheme')}</option>
                </select>
              </div>
            </div>
          </div>

          <div class="editor-form-section" style="margin-bottom:20px">
            <div class="editor-form-section-title">${t('preferences.dataExport')}</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <label class="checkbox-wrap">
                <input type="checkbox" id="pref-csv" ${appState.csvExportEnabled ? 'checked' : ''}>
                <span>${t('preferences.autoExportCsv')}</span>
              </label>
              <label class="checkbox-wrap">
                <input type="checkbox" id="pref-console-log" ${appState.consoleExportEnabled ? 'checked' : ''}>
                <span>${t('preferences.exportConsoleLog')}</span>
              </label>
              <button class="btn" id="pref-csv-path">${t('preferences.chooseCsvPath')}</button>
              <div style="font-size:12px;color:var(--text-muted)" id="pref-csv-target">${csvSessionManager.targetSummary}</div>
            </div>
          </div>

          <div class="editor-form-section">
            <div class="editor-form-section-title">${t('preferences.about')}</div>
            <div style="font-size:13px;color:var(--text-muted);line-height:1.75">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <img src="src/assets/cms-icon.png" alt="MEMS-CMS" style="width:42px;height:42px;border-radius:10px;box-shadow:0 4px 14px rgba(15,23,42,.12)">
                <div>
                  <div><strong style="color:var(--text-primary);font-size:15px">MEMS-CMS</strong> <span style="color:var(--text-muted)">v1.0.0</span></div>
                  <div>${zh ? 'MEMS 实验室状态监测上位机系统' : 'MEMS Condition Monitoring System desktop application'}</div>
                </div>
              </div>
              <div>${zh ? '用于轴承、轴瓦、齿轮箱等实验设备的数据接入、协议解析、实时绘图、FFT 分析和数据导出。' : 'A desktop monitoring system for device data acquisition, protocol parsing, real-time plotting, FFT analysis and data export.'}</div>
              <div style="margin-top:8px">${zh ? '通信方式：串口、WebSocket、MQTT、UDP。' : 'Interfaces: Serial, WebSocket, MQTT and UDP.'}</div>
              <div>${zh ? '解析方式：快速绘图、设备 JSON、项目 JSON、完整帧协议字段解析。' : 'Parsing modes: Quick Plot, Device JSON, Project JSON and full-frame protocol field parsing.'}</div>
              <div>${zh ? '显示控件：折线图、仪表、柱状图、FFT、数据表格及命令交互。' : 'Widgets: Plot, Gauge, Bar, FFT, DataGrid and command interaction.'}</div>
              <div style="margin-top:8px;color:var(--text-muted)">
                <strong>${zh ? 'UDP 网关：' : 'UDP Gateway: '}</strong>${zh ? '桌面版内置 Node.js UDP 网关，无需额外 Python 环境。' : 'The desktop build includes a Node.js UDP gateway and does not require Python.'}<br>
                <strong>${zh ? '项目文件：' : 'Project Files: '}</strong>${zh ? '加载 .json 文件即可定义解析字段、换算公式和仪表盘布局。' : 'Load .json files to define fields, formulas and dashboard layouts.'}
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn" id="pref-reset">${t('common.reset')}</button>
          <button class="btn btn-primary" id="pref-save">${t('preferences.saveClose')}</button>
        </div>
      </div>`;

    this._root.appendChild(this._el);

    this._el.addEventListener('click', (e) => { if (e.target === this._el) this.close(); });
    this._el.querySelector('#pref-close').addEventListener('click', () => this.close());
    this._el.querySelector('#pref-csv-path')?.addEventListener('click', async () => {
      try {
        const changed = await csvSessionManager.pickSaveDirectory();
        if (changed) {
          const target = this._el?.querySelector('#pref-csv-target');
          if (target) target.textContent = csvSessionManager.targetSummary;
        }
      } catch (error) {
        if (error?.name !== 'AbortError') {
          eventBus.emit('toast', { type: 'error', message: t('messages.csvSaveFailed', { error: error.message || error }) });
        }
      }
    });

    this._el.querySelector('#pref-reset').addEventListener('click', () => {
      appState.points = 100;
      appState.locale = 'zh-CN';
      appState.theme = 'dark';
      appState.csvExportEnabled = true;
      appState.consoleExportEnabled = false;
      applyTheme();
      this.close();
      eventBus.emit('toast', { type: 'info', message: t('preferences.resetSuccess') });
      window.location.reload();
    });

    this._el.querySelector('#pref-save').addEventListener('click', () => {
      const nextLocale = this._el.querySelector('#pref-language')?.value || 'zh-CN';
      const nextTheme = this._el.querySelector('#pref-theme')?.value || 'dark';
      const requiresReload = nextLocale !== appState.locale || nextTheme !== appState.theme;

      appState.points = parseInt(this._el.querySelector('#pref-points')?.value, 10) || 100;
      appState.locale = nextLocale;
      appState.theme = nextTheme;

      appState.csvExportEnabled = this._el.querySelector('#pref-csv')?.checked ?? true;
      appState.consoleExportEnabled = this._el.querySelector('#pref-console-log')?.checked ?? false;

      applyTheme();
      eventBus.emit('toast', { type: 'success', message: requiresReload ? t('preferences.reloadNotice') : t('preferences.saveSuccess') });
      this.close();

      if (requiresReload) {
        setTimeout(() => window.location.reload(), 250);
      }
    });
  }

  close() {
    if (this._el) {
      this._el.remove();
      this._el = null;
    }
  }
}
