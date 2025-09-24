const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const { spawn } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')
const { parseDot } = require('./dot-parser')

function resolveAppBasePath() {
  try {
    const { app } = require('electron')
    if (app && typeof app.getAppPath === 'function') {
      return app.getAppPath()
    }
  } catch {
    // ignore and use fallback
  }
  return path.join(__dirname, '..', '..')
}

function annotateEdges(parsedJson, edges) {
  if (!Array.isArray(edges)) return []
  const nodeById = new Map((parsedJson.nodes || []).map((node) => [node.id, node.attributes || {}]))

  return edges.map((edge) => {
    const sourceAttr = nodeById.get(edge.source) || {}
    const targetAttr = nodeById.get(edge.target) || {}
    return {
      ...edge,
      attributes: {
        ...(edge.attributes || {}),
        sourceVloc: sourceAttr.vloc || '',
        targetVloc: targetAttr.vloc || ''
      }
    }
  })
}

async function ensureExecutable(filePath) {
  try {
    await fsPromises.access(filePath, fs.constants.X_OK)
    console.log('[simulation-manager] executable already accessible:', filePath)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }
    if (error.code === 'EACCES') {
      try {
        await fsPromises.chmod(filePath, 0o755)
        await fsPromises.access(filePath, fs.constants.X_OK)
        console.log('[simulation-manager] set executable bit for:', filePath)
        return true
      } catch (chmodError) {
        console.error('chmod tck-simulate failed:', chmodError)
        throw chmodError
      }
    }
    throw error
  }
}

function normalizeClockName(clock) {
  if (!clock) return ''
  if (typeof clock === 'string') return clock
  if (typeof clock === 'object' && clock !== null) {
    return clock.name || ''
  }
  return String(clock)
}

function createEmptyMatrix(clockNames) {
  const headers = ['0', ...clockNames.map(normalizeClockName).filter(Boolean)]
  const size = headers.length
  const matrix = Array.from({ length: size }, (_, rowIndex) =>
    Array.from({ length: size }, (_, colIndex) => ({
      value: rowIndex === colIndex ? 0 : Number.POSITIVE_INFINITY,
      strict: false
    }))
  )
  return { headers, matrix }
}

function parseTerm(raw) {
  const term = raw.trim()
  if (/^-?\d+(?:\.\d+)?$/.test(term)) {
    return { type: 'const', value: parseFloat(term) }
  }
  const diffMatch = term.match(/^([A-Za-z_][A-Za-z0-9_]*?)-([A-Za-z_][A-Za-z0-9_]*)$/)
  if (diffMatch) {
    return { type: 'diff', left: diffMatch[1], right: diffMatch[2] }
  }
  return { type: 'var', name: term }
}

function setConstraint(matrix, i, j, bound, strict) {
  if (Number.isNaN(bound) || typeof bound !== 'number') return
  const cell = matrix[i]?.[j]
  if (!cell) return
  if (bound < cell.value || (bound === cell.value && strict && !cell.strict)) {
    cell.value = bound
    cell.strict = strict
  }
}

