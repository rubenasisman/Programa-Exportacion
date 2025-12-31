const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  connectDB: (config) => ipcRenderer.invoke('db-connect', config),
  executeSQL: (query) => ipcRenderer.invoke('db-execute', query),
  log: (msg) => console.log(msg)
});