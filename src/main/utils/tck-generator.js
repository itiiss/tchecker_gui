/**
 * tck-generator.js
 * * 一个将 JSON 对象模型转换为 TChecker (.tck) 文件格式字符串的工具。
 */

/**
 * 格式化 TChecker 声明中的属性部分 { ... }
 * @param {object} attrs - 包含属性的键值对对象。
 * @returns {string} - 格式化后的属性字符串，TChecker使用大括号语法
 */
function formatAttributes(attrs) {
  // 如果没有属性，返回空字符串
  if (!attrs || Object.keys(attrs).length === 0) {
    return ''
  }

  const attributePairs = []

  // --- 识别并收集所有有效的属性 ---
  // 位置属性
  if (attrs.isInitial) attributePairs.push('initial:')
  if (attrs.isCommitted) attributePairs.push('committed:') 
  if (attrs.isUrgent) attributePairs.push('urgent:')
  if (attrs.invariant && attrs.invariant.trim()) {
    attributePairs.push(`invariant:${attrs.invariant}`)
  }

  // 边属性 - TChecker不支持同时使用provided:和do:属性，优先选择do:
  const hasAction = attrs.action && attrs.action.trim() !== ''
  const hasGuard = attrs.guard && attrs.guard !== 'true' && attrs.guard.trim() !== ''
  
  if (hasAction) {
    // 优先使用do:属性，跳过provided:属性以避免语法冲突
    const tckAction = attrs.action.trim()
      .replace(/\s*=\s*/g, '=') // 移除赋值符号周围的空格
      .replace(/\s*,\s*/g, '; ') // 将逗号替换为分号（TChecker语法）
      .replace(/\s*\+\s*/g, '+') // 移除运算符周围的空格
      .replace(/\s*-\s*/g, '-')
      .replace(/\s*\*\s*/g, '*')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\(\s*([^)]+)\s*\)/g, '($1)') // 移除括号内的多余空格
    attributePairs.push(`do:${tckAction}`)
  } else if (hasGuard) {
    // 只有在没有action时才添加provided:属性
    const tckGuard = attrs.guard
      .replace(/\|\|/g, ' or ')
      .replace(/&&/g, ' and ')
      .replace(/==/g, ' == ')
      .replace(/!=/g, ' != ')
    
    // 暂时跳过复杂的guard表达式，因为TChecker语法限制
    const isComplexGuard = tckGuard.includes(' or ') || tckGuard.includes(' and ')
    if (!isComplexGuard) {
      attributePairs.push(`provided:${tckGuard}`)
    }
  }

  // 如果没有属性，返回空字符串
  if (attributePairs.length === 0) {
    return ''
  }

  // 使用TChecker标准语法：{attribute:value,attribute2:value2}
  return `{${attributePairs.join(',')}}`
}

/**
 * 从结构化的 JSON 对象生成 TChecker (.tck) 文件内容的字符串。
 * @param {object} model - 描述时间自动机的 JSON 对象。
 * @returns {string} - .tck 格式的完整字符串。
 */
function generateTckFromJSON(model) {
  const tckLines = []

  // 规则 1: system 声明必须在第一行
  // 确保系统名称只包含字母、数字和下划线
  const sanitizedSystemName = model.systemName.replace(/[^a-zA-Z0-9_]/g, '_')
  tckLines.push(`system:${sanitizedSystemName}`)
  tckLines.push('') // 空行以增加可读性

  // --- 全局声明 ---
  tckLines.push('# --- Global Declarations ---')
  ;(model.events || []).forEach((event) => {
    const eventName = typeof event === 'object' ? event.name : event
    tckLines.push(`event:${eventName}`)
  })
  ;(model.clocks || []).forEach((clock) => {
    tckLines.push(`clock:${clock.size}:${clock.name}`)
  })
  ;(model.intVars || []).forEach((v) => {
    tckLines.push(`int:${v.size}:${v.min}:${v.max}:${v.initial}:${v.name}`)
  })
  tckLines.push('')

  // --- 进程定义 ---
  tckLines.push('# --- Process Definitions ---')
  for (const procName in model.processes) {
    const procDetails = model.processes[procName]
    tckLines.push('')
    tckLines.push(`# Process: ${procName}`)
    tckLines.push(`process:${procName}`)

    // 位置声明 - 包含属性
    for (const locName in procDetails.locations) {
      const location = procDetails.locations[locName]
      // 避免使用TChecker保留关键字作为位置名称
      const sanitizedLocName = locName === 'process' ? 'processing' : locName
      const attrs = formatAttributes(location)
      tckLines.push(`location:${procName}:${sanitizedLocName}${attrs}`)
    }

    // 边声明 - 包含属性
    for (const edge of procDetails.edges) {
      const event = edge.event && edge.event.trim() ? edge.event : 'tau'
      // 避免使用TChecker保留关键字作为位置名称
      const sanitizedSource = edge.source === 'process' ? 'processing' : edge.source
      const sanitizedTarget = edge.target === 'process' ? 'processing' : edge.target
      const attrs = formatAttributes(edge)
      tckLines.push(`edge:${procName}:${sanitizedSource}:${sanitizedTarget}:${event}${attrs}`)
    }
  }
  tckLines.push('')

  // --- 同步 ---
  tckLines.push('# --- Synchronizations ---')
  ;(model.synchronizations || []).forEach((sync) => {
    const syncStr = sync.constraints.join(':')
    tckLines.push(`sync:${syncStr}`)
  })


  return tckLines.join('\n')
}

// 导出函数，以便在其他模块中使用
module.exports = { generateTckFromJSON }

// --- 3. 使用示例 ---

// 仅当直接运行此文件时执行
if (require.main === module) {
  const fs = require('fs')

  // 定义一个完整的 train-gate 模型
  const trainGateModel = {
    systemName: 'train_gate_system_generated',
    clocks: [{ name: 'x', size: 1 }],
    events: ['approach', 'enter', 'exit'],
    processes: {
      train: {
        locations: {
          far: { isInitial: true },
          near: {},
          in_gate: { labels: ['unsafe', 'critical'] },
          gone: {}
        },
        edges: [
          { source: 'far', target: 'near', event: 'approach', action: 'x=0' },
          { source: 'near', target: 'in_gate', event: 'enter', guard: 'x>=2' },
          { source: 'in_gate', target: 'gone', event: 'exit' }
        ]
      },
      gate: {
        locations: {
          up: { isInitial: true },
          // 这是一个紧急状态，时间不能在此流逝
          going_down: { invariant: 'x<=5', isUrgent: true },
          down: {},
          going_up: {}
        },
        edges: [
          { source: 'up', target: 'going_down', event: 'approach' },
          { source: 'going_down', target: 'down', event: 'enter', guard: 'x>=1' },
          { source: 'down', target: 'going_up', event: 'exit' },
          { source: 'going_up', target: 'up', event: 'exit' }
        ]
      }
    },
    synchronizations: [
      { constraints: ['train@approach', 'gate@approach'] },
      { constraints: ['train@enter', 'gate@enter'] },
      // 这是一个弱同步的例子
      { constraints: ['train@exit?', 'gate@exit?'] }
    ]
  }

  // 调用转换器函数
  const tckFileContent = generateTckFromJSON(trainGateModel)

  // 打印到控制台
  console.log('--- Generated .tck content ---')
  console.log(tckFileContent)
  console.log('----------------------------')

  // 或者写入文件
  const outputFilename = 'generated_model.tck'
  fs.writeFileSync(outputFilename, tckFileContent, 'utf8')
  console.log(`Model successfully written to ${outputFilename}`)
}
