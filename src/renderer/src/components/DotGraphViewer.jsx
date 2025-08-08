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

/**
 * DOT Graph Rendering Component
 * Converts DOT format graphs to ReactFlow visualization
 */
const DotGraphViewer = ({ dotContent, title = "State Space Graph" }) => {
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
    <Box sx={{ height: '400px', width: '100%', border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ p: 1, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" color="primary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ height: 'calc(100% - 40px)' }}>
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          fitView
          attributionPosition="bottom-left"
        >
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
  const lines = dotContent.split('\n').map(line => line.trim()).filter(line => line)
  
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
        label: attrs.vedge || attrs.label || '',
        style: { stroke: '#666' },
        labelStyle: { fontSize: '10px', fill: '#333' }
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

  // Apply optimized layout to reduce edge crossings
  if (nodes.length > 0) {
    applyOptimizedLayout(nodes, edges)
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

/**
 * Apply optimized layout algorithms to reduce edge crossings
 */
function applyOptimizedLayout(nodes, edges) {
  const nodeCount = nodes.length
  
  // For small graphs (≤ 3 nodes), use simple horizontal layout
  if (nodeCount <= 3) {
    applyLinearLayout(nodes)
    return
  }
  
  // For medium graphs (4-10 nodes), try hierarchical layout first
  if (nodeCount <= 10) {
    if (tryHierarchicalLayout(nodes, edges)) {
      return
    }
  }
  
  // For larger graphs or when hierarchical fails, use force-directed layout
  applyForceDirectedLayout(nodes, edges)
}

/**
 * Simple linear layout for very small graphs
 */
function applyLinearLayout(nodes) {
  const spacing = 200
  const startX = 100
  const centerY = 200
  
  nodes.forEach((node, index) => {
    node.position = {
      x: startX + index * spacing,
      y: centerY
    }
  })
}

/**
 * Hierarchical layout - attempts to minimize edge crossings by layering nodes
 */
function tryHierarchicalLayout(nodes, edges) {
  try {
    // Build adjacency information
    const adjacency = new Map()
    const inDegree = new Map()
    const outDegree = new Map()
    
    // Initialize maps
    nodes.forEach(node => {
      adjacency.set(node.id, { in: new Set(), out: new Set() })
      inDegree.set(node.id, 0)
      outDegree.set(node.id, 0)
    })
    
    // Build graph structure
    edges.forEach(edge => {
      const source = edge.source
      const target = edge.target
      
      adjacency.get(source)?.out.add(target)
      adjacency.get(target)?.in.add(source)
      outDegree.set(source, (outDegree.get(source) || 0) + 1)
      inDegree.set(target, (inDegree.get(target) || 0) + 1)
    })
    
    // Find root nodes (nodes with no incoming edges or marked as initial)
    const roots = nodes.filter(node => 
      node.data.isInitial || inDegree.get(node.id) === 0
    )
    
    if (roots.length === 0) {
      // If no clear roots, find nodes with minimum in-degree
      const minInDegree = Math.min(...Array.from(inDegree.values()))
      roots.push(...nodes.filter(node => inDegree.get(node.id) === minInDegree))
    }
    
    // Layer assignment using BFS from roots
    const layers = []
    const visited = new Set()
    const nodeToLayer = new Map()
    
    // Start with root layer
    let currentLayer = [...roots]
    let layerIndex = 0
    
    while (currentLayer.length > 0 && layerIndex < 10) { // Prevent infinite loops
      const layer = [...currentLayer]
      layers.push(layer)
      
      layer.forEach(node => {
        visited.add(node.id)
        nodeToLayer.set(node.id, layerIndex)
      })
      
      // Find next layer
      const nextLayer = new Set()
      currentLayer.forEach(node => {
        adjacency.get(node.id)?.out.forEach(targetId => {
          if (!visited.has(targetId)) {
            const targetNode = nodes.find(n => n.id === targetId)
            if (targetNode) {
              nextLayer.add(targetNode)
            }
          }
        })
      })
      
      currentLayer = Array.from(nextLayer)
      layerIndex++
    }
    
    // Add any remaining unvisited nodes to final layer
    const unvisited = nodes.filter(node => !visited.has(node.id))
    if (unvisited.length > 0) {
      layers.push(unvisited)
    }
    
    // Position nodes in layers
    const layerSpacing = 250
    const nodeSpacing = 180
    const startX = 100
    const startY = 100
    
    layers.forEach((layer, layerIndex) => {
      const y = startY + layerIndex * layerSpacing
      const totalWidth = Math.max(1, layer.length - 1) * nodeSpacing
      const startXForLayer = startX - totalWidth / 2
      
      layer.forEach((node, nodeIndex) => {
        node.position = {
          x: startXForLayer + nodeIndex * nodeSpacing,
          y: y
        }
      })
    })
    
    return true
  } catch (error) {
    console.warn('Hierarchical layout failed, falling back to force-directed:', error)
    return false
  }
}

/**
 * Force-directed layout using simplified Fruchterman-Reingold algorithm
 */
function applyForceDirectedLayout(nodes, edges) {
  const width = 800
  const height = 600
  const iterations = 100
  const initialTemp = Math.sqrt(width * height) / 10
  const finalTemp = 1
  
  // Initialize random positions
  nodes.forEach(node => {
    node.position = {
      x: Math.random() * width,
      y: Math.random() * height
    }
  })
  
  // Build edge map for faster lookup
  const edgeMap = new Map()
  edges.forEach(edge => {
    const sourceEdges = edgeMap.get(edge.source) || []
    sourceEdges.push(edge.target)
    edgeMap.set(edge.source, sourceEdges)
    
    const targetEdges = edgeMap.get(edge.target) || []
    targetEdges.push(edge.source)
    edgeMap.set(edge.target, targetEdges)
  })
  
  // Force-directed iterations
  for (let iter = 0; iter < iterations; iter++) {
    const temperature = initialTemp * Math.pow(finalTemp / initialTemp, iter / (iterations - 1))
    const forces = new Map()
    
    // Initialize forces
    nodes.forEach(node => {
      forces.set(node.id, { x: 0, y: 0 })
    })
    
    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]
        
        const dx = node1.position.x - node2.position.x
        const dy = node1.position.y - node2.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = (temperature * 50) / distance
        
        const force1 = forces.get(node1.id)
        const force2 = forces.get(node2.id)
        
        force1.x += (dx / distance) * repulsion
        force1.y += (dy / distance) * repulsion
        force2.x -= (dx / distance) * repulsion
        force2.y -= (dy / distance) * repulsion
      }
    }
    
    // Attractive forces for connected nodes
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source)
      const target = nodes.find(n => n.id === edge.target)
      
      if (source && target) {
        const dx = target.position.x - source.position.x
        const dy = target.position.y - source.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const attraction = (distance * distance) / (temperature * 10)
        
        const forceSource = forces.get(source.id)
        const forceTarget = forces.get(target.id)
        
        forceSource.x += (dx / distance) * attraction
        forceSource.y += (dy / distance) * attraction
        forceTarget.x -= (dx / distance) * attraction
        forceTarget.y -= (dy / distance) * attraction
      }
    })
    
    // Apply forces with temperature cooling
    nodes.forEach(node => {
      const force = forces.get(node.id)
      const forceLength = Math.sqrt(force.x * force.x + force.y * force.y) || 1
      const displacement = Math.min(forceLength, temperature)
      
      node.position.x += (force.x / forceLength) * displacement
      node.position.y += (force.y / forceLength) * displacement
      
      // Keep nodes within bounds
      node.position.x = Math.max(50, Math.min(width - 50, node.position.x))
      node.position.y = Math.max(50, Math.min(height - 50, node.position.y))
    })
  }
  
  // Center the graph
  if (nodes.length > 0) {
    const minX = Math.min(...nodes.map(n => n.position.x))
    const maxX = Math.max(...nodes.map(n => n.position.x))
    const minY = Math.min(...nodes.map(n => n.position.y))
    const maxY = Math.max(...nodes.map(n => n.position.y))
    
    const centerX = width / 2
    const centerY = height / 2
    const graphCenterX = (minX + maxX) / 2
    const graphCenterY = (minY + maxY) / 2
    
    const offsetX = centerX - graphCenterX
    const offsetY = centerY - graphCenterY
    
    nodes.forEach(node => {
      node.position.x += offsetX
      node.position.y += offsetY
    })
  }
}

export default DotGraphViewer