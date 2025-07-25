import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import Sidebar from './sidebar';
import EditorCanvas from './editorCanva';
import {
  AddCircleOutline as AddCircleOutlineIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import { ReactFlow, useNodesState, useEdgesState, addEdge } from '@xyflow/react';

let id = 4;
const getId = () => `${id++}`;

const EditorView = () => {
  const [mode, setMode] = useState('select'); // 'select', 'add-node', or 'add-edge'
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onPaneClick = useCallback(
    (event) => {
      if (mode === 'add-node') {
        const newNode = {
          id: getId(),
          position: {
            x: event.clientX - 240, // Adjust for sidebar width
            y: event.clientY - 48, // Adjust for menubar height
          },
          data: { label: `Node ${id}` },
        };
        setNodes((nds) => nds.concat(newNode));
      }
    },
    [mode, setNodes]
  );

  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Add Node">
            <IconButton onClick={() => setMode('add-node')} color={mode === 'add-node' ? 'primary' : 'default'}>
              <AddCircleOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Edge">
            <IconButton onClick={() => setMode('add-edge')} color={mode === 'add-edge' ? 'primary' : 'default'}>
              <TimelineIcon />
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
            fitView
            panOnDrag={mode !== 'add-edge'}
            nodesDraggable={mode !== 'add-edge'}
          />
        </div>
      </Box>
    </Box>
  );
};

export default EditorView;
