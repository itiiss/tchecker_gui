import React, { useCallback } from 'react'
import { Box, Tooltip, IconButton, Divider } from '@mui/material'
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Timeline as TimelineIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  PanTool as PanToolIcon
} from '@mui/icons-material'
import { ReactFlow, useReactFlow, ReactFlowProvider } from '@xyflow/react'
import useEditorStore from '../store/editorStore'
import TimedAutomatonEdge from '../components/edge'
import TimedAutomatonNode from '../components/node'
import { nanoid } from 'nanoid'
import '@xyflow/react/dist/style.css'

const nodeTypes = {
  timedAutomatonNode: TimedAutomatonNode
}
const edgeTypes = {
  timedAutomatonEdge: TimedAutomatonEdge
}

let id = 2
const getId = () => `${id++}`

const EditorContent = () => {
  const {
    processes,
    activeProcess,
    mode,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    setMode
  } = useEditorStore()
  const { zoomIn, zoomOut, screenToFlowPosition } = useReactFlow()

  const { nodes, edges } = processes[activeProcess] || { nodes: [], edges: [] }

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        id: `e-${nanoid()}`,
        ...params,
        type: 'timedAutomatonEdge',
        data: {
          event: '',
          guard: 'true',
          update: ''
        }
      }
      setEdges((eds) => [...eds, newEdge])
    },
    [setEdges]
  )

  const onPaneClick = useCallback(
    (event) => {
      if (mode === 'add-node') {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        })
        const newId = getId()
        const newNode = {
          id: newId,
          type: 'timedAutomatonNode',
          position,
          data: { label: `Node ${newId}`, invariant: 'true' }
        }
        setNodes((nds) => nds.concat(newNode))
      }
    },
    [mode, screenToFlowPosition, setNodes]
  )

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
        <Tooltip title="Zoom In">
          <IconButton onClick={() => zoomIn()}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton onClick={() => zoomOut()}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
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
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          panOnDrag={mode === 'select'}
          nodesDraggable={mode === 'select'}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick
        />
      </div>
    </Box>
  )
}

const EditorView = () => {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <ReactFlowProvider>
        <EditorContent />
      </ReactFlowProvider>
    </Box>
  )
}

export default EditorView
