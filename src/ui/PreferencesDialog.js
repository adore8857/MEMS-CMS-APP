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

    const serialCfg = appState.serialConfig;
    const frameCfg = appState.frameConfig;

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
            <div class="editor-form-section-title">${t('preferences.frameParsing')}</div>
            <div class="editor-form-grid">
              <div class="form-row">
                <div class="form-label">${t('preferences.frameDetection')}</div>
                <select class="form-select" id="pref-frame-detection">
                  <option value="EndDelimiterOnly" ${frameCfg.frameDetection === 'EndDelimiterOnly' ? 'selected' : ''}>${t('preferences.endDelimiterOnly')}</option>
                  <option value="StartAndEndDelimiter" ${frameCfg.frameDetection === 'StartAndEndDelimiter' ? 'selected' : ''}>${t('preferences.startAndEnd')}</option>
                  <option value="NoDelimiters" ${frameCfg.frameDetection === 'NoDelimiters' ? 'selected' : ''}>${t('preferences.noDelimiters')}</option>
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.endDelimiter')}</div>
                <input class="form-input" id="pref-end-del" value="${frameCfg.endDelimiter}" placeholder="\\n">
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.startDelimiter')}</div>
                <input class="form-input" id="pref-start-del" value="${frameCfg.startDelimiter}" placeholder="${t('sidebar.leaveEmpty')}">
              </div>
            </div>
          </div>

          <div class="editor-form-section" style="margin-bottom:20px">
            <div class="editor-form-section-title">${t('preferences.serialDefaults')}</div>
            <div class="editor-form-grid">
              <div class="form-row">
                <div class="form-label">${t('sidebar.baudRate')}</div>
                <select class="form-select" id="pref-baud">
                  ${[300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((b) =>
                    `<option ${b === serialCfg.baudRate ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.dataBits')}</div>
                <select class="form-select" id="pref-databits">
                  ${[7, 8].map((b) => `<option ${b === serialCfg.dataBits ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.stopBits')}</div>
                <select class="form-select" id="pref-stopbits">
                  ${[1, 2].map((b) => `<option ${b === serialCfg.stopBits ? 'selected' : ''} value="${b}">${b}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('sidebar.parity')}</div>
                <select class="form-select" id="pref-parity">
                  ${['none', 'even', 'odd', 'mark', 'space'].map((p) => `<option ${p === serialCfg.parity ? 'selected' : ''} value="${p}">${p}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <div class="form-label">${t('preferences.flowControl')}</div>
                <select class="form-select" id="pref-flowcontrol">
                  ${['none', 'hardware'].map((p) => `<option ${p === serialCfg.flowControl ? 'selected' : ''} value="${p}">${p}</option>`).join('')}
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
            <div style="font-size:12px;color:var(--text-muted);line-height:1.8">
              <div><strong style="color:var(--text-secondary)">MEMS-CMS</strong> - v1.0.0</div>
              <div>${t('preferences.aboutIntro')}</div>
              <div style="margin-top:8px">${t('preferences.aboutSupports')}</div>
              <div>${t('preferences.aboutWidgets')}</div>
              <div style="margin-top:8px;color:var(--text-muted)">
                <strong>${t('preferences.aboutQuickPlot')}</strong> <code style="color:var(--accent-green)">25.4,63.2,1013.1\\n</code><br>
                <strong>${t('preferences.aboutJson')}</strong><br>
                <strong>${t('preferences.aboutProject')}</strong>
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
      appState.updateSerialConfig({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' });
      appState.updateFrameConfig({ endDelimiter: '\\n', startDelimiter: '', frameDetection: 'EndDelimiterOnly' });
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

      appState.updateSerialConfig({
        baudRate: parseInt(this._el.querySelector('#pref-baud')?.value, 10) || 115200,
        dataBits: parseInt(this._el.querySelector('#pref-databits')?.value, 10) || 8,
        stopBits: parseInt(this._el.querySelector('#pref-stopbits')?.value, 10) || 1,
        parity: this._el.querySelector('#pref-parity')?.value || 'none',
        flowControl: this._el.querySelector('#pref-flowcontrol')?.value || 'none'
      });

      appState.updateFrameConfig({
        endDelimiter: this._el.querySelector('#pref-end-del')?.value || '\\n',
        startDelimiter: this._el.querySelector('#pref-start-del')?.value || '',
        frameDetection: this._el.querySelector('#pref-frame-detection')?.value || 'EndDelimiterOnly'
      });

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
