const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendDoubleClick: () => ipcRenderer.send('double-click'),
    sendPassword: (password) => ipcRenderer.send('check-password', password),
    closePasswordWindow: () => ipcRenderer.send('close-password-window')
});