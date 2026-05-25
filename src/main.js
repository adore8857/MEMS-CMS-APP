/**
 * main.js - Application entry point
 */
import { eventBus } from './core/EventBus.js';
import { appState } from './core/AppState.js';
import { applyTheme, modeLabel, t } from './core/i18n.js?v=mems-cms-brand-20260525-2';
import { ConnectionManager } from './io/ConnectionManager.js?v=mqtt-check-20260519-1';
import { DataSimulator } from './io/DataSimulator.js?v=fft-analysis-20260525-1';
import { Toolbar } from './ui/Toolbar.js?v=mems-cms-brand-20260525-2';
import { Sidebar } from './ui/Sidebar.js?v=csv-autosave-20260424-1';
import { Dashboard } from './ui/Dashboard.js?v=axis-units-20260525-1';
import { Console } from './ui/Console.js?v=ui-fix-20260424-1';
import { ProjectModel } from './core/ProjectModel.js?v=fft-analysis-20260525-1';
import { PreferencesDialog } from './ui/PreferencesDialog.js?v=mems-cms-brand-20260525-2';
import { ProjectEditorDialog } from './ui/ProjectEditorDialog.js?v=fft-analysis-20260525-1';
import { runDocCaptureScenario } from './utils/docCapture.js?v=doc-capture-20260424-1';

class App {
  constructor() {
    this._conn = new ConnectionManager();
    this._sim = new DataSimulator();
    this._project = new ProjectModel();
    this._toolbar = null;
    this._sidebar = null;
    this._dashboard = null;
    this._console = null;
    this._prefs = null;
    this._projectEditor = null;
    this._init();
  }

  _init() {
    applyTheme();

    const root = document.getElementById('app');
    root.innerHTML = `
      <div id="toolbar-root"></div>
      <div class="main-area" id="main-area">
        <div id="sidebar-root"></div>
        <div class="dashboard-container" id="content-area">
          <div id="dashboard-area" class="dashboard-container" style="display:flex;flex-direction:column;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden"></div>
          <div id="console-area" style="height:100%;display:none;flex-direction:column;flex:1;min-height:0;overflow:hidden"></div>
        </div>
      </div>
      <div id="taskbar-root"></div>
      <div id="toast-container" style="position:fixed;bottom:50px;right:16px;display:flex;flex-direction:column;gap:8px;z-index:500;pointer-events:none"></div>
      <div id="modal-root"></div>`;

    this._toolbar = new Toolbar(document.getElementById('toolbar-root'), this._conn, this._sim);
    this._sidebar = new Sidebar(document.getElementById('sidebar-root'));
    this._dashboard = new Dashboard(document.getElementById('dashboard-area'));
    this._console = new Console(document.getElementById('console-area'), this._conn);
    this._prefs = new PreferencesDialog(document.getElementById('modal-root'));
    this._projectEditor = new ProjectEditorDialog(document.getElementById('modal-root'), this._project, {
      onApply: (project) => {
        this._applyProject(project, { mode: 'ProjectFile' });
      }
    });

    this._renderTaskbar();
    this._bindGlobalEvents();
    runDocCaptureScenario().catch((error) => {
      console.error('Doc capture setup failed:', error);
    });
  }

  _applyProject(source, { mode = 'ProjectFile', toastMessage = '' } = {}) {
    if (!this._project.loadFromJSON(source)) {
      throw new Error(t('messages.failedParseProject'));
    }

    const project = this._project.project;
    this._dashboard.buildFromProject(project);

    appState.project = project;
    appState.projectFileName = project.title || '';
    appState.updateFrameConfig({
      separator: project.separator || ',',
      startDelimiter: project.frameStart || '',
      endDelimiter: project.frameEnd || '\\n',
      frameDetection: project.frameDetection || 'EndDelimiterOnly',
      hexadecimalDelimiters: project.hexadecimalDelimiters ?? false
    });
    appState.operationMode = mode;

    const tbProject = document.getElementById('tb-project');
    if (tbProject) tbProject.textContent = this._project.title;

    if (toastMessage) {
      eventBus.emit('toast', { type: 'success', message: toastMessage });
    }

    return project;
  }