function applySimpleConstraint(matrix, headersMap, leftTerm, operator, rightTerm) {
  const strict = operator === '<' || operator === '>'

  const resolveIndex = (name) => headersMap.get(name)

  if (operator === '==') {
    if (leftTerm.type === 'var' && rightTerm.type === 'var') {
      const li = resolveIndex(leftTerm.name)
      const ri = resolveIndex(rightTerm.name)
      if (li != null && ri != null) {
        setConstraint(matrix, li, ri, 0, false)
        setConstraint(matrix, ri, li, 0, false)
      }
    } else if (leftTerm.type === 'diff' && rightTerm.type === 'const' && rightTerm.value === 0) {
      const li = resolveIndex(leftTerm.left)
      const ri = resolveIndex(leftTerm.right)
      if (li != null && ri != null) {
        setConstraint(matrix, li, ri, 0, false)
        setConstraint(matrix, ri, li, 0, false)
      }
    }
    return
  }

  const toUpperBound = (indexI, indexJ, boundValue, useStrict) => {
    if (indexI == null || indexJ == null) return
    setConstraint(matrix, indexI, indexJ, boundValue, useStrict)
  }

  if (leftTerm.type === 'var' && rightTerm.type === 'const') {
    const i = resolveIndex(leftTerm.name)
    const zeroIndex = resolveIndex('0')
    if (i == null || zeroIndex == null) return
    if (operator === '<=' || operator === '<') {
      toUpperBound(i, zeroIndex, rightTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(zeroIndex, i, -rightTerm.value, strict)
    }
    return
  }

  if (leftTerm.type === 'const' && rightTerm.type === 'var') {
    const i = resolveIndex(rightTerm.name)
    const zeroIndex = resolveIndex('0')
    if (i == null || zeroIndex == null) return
    if (operator === '<=' || operator === '<') {
      toUpperBound(i, zeroIndex, leftTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(zeroIndex, i, -leftTerm.value, strict)
    }
    return
  }

  if (leftTerm.type === 'diff' && rightTerm.type === 'const') {
    const i = resolveIndex(leftTerm.left)
    const j = resolveIndex(leftTerm.right)
    if (i == null || j == null) return
    if (operator === '<=' || operator === '<') {
      toUpperBound(i, j, rightTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(j, i, -rightTerm.value, strict)
    }
    return
  }

  if (leftTerm.type === 'const' && rightTerm.type === 'diff') {
    const i = resolveIndex(rightTerm.left)
    const j = resolveIndex(rightTerm.right)
    if (i == null || j == null) return
    if (operator === '<=' || operator === '<') {
      // const <= (xi - xj)  =>  xj - xi <= -const
      toUpperBound(j, i, -leftTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      // const >= (xi - xj)  =>  xi - xj <= const
      toUpperBound(i, j, leftTerm.value, strict)
    }
    return
  }

  if (leftTerm.type === 'var' && rightTerm.type === 'var') {
    const i = resolveIndex(leftTerm.name)
    const j = resolveIndex(rightTerm.name)
    if (i == null || j == null) return
    if (operator === '<=' || operator === '<') {
      toUpperBound(i, j, 0, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(j, i, 0, strict)
    }
    return
  }
}

function processConstraint(matrix, headersMap, rawConstraint) {
  const cleaned = rawConstraint.trim()
  if (!cleaned) return
  const tokens = cleaned
    .replace(/==/g, ' == ')
    .replace(/<=/g, ' <= ')
    .replace(/>=/g, ' >= ')
    .replace(/</g, ' < ')
    .replace(/>/g, ' > ')
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 3) {
    const [left, op, right] = tokens
    applySimpleConstraint(matrix, headersMap, parseTerm(left), op, parseTerm(right))
    return
  }

  if (tokens.length === 5) {
    const [first, op1, middle, op2, last] = tokens
    applySimpleConstraint(matrix, headersMap, parseTerm(first), op1, parseTerm(middle))
    applySimpleConstraint(matrix, headersMap, parseTerm(middle), op2, parseTerm(last))
    return
  }

  console.warn('Unsupported zone constraint format:', cleaned)
}

function computeZoneMatrix(zoneString, clocks) {
  if (!zoneString) return null
  const clockNames = Array.isArray(clocks) ? clocks : []
  const { headers, matrix } = createEmptyMatrix(clockNames)
  const headersMap = new Map(headers.map((name, index) => [name, index]))

  const normalized = zoneString.replace(/[()]/g, '')
  const constraints = normalized
    .split('&&')
    .map((part) => part.trim())
    .filter(Boolean)

  constraints.forEach((constraint) => {
    processConstraint(matrix, headersMap, constraint)
  })

  const rows = matrix.map((row, rowIndex) => ({
    label: headers[rowIndex],
    values: row.map((cell) => ({ ...cell }))
  }))

  return { headers, rows }
}

function normalizeZoneExpression(expr) {
  if (!expr) return ''
  return expr.replace(/\s+/g, '')
}

function parseMatrixCellString(token) {
  const valueStr = token.trim()
  if (!valueStr) {
    return { value: Number.POSITIVE_INFINITY, strict: false }
  }
  if (valueStr.toLowerCase().includes('inf')) {
    return {
      value: Number.POSITIVE_INFINITY,
      strict: valueStr.startsWith('<') && !valueStr.startsWith('<=')
    }
  }
  const strict = valueStr.startsWith('<') && !valueStr.startsWith('<=')
  const numericPart = valueStr.replace(/<=|</, '')
  const parsed = parseFloat(numericPart)
  if (Number.isNaN(parsed)) {
    return { value: Number.POSITIVE_INFINITY, strict }
  }
  return { value: parsed, strict }
}

function parseTckMatrixOutput(output) {
  const zoneMatrixMap = new Map()
  if (!output) return zoneMatrixMap
  const lines = output.split(/\r?\n/)
  let currentZone = null
  let headers = []
  let rows = []
  let collecting = false

  const flush = () => {
    if (!currentZone || headers.length === 0 || rows.length === 0) {
      return
    }
    const zoneKey = normalizeZoneExpression(currentZone)
    const normalizedRows = rows.map((row) => ({
      label: row.label,
      values: row.values.map((cell) => ({ ...cell }))
    }))
    zoneMatrixMap.set(zoneKey, { headers, rows: normalizedRows })
  }

  lines.forEach((line) => {
    if (line.includes('Constraints:')) {
      flush()
      const match = line.match(/Constraints:\s*\((.*)\)/)
      currentZone = match ? match[1].trim() : null
      headers = []
      rows = []
      collecting = false
      return
    }

    if (!currentZone) {
      return
    }

    if (/^\s*\|/.test(line)) {
      const parts = line.split('|')
      headers = parts[1]?.trim().split(/\s+/).filter(Boolean) || []
      collecting = headers.length > 0
      return
    }

    if (collecting && /^\s*-+\+/.test(line)) {
      return
    }

    if (collecting && line.includes('|')) {
      const [labelPart, cellsPart] = line.split('|')
      const label = labelPart.trim()
      const values = (cellsPart || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((token) => parseMatrixCellString(token))
      rows.push({ label, values })
      return
    }

    if (collecting && !line.trim()) {
      flush()
      currentZone = null
      collecting = false
    }
  })

  flush()
  return zoneMatrixMap
}

async function resolveTckSimulatePath() {
  const envPath = process.env.TCK_SIMULATE_PATH
  const appBase = resolveAppBasePath()
  console.log('[simulation-manager] resolveTckSimulatePath base:', appBase)
  if (envPath) {
    console.log('[simulation-manager] TCK_SIMULATE_PATH env:', envPath)
  }
  const candidates = [
    envPath,
    path.join(appBase, 'src/main/build/src/tck-simulate'),
    path.join(appBase, 'main/build/src/tck-simulate'),
    path.join(appBase, 'resources', 'tck-simulate'),
    process.resourcesPath ? path.join(process.resourcesPath, 'tck-simulate') : null
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      console.log('[simulation-manager] checking candidate:', candidate)
      const ok = await ensureExecutable(candidate)
      if (ok) {
        console.log('[simulation-manager] using tck-simulate at:', candidate)
        return candidate
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue
      }
      console.warn(`tck-simulate candidate unusable (${candidate}): ${error.message}`)
    }
  }

  throw new Error(
    'Unable to locate executable tck-simulate. Set TCK_SIMULATE_PATH or keep binary in src/main/build/src.'
  )
}

async function runTckSimulate(args) {
  const command = await resolveTckSimulatePath()

  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let stderrData = ''

    child.stderr.on('data', (data) => {
      stderrData += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`tck-simulate exited with code ${code}:\n${stderrData}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to launch tck-simulate: ${error.message}`))
    })
  })
}

