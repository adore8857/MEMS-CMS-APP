const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld('memsCmsDesktop', {
  platform: process.platform,
  versions: {
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    node: process.versions.node
  },
  mqtt: {
    connect: (options) => ipcRenderer.invoke('mqtt-tcp:connect', options),
    publish: (options) => ipcRenderer.invoke('mqtt-tcp:publish', options),
    disconnect: (sessionId) => ipcRenderer.invoke('mqtt-tcp:disconnect', sessionId),
    onData: (callback) => subscribe('mqtt-tcp:data', callback),
    onError: (callback) => subscribe('mqtt-tcp:error', callback),
    onClose: (callback) => subscribe('mqtt-tcp:close', callback)
  }
});
