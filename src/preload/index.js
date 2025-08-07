import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  runSimulation: (modelData) => {
    console.log('preload: runSimulation called with:', modelData)
    return ipcRenderer.invoke('run-simulation', modelData)
  }
}

console.log('preload: api object created:', api)
console.log('preload: process.contextIsolated:', process.contextIsolated)

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    console.log('preload: APIs exposed via contextBridge')
  } catch (error) {
    console.error('preload: contextBridge error:', error)
  }
} else {
  window.electron = electronAPI
  window.api = api
  console.log('preload: APIs exposed via window')
}
