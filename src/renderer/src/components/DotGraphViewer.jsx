import React, { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from '@xyflow/react'
import { Box, Typography, Alert } from '@mui/material'
// Simple layout utility for DOT graph nodes
const getSimpleLayout = (nodes, edges) => {
  const layoutedNodes = nodes.map((node, index) => ({
    ...node,
    position: { 
      x: (index % 4) * 200, 
      y: Math.floor(index / 4) * 150 
    }
  }))
  return { nodes: layoutedNodes, edges }
}

/**
 * DOT Graph Rendering Component
 * Converts DOT format graphs to ReactFlow visualization
 */
const DotGraphViewer = ({ dotContent, title = 'State Space Graph' }) => {
  // Parse DOT content and convert to ReactFlow format
  const { nodes, edges } = useMemo(() => {
    if (!dotContent || !dotContent.trim()) {
      return { nodes: [], edges: [] }
    }

    try {
      return parseDotToReactFlow(dotContent)
    } catch (error) {
      console.error('Failed to parse DOT content:', error)
      return { nodes: [], edges: [] }
    }
  }, [dotContent])

  const [nodesState] = useNodesState(nodes)
  const [edgesState] = useEdgesState(edges)

  if (!dotContent || !dotContent.trim()) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>No graph data available</Typography>
      </Box>
    )
  }

  if (nodes.length === 0 && edges.length === 0) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Unable to parse DOT graph content, please check data format
      </Alert>
    )
  }

  return (
    <Box
      sx={{ height: '400px', width: '100%', border: 1, borderColor: 'divider', borderRadius: 1 }}
    >
      <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="primary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <ReactFlow nodes={nodesState} edges={edgesState} fitView attributionPosition="bottom-left">
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.data?.isInitial) return '#4CAF50'
              if (node.data?.isTarget) return '#F44336'
              return '#2196F3'
            }}
            height={120}
          />
        </ReactFlow>
      </Box>
    </Box>
  )
}

/**
 * Convert DOT format to ReactFlow nodes and edges
 */
function parseDotToReactFlow(dotContent) {
  const nodes = []
  const edges = []

  // Basic DOT parsing - extract nodes and edges
  const lines = dotContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)

  const nodeMap = new Map()
  let nodeId = 0
  let edgeId = 0

  // First pass: extract all nodes
  for (const line of lines) {
    // Match node definition: node_id [attributes]
    const nodeMatch = line.match(/^\s*(\w+)\s*\[([^\]]*)\]/)
    if (nodeMatch && !line.includes('->')) {
      const [, id, attributes] = nodeMatch

      // Parse attributes
      const attrs = parseAttributes(attributes)

      // Create node
      const node = {
        id: id,
        position: { x: nodeId * 150, y: Math.floor(nodeId / 5) * 100 },
        data: {
          label: attrs.vloc || attrs.label || id,
          isInitial: attrs.initial === 'true',
          isTarget: false, // Will be updated later based on edge information
          attributes: attrs
        },
        style: {
          backgroundColor: attrs.initial === 'true' ? '#E8F5E8' : '#F5F5F5',
          border: attrs.initial === 'true' ? '2px solid #4CAF50' : '1px solid #ccc',
          borderRadius: '8px',
          fontSize: '12px',
          padding: '8px'
        }
      }

      nodes.push(node)
      nodeMap.set(id, node)
      nodeId++
    }
  }

  // Second pass: extract all edges
  for (const line of lines) {
    // Match edge definition: source -> target [attributes]
    const edgeMatch = line.match(/^\s*(\w+)\s*->\s*(\w+)\s*(?:\[([^\]]*)\])?/)
    if (edgeMatch) {
      const [, sourceId, targetId, attributes = ''] = edgeMatch

      // Parse attributes
      const attrs = parseAttributes(attributes)

      // Create edge
      const edge = {
        id: `e${edgeId++}`,
        source: sourceId,
        target: targetId,
        sourceHandle: 'source-right',
        targetHandle: 'target-left',
        label: attrs.vedge || attrs.label || '',
        style: {
          stroke: '#666',
          strokeWidth: 2
        },
        labelStyle: { fontSize: '10px', fill: '#333' },
        type: 'smoothstep'
      }

      // If edge has vedge attribute, extract event information
      if (attrs.vedge) {
        const vedgeContent = attrs.vedge.replace(/[<>]/g, '')
        edge.data = { vedge: vedgeContent }
      }

      edges.push(edge)

      // Mark target node
      const targetNode = nodeMap.get(targetId)
      if (targetNode) {
        targetNode.data.isTarget = true
      }
    }
  }

  // Apply simple grid layout
  if (nodes.length > 0) {
    return getSimpleLayout(nodes, edges)
  }

  return { nodes, edges }
}

/**
 * Parse DOT attribute string
 */
function parseAttributes(attrString) {
  const attributes = {}
  if (!attrString) return attributes

  // Match key="value" or key=value format
  const attrRegex = /(\w+)=(?:"([^"]*)"|(\w+))/g
  let match

  while ((match = attrRegex.exec(attrString)) !== null) {
    const key = match[1]
    const value = match[2] || match[3]
    attributes[key] = value
  }

  return attributes
}


export default DotGraphViewer
