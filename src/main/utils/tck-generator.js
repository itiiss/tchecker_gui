/**
 * tck-generator.js
 * * 一个将 JSON 对象模型转换为 TChecker (.tck) 文件格式字符串的工具。
 */

/**
 * 格式化 TChecker 声明中的属性部分 { ... }
 * @param {object} attrs - 包含属性的键值对对象。
 * @returns {string} - 格式化后的属性字符串，例如 "{initial::invariant:x<=5}"
 */
function formatAttributes(attrs) {
  // 如果没有属性，直接返回空括号
  if (!attrs || Object.keys(attrs).length === 0) {
    return '{}'
  }

  const attributePairs = []

  // --- 识别并收集所有有效的属性 ---
  // 位置属性
  if (attrs.isInitial) attributePairs.push({ key: 'initial', value: '' })
  if (attrs.isCommitted) attributePairs.push({ key: 'committed', value: '' })
  if (attrs.isUrgent) attributePairs.push({ key: 'urgent', value: '' })
  if (attrs.invariant) attributePairs.push({ key: 'invariant', value: attrs.invariant })
  if (attrs.labels && attrs.labels.length > 0) {
    attributePairs.push({ key: 'labels', value: attrs.labels.join(',') })
  }

  // 边属性
  if (attrs.guard) attributePairs.push({ key: 'provided', value: attrs.guard })
  if (attrs.action) attributePairs.push({ key: 'do', value: attrs.action })

  // 如果没有收集到任何有效属性，也返回空括号
  if (attributePairs.length === 0) {
    return '{}'
  }

  // --- 修正的核心逻辑 ---
  // 1. 将键值对数组转换为 "key:value" 格式的字符串数组
  //    对于布尔型属性，value是空字符串，所以 `urgent:` 格式正确。
  const formattedParts = attributePairs.map((pair) => `${pair.key}:${pair.value}`)

  // 2. 用单个冒号连接这些格式化好的部分
  const finalAttributeString = formattedParts.join(':')

  return `{${finalAttributeString}}`
}

/**
 * 从结构化的 JSON 对象生成 TChecker (.tck) 文件内容的字符串。
 * @param {object} model - 描述时间自动机的 JSON 对象。
 * @returns {string} - .tck 格式的完整字符串。
 */
function generateTckFromJSON(model) {
  const tckLines = []

  // 规则 1: system 声明必须在第一行
  tckLines.push(`system:${model.systemName}{}`)
  tckLines.push('') // 空行以增加可读性

  // --- 全局声明 ---
  tckLines.push('# --- Global Declarations ---')
  ;(model.events || []).forEach((event) => {
    tckLines.push(`event:${event}{}`)
  })
  ;(model.clocks || []).forEach((clock) => {
    tckLines.push(`clock:${clock.size}:${clock.name}{}`)
  })
  ;(model.intVars || []).forEach((v) => {
    tckLines.push(`int:${v.size}:${v.min}:${v.max}:${v.initial}:${v.name}{}`)
  })
  tckLines.push('')

  // --- 进程定义 ---
  tckLines.push('# --- Process Definitions ---')
  for (const procName in model.processes) {
    const procDetails = model.processes[procName]
    tckLines.push('')
    tckLines.push(`# Process: ${procName}`)
    tckLines.push(`process:${procName}{}`)

    // 位置
    for (const locName in procDetails.locations) {
      const locDetails = procDetails.locations[locName]
      const attributes = formatAttributes({
        isInitial: locDetails.isInitial,
        invariant: locDetails.invariant,
        labels: locDetails.labels,
        isCommitted: locDetails.isCommitted,
        isUrgent: locDetails.isUrgent
      })
      tckLines.push(`location:${procName}:${locName}${attributes}`)
    }

    // 边
    for (const edge of procDetails.edges) {
      const attributes = formatAttributes({
        guard: edge.guard,
        action: edge.action
      })
      tckLines.push(`edge:${procName}:${edge.source}:${edge.target}:${edge.event}${attributes}`)
    }
  }
  tckLines.push('')

  // --- 同步 ---
  tckLines.push('# --- Synchronizations ---')
  ;(model.synchronizations || []).forEach((sync) => {
    const syncStr = sync.constraints.join(':')
    tckLines.push(`sync:${syncStr}{}`)
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
