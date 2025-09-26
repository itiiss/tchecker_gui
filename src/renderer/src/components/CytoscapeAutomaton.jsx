import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Box, Tooltip, IconButton } from '@mui/material'
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  AccountTree as LayoutIcon,
  Timeline as TimelineIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { select, pointer as d3Pointer } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import { drag } from 'd3-drag'
import 'd3-transition'

/* eslint-disable react/prop-types */

const NODE_RADIUS = 38
const EDGE_OFFSET_STEP = 40
const LOOP_RADIUS = 60

function buildPositionMap(nodes) {
  const map = new Map()
  nodes.forEach((node) => {
    map.set(node.id, {
      x: node.x ?? 0,
      y: node.y ?? 0,
      data: node.data || {}
    })
  })
  return map
}

function createNodeLines(node) {
  const data = node.data || {}
  const lines = []
  const name = data.locationName || (node.id.includes('.') ? node.id.split('.').pop() : node.id)
  if (name) lines.push(name)
  if (data.invariant && data.invariant.trim() && data.invariant.trim() !== 'true') {
    lines.push(data.invariant.trim())
  }
  if (Array.isArray(data.labels) && data.labels.length > 0) {
    lines.push(data.labels.join(', '))
  }
  return lines
}

function createEdgeLabel(edgeData) {
  if (!edgeData) return ''
  const parts = []
  if (edgeData.guard && edgeData.guard.trim() && edgeData.guard.trim() !== 'true') {
    parts.push(`[${edgeData.guard.trim()}]`)
  }
  if (edgeData.action && edgeData.action.trim()) {
    parts.push(edgeData.action.trim())
  }
  return parts.join(' / ')
}

function buildEdgeMeta(edges) {
  const directionGroups = new Map()
  const undirectedGroups = new Map()

  edges.forEach((edge) => {
    const dirKey = `${edge.source}->${edge.target}`
    if (!directionGroups.has(dirKey)) directionGroups.set(dirKey, [])
    directionGroups.get(dirKey).push(edge)

    const unorderedKey = [edge.source, edge.target].sort().join('<->')
    if (!undirectedGroups.has(unorderedKey)) undirectedGroups.set(unorderedKey, [])
    undirectedGroups.get(unorderedKey).push(edge)
  })

  const meta = new Map()
  edges.forEach((edge) => {
    const dirKey = `${edge.source}->${edge.target}`
    const unorderedKey = [edge.source, edge.target].sort().join('<->')
    const sameDirection = directionGroups.get(dirKey) || []
    const undirected = undirectedGroups.get(unorderedKey) || []
    const undirectedSorted = [...undirected].sort((a, b) => {
      if (a.source === b.source) {
        if (a.target === b.target) {
          return a.id.localeCompare(b.id)
        }
        return a.target.localeCompare(b.target)
      }
      return a.source.localeCompare(b.source)
    })
    const sameDirectionIndex = Math.max(
      sameDirection.findIndex((item) => item.id === edge.id),
      0
    )
    const undirectedIndex = Math.max(
      undirectedSorted.findIndex((item) => item.id === edge.id),
      0
    )

    meta.set(edge.id, {
      sameDirectionCount: sameDirection.length,
      sameDirectionIndex,
      totalParallel: undirected.length,
      undirectedIndex,
      isSelfLoop: edge.source === edge.target
    })
  })

  return meta
}

