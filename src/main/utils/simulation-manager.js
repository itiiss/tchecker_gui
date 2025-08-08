const fs = require('fs').promises
const path = require('path')
const { spawn } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')
const { parseDot } = require('./dot-parser')


/**
 * 初始化模拟器，获取初始状态和可用转换
 * @param {object} modelJson - 输入的 JSON 模型
 * @returns {Promise<object>} - 包含初始状态和可用转换的对象
 */
async function initializeSimulator(modelJson) {
  console.log('=== Backend: initializeSimulator called ===')
  console.log('Model JSON received:', JSON.stringify(modelJson, null, 2))
  
  const tempTckFile = path.join(__dirname, 'temp_model.tck')
  const tempDotFile = path.join(__dirname, 'init_output.dot')

  try {
    // 1. 从 JSON 生成 TCK 文件内容
    const tckContent = generateTckFromJSON(modelJson)
    console.log('Generated TCK content:')
    console.log(tckContent)
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    // 2. 执行 tck-simulate 获取初始状态和转换 (生成少量步骤)
    await new Promise((resolve, reject) => {
      const command = '/Users/zhaochen/Documents/tchecker_gui/src/main/build/src/tck-simulate'
      const args = [tempTckFile, '-t', '-r', '3', '-o', tempDotFile] // 生成3步

      const child = spawn(command, args)
      let stderrData = ''
      child.stderr.on('data', (data) => {
        stderrData += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`tck-simulate exited with code ${code}:\n${stderrData}`))
      })

      child.on('error', reject)
    })

    // 3. 读取和解析 DOT 文件
    const dotContent = await fs.readFile(tempDotFile, 'utf8')
    console.log('Raw DOT content:')
    console.log(dotContent)
    
    const parsedJson = parseDot(dotContent)
    console.log('Parsed DOT JSON:', JSON.stringify(parsedJson, null, 2))

    // 找到初始状态节点
    const initialNode = parsedJson.nodes?.find(node => 
      node.attributes?.initial === "true" || 
      node.attributes?.initial === true
    ) || parsedJson.nodes?.[0]

    // 只返回从初始状态出发的转换
    const availableTransitions = parsedJson.edges?.filter(edge => 
      edge.source === initialNode?.id
    ) || []

    console.log('Initial state:', initialNode)
    console.log('Available transitions:', availableTransitions)

    return {
      success: true,
      initialState: initialNode,
      availableTransitions: availableTransitions
    }
  } catch (error) {
    console.error('initializeSimulator error:', error)
    return {
      success: false,
      error: error.message
    }
  } finally {
    // 清理临时文件
    try {
      await fs.unlink(tempTckFile)
      await fs.unlink(tempDotFile)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error cleaning up temporary files:', err)
      }
    }
  }
}

/**
 * 执行一个转换，获取新状态和可用转换
 * @param {object} modelJson - 输入的 JSON 模型
 * @param {string} transitionId - 要执行的转换ID
 * @param {object} currentState - 当前状态
 * @returns {Promise<object>} - 包含新状态和可用转换的对象
 */
async function executeTransition(modelJson, transitionId, currentState) {
  console.log('=== Backend: executeTransition called ===')
  console.log('Transition ID:', transitionId)
  console.log('Current state:', JSON.stringify(currentState, null, 2))
  
  const tempTckFile = path.join(__dirname, 'temp_model.tck')
  const tempDotFile = path.join(__dirname, 'step_output.dot')

  try {
    // 1. 生成TCK文件
    const tckContent = generateTckFromJSON(modelJson)
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    // 2. 执行tck-simulate获取足够多的步骤来覆盖所有可能的转移
    await new Promise((resolve, reject) => {
      const command = '/Users/zhaochen/Documents/tchecker_gui/src/main/build/src/tck-simulate'
      const args = [tempTckFile, '-t', '-r', '20', '-o', tempDotFile] // 生成20步以获得更多状态和转移

      const child = spawn(command, args)
      let stderrData = ''
      child.stderr.on('data', (data) => {
        stderrData += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`tck-simulate exited with code ${code}:\n${stderrData}`))
      })

      child.on('error', reject)
    })

    // 3. 读取和解析结果
    const dotContent = await fs.readFile(tempDotFile, 'utf8')
    const parsedJson = parseDot(dotContent)

    console.log('All available transitions in DOT:', parsedJson.edges?.length || 0)

    // 4. 找到当前状态对应的节点
    const currentStateVloc = currentState?.attributes?.vloc || ''
    console.log('Looking for current state vloc:', currentStateVloc)
    
    // 查找当前状态节点
    const currentStateNode = parsedJson.nodes?.find(node => {
      const nodeVloc = node.attributes?.vloc || ''
      console.log('Comparing with node vloc:', nodeVloc)
      return nodeVloc === currentStateVloc
    })
    
    if (!currentStateNode) {
      console.error('Critical error: Could not find current state node')
      console.log('Current state vloc:', currentStateVloc)
      console.log('Available nodes:', parsedJson.nodes?.map(n => ({ id: n.id, vloc: n.attributes?.vloc })))
      
      // 更严格的错误处理 - 不使用fallback逻辑，而是报错
      return {
        success: false,
        error: `Cannot find current state node with vloc: ${currentStateVloc}. This indicates a state synchronization issue.`
      }
    }

    // 5. 根据transitionId找到对应的边（从当前状态出发的边）
    const availableEdges = parsedJson.edges?.filter(edge => edge.source === currentStateNode?.id) || []
    console.log('Available edges from current state:', availableEdges.length)
    
    const targetEdge = availableEdges.find(edge => {
      const edgeId = edge.id
      const vedge = edge.attributes?.vedge || ''
      console.log('Checking edge:', edgeId, vedge)
      return edgeId === transitionId || transitionId.includes(vedge) || vedge.includes(transitionId)
    })
    
    // 如果找不到精确匹配，使用第一个可用的边
    const selectedEdge = targetEdge || availableEdges[0]
    
    if (!selectedEdge) {
      console.log('No edges available from current state')
      return {
        success: false,
        error: 'No transitions available from current state'
      }
    }

    const newState = parsedJson.nodes?.find(node => node.id === selectedEdge.target)
    const nextTransitions = parsedJson.edges?.filter(edge => edge.source === newState?.id) || []

    console.log('Selected edge:', selectedEdge.attributes?.vedge)
    console.log('New state:', newState?.attributes?.vloc)
    console.log('Next available transitions:', nextTransitions.length)

    return {
      success: true,
      newState,
      availableTransitions: nextTransitions
    }
  } catch (error) {
    console.error('executeTransition error:', error)
    return {
      success: false,
      error: error.message
    }
  } finally {
    // 清理临时文件
    try {
      await fs.unlink(tempTckFile)
      await fs.unlink(tempDotFile)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error cleaning up temporary files:', err)
      }
    }
  }
}

/**
 * 重置模拟器到初始状态
 * @param {object} modelJson - 输入的 JSON 模型
 * @returns {Promise<object>} - 重置后的状态信息
 */
async function resetSimulator(modelJson) {
  return await initializeSimulator(modelJson)
}

module.exports = { 
  initializeSimulator, 
  executeTransition, 
  resetSimulator 
}
