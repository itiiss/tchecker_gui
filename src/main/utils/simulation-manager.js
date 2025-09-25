const fs = require('fs')
const fsPromises = fs.promises
const path = require('path')
const os = require('os')
const { spawn } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')

let activeSession = null

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
    .replace(/<(?!=)/g, ' < ')
    .replace(/>(?!=)/g, ' > ')
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

function hasPrompt(buffer) {
  if (!buffer) return false
  const normalized = buffer.replace(/\r/g, '')
  const trimmedEnd = normalized.replace(/\s+$/, '')
  return /Select[^\n]*\?$/.test(trimmedEnd)
}

function checkSessionBuffer(session) {
  if (!session.pending) return
  if (session.error) {
    const { reject } = session.pending
    session.pending = null
    reject(session.error)
    return
  }

  if (hasPrompt(session.buffer)) {
    const { resolve } = session.pending
    const output = session.buffer
    session.buffer = ''
    session.pending = null
    resolve(output)
  }
}

function waitForPrompt(session) {
  if (session.closed && !session.buffer) {
    return Promise.reject(new Error('tck-simulate process has terminated'))
  }

  if (session.pending) {
    return Promise.reject(new Error('Another prompt wait is already pending'))
  }

  return new Promise((resolve, reject) => {
    session.pending = { resolve, reject }
    checkSessionBuffer(session)
  })
}

function parseStateLines(lines) {
  const attributes = {}
  lines.forEach((rawLine) => {
    const cleanLine = rawLine.replace(/^\s+/, '')
    if (!cleanLine) return
    const match = cleanLine.match(/^([A-Za-z_]+):\s*(.*)$/)
    if (match) {
      attributes[match[1]] = match[2].trim()
    }
  })
  return attributes
}

function parseSuccessorMeta(line) {
  const cleanLine = line.replace(/\t/g, ' ').trim()
  const indexMatch = cleanLine.match(/^(\d+)\)/)
  if (!indexMatch) {
    return { index: null, fields: {} }
  }

  const index = Number.parseInt(indexMatch[1], 10)
  const rest = cleanLine.slice(indexMatch[0].length).trim()
  const fields = {}
  const fieldRegex = /([A-Za-z_]+):\s*([^]*?)(?=\s*[A-Za-z_]+:|$)/g
  let match
  while ((match = fieldRegex.exec(rest)) !== null) {
    fields[match[1]] = match[2].trim()
  }

  return { index, fields }
}

function parseSuccessorsSection(section) {
  const normalized = section.replace(/\r/g, '')
  const lines = normalized.split('\n')
  const entries = []
  let current = null

  lines.forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed) return

    if (/^\d+\)/.test(trimmed)) {
      if (current) {
        entries.push(current)
      }
      current = { meta: line, detailLines: [] }
      return
    }

    if (current) {
      current.detailLines.push(line)
    }
  })

  if (current) {
    entries.push(current)
  }

  return entries.map((entry) => {
    const { index, fields } = parseSuccessorMeta(entry.meta)
    const state = parseStateLines(entry.detailLines || [])
    return { index, fields, state }
  })
}

function parseVlocLocations(vlocString) {
  if (!vlocString) return []
  return vlocString
    .replace(/[<>]/g, '')
    .split(',')
    .map((loc) => loc.trim())
    .filter(Boolean)
}