async function simulateAndParse(tempTckFile, tempDotFile, depth) {
  const runArgs = [tempTckFile, '-t', '-r', String(depth), '-o', tempDotFile]
  await runTckSimulate(runArgs)
  const dotContent = await fsPromises.readFile(tempDotFile, 'utf8')
  const parsedJson = parseDot(dotContent)
  parsedJson.edges = annotateEdges(parsedJson, parsedJson.edges || [])
  return parsedJson
}

async function resolveTckMatrixPath() {
  const envPath = process.env.TCK_MATRIX_PATH
  const appBase = resolveAppBasePath()
  const candidates = [
    envPath,
    path.join(appBase, 'src/main/build/src/tck-matrix'),
    path.join(appBase, 'main/build/src/tck-matrix'),
    path.join(appBase, 'resources', 'tck-matrix'),
    process.resourcesPath ? path.join(process.resourcesPath, 'tck-matrix') : null
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const ok = await ensureExecutable(candidate)
      if (ok) {
        return candidate
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        continue
      }
      console.warn(`tck-matrix candidate unusable (${candidate}): ${error.message}`)
    }
  }

  throw new Error(
    'Unable to locate executable tck-matrix. Set TCK_MATRIX_PATH or keep binary in src/main/build/src.'
  )
}

async function runTckMatrix(args) {
  const command = await resolveTckMatrixPath()

  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let stdoutData = ''
    let stderrData = ''

    child.stdout.on('data', (data) => {
      stdoutData += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderrData += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdoutData)
      } else {
        reject(new Error(`tck-matrix exited with code ${code}:\n${stderrData}`))
      }
    })

    child.on('error', (error) => {
      reject(new Error(`Failed to launch tck-matrix: ${error.message}`))
    })
  })
}