function computeEdgeGeometry(edge, meta, positionsMap) {
  const source = positionsMap.get(edge.source)
  const target = positionsMap.get(edge.target)
  const label = createEdgeLabel(edge.data)

  if (!source || !target) {
    return {
      path: '',
      labelX: 0,
      labelY: 0,
      label
    }
  }

  if (meta?.isSelfLoop) {
    const sameDirectionCount = meta?.sameDirectionCount || 1
    const sameDirectionIndex = meta?.sameDirectionIndex || 0
    const offsetIndex = sameDirectionIndex - (sameDirectionCount - 1) / 2
    const loopRadius = LOOP_RADIUS + Math.abs(offsetIndex) * (EDGE_OFFSET_STEP * 0.45)
    const angleSpread = Math.PI * 0.6
    const angleOffset = offsetIndex * 0.25

    const startAngle = -Math.PI / 2 + angleSpread / 2 + angleOffset
    const endAngle = -Math.PI / 2 - angleSpread / 2 + angleOffset

    const startX = source.x + Math.cos(startAngle) * NODE_RADIUS
    const startY = source.y + Math.sin(startAngle) * NODE_RADIUS
    const endX = source.x + Math.cos(endAngle) * NODE_RADIUS
    const endY = source.y + Math.sin(endAngle) * NODE_RADIUS

    const verticalLift = NODE_RADIUS + loopRadius + Math.abs(offsetIndex) * 12
    const controlY = source.y - verticalLift
    const control1X = source.x + Math.cos(startAngle) * loopRadius
    const control2X = source.x + Math.cos(endAngle) * loopRadius

    const path = `M ${startX} ${startY} C ${control1X} ${controlY} ${control2X} ${controlY} ${endX} ${endY}`

    return {
      path,
      labelX: source.x + offsetIndex * 24,
      labelY: controlY - 14,
      label
    }
  }

  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.hypot(dx, dy) || 1
  const normX = dx / distance
  const normY = dy / distance
  const startX = source.x + normX * NODE_RADIUS
  const startY = source.y + normY * NODE_RADIUS
  const endX = target.x - normX * NODE_RADIUS
  const endY = target.y - normY * NODE_RADIUS

  const canonicalSourceId = edge.source < edge.target ? edge.source : edge.target
  const canonicalTargetId = edge.source < edge.target ? edge.target : edge.source
  const canonicalSource = positionsMap.get(canonicalSourceId) || source
  const canonicalTarget = positionsMap.get(canonicalTargetId) || target
  const cdx = canonicalTarget.x - canonicalSource.x
  const cdy = canonicalTarget.y - canonicalSource.y
  const cdistance = Math.hypot(cdx, cdy) || 1
  const perpendicularX = -cdy / cdistance
  const perpendicularY = cdx / cdistance

  const sameDirectionCount = meta?.sameDirectionCount || 1
  const sameDirectionIndex = meta?.sameDirectionIndex || 0
  const pairCount = meta?.totalParallel || 1
  const pairIndex = meta?.undirectedIndex || 0

  let offset = 0

  if (sameDirectionCount > 1) {
    const offsetIndex = sameDirectionIndex - (sameDirectionCount - 1) / 2
    offset = EDGE_OFFSET_STEP * offsetIndex
  } else if (pairCount > 1) {
    const pairOffsetIndex = pairIndex - (pairCount - 1) / 2
    offset = EDGE_OFFSET_STEP * pairOffsetIndex
  }

  if (offset !== 0) {
    const controlX = (startX + endX) / 2 + perpendicularX * offset
    const controlY = (startY + endY) / 2 + perpendicularY * offset
    return {
      path: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
      labelX: controlX,
      labelY: controlY - 6,
      label
    }
  }

  return {
    path: `M ${startX} ${startY} L ${endX} ${endY}`,
    labelX: (startX + endX) / 2,
    labelY: (startY + endY) / 2 - 6,
    label
  }
}

function getNodeVisual(node, isSource) {
  const data = node.data || {}
  let stroke = '#424242'
  let strokeWidth = 2
  let strokeDasharray = null
  let fill = '#f5f5f5'

  if (data.isInitial) {
    stroke = '#2e7d32'
    strokeWidth = 4
  }
  if (data.isUrgent) {
    stroke = '#f57c00'
    strokeWidth = 4
    strokeDasharray = '6 3'
    fill = '#fff3e0'
  }
  if (data.isCommitted) {
    stroke = '#7b1fa2'
    strokeWidth = 4
    strokeDasharray = '2 2'
    fill = '#f3e5f5'
  }
  if (data.isCurrentLocation) {
    stroke = '#d32f2f'
    strokeWidth = 5
    strokeDasharray = null
    fill = '#ffcdd2'
  }
  if (isSource) {
    stroke = '#ff5722'
    strokeWidth = 4
    strokeDasharray = null
    fill = '#ffccbc'
  }

  return { stroke, strokeWidth, strokeDasharray, fill }
}

