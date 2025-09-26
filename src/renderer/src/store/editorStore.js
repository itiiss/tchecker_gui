import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

const COLUMN_COUNT = 3
const COLUMN_WIDTH = 620
const ROW_HEIGHT = 240

const layoutLocationsForProcess = (processIndex, locationNames) => {
  const row = Math.floor((processIndex - 1) / COLUMN_COUNT)
  const col = (processIndex - 1) % COLUMN_COUNT
  const centerX = 300 + col * COLUMN_WIDTH
  const centerY = 160 + row * ROW_HEIGHT
  const count = locationNames.length || 1
  const radius = Math.max(140, Math.min(220, 100 + count * 20))

  return locationNames.map((_, idx) => {
    if (count === 1) {
      return { x: centerX, y: centerY }
    }
    const angle = (2 * Math.PI * idx) / count - Math.PI / 2
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    }
  })
}

const normalizeEvents = (events = []) =>
  events
    .map((event) => (typeof event === 'string' ? { name: event } : event))
    .filter((event) => event?.name)

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const convertBackendModelToEditorModel = (backendModel) => {
  if (!backendModel || typeof backendModel !== 'object') {
    return backendModel
  }

  const firstProcess = backendModel.processes
    ? Object.values(backendModel.processes)[0]
    : null

  if (firstProcess && Array.isArray(firstProcess.nodes) && Array.isArray(firstProcess.edges)) {
    return {
      systemName: backendModel.systemName || 'Untitled System',
      clocks: (backendModel.clocks || []).map((clock) =>
        typeof clock === 'string' ? { name: clock, size: 1 } : clock
      ),
      intVars: backendModel.intVars || [],
      events: normalizeEvents(backendModel.events),
      synchronizations: backendModel.synchronizations || [],
      processes: backendModel.processes || {}
    }
  }

  const processes = {}
  const processNames = Object.keys(backendModel.processes || {})

  processNames.forEach((procName, index) => {
    const processBackend = backendModel.processes[procName] || {}
    const locationEntries = Object.entries(processBackend.locations || {})
    const locationNames = locationEntries.map(([name]) => name)
    const positions = layoutLocationsForProcess(index + 1, locationNames)

    const nodes = locationEntries.map(([locationName, locationData], locIdx) => {
      const position = positions[locIdx] || { x: 200 + locIdx * 160, y: 160 + index * 180 }
      return {
        id: `${procName}.${locationName}`,
        type: 'timedAutomatonNode',
        position,
        data: {
          processName: procName,
          locationName,
          isInitial: !!locationData.isInitial,
          invariant: locationData.invariant || '',
          labels: Array.isArray(locationData.labels) ? locationData.labels : [],
          isCommitted: !!locationData.isCommitted,
          isUrgent: !!locationData.isUrgent
        }
      }
    })

    const edges = (processBackend.edges || []).map((edge, edgeIdx) => ({
      id: edge.id || `e_${procName}_${edgeIdx + 1}`,
      source: `${procName}.${edge.source}`,
      target: `${procName}.${edge.target}`,
      type: 'timedAutomatonEdge',
      data: {
        processName: procName,
        event: edge.event || 'tau',
        guard: edge.guard || '',
        action: edge.action || ''
      }
    }))

    processes[procName] = { nodes, edges }
  })

  return {
    systemName: backendModel.systemName || 'Untitled System',
    clocks: (backendModel.clocks || []).map((clock) => {
      if (typeof clock === 'string') {
        return { name: clock, size: 1 }
      }
      return { name: clock.name, size: toNumber(clock.size, 1) }
    }),
    intVars: (backendModel.intVars || []).map((intVar) => ({
      name: intVar.name,
      size: toNumber(intVar.size, 1),
      min: toNumber(intVar.min, 0),
      max: toNumber(intVar.max, 0),
      initial: toNumber(intVar.initial, 0)
    })),
    events: normalizeEvents(backendModel.events),
    synchronizations: backendModel.synchronizations || [],
    processes
  }
}

