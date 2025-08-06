// src/views/EditorView.jsx

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
import Siderbar from './Sidebar' // 假设侧边栏组件存在
import TimedAutomatonNode from '../components/node' // 1. 引入自定义节点
import { nanoid } from 'nanoid'
import '@xyflow/react/dist/style.css'

// 2. 定义节点和边的类型
const nodeTypes = {
  timedAutomatonNode: TimedAutomatonNode
}
const edgeTypes = {
  timedAutomatonEdge: TimedAutomatonEdge
}

let id = 2 // 初始节点ID从2开始
const getId = () => `${id++}`

const EditorContent = () => {
  const { nodes, edges, mode, onNodesChange, onEdgesChange, setNodes, setEdges, setMode } =
    useEditorStore()
  const { zoomIn, zoomOut, screenToFlowPosition } = useReactFlow()

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        id: `e-${nanoid()}`,
        ...params,
        type: 'timedAutomatonEdge',
        // 3. 更新边的初始数据
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
          type: 'timedAutomatonNode', // 4. 使用自定义节点类型
          position,
          // 5. 更新节点的初始数据
          data: { label: `Node ${newId}`, invariant: 'true' }
        }
        setNodes((nds) => nds.concat(newNode))
      }
    },
    [mode, screenToFlowPosition, setNodes]
  )

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar ... (No changes here) */}
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
          nodeTypes={nodeTypes} // 6. 注册自定义节点类型
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
    // Sidebar is not included in the provided files, assuming it exists
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Siderbar />
      <ReactFlowProvider>
        <EditorContent />
      </ReactFlowProvider>
    </Box>
  )
}

export default EditorView
