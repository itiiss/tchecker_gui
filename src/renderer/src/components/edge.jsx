/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import useEditorStore from '../store/editorStore'

// --- 边组件 ---
export default function TimedAutomatonEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  })

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsEditing(true)
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            fontFamily: 'monospace',
            fontSize: '12px',
            textAlign: 'center',
            padding: '5px',
            background: '#f0f4f8',
            border: '1px solid #ccc',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
          className="nodrag nopan"
          onContextMenu={handleContextMenu}
        >
          <div style={{ color: '#c62828' }}>{data.guard}</div>
          <div style={{ color: '#283593' }}>{data.action}</div>
        </div>
      </EdgeLabelRenderer>

      {isEditing &&
        createPortal(
          <EditorModal edgeId={id} initialData={data} onClose={() => setIsEditing(false)} />,
          document.body
        )}
    </>
  )
}

// --- 编辑模态框组件 ---
function EditorModal({ edgeId, initialData, onClose }) {
  const { updateEdgeData } = useEditorStore()
  const [formData, setFormData] = useState(initialData)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfirm = () => {
    updateEdgeData(edgeId, formData)
    onClose()
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
          />
        </div>
        <div style={fieldStyle}>
          <label>Guard:</label>
          <input
            type="text"
            value={formData.guard || ''}
            onChange={(e) => handleChange('guard', e.target.value)}
          />
        </div>
        <div style={fieldStyle}>
          <label>Action:</label>
          <input
            type="text"
            value={formData.action || ''}
            onChange={(e) => handleChange('action', e.target.value)}
          />
        </div>
        <div style={buttonContainerStyle}>
          <button style={buttonStyle} onClick={onClose}>
            Cancel
          </button>
          <button style={{ ...buttonStyle, background: '#4caf50' }} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 模态框样式 ---
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
  minWidth: '300px'
}
const fieldStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px'
}
const buttonContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginTop: '20px'
}
const buttonStyle = {
  padding: '8px 15px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  background: '#f44336',
  color: 'white'
}
