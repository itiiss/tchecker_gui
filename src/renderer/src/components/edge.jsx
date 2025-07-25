/* eslint-disable react/prop-types */
// src/components/edge.jsx

import React from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import useEditorStore from '../store/editorStore'

export default function TimedAutomatonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data
}) {
  const { setEdges } = useEditorStore()

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  // 通用的更新函数
  const onDataChange = (field, value) => {
    setEdges((edges) =>
      edges.map((edge) => {
        if (edge.id === id) {
          const newData = { ...edge.data, [field]: value }
          return { ...edge, data: newData }
        }
        return edge
      })
    )
  }

  const inputStyle = {
    border: '1px solid #eee',
    padding: '2px 4px',
    fontSize: '10px',
    width: '100px',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    width: '50px',
    textAlign: 'right',
    paddingRight: '5px',
    color: '#555',
    fontSize: '12px'
  }
  
  const fieldContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px'
  }

  return (
    <>
      <BaseEdge path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
          className="nodrag nopan"
        >
          {/* Event 输入框 */}
          <div style={fieldContainerStyle}>
            <span style={labelStyle}>Event:</span>
            <input
              type="text"
              value={data.event || ''}
              onChange={(evt) => onDataChange('event', evt.target.value)}
              style={inputStyle}
            />
          </div>
          {/* Guard 输入框 */}
          <div style={fieldContainerStyle}>
            <span style={labelStyle}>Guard:</span>
            <input
              type="text"
              value={data.guard || ''}
              onChange={(evt) => onDataChange('guard', evt.target.value)}
              style={inputStyle}
            />
          </div>
          {/* Update 输入框 */}
          <div style={fieldContainerStyle}>
            <span style={labelStyle}>Update:</span>
            <input
              type="text"
              value={data.update || ''}
              onChange={(evt) => onDataChange('update', evt.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}