function buildTransitionsFromSuccessors(session, currentState, successors) {
  const map = new Map()
  const stepIndex = session.stepIndex
  const currentLocations = parseVlocLocations(currentState.attributes?.vloc || '')

  const transitions = successors
    .filter((successor) => Number.isInteger(successor.index))
    .map((successor) => {
      const transitionId = `transition_${stepIndex}_${successor.index}`
      const targetId = `${currentState.id}_succ_${successor.index}`
      const vedge = successor.fields.vedge || ''
      const successorLocations = parseVlocLocations(successor.state?.vloc || '')
      const changedProcesses = session.processNames
        .map((name, index) => ({ name, index }))
        .filter(({ index }) => successorLocations[index] && successorLocations[index] !== currentLocations[index])
        .map(({ name }) => name)
      const processName = changedProcesses.length > 0 ? changedProcesses.join(', ') : ''
      const attributes = {
        vedge,
        sourceVloc: currentState.attributes?.vloc || '',
        targetVloc: successor.state?.vloc || '',
        guard: successor.fields.guard || '',
        reset: successor.fields.reset || '',
        sync: successor.fields.sync || '',
        srcInvariant: successor.fields.src_invariant || '',
        tgtInvariant: successor.fields.tgt_invariant || '',
        intval: successor.state?.intval || '',
        labels: successor.state?.labels || '',
        zone: successor.state?.zone || '',
        processName
      }

      map.set(transitionId, {
        index: successor.index,
        vedge,
        targetVloc: attributes.targetVloc,
        raw: successor
      })

      return {
        id: transitionId,
        source: currentState.id,
        target: targetId,
        attributes
      }
    })

  session.transitionMap = map
  session.stepIndex += 1

  return transitions
}

function parseInteractiveStep(session, output) {
  const normalized = output.replace(/\r/g, '')
  const promptIndex = normalized.lastIndexOf('Select ')
  const body = promptIndex >= 0 ? normalized.slice(0, promptIndex).trimEnd() : normalized.trim()

  const currentSplit = body.split('--- Current state:')
  if (currentSplit.length < 2) {
    throw new Error('Unable to parse current state from tck-simulate output')
  }

  const afterCurrent = currentSplit[1]
  const [stateSection, successorsSection = ''] = afterCurrent.split('--- Successors:')
  const stateLines = stateSection
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const stateAttributes = parseStateLines(stateLines)
  const zoneString = stateAttributes.zone || ''
  const stateId = `state_${session.stateCounter++}`
  const currentState = {
    id: stateId,
    attributes: stateAttributes,
    zoneMatrix: computeZoneMatrix(zoneString, session.modelJson.clocks || [])
  }

  const successors = parseSuccessorsSection(successorsSection)
  const transitions = buildTransitionsFromSuccessors(session, currentState, successors)

  return { currentState, transitions }
}

function extractSelectBounds(output) {
  const match = output.match(/Select\s+(\d+)(?:-(\d+))?/)
  if (!match) {
    return null
  }
  const min = Number.parseInt(match[1], 10)
  const max = match[2] ? Number.parseInt(match[2], 10) : min
  return { min, max }
}

function waitForChildExit(child, timeoutMs = 500) {
  return new Promise((resolve) => {
    let settled = false

    const done = () => {
      if (!settled) {
        settled = true
        resolve()
      }
    }

    child.once('close', done)
    setTimeout(done, timeoutMs)
  })
}

async function cleanupActiveSession() {
  if (!activeSession) return

  const session = activeSession
  activeSession = null

  try {
    if (session.child && !session.closed) {
      try {
        session.child.stdin.write('q\n')
      } catch (error) {
        console.warn('Failed to send quit to tck-simulate:', error.message)
      }

      await waitForChildExit(session.child)

      if (!session.closed) {
        session.child.kill('SIGTERM')
      }
    }
  } catch (error) {
    console.warn('Error while terminating tck-simulate:', error.message)
  }

  if (session.tempDir) {
    try {
      await fsPromises.rm(session.tempDir, { recursive: true, force: true })
    } catch (error) {
      console.warn('Failed to remove temporary simulation directory:', error.message)
    }
  }
}

async function startInteractiveSession(modelJson) {
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'tchecker-gui-'))
  const tempTckFile = path.join(tempDir, 'model.tck')
  const tckContent = generateTckFromJSON(modelJson)
  await fsPromises.writeFile(tempTckFile, tckContent, 'utf8')

  const command = await resolveTckSimulatePath()
  const child = spawn(command, [tempTckFile])
  child.stdin.setDefaultEncoding('utf8')

  const session = {
    child,
    buffer: '',
    pending: null,
    error: null,
    closed: false,
    tempDir,
    tckFile: tempTckFile,
    modelJson,
    processNames: Object.keys(modelJson.processes || {}),
    stateCounter: 0,
    stepIndex: 0,
    transitionMap: new Map(),
    stderr: ''
  }

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', (data) => {
    session.buffer += data
    checkSessionBuffer(session)
  })

  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (data) => {
    session.stderr += data
  })

  child.on('error', (error) => {
    session.error = error
    checkSessionBuffer(session)
  })

  child.on('close', (code) => {
    session.closed = true
    if (code !== 0 && !session.error) {
      session.error = new Error(`tck-simulate exited with code ${code}`)
    }
    checkSessionBuffer(session)
  })

  return session
}