  _renderTaskbar() {
    const el = document.getElementById('taskbar-root');
    const projectTitle = this._project?.title || t('common.noProject');

    el.innerHTML = `
      <div class="taskbar">
        <button class="taskbar-menu-btn" id="tb-menu">${t('taskbar.menu')}</button>
        <div class="taskbar-tabs">
          <button class="taskbar-tab ${appState.currentWorkspace === 'dashboard' ? 'active' : ''}" data-ws="dashboard">
            <span class="taskbar-tab-marker" aria-hidden="true"></span>
            <span>${t('common.dashboard')}</span>
          </button>
          <button class="taskbar-tab ${appState.currentWorkspace === 'console' ? 'active' : ''}" data-ws="console">
            <span class="taskbar-tab-marker" aria-hidden="true"></span>
            <span>${t('common.console')}</span>
          </button>
        </div>
        <div class="taskbar-status">
          <div class="taskbar-status-item">
            <span class="taskbar-status-dot mode" aria-hidden="true"></span>
            <span id="tb-mode">${modeLabel(appState.operationMode)}</span>
          </div>
          <div class="taskbar-status-item">
            <span class="taskbar-status-dot project" aria-hidden="true"></span>
            <span id="tb-project">${projectTitle}</span>
          </div>
        </div>
      </div>`;

    el.querySelectorAll('.taskbar-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this._setWorkspace(tab.dataset.ws);
      });
    });
  }

  _setWorkspace(ws) {
    const el = document.getElementById('taskbar-root');
    el?.querySelectorAll('.taskbar-tab').forEach((node) => {
      node.classList.toggle('active', node.dataset.ws === ws);
    });

    const dashboardArea = document.getElementById('dashboard-area');
    const consoleArea = document.getElementById('console-area');
    if (dashboardArea) {
      dashboardArea.style.display = ws === 'dashboard' ? 'flex' : 'none';
      dashboardArea.style.flexDirection = 'column';
    }
    if (consoleArea) {
      consoleArea.style.display = ws === 'console' ? 'flex' : 'none';
      consoleArea.style.flexDirection = ws === 'console' ? 'column' : 'none';
    }

    appState.currentWorkspace = ws;
  }

  _bindGlobalEvents() {
    eventBus.on('ui:toggleSidebar', () => {
      const sidebar = document.querySelector('.sidebar');
      if (!sidebar) return;
      sidebar.classList.toggle('collapsed');
    });

    eventBus.on('toast', ({ type, message }) => this._showToast(type, message));

    eventBus.on('ui:startSimulator', () => {
      this._sim?.toggle?.();
    });

    eventBus.on('ui:switchWorkspace', (ws) => {
      if (ws === 'dashboard' || ws === 'console') {
        this._setWorkspace(ws);
      }
    });

    eventBus.on('project:openFile', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => eventBus.emit('project:load', ev.target.result);
        reader.readAsText(file);
      });
      input.click();
    });

    eventBus.on('project:load', (jsonStr) => {
      try {
        const project = this._applyProject(jsonStr, { mode: 'ProjectFile' });
        eventBus.emit('toast', { type: 'success', message: t('messages.loaded', { title: project.title }) });
      } catch (error) {
        eventBus.emit('toast', { type: 'error', message: t('messages.failedParseProject') });
      }
    });

    eventBus.on('project:save', () => {
      const json = this._project.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (this._project.title || 'project') + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    eventBus.on('state:operationModeChanged', (mode) => {
      const el = document.getElementById('tb-mode');
      if (el) el.textContent = modeLabel(mode);
    });

    eventBus.on('project:applyJSON', (schema) => {
      const groups = (schema.g || schema.groups || []).map((g, gi) => ({
        title: g.t || g.title || `Group ${gi + 1}`,
        widget: g.w || g.widget || 'MultiPlot',
        datasets: (g.d || g.datasets || []).map((d, di) => ({
          title: d.t || d.title || `Dataset ${di + 1}`,
          index: di,
          units: d.u || d.units || '',
          min: d.min ?? 0,
          max: d.max ?? 100,
          gauge: d.g ?? false,
          bar: d.b ?? false,
          widget: d.w || 'Bar'
        }))
      }));

      const project = {
        title: schema.t || schema.title || 'Device Project',
        groups
      };

      this._applyProject(project, { mode: 'DeviceSendsJSON', toastMessage: t('messages.jsonApplied') });
    });

    eventBus.on('state:themeChanged', () => {
      applyTheme();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        eventBus.emit('ui:toggleSidebar');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        eventBus.emit('ui:openPreferences');
      }
    });
  }

  _showToast(type, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      warning: '#f59e0b'
    };

    const icons = {
      success: 'OK',
      error: 'ERR',
      info: 'INFO',
      warning: 'WARN'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      display:flex;align-items:center;gap:8px;
      padding:10px 14px;
      background:var(--glass-bg);
      border:1px solid ${colors[type]}40;
      border-left:3px solid ${colors[type]};
      border-radius:8px;
      color:var(--text-primary);
      font-size:13px;
      pointer-events:auto;
      box-shadow:0 4px 12px rgba(0,0,0,0.18);
      animation:fadeInUp 0.2s ease;
      backdrop-filter:blur(8px);
      max-width:320px;
    `;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

document.addEventListener('DOMContentLoaded', () => new App());
