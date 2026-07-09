const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('serialPicker', {
  choose: (portId) => ipcRenderer.send('serial-picker:choose', portId),
  cancel: () => ipcRenderer.send('serial-picker:cancel')
});
