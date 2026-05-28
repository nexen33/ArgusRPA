import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('argusBridge', {
  sendElementSelected: (data: any) => ipcRenderer.send('element-selected', data)
})
