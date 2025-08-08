import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 立即注册IPC处理器
console.log('=== Registering IPC Handlers ===')

// IPC handler for property verification
ipcMain.handle('verify-property', async (event, verificationRequest) => {
  try {
    console.log('=== Received verify property request ===')
    console.log('Request:', JSON.stringify(verificationRequest, null, 2))
    
    const appPath = app.getAppPath()
    const verificationManagerPath = join(appPath, 'src/main/utils/verification-manager.js')
    console.log('Loading from path:', verificationManagerPath)
    
    const { verifyProperty } = require(verificationManagerPath)
    
    const result = await verifyProperty(verificationRequest)
    console.log('Verification completed, result:', result)
    return result
  } catch (error) {
    console.error('Verify property error:', error)
    console.error('Error stack:', error.stack)
    return {
      success: false,
      error: error.message
    }
  }
})

console.log('verify-property handler registered')

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for running simulation

  // IPC handler for initializing simulator
  ipcMain.handle('initialize-simulator', async (event, modelData) => {
    try {
      console.log('Received initialize simulator request:', modelData)
      const appPath = app.getAppPath()
      const simulationManagerPath = join(appPath, 'src/main/utils/simulation-manager.js')
      const { initializeSimulator } = require(simulationManagerPath)
      const result = await initializeSimulator(modelData)
      return result
    } catch (error) {
      console.error('Initialize simulator error:', error)
      throw error
    }
  })

  // IPC handler for executing transition
  ipcMain.handle('execute-transition', async (event, modelData, transitionId, currentState) => {
    try {
      console.log('Received execute transition request:', { transitionId, currentState })
      const appPath = app.getAppPath()
      const simulationManagerPath = join(appPath, 'src/main/utils/simulation-manager.js')
      const { executeTransition } = require(simulationManagerPath)
      const result = await executeTransition(modelData, transitionId, currentState)
      return result
    } catch (error) {
      console.error('Execute transition error:', error)
      throw error
    }
  })

  // IPC handler for resetting simulator
  ipcMain.handle('reset-simulator', async (event, modelData) => {
    try {
      console.log('Received reset simulator request:', modelData)
      const appPath = app.getAppPath()
      const simulationManagerPath = join(appPath, 'src/main/utils/simulation-manager.js')
      const { resetSimulator } = require(simulationManagerPath)
      const result = await resetSimulator(modelData)
      return result
    } catch (error) {
      console.error('Reset simulator error:', error)
      throw error
    }
  })

  // 验证所有IPC处理器都已注册
  console.log('=== IPC Handlers Registered in whenReady ===')
  console.log('verify-property handler registered:', ipcMain.listenerCount('verify-property') > 0)
  console.log('initialize-simulator handler registered:', ipcMain.listenerCount('initialize-simulator') > 0)

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