const defaultBackendModel = {
  systemName: 'fischer_async_3_10',
  clocks: [
    { name: 'x1', size: 1 },
    { name: 'x2', size: 1 },
    { name: 'x3', size: 1 }
  ],
  intVars: [{ name: 'id', size: 1, min: 0, max: 3, initial: 0 }],
  events: [
    'id_is_0',
    'id_to_0',
    'id_is_1',
    'id_to_1',
    'id_is_2',
    'id_to_2',
    'id_is_3',
    'id_to_3',
    'tau'
  ],
  synchronizations: [
    { constraints: ['P1@id_is_0', 'ID@id_is_0'] },
    { constraints: ['P1@id_to_0', 'ID@id_to_0'] },
    { constraints: ['P1@id_is_1', 'ID@id_is_1'] },
    { constraints: ['P1@id_to_1', 'ID@id_to_1'] },
    { constraints: ['P2@id_is_0', 'ID@id_is_0'] },
    { constraints: ['P2@id_to_0', 'ID@id_to_0'] },
    { constraints: ['P2@id_is_2', 'ID@id_is_2'] },
    { constraints: ['P2@id_to_2', 'ID@id_to_2'] },
    { constraints: ['P3@id_is_0', 'ID@id_is_0'] },
    { constraints: ['P3@id_to_0', 'ID@id_to_0'] },
    { constraints: ['P3@id_is_3', 'ID@id_is_3'] },
    { constraints: ['P3@id_to_3', 'ID@id_to_3'] }
  ],
  processes: {
    P1: {
      locations: {
        A: { isInitial: true, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        req: {
          isInitial: false,
          invariant: 'x1<=10',
          labels: [],
          isCommitted: false,
          isUrgent: false
        },
        wait: { isInitial: false, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        cs: {
          isInitial: false,
          invariant: '',
          labels: ['cs1'],
          isCommitted: false,
          isUrgent: false
        }
      },
      edges: [
        { source: 'A', target: 'req', event: 'id_is_0', guard: '', action: 'x1=0' },
        { source: 'req', target: 'wait', event: 'id_to_1', guard: 'x1<=10', action: 'x1=0' },
        { source: 'wait', target: 'req', event: 'id_is_0', guard: '', action: 'x1=0' },
        { source: 'wait', target: 'cs', event: 'id_is_1', guard: 'x1>10', action: '' },
        { source: 'cs', target: 'A', event: 'id_to_0', guard: '', action: '' }
      ]
    },
    P2: {
      locations: {
        A: { isInitial: true, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        req: {
          isInitial: false,
          invariant: 'x2<=10',
          labels: [],
          isCommitted: false,
          isUrgent: false
        },
        wait: { isInitial: false, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        cs: {
          isInitial: false,
          invariant: '',
          labels: ['cs2'],
          isCommitted: false,
          isUrgent: false
        }
      },
      edges: [
        { source: 'A', target: 'req', event: 'id_is_0', guard: '', action: 'x2=0' },
        { source: 'req', target: 'wait', event: 'id_to_2', guard: 'x2<=10', action: 'x2=0' },
        { source: 'wait', target: 'req', event: 'id_is_0', guard: '', action: 'x2=0' },
        { source: 'wait', target: 'cs', event: 'id_is_2', guard: 'x2>10', action: '' },
        { source: 'cs', target: 'A', event: 'id_to_0', guard: '', action: '' }
      ]
    },
    P3: {
      locations: {
        A: { isInitial: true, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        req: {
          isInitial: false,
          invariant: 'x3<=10',
          labels: [],
          isCommitted: false,
          isUrgent: false
        },
        wait: { isInitial: false, invariant: '', labels: [], isCommitted: false, isUrgent: false },
        cs: {
          isInitial: false,
          invariant: '',
          labels: ['cs3'],
          isCommitted: false,
          isUrgent: false
        }
      },
      edges: [
        { source: 'A', target: 'req', event: 'id_is_0', guard: '', action: 'x3=0' },
        { source: 'req', target: 'wait', event: 'id_to_3', guard: 'x3<=10', action: 'x3=0' },
        { source: 'wait', target: 'req', event: 'id_is_0', guard: '', action: 'x3=0' },
        { source: 'wait', target: 'cs', event: 'id_is_3', guard: 'x3>10', action: '' },
        { source: 'cs', target: 'A', event: 'id_to_0', guard: '', action: '' }
      ]
    },
    ID: {
      locations: {
        l: { isInitial: true, invariant: '', labels: [], isCommitted: false, isUrgent: false }
      },
      edges: [
        { source: 'l', target: 'l', event: 'id_is_0', guard: 'id==0', action: '' },
        { source: 'l', target: 'l', event: 'id_to_0', guard: '', action: 'id=0' },
        { source: 'l', target: 'l', event: 'id_is_1', guard: 'id==1', action: '' },
        { source: 'l', target: 'l', event: 'id_to_1', guard: '', action: 'id=1' },
        { source: 'l', target: 'l', event: 'id_is_2', guard: 'id==2', action: '' },
        { source: 'l', target: 'l', event: 'id_to_2', guard: '', action: 'id=2' },
        { source: 'l', target: 'l', event: 'id_is_3', guard: 'id==3', action: '' },
        { source: 'l', target: 'l', event: 'id_to_3', guard: '', action: 'id=3' }
      ]
    }
  }
}

const defaultModel = convertBackendModelToEditorModel(defaultBackendModel)

const useEditorStore = create((set, get) => ({
  systemName: defaultModel.systemName,
  clocks: defaultModel.clocks,
  intVars: defaultModel.intVars,
  events: defaultModel.events,
  synchronizations: defaultModel.synchronizations,
  processes: defaultModel.processes,
  activeProcess: Object.keys(defaultModel.processes)[0] || null,
  mode: 'select',
  simulationResult: null,
  simulationLoading: false,
  simulationError: null,

  // Simulator state
  simulatorInitialized: false,
  currentState: null, // Current state of all processes
  enabledTransitions: [], // Available transitions from current state
  simulationTrace: [], // History of states and transitions
  tracePosition: 0, // Current position in trace
  clockValues: {}, // Current clock valuations
  currentZoneMatrix: null,

  setSystemName: (name) => set({ systemName: name }),
  setClocks: (clocks) => set({ clocks }),
  setIntVars: (intVars) => set({ intVars }),
  setEvents: (events) => set({ events }),
  setSynchronizations: (synchronizations) => set({ synchronizations }),

  setActiveProcess: (processName) => set({ activeProcess: processName }),

  addProcess: (processName) => {
    set((state) => ({
      processes: {
        ...state.processes,
        [processName]: {
          nodes: [],
          edges: []
        }
      }
    }))
  },

  renameProcess: (oldName, newName) => {
    set((state) => {
      const { [oldName]: processToRename, ...otherProcesses } = state.processes
      return {
        processes: {
          ...otherProcesses,
          [newName]: processToRename
        },
        activeProcess: state.activeProcess === oldName ? newName : state.activeProcess
      }
    })
  },

  copyProcess: (processName) => {
    const state = get()
    const processToCopy = state.processes[processName]
    if (!processToCopy) return null

    // Generate incremental name
    let copyCounter = 1
    let newProcessName = `${processName}_${copyCounter}`
    while (state.processes[newProcessName]) {
      copyCounter++
      newProcessName = `${processName}_${copyCounter}`
    }

    // Deep copy the process data and update IDs
    const copiedNodes = processToCopy.nodes.map((node) => ({
      ...node,
      id: node.id.replace(processName, newProcessName),
      data: {
        ...node.data,
        processName: newProcessName
      }
    }))

    const copiedEdges = processToCopy.edges.map((edge) => ({
      ...edge,
      id: edge.id.replace(processName, newProcessName),
      source: edge.source.replace(processName, newProcessName),
      target: edge.target.replace(processName, newProcessName),
      data: {
        ...edge.data,
        processName: newProcessName
      }
    }))

    set((state) => ({
      processes: {
        ...state.processes,
        [newProcessName]: {
          nodes: copiedNodes,
          edges: copiedEdges
        }
      }
    }))

    return newProcessName
  },

  updateNodeData: (nodeId, dataUpdate) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          nodes: state.processes[activeProcess].nodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
          )
        }
      }
    }))
  },

  updateEdgeData: (edgeId, dataUpdate) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          edges: state.processes[activeProcess].edges.map((edge) =>
            edge.id === edgeId ? { ...edge, data: { ...edge.data, ...dataUpdate } } : edge
          )
        }
      }
    }))
  },

  setNodes: (updater) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          nodes:
            typeof updater === 'function' ? updater(state.processes[activeProcess].nodes) : updater
        }
      }
    }))
  },

  setEdges: (updater) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          edges:
            typeof updater === 'function' ? updater(state.processes[activeProcess].edges) : updater
        }
      }
    }))
  },

  setMode: (newMode) => set({ mode: newMode }),

  onNodesChange: (changes) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          nodes: applyNodeChanges(changes, state.processes[activeProcess].nodes)
        }
      }
    }))
  },

  onEdgesChange: (changes) => {
    const activeProcess = get().activeProcess
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          edges: applyEdgeChanges(changes, state.processes[activeProcess].edges)
        }
      }
    }))
  },

  setSimulationResult: (result) => set({ simulationResult: result }),
  setSimulationLoading: (loading) => set({ simulationLoading: loading }),
  setSimulationError: (error) => set({ simulationError: error }),

  // Simulator control functions
  initializeSimulator: async () => {
    console.log('=== Starting simulator initialization ===')
    set({ simulationLoading: true, simulationError: null })

    try {
      // Convert ReactFlow format to TCK generator format
      const modelData = get().convertModelDataForBackend()
      console.log('Converted model data:', JSON.stringify(modelData, null, 2))

      // Call backend to initialize simulator
      const { ipcRenderer } = window.require('electron')
      console.log('Calling backend initialize-simulator...')
      const result = await ipcRenderer.invoke('initialize-simulator', modelData)
      console.log('Backend result:', JSON.stringify(result, null, 2))

      if (result.success) {
        // Parse the result from tck-simulate
        const initialStateData = result.initialState
        const availableTransitions = result.availableTransitions
        const initialZoneMatrix = initialStateData?.zoneMatrix || null

        console.log('Initial state data from backend:', initialStateData)
        console.log('Available transitions from backend:', availableTransitions)

        // Convert backend state format to frontend format
        const currentState = get().parseBackendState(initialStateData)
        const enabledTransitions = get().parseBackendTransitions(availableTransitions)

        console.log('Parsed current state:', currentState)
        console.log('Parsed enabled transitions:', enabledTransitions)

        set({
          simulatorInitialized: true,
          currentState,
          currentZoneMatrix: initialZoneMatrix,
          enabledTransitions,
          simulationTrace: [
            {
              state: currentState,
              transition: null,
              backendState: initialStateData,
              zoneMatrix: initialZoneMatrix,
              enabledTransitions: enabledTransitions // 缓存来自tck-simulate的转换
            }
          ],
          tracePosition: 0,
          simulationLoading: false
        })

        console.log('Simulator initialized successfully!')
      } else {
        console.error('Backend returned error:', result.error)
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Initialize simulator error:', error)
      set({
        simulationError: error.message,
        simulationLoading: false,
        simulatorInitialized: false,
        currentZoneMatrix: null
      })
    }
  },

  // calculateEnabledTransitions已移除 - 所有转换计算都依赖tck-simulate的结果

  executeTransition: async (transitionId) => {
    const state = get()
    const transition = state.enabledTransitions.find((t) => t.id === transitionId)

    if (!transition) {
      console.warn('No transition found with id:', transitionId)
      return
    }

    // 在执行过程中清空可用转换，防止重复点击
    set({
      simulationLoading: true,
      simulationError: null,
      enabledTransitions: [] // 立即清空，防止重复执行
    })

    try {
      // Get model data and current state for backend
      const modelData = get().convertModelDataForBackend()
      const currentBackendState = state.simulationTrace[state.tracePosition]?.backendState

      console.log(
        'Executing transition:',
        transitionId,
        'from state:',
        currentBackendState?.attributes?.vloc
      )

      // Call backend to execute transition
      const { ipcRenderer } = window.require('electron')
      const transitionDescriptor = {
        id: transition.id,
        vedge: transition.vedge,
        sourceLocation: transition.sourceLocation,
        targetLocation: transition.targetLocation,
        sourceVloc: transition.sourceVloc,
        targetVloc: transition.targetVloc,
        edgeData: transition.edgeData
      }

      const result = await ipcRenderer.invoke(
        'execute-transition',
        modelData,
        transitionDescriptor,
        currentBackendState
      )

      if (result.success) {
        // Parse the new state and transitions
        const newState = get().parseBackendState(result.newState)
        const newEnabledTransitions = get().parseBackendTransitions(result.availableTransitions)
        const zoneMatrix = result.newState?.zoneMatrix || null

        console.log(
          'Transition executed successfully. New state:',
          result.newState?.attributes?.vloc
        )
        console.log('New available transitions count:', newEnabledTransitions.length)

        // Add to trace
        const newTraceEntry = {
          state: newState,
          transition: transition,
          backendState: result.newState,
          zoneMatrix,
          enabledTransitions: newEnabledTransitions // 缓存来自tck-simulate的转换
        }

        const newTrace = [...state.simulationTrace.slice(0, state.tracePosition + 1), newTraceEntry]

        set({
          currentState: newState,
          currentZoneMatrix: zoneMatrix,
          enabledTransitions: newEnabledTransitions,
          simulationTrace: newTrace,
          tracePosition: newTrace.length - 1,
          simulationLoading: false
        })
      } else {
        console.error('Backend returned error:', result.error)
        // 如果执行失败，恢复原来的转换列表
        set({
          simulationError: result.error,
          simulationLoading: false,
          enabledTransitions: state.enabledTransitions,
          currentZoneMatrix: state.currentZoneMatrix // 恢复原来的转换
        })
      }
    } catch (error) {
      console.error('Execute transition error:', error)
      // 如果出错，恢复原来的转换列表
      set({
        simulationError: error.message,
        simulationLoading: false,
        enabledTransitions: state.enabledTransitions,
        currentZoneMatrix: state.currentZoneMatrix // 恢复原来的转换
      })
    }
  },

  resetSimulation: async () => {
    await get().initializeSimulator()
  },

  stepBackward: () => {
    const state = get()
    if (state.tracePosition > 0) {
      const newPosition = state.tracePosition - 1
      const traceEntry = state.simulationTrace[newPosition]

      console.log('Step backward to position:', newPosition)
      console.log('Trace entry at position:', traceEntry)
      console.log('Available transitions at position:', traceEntry.enabledTransitions?.length || 0)

      // 使用缓存的转换（来自tck-simulate的结果），不进行前端计算
      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        currentZoneMatrix: traceEntry.zoneMatrix ?? state.currentZoneMatrix ?? null,
        enabledTransitions: traceEntry.enabledTransitions || [], // 使用缓存的转换
        tracePosition: newPosition
      })
    }
  },

  stepForward: () => {
    const state = get()
    if (state.tracePosition < state.simulationTrace.length - 1) {
      const newPosition = state.tracePosition + 1
      const traceEntry = state.simulationTrace[newPosition]

      console.log('Step forward to position:', newPosition)
      console.log('Trace entry at position:', traceEntry)
      console.log('Available transitions at position:', traceEntry.enabledTransitions?.length || 0)

      // 使用缓存的转换（来自tck-simulate的结果），不进行前端计算
      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        currentZoneMatrix: traceEntry.zoneMatrix ?? state.currentZoneMatrix ?? null,
        enabledTransitions: traceEntry.enabledTransitions || [], // 使用缓存的转换
        tracePosition: newPosition
      })
    }
  },

  randomStep: async () => {
    const state = get()
    if (state.enabledTransitions.length > 0) {
      const randomTransition =
        state.enabledTransitions[Math.floor(Math.random() * state.enabledTransitions.length)]
      await get().executeTransition(randomTransition.id)
    }
  },

  jumpToTracePosition: (position) => {
    const state = get()
    if (position >= 0 && position < state.simulationTrace.length) {
      const traceEntry = state.simulationTrace[position]

      // 使用缓存的转换（来自tck-simulate的结果），不进行前端计算
      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        currentZoneMatrix: traceEntry.zoneMatrix ?? state.currentZoneMatrix ?? null,
        enabledTransitions: traceEntry.enabledTransitions || [], // 使用缓存的转换
        tracePosition: position
      })
    }
  },

  saveTrace: () => {
    const state = get()
    const traceData = {
      trace: state.simulationTrace,
      modelInfo: {
        systemName: state.systemName,
        processes: Object.keys(state.processes)
      },
      timestamp: new Date().toISOString()
    }

    // Download as JSON file
    const dataStr = JSON.stringify(traceData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = `${state.systemName}_trace_${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  },

  loadTrace: () => {
    // TODO: Implement trace loading from file
    console.log('Load trace functionality to be implemented')
  },

  // Model save/load functionality
  saveModel: async () => {
    const state = get()
    const modelData = state.convertModelDataForBackend()

    try {
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('save-model', modelData)
      if (result.success) {
        console.log('Model saved successfully:', result.filePath)
        return { success: true, filePath: result.filePath }
      } else {
        console.error('Failed to save model:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Save model error:', error)
      return { success: false, error: error.message }
    }
  },

  loadModel: async () => {
    try {
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('load-model')

      if (result.success && result.modelData) {
        const modelData = convertBackendModelToEditorModel(result.modelData)
        set({
          systemName: modelData.systemName || 'Untitled System',
          clocks: modelData.clocks || [],
          intVars: modelData.intVars || [],
          events: modelData.events || [],
          synchronizations: modelData.synchronizations || [],
          processes: modelData.processes || {},
          activeProcess: Object.keys(modelData.processes || {})[0] || null,
          // Reset simulation state when loading new model
          simulatorInitialized: false,
          currentState: null,
          enabledTransitions: [],
          simulationTrace: [],
          tracePosition: 0,
          simulationResult: null,
          simulationError: null
        })
        console.log('Model loaded successfully:', result.filePath)
        return { success: true, filePath: result.filePath }
      } else {
        console.error('Failed to load model:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Load model error:', error)
      return { success: false, error: error.message }
    }
  },

  // Preview functionality
  generateTckPreview: async () => {
    try {
      const state = get()
      const modelData = state.convertModelDataForBackend()

      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('generate-tck-preview', modelData)

      if (result.success) {
        return { success: true, tckContent: result.tckContent, syntaxResult: result.syntaxResult }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Generate TCK preview error:', error)
      return { success: false, error: error.message }
    }
  },

  // Helper functions for backend integration
  convertModelDataForBackend: () => {
    const state = get()
    // Reuse the existing conversion logic from runSimulation
    const convertedProcesses = {}
    const allEvents = new Set()

    for (const [procName, procData] of Object.entries(state.processes)) {
      const locations = {}
      const edges = []

      // Convert nodes array to locations object
      if (procData.nodes) {
        procData.nodes.forEach((node) => {
          const locationName = node.data.locationName || node.id.split('.').pop()
          locations[locationName] = {
            isInitial: node.data.isInitial || false,
            invariant: node.data.invariant || '',
            labels: node.data.labels || [],
            isCommitted: node.data.isCommitted || false,
            isUrgent: node.data.isUrgent || false
          }
        })
      }

      // Convert edges array and collect events
      if (procData.edges) {
        procData.edges.forEach((edge) => {
          const sourceLocation = edge.source.split('.').pop()
          const targetLocation = edge.target.split('.').pop()
          const rawEvent = typeof edge.data.event === 'string' ? edge.data.event.trim() : ''
          const eventName = rawEvent || 'tau'

          // Collect the normalized event name so declarations stay in sync with edges
          if (eventName) {
            allEvents.add(eventName)
          }

          edges.push({
            source: sourceLocation,
            target: targetLocation,
            event: eventName,
            guard: edge.data.guard || '',
            action: edge.data.action || ''
          })
        })
      }

      convertedProcesses[procName] = {
        locations,
        edges
      }
    }

    // Combine manually defined events with auto-discovered events
    const combinedEvents = [
      ...new Set([...state.events.map((e) => e.name || e).filter(Boolean), ...allEvents])
    ]

    return {
      systemName: state.systemName,
      clocks: state.clocks,
      intVars: state.intVars,
      events: combinedEvents,
      synchronizations: state.synchronizations,
      processes: convertedProcesses
    }
  },

  parseBackendState: (backendState) => {
    // Parse the backend state format to extract process locations
    console.log('Parsing backend state:', backendState)

    if (!backendState) return {}

    const currentState = {}

    // tck-simulate DOT格式：attributes.vloc="<location1,location2,location3>"
    if (backendState.attributes && backendState.attributes.vloc) {
      const vloc = backendState.attributes.vloc
      const cleanVloc = vloc.replace(/[<>]/g, '')
      const locations = cleanVloc.split(',')
      const state = get()
      const processNames = Object.keys(state.processes)

      locations.forEach((location, index) => {
        if (index < processNames.length && location.trim()) {
          currentState[processNames[index]] = location.trim()
        }
      })
    }
    // 如果直接是字符串格式
    else if (typeof backendState === 'string') {
      const locationPairs = backendState.split(',')
      locationPairs.forEach((pair) => {
        const [process, location] = pair.split('.')
        if (process && location) {
          currentState[process] = location
        }
      })
    }

    console.log('Parsed current state:', currentState)
    return currentState
  },

  parseBackendTransitions: (backendTransitions) => {
    // Parse DOT transition format to frontend format
    console.log('Parsing backend transitions:', backendTransitions)

    if (!Array.isArray(backendTransitions)) return []

    return backendTransitions.map((edge, index) => {
      // DOT格式：{id, source, target, attributes: {vedge: "<process@event>"}}
      const vedge = edge.attributes?.vedge || ''
      const guard = edge.attributes?.guard || edge.attributes?.provided || ''
      const action = edge.attributes?.reset || edge.attributes?.do || ''
      const sourceInvariant = edge.attributes?.srcInvariant || ''
      const targetInvariant = edge.attributes?.tgtInvariant || ''
      const sync = edge.attributes?.sync || ''

      let processName = edge.attributes?.processName || 'unknown'
      let event = ''

      if (vedge) {
        // 移除< >括号
        const cleanVedge = vedge.replace(/[<>]/g, '')
        if (cleanVedge.includes('@')) {
          ;[processName, event] = cleanVedge.split('@')
        } else if (cleanVedge) {
          // 如果没有@符号，可能整个就是事件名
          event = cleanVedge
        }
      }

      if (!event.trim()) {
        if (edge.attributes?.event) {
          event = edge.attributes.event
        } else if (sync) {
          event = sync
        } else {
          event = 'tau'
        }
      }

      const parsedTransition = {
        id: edge.id || `${edge.source}_to_${edge.target}_${index}`,
        processName: processName.trim(),
        event: event.trim(),
        sourceLocation: edge.source || '',
        targetLocation: edge.target || '',
        guard: guard,
        action: action,
        sourceInvariant,
        targetInvariant,
        sync,
        vedge: vedge,
        sourceVloc: edge.attributes?.sourceVloc || '',
        targetVloc: edge.attributes?.targetVloc || '',
        edgeData: edge
      }

      console.log('Parsed transition:', parsedTransition)
      return parsedTransition
    })
  }
}))

export default useEditorStore
