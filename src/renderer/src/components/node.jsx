/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { Handle, Position } from '@xyflow/react'
import useEditorStore from '../store/editorStore'

// --- 节点组件 ---
function TimedAutomatonNode({ id, data }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleContextMenu = (event) => {
    event.preventDefault()
    event.stopPropagation()
    // Only allow editing if not in simulator mode (check if isCurrentLocation exists)
    if (data.isCurrentLocation === undefined) {
      setIsEditing(true)
    }
  }

  // Dynamic styles based on current state
  const dynamicNodeStyle = {
    ...nodeStyle,
    background: data.isCurrentLocation ? '#ffebee' : '#eceff1',
    border: data.isCurrentLocation ? '3px solid #f44336' : '2px solid #546e7a',
    boxShadow: data.isCurrentLocation ? '0 0 10px rgba(244, 67, 54, 0.5)' : 'none'
  }

  return (
    <>
      <div style={dynamicNodeStyle} onContextMenu={handleContextMenu}>
        <Handle type="target" position={Position.Top} />

        {/* Initial 状态的同心内圆 */}
        {data.isInitial && <div style={initialIndicatorStyle} />}

        {/* Urgent 状态的同心下半圆 */}
        {data.isUrgent && <div style={urgentIndicatorStyle} />}

        {/* Committed 状态的同心左半圆 */}
        {data.isCommitted && <div style={committedIndicatorStyle} />}

        {/* 确保文本在最上层 */}
        <div style={{ zIndex: 1 }}>
          <div
            style={{
              fontWeight: 'bold',
              color: data.isCurrentLocation ? '#c62828' : '#333'
            }}
          >
            {data.locationName}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: data.isCurrentLocation ? '#c62828' : '#607d8b'
            }}
          >
            {data.invariant}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: data.isCurrentLocation ? '#c62828' : '#607d8b'
            }}
          >
            {data.labels?.join(',') || ''}
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} />
      </div>
      {isEditing &&
        createPortal(
          <EditorModal nodeId={id} initialData={data} onClose={() => setIsEditing(false)} />,
          document.body
        )}
    </>
  )
}

// --- 编辑模态框组件 (逻辑不变) ---
function EditorModal({ nodeId, initialData, onClose }) {
  const { updateNodeData } = useEditorStore()
  const [formData, setFormData] = useState(initialData)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUrgentCommittedChange = (field, checked) => {
    setFormData((prev) => {
      const update = { ...prev, [field]: checked }
      if (checked) {
        if (field === 'isUrgent') update.isCommitted = false
        if (field === 'isCommitted') update.isUrgent = false
      }
      return update
    })
  }

  const handleConfirm = () => {
    updateNodeData(nodeId, formData)
    onClose()
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
          />
        </div>
        <div style={fieldStyle}>
          <label>Invariant:</label>
          <input
            type="text"
            value={formData.invariant || ''}
            onChange={(e) => handleChange('invariant', e.target.value)}
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
                e.target.value.split(',').map((s) => s.trim())
              )
            }
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
          <button style={{ ...buttonStyle, background: '#4caf50' }} onClick={handleConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 样式定义 ---
const nodeStyle = {
  background: '#eceff1',
  padding: '10px',
  borderRadius: '50%',
  border: '2px solid #546e7a',
  textAlign: 'center',
  width: '80px',
  height: '80px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'monospace',
  fontSize: '12px',
  position: 'relative',
  cursor: 'pointer'
}

// 通用的同心圆基础样式
const concentricCircleBase = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  borderRadius: '50%',
  pointerEvents: 'none'
}

const initialIndicatorStyle = {
  ...concentricCircleBase,
  width: '70px',
  height: '70px',
  border: '2px solid #546e7a'
}

const urgentIndicatorStyle = {
  ...concentricCircleBase,
  width: '70px',
  height: '70px',
  border: '2px solid transparent',
  borderBottomColor: '#c62828'
}

const committedIndicatorStyle = {
  ...concentricCircleBase,
  width: '70px',
  height: '70px',
  border: '2px solid transparent',
  borderLeftColor: '#c62828'
}

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
const checkboxGroupStyle = { display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }
const buttonContainerStyle = { display: 'flex', justifyContent: 'flex-end', gap: '10px' }
const buttonStyle = {
  padding: '8px 15px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  background: '#f44336',
  color: 'white'
}

export default TimedAutomatonNode
