import React, { useCallback } from 'react'
import { Box } from '@mui/material'
import useEditorStore from '../store/editorStore'
import CytoscapeAutomaton from '../components/CytoscapeAutomaton'

let id = 2
const getId = () => `${id++}`

const EditorContent = () => {
  const {
    processes,
    activeProcess,
    setNodes,
    setEdges,
    setMode,
    mode
  } = useEditorStore()

  const { nodes, edges } = processes[activeProcess] || { nodes: [], edges: [] }

  // Cytoscape节点更新处理
  const handleNodeUpdate = useCallback((nodeId, updatedData) => {
    console.log('Update node:', nodeId, updatedData)
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // 分离position和其他数据
          const { position, ...dataUpdates } = updatedData
          
          return {
            ...node,
            // 如果有position更新，更新到节点顶层
            ...(position && { position }),
            // 其他数据更新到data中
            data: { 
              ...node.data, 
              ...dataUpdates,
              // 确保processName正确设置
              processName: node.data.processName || activeProcess
            }
          }
        }
        return node
      })
    )
    // 立即触发重新渲染
    console.log('Node updated successfully')
  }, [setNodes, activeProcess])

  // Cytoscape边更新处理
  const handleEdgeUpdate = useCallback((edgeId, updatedData) => {
    console.log('Update edge:', edgeId, updatedData)
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { 
              ...edge, 
              data: { 
                ...edge.data, 
                ...updatedData,
                // 确保processName正确设置
                processName: edge.data.processName || activeProcess
              } 
            }
          : edge
      )
    )
    console.log('Edge updated successfully')
  }, [setEdges, activeProcess])

  // Cytoscape边创建处理
  const handleEdgeCreate = useCallback((sourceId, targetId) => {
    const newEdgeId = `edge_${sourceId}_${targetId}_${Date.now()}`
    const newEdge = {
      id: newEdgeId,
      source: sourceId,
      target: targetId,
      type: 'timedAutomatonEdge',
      data: {
        processName: activeProcess,
        event: '',
        guard: 'true',
        action: ''
      }
    }
    console.log('Create new edge:', newEdge)
    setEdges((eds) => [...eds, newEdge])
    return newEdgeId
  }, [setEdges, activeProcess])

  // 删除节点处理
  const handleNodeDelete = useCallback((nodeId) => {
    console.log('Delete node:', nodeId)
    // 删除节点
    setNodes((nds) => nds.filter(node => node.id !== nodeId))
    // 删除连接到该节点的所有边
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId))
  }, [setNodes, setEdges])

  // 删除边处理
  const handleEdgeDelete = useCallback((edgeId) => {
    console.log('Delete edge:', edgeId)
    setEdges((eds) => eds.filter(edge => edge.id !== edgeId))
  }, [setEdges])

  // 创建节点处理
  const handleNodeCreate = useCallback((position) => {
    const nodeCount = nodes.length + 1
    const newNodeId = `${activeProcess}.location_${nodeCount}`
    const newNode = {
      id: newNodeId,
      type: 'timedAutomatonNode',
      position: position || { x: 200, y: 200 },
      data: {
        processName: activeProcess,
        locationName: `location_${nodeCount}`,
        isInitial: false,
        invariant: '',
        labels: [],
        isCommitted: false,
        isUrgent: false
      }
    }
    console.log('Create new node:', newNode)
    setNodes((nds) => [...nds, newNode])
    return newNodeId
  }, [setNodes, activeProcess, nodes.length])

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexGrow: 1, height: '100%' }}>
        <CytoscapeAutomaton
          nodes={nodes}
          edges={edges}
          mode={mode}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          onEdgeCreate={handleEdgeCreate}
          onNodeDelete={handleNodeDelete}
          onEdgeDelete={handleEdgeDelete}
          onNodeCreate={handleNodeCreate}
          onModeChange={setMode}
        />
      </div>
    </Box>
  )
}

const EditorView = () => {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <EditorContent />
    </Box>
  )
}

export default EditorView
