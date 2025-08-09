import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFileSync, readFileSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

/**
 * Parse TChecker format output from uppaal-to-tchecker library to our JSON format
 * @param {string} tckContent - TChecker format content
 * @param {string} systemName - System name
 * @returns {object} - Model data in our JSON format
 */
function parseTCheckerToJson(tckContent, systemName) {
  const lines = tckContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'))
  
  const modelData = {
    systemName: systemName,
    clocks: [],
    intVars: [],
    events: [],
    processes: {},
    synchronizations: []
  }
  
  const processData = {}
  
  for (const line of lines) {
    if (line.startsWith('system:')) {
      // system:name
      modelData.systemName = line.split(':')[1]
    } else if (line.startsWith('event:')) {
      // event:name
      const eventName = line.split(':')[1]
      if (!modelData.events.includes(eventName)) {
        modelData.events.push(eventName)
      }
    } else if (line.startsWith('clock:')) {
      // clock:size:name
      const parts = line.split(':')
      modelData.clocks.push({
        name: parts[2],
        size: parseInt(parts[1]) || 1
      })
    } else if (line.startsWith('int:')) {
      // int:size:min:max:init:name
      const parts = line.split(':')
      modelData.intVars.push({
        name: parts[5],
        size: parseInt(parts[1]) || 1,
        min: parseInt(parts[2]) || 0,
        max: parseInt(parts[3]) || 1,
        initial: parseInt(parts[4]) || 0
      })
    } else if (line.startsWith('process:')) {
      // process:name
      const processName = line.split(':')[1]
      if (!processData[processName]) {
        processData[processName] = {
          locations: {},
          edges: []
        }
      }
    } else if (line.startsWith('location:')) {
      // location:process:name{attributes}
      const match = line.match(/location:([^:]+):([^{]+)(\{.*\})?/)
      if (match) {
        const processName = match[1]
        const locationName = match[2]
        const attributesStr = match[3] || ''
        
        if (!processData[processName]) {
          processData[processName] = { locations: {}, edges: [] }
        }
        
        const attributes = parseAttributes(attributesStr)
        processData[processName].locations[locationName] = {
          isInitial: attributes.initial || false,
          invariant: attributes.invariant || '',
          labels: attributes.labels || [],
          isCommitted: attributes.committed || false,
          isUrgent: attributes.urgent || false
        }
      }
    } else if (line.startsWith('edge:')) {
      // edge:process:source:target:event{attributes}
      const match = line.match(/edge:([^:]+):([^:]+):([^:]+):([^{]+)(\{.*\})?/)
      if (match) {
        const processName = match[1]
        const source = match[2]
        const target = match[3]
        const event = match[4]
        const attributesStr = match[5] || ''
        
        if (!processData[processName]) {
          processData[processName] = { locations: {}, edges: [] }
        }
        
        const attributes = parseAttributes(attributesStr)
        processData[processName].edges.push({
          source: source,
          target: target,
          event: event || '',
          guard: attributes.provided || '',
          action: attributes.do || ''
        })
      }
    }
  }
  
  modelData.processes = processData
  
  return modelData
}

/**
 * Parse TChecker attributes from string like {initial:,invariant:x<=5,do:x=0}
 * @param {string} attributesStr - Attributes string
 * @returns {object} - Parsed attributes object
 */
function parseAttributes(attributesStr) {
  const attributes = {}
  
  if (!attributesStr || !attributesStr.startsWith('{') || !attributesStr.endsWith('}')) {
    return attributes
  }
  
  const content = attributesStr.slice(1, -1) // Remove { and }
  if (!content.trim()) return attributes
  
  // Handle the updated format from uppaal-to-tchecker v1.1.0: provided:(guard):do:action
  if (content.includes('provided:(') && content.includes('):do:')) {
    const match = content.match(/provided:\(([^)]+)\):do:(.+)/)
    if (match) {
      attributes.provided = match[1].trim()
      attributes.do = match[2].trim()
      return attributes
    }
  }
  
  // Handle invariant format: invariant:(expression)
  if (content.includes('invariant:(') && content.includes(')')) {
    const match = content.match(/invariant:\(([^)]+)\)/)
    if (match) {
      attributes.invariant = match[1].trim()
    }
  }
  
  // Handle simple do: format
  if (content.startsWith('do:') && !content.includes(',') && !content.includes(':') || 
      content.match(/^do:[^:,]+$/)) {
    attributes.do = content.substring(3).trim()
    return attributes
  }
  
  // Split by commas, but be careful with nested expressions
  const parts = []
  let current = ''
  let depth = 0
  
  for (const char of content) {
    if (char === '(' || char === '[' || char === '{') depth++
    if (char === ')' || char === ']' || char === '}') depth--
    
    if (char === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) parts.push(current.trim())
  
  for (const part of parts) {
    const colonIndex = part.indexOf(':')
    if (colonIndex === -1) {
      // Flag attribute like 'initial'
      attributes[part.trim()] = true
    } else {
      const key = part.substring(0, colonIndex).trim()
      const value = part.substring(colonIndex + 1).trim()
      
      // Handle special cases
      if (key === 'invariant' && value.startsWith('(') && value.endsWith(')')) {
        attributes[key] = value.slice(1, -1) // Remove parentheses
      } else {
        attributes[key] = value || true
      }
    }
  }
  
  return attributes
}

/**
 * Convert TChecker model data to ReactFlow format expected by the frontend
 * @param {object} modelData - Model data from parseTCheckerToJson
 * @returns {object} - Model data in ReactFlow format
 */
function convertToReactFlowFormat(modelData) {
  const reactFlowData = {
    systemName: modelData.systemName,
    clocks: modelData.clocks,
    intVars: modelData.intVars,
    events: modelData.events,
    processes: {},
    synchronizations: modelData.synchronizations || []
  }
  
  // Convert processes to ReactFlow format
  for (const [processName, processInfo] of Object.entries(modelData.processes)) {
    const nodes = []
    const edges = []
    
    // Convert locations to nodes
    let nodeIndex = 0
    for (const [locationName, locationData] of Object.entries(processInfo.locations)) {
      const nodeId = `${processName}.${locationName}`
      nodes.push({
        id: nodeId,
        type: 'timedAutomatonNode',
        position: { x: 100 + (nodeIndex % 4) * 200, y: 100 + Math.floor(nodeIndex / 4) * 150 },
        data: {
          processName: processName,
          locationName: locationName,
          isInitial: locationData.isInitial,
          invariant: locationData.invariant,
          labels: locationData.labels,
          isCommitted: locationData.isCommitted,
          isUrgent: locationData.isUrgent
        }
      })
      nodeIndex++
    }
    
    // Convert edges to ReactFlow edges
    processInfo.edges.forEach((edgeData, edgeIndex) => {
      const edgeId = `edge_${processName}_${edgeIndex}`
      const sourceId = `${processName}.${edgeData.source}`
      const targetId = `${processName}.${edgeData.target}`
      
      edges.push({
        id: edgeId,
        source: sourceId,
        target: targetId,
        type: 'timedAutomatonEdge',
        data: {
          processName: processName,
          event: edgeData.event,
          guard: edgeData.guard,
          action: edgeData.action
        }
      })
    })
    
    reactFlowData.processes[processName] = {
      nodes: nodes,
      edges: edges
    }
  }
  
  return reactFlowData
}

// Global declaration enhancement functions are no longer needed
// as the updated uppaal-to-tchecker library handles this correctly

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

// IPC handler for saving model
ipcMain.handle('save-model', async (event, modelData) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Save Model',
      defaultPath: `${modelData.systemName || 'model'}.json`,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (canceled || !filePath) {
      return { success: false, error: 'Save canceled by user' }
    }

    const jsonData = JSON.stringify(modelData, null, 2)
    writeFileSync(filePath, jsonData, 'utf8')
    
    return { success: true, filePath }
  } catch (error) {
    console.error('Save model error:', error)
    return { success: false, error: error.message }
  }
})

