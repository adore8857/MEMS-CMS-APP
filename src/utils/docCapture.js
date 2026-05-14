import { eventBus } from '../core/EventBus.js';
import { appState, BusType } from '../core/AppState.js';
import { applyTheme } from '../core/i18n.js?v=csv-autosave-20260424-1';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emitSampleConsoleTraffic() {
  const encoder = new TextEncoder();
  const frames = [
    { data: encoder.encode('AT+PING\r\n'), direction: 'tx', timestamp: Date.now() - 1400 },
    { data: encoder.encode('OK\r\n'), direction: 'rx', timestamp: Date.now() - 1200 },
    { data: encoder.encode('temp=24.8,humidity=56.1,pressure=1012.6\r\n'), direction: 'rx', timestamp: Date.now() - 900 },
    { data: encoder.encode('topic:sensor/bearing frame-size=5728\r\n'), direction: 'rx', timestamp: Date.now() - 600 }
  ];

  frames.forEach((frame) => eventBus.emit('console:data', frame));
}

function emitSampleProjectFrame() {
  const accelBuffer = Array.from({ length: 72 }, (_, index) => {
    const phase = index / 6;
    return Number((Math.sin(phase) * 0.35 + Math.cos(phase * 0.45) * 0.08).toFixed(4));
  });
  const strain1 = Array.from({ length: 48 }, (_, index) => Number((Math.sin(index / 7) * 0.18).toFixed(4)));
  const strain2 = Array.from({ length: 48 }, (_, index) => Number((Math.cos(index / 8) * 0.13).toFixed(4)));
  const strain3 = Array.from({ length: 48 }, (_, index) => Number((Math.sin(index / 9 + 0.8) * 0.16).toFixed(4)));

  eventBus.emit('frame:received', {
    title: 'STM32 Bearing Data',
    datasets: [
      { title: 'Accel Z', value: accelBuffer[accelBuffer.length - 1], index: 0, units: 'g', buffer: accelBuffer },
      { title: 'Strain 1', value: strain1[strain1.length - 1], index: 1, units: 'V', buffer: strain1 },
      { title: 'Strain 2', value: strain2[strain2.length - 1], index: 2, units: 'V', buffer: strain2 },
      { title: 'Strain 3', value: strain3[strain3.length - 1], index: 3, units: 'V', buffer: strain3 },
      { title: 'ADC Temp', value: 1.284, index: 4, units: 'V' },
      { title: 'TMP117', value: 27.6, index: 5, units: '°C' }
    ],
    raw: 'Doc capture sample frame',
    timestamp: Date.now()
  });
}

async function loadProjectFromRepo() {
  const response = await fetch('./projects/stm32-bearing.json');
  if (!response.ok) {
    throw new Error(`Failed to load project file: ${response.status}`);
  }

  const jsonText = await response.text();
  eventBus.emit('project:load', jsonText);
}

function normalizeForCapture() {
  appState.locale = 'zh-CN';
  appState.theme = 'light';
  appState.sidebarVisible = true;
  applyTheme('light');

  document.documentElement.dataset.docCapture = 'true';
  const toastContainer = document.getElementById('toast-container');
  if (toastContainer) toastContainer.style.display = 'none';
}

export async function runDocCaptureScenario() {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get('capture');
  if (!scenario) return;

  normalizeForCapture();
  await wait(180);

  if (scenario === 'main-dashboard') {
    document.documentElement.dataset.captureReady = 'true';
    return;
  }

  if (scenario === 'project-editor') {
    await loadProjectFromRepo();
    await wait(280);
    eventBus.emit('ui:openEditor');
    await wait(200);
    document.documentElement.dataset.captureReady = 'true';
    return;
  }

  if (scenario === 'preferences') {
    eventBus.emit('ui:openPreferences');
    await wait(180);
    document.documentElement.dataset.captureReady = 'true';
    return;
  }

  if (scenario === 'mqtt-config') {
    appState.busType = BusType.MQTT;
    await wait(180);
    document.documentElement.dataset.captureReady = 'true';
    return;
  }

  if (scenario === 'console') {
    eventBus.emit('ui:switchWorkspace', 'console');
    await wait(120);
    emitSampleConsoleTraffic();
    await wait(160);
    document.documentElement.dataset.captureReady = 'true';
    return;
  }

  if (scenario === 'project-dashboard') {
    await loadProjectFromRepo();
    await wait(260);
    emitSampleProjectFrame();
    await wait(240);
    document.documentElement.dataset.captureReady = 'true';
  }
}