const CytoscapeAutomaton = ({
  nodes = [],
  edges = [],
  mode = 'select',
  autoCenter = false,
  showToolbar = true,
  onNodeUpdate,
  onEdgeUpdate,
  onEdgeCreate,
  onNodeDelete,
  onEdgeDelete,
  onNodeCreate,
  onModeChange
}) => {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const gRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const transformRef = useRef(zoomIdentity)
  const nodesPositionRef = useRef(new Map())
  const dragPositionsRef = useRef(new Map())
  const dragRafRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [edgeSourceNode, setEdgeSourceNode] = useState(null)
  const [editingNode, setEditingNode] = useState(null)
  const [editingEdge, setEditingEdge] = useState(null)
  const [dragPositionsSnapshot, setDragPositionsSnapshot] = useState(new Map())

  const triggerDragRerender = useCallback(() => {
    if (dragRafRef.current !== null) return
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null
      setDragPositionsSnapshot(new Map(dragPositionsRef.current))
    })
  }, [])

  const normalizedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        x: dragPositionsSnapshot.get(node.id)?.x ?? node.position?.x ?? 0,
        y: dragPositionsSnapshot.get(node.id)?.y ?? node.position?.y ?? 0,
        data: node.data || {}
      })),
    [nodes, dragPositionsSnapshot]
  )

  useEffect(() => {
    nodesPositionRef.current = buildPositionMap(normalizedNodes)
  }, [normalizedNodes])

  useEffect(
    () => () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current)
      }
    },
    []
  )

  useEffect(() => {
    const validIds = new Set(nodes.map((node) => node.id))
    let removed = false
    for (const key of dragPositionsRef.current.keys()) {
      if (!validIds.has(key)) {
        dragPositionsRef.current.delete(key)
        removed = true
      }
    }
    if (removed) {
      triggerDragRerender()
    }
  }, [nodes, triggerDragRerender])

  const edgeMetaMap = useMemo(() => buildEdgeMeta(edges), [edges])
  const nodesById = useMemo(() => buildPositionMap(normalizedNodes), [normalizedNodes])

  const edgesToRender = useMemo(
    () =>
      edges.map((edge) => {
        const meta = edgeMetaMap.get(edge.id)
        const geometry = computeEdgeGeometry(edge, meta, nodesById)
        return {
          edge,
          geometry
        }
      }),
    [edges, edgeMetaMap, nodesById]
  )

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        })
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = select(svgRef.current)
    const g = select(gRef.current)
    const zoomBehavior = zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        transformRef.current = event.transform
      })

    svg.call(zoomBehavior)
    zoomBehaviorRef.current = zoomBehavior
    transformRef.current = zoomIdentity

    return () => {
      svg.on('.zoom', null)
    }
  }, [])

  const updateConnectedEdgesDuringDrag = useCallback(
    (nodeId) => {
      if (!gRef.current) return
      const g = select(gRef.current)
      const positionsMap = nodesPositionRef.current

      edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .forEach((edge) => {
          const meta = edgeMetaMap.get(edge.id)
          const geometry = computeEdgeGeometry(edge, meta, positionsMap)
          const edgeGroup = g.select(`.edge-group[data-edge-id="${edge.id}"]`)
          const visualPath = edgeGroup.select('path.edge-visual')
          if (!visualPath.empty()) {
            visualPath.attr('d', geometry.path)
          }
          const hitboxPath = edgeGroup.select('path.edge-hitbox')
          if (!hitboxPath.empty()) {
            hitboxPath.attr('d', geometry.path)
          }
          const textSelection = edgeGroup.select('text')
          if (!textSelection.empty()) {
            textSelection.attr('x', geometry.labelX).attr('y', geometry.labelY).text(geometry.label)
          }
        })
    },
    [edges, edgeMetaMap]
  )

  useEffect(() => {
    if (!gRef.current || !svgRef.current) return

    const g = select(gRef.current)
    const svg = select(svgRef.current)
    const nodeSelection = g.selectAll('.node-group')
    const nodeById = new Map(normalizedNodes.map((node) => [node.id, node]))

    nodeSelection.each(function () {
      const nodeId = select(this).attr('data-node-id')
      const datum = nodeById.get(nodeId)
      if (datum) {
        select(this).datum({ ...datum })
      }
    })

    const dragBehavior = drag()
      .on('start', function (event, d) {
        if (!d) return
        select(this).raise().classed('dragging', true)
        dragPositionsRef.current.set(d.id, {
          x: d.x,
          y: d.y
        })
        triggerDragRerender()
      })
      .on('drag', function (event, d) {
        if (!d) return
        const sourceEvent = event.sourceEvent || event
        const [px, py] = d3Pointer(sourceEvent, svg.node())
        const transform = transformRef.current || zoomIdentity
        const [x, y] = transform.invert([px, py])
        d.x = x
        d.y = y
        nodesPositionRef.current.set(d.id, {
          ...nodesPositionRef.current.get(d.id),
          x,
          y
        })
        dragPositionsRef.current.set(d.id, { x, y })
        triggerDragRerender()
        updateConnectedEdgesDuringDrag(d.id)
      })
      .on('end', function (event, d) {
        if (!d) return
        select(this).classed('dragging', false)
        const latest = nodesPositionRef.current.get(d.id) || d
        dragPositionsRef.current.delete(d.id)
        triggerDragRerender()
        if (onNodeUpdate) {
          onNodeUpdate(d.id, {
            position: {
              x: latest.x,
              y: latest.y
            }
          })
        }
      })

    nodeSelection.call(dragBehavior)

    return () => {
      nodeSelection.on('.drag', null)
    }
  }, [normalizedNodes, updateConnectedEdgesDuringDrag, onNodeUpdate, triggerDragRerender])

  const cancelEdgeCreation = useCallback(() => {
    setIsCreatingEdge(false)
    setEdgeSourceNode(null)
  }, [])

  useEffect(() => {
    if (mode === 'add-node') {
      cancelEdgeCreation()
    }
  }, [mode, cancelEdgeCreation])

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    select(svgRef.current).transition().duration(150).call(zoomBehaviorRef.current.scaleBy, 1.2)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    select(svgRef.current).transition().duration(150).call(zoomBehaviorRef.current.scaleBy, 0.8)
  }, [])

  const handleCenter = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || normalizedNodes.length === 0) return
    const padding = 80
    const xs = normalizedNodes.map((node) => node.x)
    const ys = normalizedNodes.map((node) => node.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const graphWidth = Math.max(maxX - minX, 1)
    const graphHeight = Math.max(maxY - minY, 1)
    const width = dimensions.width || 1
    const height = dimensions.height || 1

    const scale = Math.min(
      Math.min((width - padding) / graphWidth, (height - padding) / graphHeight),
      3
    )
    const k = Math.max(scale, 0.3)
    const tx = width / 2 - ((minX + maxX) / 2) * k
    const ty = height / 2 - ((minY + maxY) / 2) * k

    select(svgRef.current)
      .transition()
      .duration(200)
      .call(zoomBehaviorRef.current.transform, zoomIdentity.translate(tx, ty).scale(k))
  }, [dimensions.height, dimensions.width, normalizedNodes])

  useEffect(() => {
    if (autoCenter && normalizedNodes.length > 0) {
      handleCenter()
    }
  }, [autoCenter, normalizedNodes, handleCenter])

  const handleLayout = useCallback(() => {
    if (!normalizedNodes.length || !onNodeUpdate) return
    const width = dimensions.width || 400
    const height = dimensions.height || 400
    const radius = Math.max(Math.min(width, height) / 2 - 80, 120)
    const centerX = width / 2
    const centerY = height / 2

    normalizedNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / normalizedNodes.length
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      onNodeUpdate(node.id, {
        position: { x, y }
      })
    })
  }, [dimensions.height, dimensions.width, normalizedNodes, onNodeUpdate])

  const handleSelectMode = useCallback(() => {
    cancelEdgeCreation()
    if (onModeChange) {
      onModeChange('select')
    }
  }, [cancelEdgeCreation, onModeChange])

  const handleAddNodeMode = useCallback(() => {
    cancelEdgeCreation()
    if (onModeChange) {
      onModeChange('add-node')
    }
  }, [cancelEdgeCreation, onModeChange])

  const handleToggleEdgeMode = useCallback(() => {
    if (isCreatingEdge) {
      cancelEdgeCreation()
    } else {
      setIsCreatingEdge(true)
      setEdgeSourceNode(null)
      if (onModeChange) {
        onModeChange('select')
      }
    }
  }, [isCreatingEdge, cancelEdgeCreation, onModeChange])

  const handleBackgroundClick = useCallback(
    (event) => {
      if (!svgRef.current) return
      if (mode === 'add-node' && onNodeCreate) {
        const [px, py] = d3Pointer(event.nativeEvent, svgRef.current)
        const transform = transformRef.current || zoomIdentity
        const [x, y] = transform.invert([px, py])
        onNodeCreate({ x, y })
      } else if (isCreatingEdge) {
        cancelEdgeCreation()
      }
    },
    [cancelEdgeCreation, isCreatingEdge, mode, onNodeCreate]
  )

  const handleNodeClick = useCallback(
    (event, node) => {
      event.stopPropagation()
      if (isCreatingEdge) {
        if (!edgeSourceNode) {
          setEdgeSourceNode(node.id)
        } else if (edgeSourceNode !== node.id) {
          if (onEdgeCreate) {
            onEdgeCreate(edgeSourceNode, node.id)
          }
          cancelEdgeCreation()
        }
      }
    },
    [cancelEdgeCreation, edgeSourceNode, isCreatingEdge, onEdgeCreate]
  )

  const handleNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault()
      event.stopPropagation()
      if (!onNodeUpdate) return
      const data = node.data || {}
      setEditingNode({
        id: node.id,
        locationName: data.locationName || '',
        invariant: data.invariant || '',
        labels: Array.isArray(data.labels) ? data.labels : [],
        isInitial: !!data.isInitial,
        isUrgent: !!data.isUrgent,
        isCommitted: !!data.isCommitted
      })
    },
    [onNodeUpdate]
  )

  const handleEdgeContextMenu = useCallback(
    (event, edge) => {
      event.preventDefault()
      event.stopPropagation()
      if (!onEdgeUpdate) return
      const data = edge.data || {}
      setEditingEdge({
        id: edge.id,
        event: data.event || '',
        guard: data.guard || '',
        action: data.action || ''
      })
    },
    [onEdgeUpdate]
  )

  const handleNodeUpdate = useCallback(
    (nodeId, updatedData) => {
      if (onNodeUpdate) {
        onNodeUpdate(nodeId, updatedData)
      }
    },
    [onNodeUpdate]
  )

  const handleNodeDelete = useCallback(
    (nodeId) => {
      if (onNodeDelete) {
        onNodeDelete(nodeId)
      }
    },
    [onNodeDelete]
  )

  const handleEdgeUpdate = useCallback(
    (edgeId, updatedData) => {
      if (onEdgeUpdate) {
        onEdgeUpdate(edgeId, updatedData)
      }
    },
    [onEdgeUpdate]
  )

  const handleEdgeDelete = useCallback(
    (edgeId) => {
      if (onEdgeDelete) {
        onEdgeDelete(edgeId)
      }
    },
    [onEdgeDelete]
  )

  return (
    <Box ref={containerRef} sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {showToolbar && (
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 2,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
        <Tooltip title="放大">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="缩小">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="居中适配">
          <IconButton onClick={handleCenter} size="small">
            <CenterIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="圆形布局">
          <IconButton onClick={handleLayout} size="small">
            <LayoutIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={mode === 'select' ? '查看模式 (当前)' : '切换到查看模式'}>
          <IconButton
            onClick={handleSelectMode}
            size="small"
            color={mode === 'select' ? 'primary' : 'default'}
            sx={{
              backgroundColor: mode === 'select' ? '#e3f2fd' : 'transparent',
              '&:hover': {
                backgroundColor: mode === 'select' ? '#bbdefb' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={mode === 'add-node' ? '创建节点模式 (当前)' : '切换到创建节点模式'}>
          <IconButton
            onClick={handleAddNodeMode}
            size="small"
            color={mode === 'add-node' ? 'primary' : 'default'}
            sx={{
              backgroundColor: mode === 'add-node' ? '#e8f5e8' : 'transparent',
              '&:hover': {
                backgroundColor: mode === 'add-node' ? '#c8e6c9' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <AddCircleOutlineIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={isCreatingEdge ? '取消创建边' : '创建边模式'}>
          <IconButton
            onClick={handleToggleEdgeMode}
            size="small"
            color={isCreatingEdge ? 'secondary' : 'default'}
            sx={{
              backgroundColor: isCreatingEdge ? '#ffeb3b' : 'transparent',
              '&:hover': {
                backgroundColor: isCreatingEdge ? '#fdd835' : 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <TimelineIcon />
          </IconButton>
        </Tooltip>
        </Box>
      )}

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{
          backgroundColor: '#fafafa',
          cursor: mode === 'add-node' ? 'crosshair' : 'default'
        }}
        onClick={handleBackgroundClick}
      >
        <defs>
          <marker
            id="edge-arrow"
            viewBox="0 -5 10 10"
            refX="10"
            refY="0"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,-5L10,0L0,5" fill="#616161" />
          </marker>
        </defs>
        <g ref={gRef}>
          {edgesToRender.map(({ edge, geometry }) => (
            <g
              key={edge.id}
              className="edge-group"
              data-edge-id={edge.id}
              onContextMenu={(event) => handleEdgeContextMenu(event, edge)}
            >
              <path
                className="edge-visual"
                data-source={edge.source}
                data-target={edge.target}
                d={geometry.path}
                fill="none"
                stroke="#616161"
                strokeWidth={2}
                markerEnd="url(#edge-arrow)"
              />
              <path
                className="edge-hitbox"
                d={geometry.path}
                fill="none"
                stroke="transparent"
                strokeWidth={18}
                pointerEvents="stroke"
                style={{ cursor: 'pointer' }}
                onContextMenu={(event) => handleEdgeContextMenu(event, edge)}
              />
              {geometry.label && (
                <text
                  x={geometry.labelX}
                  y={geometry.labelY}
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize={10}
                  fill="#424242"
                  pointerEvents="auto"
                  style={{ cursor: 'pointer' }}
                  onContextMenu={(event) => handleEdgeContextMenu(event, edge)}
                >
                  {geometry.label}
                </text>
              )}
            </g>
          ))}
          {normalizedNodes.map((node) => {
            const isSource = isCreatingEdge && edgeSourceNode === node.id
            const { stroke, strokeWidth, strokeDasharray, fill } = getNodeVisual(node, isSource)
            const lines = createNodeLines(node)
            return (
              <g
                key={node.id}
                className="node-group"
                data-node-id={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(event) => handleNodeClick(event, node)}
                onContextMenu={(event) => handleNodeContextMenu(event, node)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  r={NODE_RADIUS}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray || undefined}
                />
                <text
                  textAnchor="middle"
                  fontFamily="monospace"
                  fontSize={11}
                  fill="#333"
                  dominantBaseline="middle"
                >
                  {lines.map((line, index) => (
                    <tspan key={line + index} x={0} dy={index === 0 ? 0 : '1.2em'}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {editingNode &&
        createPortal(
          <NodeEditorModal
            nodeData={editingNode}
            onClose={() => setEditingNode(null)}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
          />,
          document.body
        )}

      {editingEdge &&
        createPortal(
          <EdgeEditorModal
            edgeData={editingEdge}
            onClose={() => setEditingEdge(null)}
            onUpdate={handleEdgeUpdate}
            onDelete={handleEdgeDelete}
          />,
          document.body
        )}
    </Box>
  )
}

function NodeEditorModal({ nodeData, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(nodeData)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUrgentCommittedChange = (field, checked) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: checked }
      if (checked) {
        if (field === 'isUrgent') next.isCommitted = false
        if (field === 'isCommitted') next.isUrgent = false
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (onUpdate) {
      onUpdate(formData.id, formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (
      onDelete &&
      window.confirm(
        `确定要删除节点 "${formData.locationName}" 吗？这将同时删除所有连接到该节点的边。`
      )
    ) {
      onDelete(formData.id)
      onClose()
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalHeaderStyle}>Edit Location</h3>
        <div style={fieldStyle}>
          <label>Name:</label>
          <input
            type="text"
            value={formData.locationName || ''}
            onChange={(e) => handleChange('locationName', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label>Invariant:</label>
          <input
            type="text"
            value={formData.invariant || ''}
            onChange={(e) => handleChange('invariant', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label>Labels:</label>
          <input
            type="text"
            value={formData.labels?.join(', ') || ''}
            onChange={(e) =>
              handleChange(
                'labels',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter((s) => s)
              )
            }
            style={inputStyle}
          />
        </div>
        <hr style={dividerStyle} />
        <div style={checkboxGroupStyle}>
          <label>
            <input
              type="checkbox"
              checked={!!formData.isInitial}
              onChange={(e) => handleChange('isInitial', e.target.checked)}
            />
            Initial
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!formData.isUrgent}
              onChange={(e) => handleUrgentCommittedChange('isUrgent', e.target.checked)}
            />
            Urgent
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!formData.isCommitted}
              onChange={(e) => handleUrgentCommittedChange('isCommitted', e.target.checked)}
            />
            Committed
          </label>
        </div>
        <div style={modalActionsStyle}>
          <button onClick={handleDelete} style={deleteButtonStyle}>
            Delete
          </button>
          <div>
            <button onClick={onClose} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button onClick={handleConfirm} style={primaryButtonStyle}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EdgeEditorModal({ edgeData, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(edgeData)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfirm = () => {
    if (onUpdate) {
      onUpdate(formData.id, formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这条边吗？')) {
      onDelete(formData.id)
      onClose()
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalHeaderStyle}>Edit Transition</h3>
        <div style={fieldStyle}>
          <label>Event:</label>
          <input
            type="text"
            value={formData.event || ''}
            onChange={(e) => handleChange('event', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label>Guard:</label>
          <input
            type="text"
            value={formData.guard || ''}
            onChange={(e) => handleChange('guard', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label>Action:</label>
          <input
            type="text"
            value={formData.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={modalActionsStyle}>
          <button onClick={handleDelete} style={deleteButtonStyle}>
            Delete
          </button>
          <div>
            <button onClick={onClose} style={secondaryButtonStyle}>
              Cancel
            </button>
            <button onClick={handleConfirm} style={primaryButtonStyle}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1300
}

const modalContentStyle = {
  width: '360px',
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
}

const modalHeaderStyle = {
  margin: 0,
  borderBottom: '1px solid #eee',
  paddingBottom: '10px'
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const inputStyle = {
  padding: '8px',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontFamily: 'inherit'
}

const checkboxGroupStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '6px'
}

const modalActionsStyle = {
  marginTop: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}

const deleteButtonStyle = {
  backgroundColor: '#f5f5f5',
  color: '#d32f2f',
  border: '1px solid #d32f2f',
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'pointer'
}

const secondaryButtonStyle = {
  backgroundColor: '#f5f5f5',
  color: '#424242',
  border: '1px solid #bdbdbd',
  padding: '6px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '8px'
}

const primaryButtonStyle = {
  backgroundColor: '#1976d2',
  color: '#fff',
  border: 'none',
  padding: '6px 14px',
  borderRadius: '4px',
  cursor: 'pointer'
}

const dividerStyle = {
  border: 'none',
  borderTop: '1px solid #eee',
  margin: '12px 0'
}

export default CytoscapeAutomaton
