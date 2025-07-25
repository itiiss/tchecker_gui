// src/store/editorStore.js

import { create } from 'zustand'
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react'

const useEditorStore = create((set, get) => ({
  nodes: [
    {
      id: '1',
      type: 'timedAutomatonNode', // 1. 使用自定义节点类型
      position: { x: 250, y: 150 },
      // 2. 添加 invariant 属性
      data: { label: 'Node 1', invariant: 'true' }
    }
  ],
  edges: [],
  mode: 'select',

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
