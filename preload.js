const { contextBridge, ipcRenderer } = require('electron')
console.log("✅ preload.js loaded")

contextBridge.exposeInMainWorld('electronAPI', {
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  // Gen Video
  printPage: () => ipcRenderer.invoke('print-page'),
  printHTML: (html) => ipcRenderer.invoke('print-html', html),
  notify: (callback) => ipcRenderer.on('profile-status', callback),
})

