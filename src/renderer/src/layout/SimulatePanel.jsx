import React from 'react'

const SimulatorPanel = () => {
  return (
    <div className="p-4 text-gray-700">
      <h2 className="text-xl font-semibold mb-3">模拟器内容</h2>
      <p>这里将显示模型的模拟轨迹、时钟值以及交互控制。</p>
      <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded">
        <p>模拟输出区域...</p>
      </div>
    </div>
  )
}

export default SimulatorPanel
