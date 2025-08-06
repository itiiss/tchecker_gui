import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

const useEditorStore = create((set, get) => ({
  systemName: 'MySystem',
  clocks: [{ name: 'x', size: 1 }],
  intVars: [],
  events: [],
  synchronizations: [],
  processes: {
    train: {
      nodes: [
        {
          id: 'train.far',
          type: 'timedAutomatonNode',
          position: { x: 100, y: 150 },
          data: {
            processName: 'train',
            locationName: 'far',
            isInitial: true,
            invariant: '',
            labels: [],
            isCommitted: false,
            isUrgent: false
          }
        },
        {
          id: 'train.near',
          type: 'timedAutomatonNode',
          position: { x: 400, y: 150 },
          data: {
            processName: 'train',
            locationName: 'near',
            isInitial: false,
            invariant: 'x <= 10',
            labels: ['safe'],
            isCommitted: false,
            isUrgent: false
          }
        }
      ],
      edges: [
        {
          id: 'e_train_1',
          source: 'train.far',
          target: 'train.near',
          type: 'timedAutomatonEdge',
          data: {
            processName: 'train',
            event: 'approach',
            guard: 'x >= 5',
            action: 'x = 0'
          }
        }
      ]
    }
  },
  activeProcess: 'train',
  mode: 'select',

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
    }));
  },

  updateNodeData: (nodeId, dataUpdate) => {
    const activeProcess = get().activeProcess;
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
    }));
  },

  updateEdgeData: (edgeId, dataUpdate) => {
    const activeProcess = get().activeProcess;
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
    }));
  },

  setNodes: (updater) => {
    const activeProcess = get().activeProcess;
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          nodes: typeof updater === 'function' ? updater(state.processes[activeProcess].nodes) : updater
        }
      }
    }));
  },

  setEdges: (updater) => {
    const activeProcess = get().activeProcess;
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          edges: typeof updater === 'function' ? updater(state.processes[activeProcess].edges) : updater
        }
      }
    }));
  },

  setMode: (newMode) => set({ mode: newMode }),

  onNodesChange: (changes) => {
    const activeProcess = get().activeProcess;
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          nodes: applyNodeChanges(changes, state.processes[activeProcess].nodes)
        }
      }
    }));
  },

  onEdgesChange: (changes) => {
    const activeProcess = get().activeProcess;
    set((state) => ({
      processes: {
        ...state.processes,
        [activeProcess]: {
          ...state.processes[activeProcess],
          edges: applyEdgeChanges(changes, state.processes[activeProcess].edges)
        }
      }
    }));
  }
}));

export default useEditorStore;
