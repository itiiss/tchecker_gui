import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

const useEditorStore = create((set, get) => ({
  systemName: 'ProductionLineSystem',
  clocks: [
    { name: 'workerTime', size: 1 }, // 工人操作时间
    { name: 'machineTime', size: 1 }, // 机器处理时间
    { name: 'qcTime', size: 1 }, // 质检时间
    { name: 'globalTime', size: 1 } // 全局时间
  ],
  intVars: [
    { name: 'rawMaterials', size: 1, min: 0, max: 5, initial: 3 }, // 原材料库存
    { name: 'workerQueue', size: 1, min: 0, max: 3, initial: 0 }, // 工人队列中的任务
    { name: 'machineQueue', size: 1, min: 0, max: 2, initial: 0 }, // 机器队列中的任务
    { name: 'finishedProducts', size: 1, min: 0, max: 10, initial: 0 }, // 完成品
    { name: 'defectiveProducts', size: 1, min: 0, max: 5, initial: 0 } // 次品
  ],
  events: [
    { name: 'startWork' }, // 开始工作
    { name: 'finishPrep' }, // 完成准备
    { name: 'machineProcess' }, // 机器处理
    { name: 'finishMachine' }, // 机器完成
    { name: 'qualityCheck' }, // 质检
    { name: 'passQC' }, // 质检通过
    { name: 'failQC' }, // 质检失败
    { name: 'restockMaterial' }, // 补充原材料
    { name: 'urgentOrder' }, // 紧急订单
    { name: 'maintenanceBreak' } // 维护休息
  ],
  synchronizations: [],
  processes: {
    worker: {
      nodes: [
        {
          id: 'worker.Idle',
          type: 'timedAutomatonNode',
          position: { x: 100, y: 100 },
          data: {
            processName: 'worker',
            locationName: 'Idle',
            isInitial: true,
            invariant: '',
            labels: ['available'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'worker.Preparing',
          type: 'timedAutomatonNode',
          position: { x: 300, y: 100 },
          data: {
            processName: 'worker',
            locationName: 'Preparing',
            isInitial: false,
            invariant: 'workerTime <= 5',
            labels: ['busy', 'preparing'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'worker.Waiting',
          type: 'timedAutomatonNode',
          position: { x: 500, y: 100 },
          data: {
            processName: 'worker',
            locationName: 'Waiting',
            isInitial: false,
            invariant: 'workerTime <= 10',
            labels: ['waiting_machine'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'worker.Resting',
          type: 'timedAutomatonNode',
          position: { x: 300, y: 250 },
          data: {
            processName: 'worker',
            locationName: 'Resting',
            isInitial: false,
            invariant: 'workerTime <= 15',
            labels: ['break'],
            isCommitted: false,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_worker_1',
          source: 'worker.Idle',
          target: 'worker.Preparing',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'startWork',
            guard: 'rawMaterials > 0',
            action: 'rawMaterials = rawMaterials - 1'
          }
        },
        {
          id: 'e_worker_2',
          source: 'worker.Preparing',
          target: 'worker.Waiting',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'finishPrep',
            guard: 'workerTime >= 1',
            action: 'workerQueue = workerQueue + 1'
          }
        },
        {
          id: 'e_worker_2b',
          source: 'worker.Preparing',
          target: 'worker.Idle',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'urgentOrder',
            guard: '',
            action: ''
          }
        },
        {
          id: 'e_worker_3',
          source: 'worker.Waiting',
          target: 'worker.Idle',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'machineProcess',
            guard: 'workerTime >= 1 && machineQueue < 2',
            action: 'workerTime = 0'
          }
        },
        {
          id: 'e_worker_4',
          source: 'worker.Idle',
          target: 'worker.Resting',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'maintenanceBreak',
            guard: 'globalTime >= 20',
            action: 'workerTime = 0'
          }
        },
        {
          id: 'e_worker_5',
          source: 'worker.Resting',
          target: 'worker.Idle',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'urgentOrder',
            guard: 'workerTime >= 5',
            action: 'workerTime = 0'
          }
        },
        {
          id: 'e_worker_6',
          source: 'worker.Resting',
          target: 'worker.Idle',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'worker',
            event: 'restockMaterial',
            guard: 'workerTime >= 10',
            action: 'rawMaterials = 5'
          }
        }
      ]
    },
    machine: {
      nodes: [
        {
          id: 'machine.Ready',
          type: 'timedAutomatonNode',
          position: { x: 150, y: 100 },
          data: {
            processName: 'machine',
            locationName: 'Ready',
            isInitial: true,
            invariant: '',
            labels: ['ready'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'machine.Processing',
          type: 'timedAutomatonNode',
          position: { x: 350, y: 100 },
          data: {
            processName: 'machine',
            locationName: 'Processing',
            isInitial: false,
            invariant: 'machineTime <= 8',
            labels: ['busy', 'processing'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'machine.Maintenance',
          type: 'timedAutomatonNode',
          position: { x: 250, y: 250 },
          data: {
            processName: 'machine',
            locationName: 'Maintenance',
            isInitial: false,
            invariant: 'machineTime <= 20',
            labels: ['maintenance'],
            isCommitted: false,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_machine_1',
          source: 'machine.Ready',
          target: 'machine.Processing',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'machine',
            event: 'machineProcess',
            guard: 'workerQueue > 0',
            action: 'workerQueue = workerQueue - 1'
          }
        },
        {
          id: 'e_machine_2',
          source: 'machine.Processing',
          target: 'machine.Ready',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'machine',
            event: 'finishMachine',
            guard: 'machineTime >= 6',
            action: 'machineTime = 0'
          }
        },
        {
          id: 'e_machine_3',
          source: 'machine.Ready',
          target: 'machine.Maintenance',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'machine',
            event: 'maintenanceBreak',
            guard: 'globalTime >= 25',
            action: 'machineTime = 0'
          }
        },
        {
          id: 'e_machine_4',
          source: 'machine.Maintenance',
          target: 'machine.Ready',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'machine',
            event: 'urgentOrder',
            guard: 'machineTime >= 8',
            action: 'machineTime = 0'
          }
        },
        {
          id: 'e_machine_5',
          source: 'machine.Ready',
          target: 'machine.Ready',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'machine',
            event: 'restockMaterial',
            guard: '',
            action: ''
          }
        }
      ]
    },
    qualityControl: {
      nodes: [
        {
          id: 'qualityControl.Waiting',
          type: 'timedAutomatonNode',
          position: { x: 200, y: 100 },
          data: {
            processName: 'qualityControl',
            locationName: 'Waiting',
            isInitial: true,
            invariant: '',
            labels: ['waiting'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'qualityControl.Inspecting',
          type: 'timedAutomatonNode',
          position: { x: 400, y: 100 },
          data: {
            processName: 'qualityControl',
            locationName: 'Inspecting',
            isInitial: false,
            invariant: 'qcTime <= 4',
            labels: ['inspecting'],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'qualityControl.Deciding',
          type: 'timedAutomatonNode',
          position: { x: 300, y: 250 },
          data: {
            processName: 'qualityControl',
            locationName: 'Deciding',
            isInitial: false,
            invariant: 'qcTime <= 2',
            labels: ['deciding'],
            isCommitted: true,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_qc_1',
          source: 'qualityControl.Waiting',
          target: 'qualityControl.Inspecting',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'qualityControl',
            event: 'qualityCheck',
            guard: 'machineQueue > 0',
            action: 'machineQueue = machineQueue - 1'
          }
        },
        {
          id: 'e_qc_2',
          source: 'qualityControl.Inspecting',
          target: 'qualityControl.Deciding',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'qualityControl',
            event: 'qualityCheck',
            guard: 'qcTime >= 3',
            action: 'qcTime = 0'
          }
        },
        {
          id: 'e_qc_3',
          source: 'qualityControl.Deciding',
          target: 'qualityControl.Waiting',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'qualityControl',
            event: 'passQC',
            guard: '',
            action: 'finishedProducts = finishedProducts + 1'
          }
        },
        {
          id: 'e_qc_4',
          source: 'qualityControl.Deciding',
          target: 'qualityControl.Waiting',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'qualityControl',
            event: 'failQC',
            guard: '',
            action: 'defectiveProducts = defectiveProducts + 1'
          }
        }
      ]
    }
  },
  activeProcess: 'worker',
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
    const state = get()
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
          enabledTransitions,
          simulationTrace: [
            {
              state: currentState,
              transition: null,
              backendState: initialStateData,
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
        simulatorInitialized: false
      })
    }
  },

  // calculateEnabledTransitions已移除 - 所有转换计算都依赖tck-simulate的结果

  executeTransition: async (transitionId) => {
    const state = get()
    const transition = state.enabledTransitions.find((t) => t.id === transitionId)

    if (!transition) return

    set({ simulationLoading: true, simulationError: null })

    try {
      // Get model data and current state for backend
      const modelData = get().convertModelDataForBackend()
      const currentBackendState = state.simulationTrace[state.tracePosition]?.backendState

      // Call backend to execute transition
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke(
        'execute-transition',
        modelData,
        transitionId,
        currentBackendState
      )

      if (result.success) {
        // Parse the new state and transitions
        const newState = get().parseBackendState(result.newState)
        const newEnabledTransitions = get().parseBackendTransitions(result.availableTransitions)

        // Add to trace
        const newTraceEntry = {
          state: newState,
          transition: transition,
          backendState: result.newState,
          enabledTransitions: newEnabledTransitions // 缓存来自tck-simulate的转换
        }

        const newTrace = [...state.simulationTrace.slice(0, state.tracePosition + 1), newTraceEntry]

        set({
          currentState: newState,
          enabledTransitions: newEnabledTransitions,
          simulationTrace: newTrace,
          tracePosition: newTrace.length - 1,
          simulationLoading: false
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      set({
        simulationError: error.message,
        simulationLoading: false
      })
      console.error('Execute transition error:', error)
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

      // 使用缓存的转换（来自tck-simulate的结果），不进行前端计算
      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
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

      // 使用缓存的转换（来自tck-simulate的结果），不进行前端计算
      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
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

  loadTrace: (traceData) => {
    // TODO: Implement trace loading from file
    console.log('Load trace functionality to be implemented')
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
          const eventName = edge.data.event || ''

          // Collect non-empty event names
          if (eventName && eventName.trim()) {
            allEvents.add(eventName.trim())
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

      let processName = 'unknown'
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

      const parsedTransition = {
        id: edge.id || `${edge.source}_to_${edge.target}_${index}`,
        processName: processName.trim(),
        event: event.trim(),
        sourceLocation: edge.source || '',
        targetLocation: edge.target || '',
        guard: '', // DOT格式不直接提供guard信息
        action: '', // DOT格式不直接提供action信息
        edgeData: edge
      }

      console.log('Parsed transition:', parsedTransition)
      return parsedTransition
    })
  }
}))

export default useEditorStore
