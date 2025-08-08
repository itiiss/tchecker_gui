import React, { useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import CytoscapeComponent from 'react-cytoscapejs'
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

const CytoscapeAutomaton = ({ 
  nodes = [], 
  edges = [], 
  mode = 'select',
  onNodeUpdate, 
  onEdgeUpdate, 
  onEdgeCreate, 
  onNodeDelete,
  onEdgeDelete,
  onNodeCreate,
  onModeChange
}) => {
  const cyRef = useRef(null)
  const [editingNode, setEditingNode] = useState(null)
  const [editingEdge, setEditingEdge] = useState(null)
  
  // Track the last state to avoid unnecessary re-renders
  const lastCurrentStateRef = useRef(null)

  // 创建节点标签（包含名称和invariant）
  function createNodeLabel(nodeData) {
    const name = nodeData?.locationName || nodeData?.label || nodeData?.id || ''
    const invariant = nodeData?.invariant && nodeData.invariant !== 'true' ? nodeData.invariant : ''
    
    if (invariant) {
      return `${name}\n${invariant}`
    }
    return name
  }

  // 转换节点数据格式 - 优化为只包含基础数据，不包含状态类
  const cytoscapeElements = React.useMemo(() => [
    ...nodes.map(node => ({
      data: {
        id: node.id,
        label: createNodeLabel(node.data),
        ...node.data
      },
      position: node.position,
      // 初始不设置状态类，通过动态更新处理
      classes: ''
    })),
    ...edges.map((edge) => {
      // 计算平行边的偏移
      const parallelEdges = edges.filter(e => 
        (e.source === edge.source && e.target === edge.target) ||
        (e.source === edge.target && e.target === edge.source)
      )
      
      const sameDirectionEdges = edges.filter(e => 
        e.source === edge.source && e.target === edge.target
      )
      
      const edgeIndex = sameDirectionEdges.findIndex(e => e.id === edge.id)
      const totalParallel = parallelEdges.length
      
      return {
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: createEdgeLabel(edge.data),
          edgeIndex,
          totalParallel,
          ...edge.data
        },
        classes: totalParallel > 1 ? `parallel-edge parallel-${edgeIndex}` : ''
      }
    })
  ], [nodes, edges]) // Re-create when nodes or edges change

  // 创建边标签
  function createEdgeLabel(edgeData) {
    if (!edgeData) return ''
    const parts = []
    if (edgeData.guard && edgeData.guard !== 'true') {
      parts.push(`[${edgeData.guard}]`)
    }
    if (edgeData.action) {
      parts.push(edgeData.action)
    }
    return parts.join(' / ')
  }

  // Cytoscape样式配置
  const stylesheet = [
    // 基础节点样式 - 添加过渡效果
    {
      selector: 'node',
      style: {
        'background-color': '#f5f5f5',
        'border-width': 2,
        'border-color': '#424242',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-family': 'monospace',
        'font-size': '10px',
        'font-weight': 'normal',
        'color': '#333',
        'width': 80,
        'height': 80,
        'shape': 'ellipse',
        'text-wrap': 'wrap',
        'text-max-width': '70px',
        'transition-property': 'background-color, border-color, border-width, box-shadow',
        'transition-duration': '300ms',
        'transition-timing-function': 'ease-out'
      }
    },
    // Initial状态：绿色双重边框
    {
      selector: 'node.initial-state',
      style: {
        'border-width': 4,
        'border-color': '#2e7d32',
        'border-style': 'double',
        'background-color': '#e8f5e8'
      }
    },
    // Urgent状态：橙色虚线边框  
    {
      selector: 'node.urgent-state',
      style: {
        'border-width': 4,
        'border-color': '#f57c00',
        'background-color': '#fff3e0',
        'border-style': 'dashed'
      }
    },
    // Committed状态：紫色点线边框
    {
      selector: 'node.committed-state',
      style: {
        'border-width': 4,
        'border-color': '#7b1fa2',
        'background-color': '#f3e5f5',
        'border-style': 'dotted'
      }
    },
    // Initial + Urgent组合
    {
      selector: 'node.initial-state.urgent-state',
      style: {
        'border-width': 5,
        'border-color': '#f57c00',
        'background-color': '#fff3e0',
        'border-style': 'solid',
        'box-shadow': 'inset 0 0 0 3px #2e7d32'
      }
    },
    // Initial + Committed组合
    {
      selector: 'node.initial-state.committed-state',
      style: {
        'border-width': 5,
        'border-color': '#7b1fa2',
        'background-color': '#f3e5f5',
        'border-style': 'solid',
        'box-shadow': 'inset 0 0 0 3px #2e7d32'
      }
    },
    // 当前位置节点 - 添加平滑过渡效果
    {
      selector: 'node.current-state',
      style: {
        'background-color': '#ffcdd2',
        'border-color': '#d32f2f',
        'border-width': 5,
        'border-style': 'solid',
        'box-shadow': '0 0 15px #d32f2f',
        'transition-property': 'background-color, border-color, border-width, box-shadow',
        'transition-duration': '300ms',
        'transition-timing-function': 'ease-out'
      }
    },
    // 边样式 - 直线，标签位置优化
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#616161',
        'target-arrow-color': '#616161',
        'target-arrow-shape': 'triangle',
        'curve-style': 'straight',
        'arrow-scale': 1.0,
        'font-family': 'monospace',
        'font-size': '8px',
        'font-weight': 'normal',
        'color': '#424242',
        'text-background-color': 'white',
        'text-background-opacity': 0.9,
        'text-background-padding': '2px',
        'text-border-width': 1,
        'text-border-color': '#bdbdbd',
        'text-border-opacity': 0.8,
        'label': 'data(label)',
        'text-rotation': 'none',
        'source-text-offset': 15,
        'target-text-offset': 15,
        'text-margin-y': -10
      }
    },
    // 自环边样式
    {
      selector: 'edge[source = target]',
      style: {
        'curve-style': 'loop',
        'loop-direction': '-45deg',
        'loop-sweep': '60deg',
        'source-distance-from-node': 10,
        'target-distance-from-node': 10,
        'text-margin-y': -20 // 自环边标签更向上
      }
    },
    // 选中状态 - 去除蓝色
    {
      selector: ':selected',
      style: {
        'overlay-color': '#757575',
        'overlay-opacity': 0.2
      }
    },
    // 边创建源节点高亮
    {
      selector: 'node.edge-source',
      style: {
        'border-color': '#ff5722',
        'border-width': 4,
        'background-color': '#ffccbc'
      }
    },
    // 平行边样式
    {
      selector: 'edge.parallel-edge',
      style: {
        'curve-style': 'bezier',
        'control-point-step-size': 40
      }
    },
    {
      selector: 'edge.parallel-0',
      style: {
        'control-point-distance': -20,
        'control-point-weight': 0.5
      }
    },
    {
      selector: 'edge.parallel-1', 
      style: {
        'control-point-distance': 20,
        'control-point-weight': 0.5
      }
    },
    {
      selector: 'edge.parallel-2',
      style: {
        'control-point-distance': -40,
        'control-point-weight': 0.5
      }
    },
    {
      selector: 'edge.parallel-3',
      style: {
        'control-point-distance': 40,
        'control-point-weight': 0.5
      }
    },
    // hover状态
    {
      selector: 'node:hover',
      style: {
        'border-color': '#2196f3',
        'border-width': 3
      }
    },
    {
      selector: 'edge:hover',
      style: {
        'width': 3,
        'line-color': '#2196f3',
        'target-arrow-color': '#2196f3'
      }
    }
  ]

  // Cytoscape配置
  const cytoscapeConfig = {
    layout: {
      name: 'preset', // 使用预设位置
      fit: true,
      padding: 50
    },
    wheelSensitivity: 0.2,
    maxZoom: 3,
    minZoom: 0.3,
    userPanningEnabled: true,
    userZoomingEnabled: true,
    boxSelectionEnabled: false
  }

  // 工具栏操作
  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2)
      cyRef.current.center()
    }
  }, [])

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8)
      cyRef.current.center()
    }
  }, [])

  const handleCenter = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(50)
    }
  }, [])

  const handleLayout = useCallback(() => {
    if (cyRef.current) {
      // 应用圆形布局
      const layout = cyRef.current.layout({
        name: 'circle',
        radius: 200,
        spacingFactor: 1.5,
        avoidOverlap: true
      })
      layout.run()
    }
  }, [])

  // 边创建相关状态
  const [isCreatingEdge, setIsCreatingEdge] = useState(false)
  const [edgeSourceNode, setEdgeSourceNode] = useState(null)
  const [tempEdge, setTempEdge] = useState(null)


  // 更新节点样式类 - 优化版本，只在状态真正改变时更新
  const updateNodeClasses = useCallback(() => {
    if (!cyRef.current) return
    
    const cy = cyRef.current
    
    // 批量更新，减少DOM操作
    cy.batch(() => {
      nodes.forEach(node => {
        const cyNode = cy.getElementById(node.id)
        if (cyNode.length) {
          // 计算新的状态类
          const newClasses = [
            node.data?.isInitial ? 'initial-state' : '',
            node.data?.isUrgent ? 'urgent-state' : '', 
            node.data?.isCommitted ? 'committed-state' : '',
            node.data?.isCurrentLocation ? 'current-state' : ''
          ].filter(Boolean)
          
          // 获取当前类
          const currentClasses = cyNode.classes() || []
          const currentStateClasses = currentClasses.filter(cls => 
            ['initial-state', 'urgent-state', 'committed-state', 'current-state'].includes(cls)
          )
          
          // 只有在类实际改变时才更新
          const newClassesStr = newClasses.sort().join(' ')
          const currentClassesStr = currentStateClasses.sort().join(' ')
          
          if (newClassesStr !== currentClassesStr) {
            // 清除旧的状态类
            cyNode.removeClass('initial-state urgent-state committed-state current-state')
            // 添加新的状态类
            if (newClasses.length > 0) {
              cyNode.addClass(newClasses.join(' '))
            }
          }
        }
      })
    })
  }, [nodes])

  // 监听节点数据变化并更新样式和标签
  React.useEffect(() => {
    if (!cyRef.current) return

    const updateId = requestAnimationFrame(() => {
      const cy = cyRef.current
      
      // 批量更新节点标签和样式
      cy.batch(() => {
        nodes.forEach(node => {
          const cyNode = cy.getElementById(node.id)
          if (cyNode.length) {
            // 更新标签
            cyNode.data('label', createNodeLabel(node.data))
            // 更新其他数据
            Object.keys(node.data).forEach(key => {
              cyNode.data(key, node.data[key])
            })
          }
        })

        // 批量更新边标签
        edges.forEach(edge => {
          const cyEdge = cy.getElementById(edge.id)
          if (cyEdge.length) {
            // 更新标签
            cyEdge.data('label', createEdgeLabel(edge.data))
            // 更新其他数据
            Object.keys(edge.data).forEach(key => {
              cyEdge.data(key, edge.data[key])
            })
          }
        })
      })

      // 更新节点样式类
      updateNodeClasses()
    })
    
    return () => cancelAnimationFrame(updateId)
  }, [nodes, edges, updateNodeClasses])

  // 事件处理
  const handleCyInit = useCallback((cy) => {
    cyRef.current = cy

    // 节点左键点击 - 用于创建边
    cy.on('tap', 'node', (event) => {
      const node = event.target
      const nodeData = node.data()
      
      if (isCreatingEdge) {
        if (!edgeSourceNode) {
          // 选择源节点
          setEdgeSourceNode(nodeData.id)
          node.addClass('edge-source')
          console.log('Edge source selected:', nodeData.id)
        } else if (edgeSourceNode !== nodeData.id) {
          // 选择目标节点，创建边
          const newEdgeId = `edge_${edgeSourceNode}_${nodeData.id}_${Date.now()}`
          const newEdge = {
            id: newEdgeId,
            source: edgeSourceNode,
            target: nodeData.id,
            data: {
              event: '',
              guard: 'true',
              action: ''
            }
          }
          
          // 创建新边并添加到图中
          const newCytoscapeEdge = {
            data: {
              id: newEdgeId,
              source: edgeSourceNode,
              target: nodeData.id,
              label: '',
              ...newEdge.data
            },
            classes: ''
          }
          
          // 添加到Cytoscape实例
          cy.add(newCytoscapeEdge)
          
          // 通过回调通知父组件创建新边
          if (onEdgeCreate) {
            onEdgeCreate(edgeSourceNode, nodeData.id)
          }
          
          console.log('New edge created:', newEdge)
          
          // 重置状态
          cy.nodes().removeClass('edge-source')
          setEdgeSourceNode(null)
          setIsCreatingEdge(false)
        }
      }
    })

    // 节点右键点击事件 - 打开编辑对话框
    cy.on('cxttap', 'node', (event) => {
      const node = event.target
      const nodeData = node.data()
      console.log('Node right-clicked:', nodeData)
      setEditingNode({
        id: nodeData.id,
        locationName: nodeData.locationName || nodeData.label || nodeData.id,
        invariant: nodeData.invariant || '',
        labels: nodeData.labels || [],
        isInitial: nodeData.isInitial || false,
        isUrgent: nodeData.isUrgent || false,
        isCommitted: nodeData.isCommitted || false
      })
    })

    // 边右键点击事件 - 打开编辑对话框
    cy.on('cxttap', 'edge', (event) => {
      const edge = event.target
      const edgeData = edge.data()
      console.log('Edge right-clicked:', edgeData)
      setEditingEdge({
        id: edgeData.id,
        event: edgeData.event || '',
        guard: edgeData.guard || '',
        action: edgeData.action || ''
      })
    })

    // 节点拖动事件
    cy.on('position', 'node', (event) => {
      const node = event.target
      const nodeId = node.id()
      const position = node.position()
      console.log('Node moved:', nodeId, position)
      
      // 更新节点位置到store
      if (onNodeUpdate) {
        onNodeUpdate(nodeId, { position })
      }
    })
    
    // 空白区域点击 - 根据模式执行不同操作
    cy.on('tap', (event) => {
      if (event.target === cy) {
        if (mode === 'add-node') {
          // 创建节点模式下，在点击位置创建新节点
          const position = event.position || event.cyPosition
          if (onNodeCreate && position) {
            onNodeCreate(position)
          }
        } else if (isCreatingEdge) {
          // 取消边创建模式
          cy.nodes().removeClass('edge-source')
          setEdgeSourceNode(null)
          setIsCreatingEdge(false)
        }
      }
    })
    
    // 初始化节点样式 - 减少延迟
    requestAnimationFrame(updateNodeClasses)
  }, [isCreatingEdge, edgeSourceNode, mode, onEdgeCreate, onNodeCreate, onNodeDelete, onEdgeDelete, updateNodeClasses])

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 工具栏 */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 1000,
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
        <Tooltip title={mode === 'select' ? "查看模式 (当前)" : "切换到查看模式"}>
          <IconButton 
            onClick={() => {
              // 取消边创建模式
              if (cyRef.current) {
                cyRef.current.nodes().removeClass('edge-source')
              }
              setEdgeSourceNode(null)
              setIsCreatingEdge(false)
              // 切换到查看模式
              if (onModeChange) {
                onModeChange('select')
              }
            }}
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
        <Tooltip title={mode === 'add-node' ? "创建节点模式 (当前)" : "切换到创建节点模式"}>
          <IconButton 
            onClick={() => {
              // 取消边创建模式
              if (cyRef.current) {
                cyRef.current.nodes().removeClass('edge-source')
              }
              setEdgeSourceNode(null)
              setIsCreatingEdge(false)
              // 切换到创建节点模式
              if (onModeChange) {
                onModeChange('add-node')
              }
            }}
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
        <Tooltip title={isCreatingEdge ? "取消创建边" : "创建边模式"}>
          <IconButton 
            onClick={() => {
              if (isCreatingEdge) {
                // 取消创建边模式
                if (cyRef.current) {
                  cyRef.current.nodes().removeClass('edge-source')
                }
                setEdgeSourceNode(null)
                setIsCreatingEdge(false)
              } else {
                // 进入创建边模式
                setIsCreatingEdge(true)
              }
            }}
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

      {/* Cytoscape图形 */}
      <CytoscapeComponent
        elements={cytoscapeElements}
        stylesheet={stylesheet}
        {...cytoscapeConfig}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#fafafa'
        }}
        cy={handleCyInit}
      />

      {/* 节点编辑模态框 */}
      {editingNode && 
        createPortal(
          <NodeEditorModal 
            nodeData={editingNode} 
            onClose={() => setEditingNode(null)}
            onUpdate={onNodeUpdate}
            onDelete={onNodeDelete}
          />,
          document.body
        )}

      {/* 边编辑模态框 */}
      {editingEdge && 
        createPortal(
          <EdgeEditorModal 
            edgeData={editingEdge} 
            onClose={() => setEditingEdge(null)}
            onUpdate={onEdgeUpdate}
            onDelete={onEdgeDelete}
          />,
          document.body
        )}
    </Box>
  )
}

