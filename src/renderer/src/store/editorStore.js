import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

// 这是一个更符合您最终模型的初始状态示例
const initialState = {
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

const useEditorStore = create((set, get) => ({
  nodes: initialState.nodes,
  edges: initialState.edges,
  mode: 'select',

  // 通用的节点数据更新函数
  updateNodeData: (nodeId, dataUpdate) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...dataUpdate } } : node
      )
    })
  },

  // 通用的边数据更新函数
  updateEdgeData: (edgeId, dataUpdate) => {
    set({
      edges: get().edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...dataUpdate } } : edge
      )
    })
  },

  setNodes: (updater) => {
    if (typeof updater === 'function') {
      set({ nodes: updater(get().nodes) })
    } else {
      set({ nodes: updater })
    }
  },

  setEdges: (updater) => {
    if (typeof updater === 'function') {
      set({ edges: updater(get().edges) })
    } else {
      set({ edges: updater })
    }
  },

  setMode: (newMode) => set({ mode: newMode }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    })
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    })
  }
}))

export default useEditorStore