// IPC handler for loading model
ipcMain.handle('load-model', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Load Model',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (canceled || filePaths.length === 0) {
      return { success: false, error: 'Load canceled by user' }
    }

    const filePath = filePaths[0]
    const jsonData = readFileSync(filePath, 'utf8')
    const modelData = JSON.parse(jsonData)
    
    return { success: true, filePath, modelData }
  } catch (error) {
    console.error('Load model error:', error)
    return { success: false, error: error.message }
  }
})

// IPC handler for importing Uppaal model
ipcMain.handle('import-uppaal-model', async () => {
  try {
    const { filePaths, canceled } = await dialog.showOpenDialog({
      title: 'Import Uppaal Model',
      filters: [
        { name: 'Uppaal Models', extensions: ['xta', 'xml'] },
        { name: 'Uppaal XTA Files', extensions: ['xta'] },
        { name: 'Uppaal XML Files', extensions: ['xml'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, error: 'Import canceled by user' }
    }

    const filePath = filePaths[0]
    const modelContent = readFileSync(filePath, 'utf-8')
    
    console.log('Importing Uppaal model using uppaal-to-tchecker library...')
    
    // Initialize the uppaal-to-tchecker converter
    const UppaalToTChecker = require('uppaal-to-tchecker')
    const translator = new UppaalToTChecker()
    
    // Determine format based on file extension
    const format = filePath.endsWith('.xta') ? 'xta' : 'xml'
    const systemName = require('path').basename(filePath, require('path').extname(filePath)).replace(/[^a-zA-Z0-9_]/g, '_')
    
    // Convert Uppaal model to TChecker format
    const translationResult = await translator.translate(modelContent, {
      format: format,
      language: format,
      systemName: systemName,
      verbose: 1
    })
    
    console.log('Translation result:', translationResult ? 'Success' : 'Failed')
    
    if (!translationResult) {
      throw new Error('Translation failed - no result returned from uppaal-to-tchecker')
    }
    
    // The updated uppaal-to-tchecker library now handles global declarations correctly
    console.log('TChecker output from uppaal-to-tchecker:')
    console.log(translationResult)
    
    // Parse the TChecker output to extract model data  
    const modelData = parseTCheckerToJson(translationResult, systemName)
    
    // Note: Keep the intermediate format, frontend will convert to ReactFlow format
    
    console.log('Uppaal model converted successfully using uppaal-to-tchecker')
    return { 
      success: true, 
      filePath, 
      modelData: modelData,
      tckOutput: translationResult
    }
    
  } catch (error) {
    console.error('Import Uppaal model error:', error)
    return { success: false, error: error.message }
  }
})

console.log('save-model, load-model, and import-uppaal-model handlers registered')

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
  console.log('save-model handler registered:', ipcMain.listenerCount('save-model') > 0)
  console.log('load-model handler registered:', ipcMain.listenerCount('load-model') > 0)

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
