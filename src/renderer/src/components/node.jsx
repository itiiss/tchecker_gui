/* eslint-disable react/prop-types */
// src/components/TimedAutomatonNode.jsx

import React, { useCallback } from 'react'
import { Handle, Position } from '@xyflow/react'
import useEditorStore from '../store/editorStore'

const nodeStyle = {
  background: '#dde5f3',
  padding: '10px 15px',
  borderRadius: '50%',
  border: '1px solid #2a4a8f',
  textAlign: 'center',
  minWidth: '80px'
}

const inputStyle = {
  marginTop: '8px',
  padding: '2px 4px',
  border: '1px solid #ccc',
  borderRadius: '3px',
  width: '100px',
  fontSize: '10px',
  textAlign: 'center'
}

function TimedAutomatonNode({ id, data }) {
  const { setNodes } = useEditorStore()

  const onInvariantChange = useCallback(
    (evt) => {
      const newInvariant = evt.target.value
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, invariant: newInvariant } }
          }
          return node
        })
      )
    },
    [id, setNodes]
  )

  return (
    <div style={nodeStyle}>
      {/* 用于连接边的句柄 */}
      <Handle type="target" position={Position.Top} />

      {/* 节点名称 */}
      <div>{data.label}</div>

      {/* 不变量输入框 */}
      <input
        type="text"
        className="nodrag" // 防止拖动输入框时移动整个节点
        value={data.invariant || ''}
        onChange={onInvariantChange}
        style={inputStyle}
        placeholder="invariant"
      />

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

export default TimedAutomatonNode