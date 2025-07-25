import React from 'react'

const VerifierPanel = () => {
  return (
    <div className="p-4 text-gray-700">
      <h2 className="text-xl font-semibold mb-3">验证器内容</h2>
      <p>这里将用于输入属性查询和显示验证结果。</p>
      <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded">
        <textarea
          className="w-full h-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="输入查询，例如 A[] not deadlock"
        ></textarea>
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
          运行验证
        </button>
        <p className="mt-3">验证结果区域...</p>
      </div>
    </div>
  )
}

export default VerifierPanel