async function buildZoneMatrixMap(tempTckFile, depth) {
  try {
    const output = await runTckMatrix(['-d', '-s', String(depth), tempTckFile])
    return parseTckMatrixOutput(output)
  } catch (error) {
    console.warn('tck-matrix execution failed:', error.message)
    return new Map()
  }
}

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
    await fsPromises.writeFile(tempTckFile, tckContent, 'utf8')

    // 2. 执行 tck-simulate 获取初始状态和转换 (生成少量步骤)
    const parsedJson = await simulateAndParse(tempTckFile, tempDotFile, 3)
    console.log('Parsed DOT JSON:', JSON.stringify(parsedJson, null, 2))

    const zoneMatrixMap = await buildZoneMatrixMap(tempTckFile, 50)

    // 找到初始状态节点
    const initialNode =
      parsedJson.nodes?.find(
        (node) => node.attributes?.initial === 'true' || node.attributes?.initial === true
      ) || parsedJson.nodes?.[0]

    // 只返回从初始状态出发的转换
    const availableTransitions =
      parsedJson.edges?.filter((edge) => edge.source === initialNode?.id) || []
    const initialZoneMatrix =
      zoneMatrixMap.get(normalizeZoneExpression(initialNode?.attributes?.zone || '')) ||
      computeZoneMatrix(initialNode?.attributes?.zone || '', modelJson.clocks || [])
    const initialState = {
      ...initialNode,
      zoneMatrix: initialZoneMatrix
    }

    console.log('Initial state:', initialNode)
    console.log('Available transitions:', availableTransitions)

    return {
      success: true,
      initialState,
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
      await fsPromises.unlink(tempTckFile)
      await fsPromises.unlink(tempDotFile)
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
async function executeTransition(modelJson, requestedTransition, currentState) {
  console.log('=== Backend: executeTransition called ===')
  console.log('Requested transition:', requestedTransition)
  console.log('Current state:', JSON.stringify(currentState, null, 2))

  const tempTckFile = path.join(__dirname, 'temp_model.tck')
  const tempDotFile = path.join(__dirname, 'step_output.dot')

  try {
    // 1. 生成TCK文件
    const tckContent = generateTckFromJSON(modelJson)
    await fsPromises.writeFile(tempTckFile, tckContent, 'utf8')

    const depthAttempts = [20, 200, 1000]
    let parsedJson = null
    let currentStateNode = null
    let usedDepth = null

    const currentStateVloc = currentState?.attributes?.vloc || ''
    console.log('Looking for current state vloc:', currentStateVloc)

    for (const depth of depthAttempts) {
      parsedJson = await simulateAndParse(tempTckFile, tempDotFile, depth)
      console.log('All available transitions in DOT:', parsedJson.edges?.length || 0)

      currentStateNode = parsedJson.nodes?.find((node) => {
        const nodeVloc = node.attributes?.vloc || ''
        console.log('Comparing with node vloc:', nodeVloc)
        return nodeVloc === currentStateVloc
      })

      if (currentStateNode) {
        usedDepth = depth
        break
      }

      console.warn(
        `Current state ${currentStateVloc} not found with depth ${depth}, retrying with higher depth...`
      )
    }

    if (!currentStateNode) {
      console.error('Critical error: Could not find current state node')
      console.log('Current state vloc:', currentStateVloc)
      console.log(
        'Available nodes:',
        parsedJson.nodes?.map((n) => ({ id: n.id, vloc: n.attributes?.vloc }))
      )

      // 更严格的错误处理 - 不使用fallback逻辑，而是报错
      return {
        success: false,
        error: `Cannot find current state node with vloc: ${currentStateVloc}. This indicates a state synchronization issue.`
      }
    }

    const zoneMatrixMap = await buildZoneMatrixMap(
      tempTckFile,
      usedDepth || depthAttempts[depthAttempts.length - 1]
    )

    // 5. 根据transitionId找到对应的边（从当前状态出发的边）
    const availableEdges =
      parsedJson.edges?.filter((edge) => edge.source === currentStateNode?.id) || []
    console.log('Available edges from current state:', availableEdges.length)

    const targetEdge = availableEdges.find((edge) => {
      const vedge = edge.attributes?.vedge || ''
      const cleanVedge = vedge.replace(/[<>]/g, '')
      const requestedVedge = (requestedTransition?.vedge || '').replace(/[<>]/g, '')
      const sameVedge = requestedVedge && cleanVedge === requestedVedge
      const sameId = requestedTransition?.id && edge.id && edge.id === requestedTransition.id
      const sameSourceTarget =
        requestedTransition?.sourceLocation === edge.source &&
        requestedTransition?.targetLocation === edge.target
      const sameTargetVloc =
        requestedTransition?.targetVloc &&
        requestedTransition.targetVloc === edge.attributes?.targetVloc

      console.log('Checking edge candidate:', {
        source: edge.source,
        target: edge.target,
        vedge: cleanVedge,
        targetVloc: edge.attributes?.targetVloc || ''
      })

      return sameVedge || sameId || sameSourceTarget || sameTargetVloc
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

    const newStateRaw = parsedJson.nodes?.find((node) => node.id === selectedEdge.target)
    const nextTransitions =
      parsedJson.edges?.filter((edge) => edge.source === newStateRaw?.id) || []
    const newState = {
      ...newStateRaw,
      zoneMatrix:
        zoneMatrixMap.get(normalizeZoneExpression(newStateRaw?.attributes?.zone || '')) ||
        computeZoneMatrix(newStateRaw?.attributes?.zone || '', modelJson.clocks || [])
    }

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
      await fsPromises.unlink(tempTckFile)
      await fsPromises.unlink(tempDotFile)
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
