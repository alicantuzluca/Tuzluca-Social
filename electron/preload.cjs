const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  getLoginSettings: () => ipcRenderer.invoke('get-login-settings'),
  setLoginSettings: (enabled) => ipcRenderer.send('set-login-settings', enabled),
  savePhoto: (base64Data) => ipcRenderer.invoke('save-photo', base64Data),
  readPhotos: () => ipcRenderer.invoke('read-photos'),
  deletePhoto: (path) => ipcRenderer.invoke('delete-photo', path),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  copyToClipboard: (text) => ipcRenderer.send('copy-to-clipboard', text)
});
