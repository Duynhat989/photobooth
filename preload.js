const { contextBridge, ipcRenderer } = require('electron')
console.log("✅ preload.js loaded")

contextBridge.exposeInMainWorld('electronAPI', {
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  // Gen Video
  openProfile: (objectData) => ipcRenderer.invoke('open-app', objectData),
  notify: (callback) => ipcRenderer.on('profile-status', callback),
})