/**
 * 初始化模拟器，获取初始状态和可用转换
 * @param {object} modelJson - 输入的 JSON 模型
 * @returns {Promise<object>} - 包含初始状态和可用转换的对象
 */
async function initializeSimulator(modelJson) {
  console.log('=== Backend: initializeSimulator called ===')
  console.log('Model JSON received for system:', modelJson?.systemName)

  await cleanupActiveSession()

  try {
    const session = await startInteractiveSession(modelJson)
    activeSession = session

    const initialPrompt = await waitForPrompt(session)
    const bounds = extractSelectBounds(initialPrompt)
    if (!bounds || bounds.min > 0) {
      throw new Error('Unexpected initial state prompt from tck-simulate')
    }

    session.child.stdin.write('0\n')

    const firstStepOutput = await waitForPrompt(session)
    const { currentState, transitions } = parseInteractiveStep(session, firstStepOutput)

    session.currentState = currentState

    console.log('Initial state vloc:', currentState.attributes?.vloc)
    console.log('Initial transitions count:', transitions.length)

    return {
      success: true,
      initialState: currentState,
      availableTransitions: transitions
    }
  } catch (error) {
    console.error('initializeSimulator error:', error)
    await cleanupActiveSession()
    return {
      success: false,
      error: error.message
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
  console.log(
    'Requested transition:',
    requestedTransition?.id || 'unknown',
    requestedTransition?.vedge || ''
  )
  console.log('Current state vloc:', currentState?.attributes?.vloc)

  if (!activeSession) {
    return {
      success: false,
      error: 'Simulator session is not initialized'
    }
  }

  const session = activeSession

  if (
    modelJson &&
    JSON.stringify(modelJson.systemName) !== JSON.stringify(session.modelJson.systemName)
  ) {
    console.warn('executeTransition received a model that differs from the active session')
  }

  const candidateId = requestedTransition?.id
  let transitionInfo = candidateId ? session.transitionMap.get(candidateId) : null

  if (!transitionInfo) {
    const requestedVedge =
      requestedTransition?.vedge || requestedTransition?.edgeData?.attributes?.vedge
    const requestedTargetVloc =
      requestedTransition?.targetVloc || requestedTransition?.edgeData?.attributes?.targetVloc

    for (const [, info] of session.transitionMap.entries()) {
      if (requestedVedge && info.vedge === requestedVedge) {
        if (!requestedTargetVloc || requestedTargetVloc === info.targetVloc) {
          transitionInfo = info
          break
        }
      }
      if (!transitionInfo && !requestedVedge) {
        transitionInfo = info
      }
    }
  }

  if (!transitionInfo) {
    return {
      success: false,
      error: `Cannot find transition with id ${requestedTransition?.id || '<unknown>'}`
    }
  }

  try {
    session.child.stdin.write(`${transitionInfo.index}\n`)
  } catch (error) {
    console.error('Failed to write transition selection to tck-simulate:', error)
    await cleanupActiveSession()
    return {
      success: false,
      error: error.message
    }
  }

  try {
    const stepOutput = await waitForPrompt(session)
    const { currentState: newState, transitions } = parseInteractiveStep(session, stepOutput)
    session.currentState = newState

    console.log('New state vloc:', newState.attributes?.vloc)
    console.log('New transitions count:', transitions.length)

    return {
      success: true,
      newState,
      availableTransitions: transitions
    }
  } catch (error) {
    console.error('executeTransition error:', error)
    await cleanupActiveSession()
    return {
      success: false,
      error: error.message
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