// 节点编辑模态框组件
function NodeEditorModal({ nodeData, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(nodeData)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleUrgentCommittedChange = (field, checked) => {
    setFormData(prev => {
      const update = { ...prev, [field]: checked }
      if (checked) {
        if (field === 'isUrgent') update.isCommitted = false
        if (field === 'isCommitted') update.isUrgent = false
      }
      return update
    })
  }

  const handleConfirm = () => {
    if (onUpdate) {
      onUpdate(formData.id, formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (onDelete && window.confirm(`确定要删除节点 "${formData.locationName}" 吗？这将同时删除所有连接到该节点的边。`)) {
      onDelete(formData.id)
      onClose()
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          Edit Location
        </h3>
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
                e.target.value.split(',').map((s) => s.trim()).filter(s => s)
              )
            }
            style={inputStyle}
          />
        </div>
        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
        <div style={checkboxGroupStyle}>
          <div>
            <input
              type="checkbox"
              checked={!!formData.isInitial}
              onChange={(e) => handleChange('isInitial', e.target.checked)}
            />
            <label>Initial</label>
          </div>
          <div>
            <input
              type="checkbox"
              checked={!!formData.isUrgent}
              onChange={(e) => handleUrgentCommittedChange('isUrgent', e.target.checked)}
            />
            <label>Urgent</label>
          </div>
          <div>
            <input
              type="checkbox"
              checked={!!formData.isCommitted}
              onChange={(e) => handleUrgentCommittedChange('isCommitted', e.target.checked)}
            />
            <label>Committed</label>
          </div>
        </div>
        <div style={buttonContainerStyle}>
          <button style={buttonStyle} onClick={onClose}>
            Cancel
          </button>
          {onDelete && (
            <button style={{ ...buttonStyle, background: '#f44336' }} onClick={handleDelete}>
              Delete
            </button>
          )}
          <button style={{ ...buttonStyle, background: '#4caf50' }} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// 边编辑模态框组件
function EdgeEditorModal({ edgeData, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(edgeData)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConfirm = () => {
    if (onUpdate) {
      onUpdate(formData.id, formData)
    }
    onClose()
  }

  const handleDelete = () => {
    if (onDelete && window.confirm(`确定要删除这条边吗？`)) {
      onDelete(formData.id)
      onClose()
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          Edit Transition
        </h3>
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
        <div style={buttonContainerStyle}>
          <button style={buttonStyle} onClick={onClose}>
            Cancel
          </button>
          {onDelete && (
            <button style={{ ...buttonStyle, background: '#f44336' }} onClick={handleDelete}>
              Delete
            </button>
          )}
          <button style={{ ...buttonStyle, background: '#4caf50' }} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// 样式定义
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0, 0, 0, 0.5)',
  zIndex: 9999,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const modalContentStyle = {
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '20px',
  fontFamily: 'monospace',
  fontSize: '14px',
  minWidth: '300px',
  maxWidth: '400px'
}

const fieldStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px'
}

const inputStyle = {
  padding: '4px 8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '14px',
  fontFamily: 'monospace',
  width: '200px'
}

const checkboxGroupStyle = { 
  display: 'flex', 
  justifyContent: 'space-around', 
  marginBottom: '20px' 
}

const buttonContainerStyle = { 
  display: 'flex', 
  justifyContent: 'flex-end', 
  gap: '10px' 
}

const buttonStyle = {
  padding: '8px 15px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  background: '#f44336',
  color: 'white'
}

export default CytoscapeAutomaton