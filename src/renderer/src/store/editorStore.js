import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

const useEditorStore = create((set, get) => ({
  systemName: 'TrainGateSystem',
  clocks: [{ name: 'x', size: 1 }],
  intVars: [
    { name: 'len', size: 1, min: 0, max: 10, initial: 0 },
    { name: 'id_t', size: 1, min: 0, max: 5, initial: 0 }
  ],
  events: [
    { name: 'approach' },
    { name: 'leave' },
    { name: 'appr' },
    { name: 'go' },
    { name: 'stop' }
  ],
  synchronizations: [],
  processes: {
    trainGate: {
      nodes: [
        {
          id: 'trainGate.Safe',
          type: 'timedAutomatonNode',
          position: { x: 100, y: 100 },
          data: {
            processName: 'trainGate',
            locationName: 'Safe',
            isInitial: true,
            invariant: '',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'trainGate.Cross',
          type: 'timedAutomatonNode',
          position: { x: 300, y: 100 },
          data: {
            processName: 'trainGate',
            locationName: 'Cross',
            isInitial: false,
            invariant: 'x < 5',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'trainGate.Appr',
          type: 'timedAutomatonNode',
          position: { x: 100, y: 250 },
          data: {
            processName: 'trainGate',
            locationName: 'Appr',
            isInitial: false,
            invariant: 'x <= 20',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'trainGate.Start',
          type: 'timedAutomatonNode',
          position: { x: 300, y: 250 },
          data: {
            processName: 'trainGate',
            locationName: 'Start',
            isInitial: false,
            invariant: 'x <= 15',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'trainGate.Stop',
          type: 'timedAutomatonNode',
          position: { x: 200, y: 350 },
          data: {
            processName: 'trainGate',
            locationName: 'Stop',
            isInitial: false,
            invariant: '',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_trainGate_1',
          source: 'trainGate.Safe',
          target: 'trainGate.Cross',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'leave',
            guard: 'x >= 5',
            action: ''
          }
        },
        {
          id: 'e_trainGate_2',
          source: 'trainGate.Safe',
          target: 'trainGate.Appr',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'approach',
            guard: '',
            action: 'x = 0'
          }
        },
        {
          id: 'e_trainGate_3',
          source: 'trainGate.Cross',
          target: 'trainGate.Start',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'go',
            guard: 'x >= 10',
            action: 'x = 0'
          }
        },
        {
          id: 'e_trainGate_4',
          source: 'trainGate.Start',
          target: 'trainGate.Stop',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'go',
            guard: '',
            action: 'x = 0'
          }
        },
        {
          id: 'e_trainGate_5',
          source: 'trainGate.Start',
          target: 'trainGate.Cross',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'appr',
            guard: 'x >= 7',
            action: 'x = 0'
          }
        },
        {
          id: 'e_trainGate_6',
          source: 'trainGate.Stop',
          target: 'trainGate.Appr',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'trainGate',
            event: 'stop',
            guard: 'x <= 10',
            action: ''
          }
        }
      ]
    },
    queue: {
      nodes: [
        {
          id: 'queue.Free',
          type: 'timedAutomatonNode',
          position: { x: 200, y: 100 },
          data: {
            processName: 'queue',
            locationName: 'Free',
            isInitial: true,
            invariant: '',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'queue.Occ',
          type: 'timedAutomatonNode',
          position: { x: 200, y: 250 },
          data: {
            processName: 'queue',
            locationName: 'Occ',
            isInitial: false,
            invariant: '',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'queue.C',
          type: 'timedAutomatonNode',
          position: { x: 200, y: 350 },
          data: {
            processName: 'queue',
            locationName: 'C',
            isInitial: false,
            invariant: '',
            labels: [],
            isCommitted: true,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_queue_1',
          source: 'queue.Free',
          target: 'queue.Occ',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'queue',
            event: 'appr',
            guard: 'len > 0',
            action: ''
          }
        },
        {
          id: 'e_queue_2',
          source: 'queue.Free',
          target: 'queue.Occ',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'queue',
            event: 'appr',
            guard: 'len == 0',
            action: 'enqueue(e)'
          }
        },
        {
          id: 'e_queue_3',
          source: 'queue.Occ',
          target: 'queue.Free',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'queue',
            event: 'leave',
            guard: 'e == front()',
            action: 'dequeue()'
          }
        },
        {
          id: 'e_queue_4',
          source: 'queue.Occ',
          target: 'queue.C',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'queue',
            event: 'appr',
            guard: '',
            action: 'enqueue(e)'
          }
        },
        {
          id: 'e_queue_5',
          source: 'queue.C',
          target: 'queue.Occ',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'queue',
            event: 'stop',
            guard: '',
            action: ''
          }
        }
      ]
    }
  },
  activeProcess: 'trainGate',
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

  runSimulation: async () => {
    const state = get()
    set({ simulationLoading: true, simulationError: null })

    try {
      // Convert ReactFlow format to TCK generator format
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
              guard: edge.data.guard || 'true',
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

      const modelData = {
        systemName: state.systemName,
        clocks: state.clocks,
        intVars: state.intVars,
        events: combinedEvents,
        synchronizations: state.synchronizations,
        processes: convertedProcesses
      }

      // Direct IPC call since preload is not working
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('run-simulation', modelData)
      set({ simulationResult: result, simulationLoading: false })
      return result
    } catch (error) {
      set({ simulationError: error.message, simulationLoading: false })
      throw error
    }
  },

  // Simulator control functions
  initializeSimulator: () => {
    const state = get()

    // Initialize current state - all processes at their initial locations
    const currentState = {}
    const clockValues = {}

    Object.entries(state.processes).forEach(([procName, procData]) => {
      if (procData.nodes) {
        const initialNode = procData.nodes.find((node) => node.data.isInitial)
        if (initialNode) {
          currentState[procName] = initialNode.data.locationName || initialNode.id.split('.').pop()
        }
      }
    })

    // Initialize clocks to 0
    state.clocks.forEach((clock) => {
      clockValues[clock.name] = 0
    })

    // Calculate enabled transitions from initial state
    const enabledTransitions = get().calculateEnabledTransitions(currentState)

    set({
      simulatorInitialized: true,
      currentState,
      clockValues,
      enabledTransitions,
      simulationTrace: [{ state: currentState, clocks: clockValues, transition: null }],
      tracePosition: 0
    })
  },

  calculateEnabledTransitions: (fromState) => {
    const state = get()
    const enabled = []

    Object.entries(state.processes).forEach(([procName, procData]) => {
      if (procData.edges) {
        procData.edges.forEach((edge, edgeIndex) => {
          const sourceLocation = edge.source.split('.').pop()
          const targetLocation = edge.target.split('.').pop()

          // Check if this edge can be taken from current state
          if (fromState[procName] === sourceLocation) {
            enabled.push({
              id: `${procName}_${edgeIndex}`,
              processName: procName,
              sourceLocation,
              targetLocation,
              event: edge.data.event || '',
              guard: edge.data.guard || 'true',
              action: edge.data.action || '',
              edgeData: edge
            })
          }
        })
      }
    })

    return enabled
  },

  executeTransition: (transitionId) => {
    const state = get()
    const transition = state.enabledTransitions.find((t) => t.id === transitionId)

    if (!transition) return

    // Create new state by updating the process location
    const newState = { ...state.currentState }
    newState[transition.processName] = transition.targetLocation

    // TODO: Update clock values based on action (simplified for now)
    const newClockValues = { ...state.clockValues }

    // Calculate new enabled transitions
    const newEnabledTransitions = get().calculateEnabledTransitions(newState)

    // Add to trace
    const newTraceEntry = {
      state: newState,
      clocks: newClockValues,
      transition: transition
    }

    const newTrace = [...state.simulationTrace.slice(0, state.tracePosition + 1), newTraceEntry]

    set({
      currentState: newState,
      clockValues: newClockValues,
      enabledTransitions: newEnabledTransitions,
      simulationTrace: newTrace,
      tracePosition: newTrace.length - 1
    })
  },

  resetSimulation: () => {
    get().initializeSimulator()
  },

  stepBackward: () => {
    const state = get()
    if (state.tracePosition > 0) {
      const newPosition = state.tracePosition - 1
      const traceEntry = state.simulationTrace[newPosition]
      const enabledTransitions = get().calculateEnabledTransitions(traceEntry.state)

      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        enabledTransitions,
        tracePosition: newPosition
      })
    }
  },

  stepForward: () => {
    const state = get()
    if (state.tracePosition < state.simulationTrace.length - 1) {
      const newPosition = state.tracePosition + 1
      const traceEntry = state.simulationTrace[newPosition]
      const enabledTransitions = get().calculateEnabledTransitions(traceEntry.state)

      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        enabledTransitions,
        tracePosition: newPosition
      })
    }
  },

  randomStep: () => {
    const state = get()
    if (state.enabledTransitions.length > 0) {
      const randomTransition =
        state.enabledTransitions[Math.floor(Math.random() * state.enabledTransitions.length)]
      get().executeTransition(randomTransition.id)
    }
  },

  jumpToTracePosition: (position) => {
    const state = get()
    if (position >= 0 && position < state.simulationTrace.length) {
      const traceEntry = state.simulationTrace[position]
      const enabledTransitions = get().calculateEnabledTransitions(traceEntry.state)

      set({
        currentState: traceEntry.state,
        clockValues: traceEntry.clocks,
        enabledTransitions,
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
  }
}))

export default useEditorStore
