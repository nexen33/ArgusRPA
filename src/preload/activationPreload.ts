import { contextBridge, ipcRenderer } from 'electron';

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('activationAPI', {
      getMachineId: () => ipcRenderer.invoke('get-machine-id'),
      activateLicense: (code: string) => ipcRenderer.invoke('activate-license', code),
      quitApp: () => ipcRenderer.send('quit-app'),
      launchApp: () => ipcRenderer.send('launch-main-app'),
      getTheme: () => ipcRenderer.invoke('get-theme')
    });
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in d.ts)
  window.activationAPI = {
    getMachineId: () => ipcRenderer.invoke('get-machine-id'),
    activateLicense: (code: string) => ipcRenderer.invoke('activate-license', code),
    quitApp: () => ipcRenderer.send('quit-app'),
    launchApp: () => ipcRenderer.send('launch-main-app'),
    getTheme: () => ipcRenderer.invoke('get-theme')
  };
}
