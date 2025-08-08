import React, { useCallback } from 'react'
import { Box, Tooltip, IconButton, Divider } from '@mui/material'
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Timeline as TimelineIcon,
  PanTool as PanToolIcon
} from '@mui/icons-material'
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
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updatedData } }
          : node
      )
    )
  }, [setNodes])

  // Cytoscape边更新处理
  const handleEdgeUpdate = useCallback((edgeId, updatedData) => {
    console.log('Update edge:', edgeId, updatedData)
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? { ...edge, data: { ...edge.data, ...updatedData } }
          : edge
      )
    )
  }, [setEdges])

  // Cytoscape边创建处理
  const handleEdgeCreate = useCallback((sourceId, targetId) => {
    const newEdgeId = `edge_${sourceId}_${targetId}_${Date.now()}`
    const newEdge = {
      id: newEdgeId,
      source: sourceId,
      target: targetId,
      type: 'timedAutomatonEdge',
      data: {
        event: '',
        guard: 'true',
        action: ''
      }
    }
    console.log('Create new edge:', newEdge)
    setEdges((eds) => [...eds, newEdge])
    return newEdgeId
  }, [setEdges])

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
        <Tooltip title="Add Node">
          <IconButton
            onClick={() => setMode('add-node')}
            color={mode === 'add-node' ? 'primary' : 'default'}
          >
            <AddCircleOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Edge">
          <IconButton
            onClick={() => setMode('add-edge')}
            color={mode === 'add-edge' ? 'primary' : 'default'}
          >
            <TimelineIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
        <Tooltip title="Pan/Select Mode">
          <IconButton
            onClick={() => setMode('select')}
            color={mode === 'select' ? 'primary' : 'default'}
          >
            <PanToolIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <div style={{ flexGrow: 1, height: '100%' }}>
        <CytoscapeAutomaton
          nodes={nodes}
          edges={edges}
          onNodeUpdate={handleNodeUpdate}
          onEdgeUpdate={handleEdgeUpdate}
          onEdgeCreate={handleEdgeCreate}
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
