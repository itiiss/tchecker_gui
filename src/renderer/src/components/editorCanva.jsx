import React from 'react'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// 为了示例，我们先定义一些虚拟的节点和边
const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'red' }, type: 'input' },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'yellow' } },
  { id: '3', position: { x: 200, y: 300 }, data: { label: 'green' } }
]
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'x >= 5, x=0' },
  { id: 'e2-3', source: '2', target: '3', label: 'x >= 3, x=0' },
  { id: 'e3-1', source: '3', target: '1', label: 'x >= 2, x=0' }
]

const EditorCanvas = () => {
  // 在实际项目中，你会从 Zustand store 中获取 nodes 和 edges
  // const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useModelStore();

  return (
    // React Flow 容器需要明确的宽度和高度
    <div className="w-full h-full">
      <ReactFlow
        nodes={initialNodes} // 替换为来自 useModelStore 的 nodes
        edges={initialEdges} // 替换为来自 useModelStore 的 edges
        // onNodesChange={onNodesChange}
        // onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        fitView
      ></ReactFlow>
    </div>
  )
}

export default EditorCanvas
