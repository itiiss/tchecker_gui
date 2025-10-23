const fsNative = require('fs')
const fs = fsNative.promises
const path = require('path')
const { spawn } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')

/**
 * Verification Property Manager
 * Uses tck-reach tool for formal verification
 */

function resolveAppBasePath() {
  try {
    const { app } = require('electron')
    if (app && typeof app.getAppPath === 'function') {
      return app.getAppPath()
    }
  } catch {
    // Ignore and use fallback path
  }
  return path.join(__dirname, '..', '..')
}

async function ensureExecutable(filePath) {
  if (!filePath) return false

  try {
    const stats = await fs.stat(filePath)
    if (!stats.isFile()) {
      return false
    }
    await fs.access(filePath, fsNative.constants.X_OK)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    }
    if (error.code === 'EACCES') {
      try {
        await fs.chmod(filePath, 0o755)
        await fs.access(filePath, fsNative.constants.X_OK)
        return true
      } catch (chmodError) {
        console.warn(`Failed to set executable permissions on ${filePath}:`, chmodError.message)
        return false
      }
    }
    throw error
  }
}

async function resolveExecutableCandidates(executableName, envVariable) {
  const appBase = resolveAppBasePath()
  const envPath = process.env[envVariable]

  const candidates = [
    path.join(appBase, 'src/main/build/src', executableName),
    path.join(appBase, 'main/build/src', executableName),
    path.join(appBase, 'resources', executableName),
    process.resourcesPath ? path.join(process.resourcesPath, executableName) : null,
    envPath
  ].filter(Boolean)

  const accessible = []
  const seen = new Set()

  for (const candidate of candidates) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    try {
      if (await ensureExecutable(candidate)) {
        accessible.push(candidate)
      }
    } catch (error) {
      if (error.code && error.code !== 'ENOENT') {
        console.warn(`Executable candidate unusable (${candidate}): ${error.message}`)
      }
    }
  }

  if (accessible.length === 0) {
    throw new Error(
      `Unable to locate executable ${executableName}. Set ${envVariable} or keep binary in src/main/build/src.`
    )
  }

  return accessible
}

async function resolveTckReachCandidates() {
  return resolveExecutableCandidates('tck-reach', 'TCK_REACH_PATH')
}

function extractDotGraph(text) {
  if (!text) return ''
  const startIndex = text.indexOf('digraph')
  if (startIndex === -1) {
    return ''
  }

  let braceDepth = 0
  let foundOpening = false

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i]
    if (char === '{') {
      braceDepth += 1
      foundOpening = true
    } else if (char === '}') {
      if (foundOpening) {
        braceDepth -= 1
        if (braceDepth === 0) {
          return text.slice(startIndex, i + 1).trim()
        }
      }
    }
  }

  return ''
}

function collectLabelsFromModel(modelData) {
  const labelSet = new Set()

  if (!modelData || typeof modelData !== 'object') {
    return labelSet
  }

  const processes = modelData.processes || {}

  Object.values(processes).forEach((process) => {
    const locations = process?.locations || {}
    Object.values(locations).forEach((location) => {
      if (Array.isArray(location.labels)) {
        location.labels
          .filter((label) => typeof label === 'string')
          .forEach((label) => labelSet.add(label.trim()))
      }
    })
  })

  return labelSet
}

function normalizeLogicFormula(formula) {
  if (typeof formula !== 'string') {
    return ''
  }

  const mergedIdentifiers = formula.replace(/([A-Za-z0-9_])\s+(?=[A-Za-z0-9_])/g, '$1')

  return mergedIdentifiers
    .replace(/\s*(\()\s*/g, '$1')
    .replace(/\s*(\))\s*/g, '$1')
    .replace(/\s*(\|\||&&)\s*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenizeLogicFormula(formula) {
  const normalizedFormula = normalizeLogicFormula(formula)

  if (!normalizedFormula) {
    throw new Error('Formula must be a non-empty string')
  }

  const tokens = []
  let buffer = ''

  const pushBuffer = () => {
    if (buffer) {
      tokens.push({ type: 'label', value: buffer })
      buffer = ''
    }
  }

  for (let i = 0; i < normalizedFormula.length; i += 1) {
    const char = normalizedFormula[i]

    if (/\s/.test(char)) {
      pushBuffer()
      continue
    }

    if (/[A-Za-z0-9_]/.test(char)) {
      buffer += char
      continue
    }

    if (char === '(' || char === ')') {
      pushBuffer()
      tokens.push({ type: 'paren', value: char })
      continue
    }

    if (char === '&' || char === '|') {
      const nextChar = normalizedFormula[i + 1]
      const operator = `${char}${nextChar}`
      if (operator !== '&&' && operator !== '||') {
        throw new Error('Only && and || operators are supported in formulas')
      }
      pushBuffer()
      tokens.push({ type: 'operator', value: operator })
      i += 1
      continue
    }

    if (char === '!') {
      throw new Error('Negation is not supported in formulas')
    }

    throw new Error(`Unsupported character "${char}" in formula`)
  }

  pushBuffer()

  if (tokens.length === 0) {
    throw new Error('Formula cannot be empty')
  }

  return tokens
}

function parseFormulaTokens(tokens) {
  let index = 0

  const parseExpression = () => parseOr()

  const parseOr = () => {
    let node = parseAnd()
    while (tokens[index]?.type === 'operator' && tokens[index].value === '||') {
      index += 1
      node = { type: 'or', left: node, right: parseAnd() }
    }
    return node
  }

  const parseAnd = () => {
    let node = parsePrimary()
    while (tokens[index]?.type === 'operator' && tokens[index].value === '&&') {
      index += 1
      node = { type: 'and', left: node, right: parsePrimary() }
    }
    return node
  }

  const parsePrimary = () => {
    const token = tokens[index]
    if (!token) {
      throw new Error('Unexpected end of formula')
    }

    if (token.type === 'label') {
      index += 1
      return { type: 'label', value: token.value }
    }

    if (token.type === 'paren' && token.value === '(') {
      index += 1
      const expression = parseExpression()
      if (tokens[index]?.type !== 'paren' || tokens[index].value !== ')') {
        throw new Error('Mismatched parentheses in formula')
      }
      index += 1
      return expression
    }

    throw new Error('Invalid token sequence in formula')
  }

  const ast = parseExpression()

  if (index !== tokens.length) {
    throw new Error('Invalid trailing tokens in formula')
  }

  return ast
}

function astToClauses(ast) {
  if (!ast) {
    return []
  }

  if (ast.type === 'label') {
    return [[ast.value]]
  }

  if (ast.type === 'or') {
    return [...astToClauses(ast.left), ...astToClauses(ast.right)]
  }

  if (ast.type === 'and') {
    const leftClauses = astToClauses(ast.left)
    const rightClauses = astToClauses(ast.right)
    const combined = []

    leftClauses.forEach((left) => {
      rightClauses.forEach((right) => {
        combined.push([...new Set([...left, ...right])])
      })
    })

    return combined
  }

  throw new Error('Unsupported node in formula AST')
}

function parseLogicFormula(formula) {
  const tokens = tokenizeLogicFormula(formula)
  const ast = parseFormulaTokens(tokens)
  const clauses = astToClauses(ast)
  const sanitizedClauses = clauses
    .map((clause) => clause.map((label) => label.trim()).filter(Boolean))
    .filter((clause) => clause.length > 0)

  if (sanitizedClauses.length === 0) {
    throw new Error('Formula must reference at least one label')
  }

  return sanitizedClauses
}

/**
 * Collect unique, trimmed label names from a property configuration
 * @param {object} property - Property configuration
 * @returns {string[]} - Array of distinct labels
 */
function collectPropertyLabels(property) {
  if (Array.isArray(property.clauseLabels) && property.clauseLabels.length > 0) {
    return Array.from(
      new Set(
        property.clauseLabels
          .filter((label) => typeof label === 'string')
          .map((label) => label.trim())
          .filter(Boolean)
      )
    )
  }

  const labels = Array.isArray(property.labels) ? property.labels : []
  const fallback = []

  if (property.targetLabel) {
    fallback.push(property.targetLabel)
  }

  if (property.secondaryLabel) {
    fallback.push(property.secondaryLabel)
  }

  if (Array.isArray(property.formulaLabels)) {
    fallback.push(...property.formulaLabels)
  }

  const combined = [...labels, ...fallback]
  const cleaned = combined
    .filter((label) => typeof label === 'string' && label.trim())
    .map((label) => label.trim())

  return Array.from(new Set(cleaned))
}

/**
 * Generate tck-reach command parameters based on property configuration
 * @param {object} property - Property configuration
 * @returns {object} - Configuration containing algorithm, labels and certificate type
 */
function getVerificationConfig(property) {
  const config = {
    algorithm: 'covreach', // Default: coverage reachability algorithm
    labels: [],
    certificateType: 'symbolic',
    searchOrder: 'bfs'
  }

  const labels = collectPropertyLabels(property)

  switch (property.type) {
    case 'reachability':
      if (labels.length === 0) {
        throw new Error('Reachability verification requires at least one target label')
      }
      config.labels = labels.slice(0, 1)
      config.certificateType = 'concrete' // Get concrete execution trace
      break

    case 'safety':
      if (labels.length === 0) {
        throw new Error('Safety verification requires at least one target label')
      }
      config.labels = labels.slice(0, 1)
      config.certificateType = 'concrete' // If unsafe, provide concrete counter-example trace
      break

    case 'mutual-exclusion': {
      if (labels.length < 2) {
        throw new Error('Mutual exclusion verification requires two distinct labels')
      }
      config.labels = labels.slice(0, 2)
      config.certificateType = 'concrete'
      break
    }

    case 'deadlock-free':
      config.algorithm = 'covreach'
      config.labels = [] // Deadlock-free check doesn't need specific labels
      config.certificateType = 'concrete' // If deadlock exists, provide concrete trace
      break

    default:
      throw new Error(`Unsupported verification type: ${property.type}`)
  }

  return config
}

function buildVerificationPlan(property, modelData) {
  const propertyType = typeof property.type === 'string' ? property.type.trim() : property.type

  if (propertyType === 'logic-formula') {
    const formulaText = normalizeLogicFormula(property.formula || '')
    if (!formulaText) {
      throw new Error('Logical formula cannot be empty')
    }

    const clauses = parseLogicFormula(formulaText)
    const availableLabels = collectLabelsFromModel(modelData)

    const missingLabels = Array.from(
      new Set(clauses.flat().filter((label) => label && !availableLabels.has(label)))
    )

    if (missingLabels.length > 0) {
      throw new Error(`Formula references unknown labels: ${missingLabels.join(', ')}`)
    }

    const mode = property.formulaMode === 'exists' ? 'exists' : 'forbid'

    return {
      type: 'logic-formula',
      formulaMode: mode,
      runs: clauses.map((labels, index) => ({
        id: index,
        config: {
          algorithm: 'covreach',
          labels,
          certificateType: 'graph',
          searchOrder: 'bfs'
        },
        propertyOverride: {
          ...property,
          type: 'logic-formula',
          formula: formulaText,
          clauseLabels: labels,
          targetLabel: labels.join(' && '),
          formulaMode: mode
        }
      }))
    }
  }

  const normalizedProperty = {
    ...property,
    type: propertyType
  }

  const config = getVerificationConfig(normalizedProperty)

  return {
    type: propertyType,
    runs: [
      {
        id: 0,
        config,
        propertyOverride: { ...normalizedProperty }
      }
    ]
  }
}

/**
 * Parse tck-reach output results
 * @param {string} stdout - Standard output
 * @param {string} stderr - Error output
 * @param {number} exitCode - Exit code
 * @param {object} property - Property configuration
 * @returns {object} - Parsed verification results
 */
function parseVerificationResult(stdout, stderr, exitCode, property) {
  const result = {
    satisfied: false,
    output: stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : ''),
    counterExample: null,
    rawOutput: { stdout, stderr, exitCode }
  }

  const normalizedOutput = stdout.toLowerCase()
  const hasReachableTrue = /reachable\s+true/.test(normalizedOutput)
  const hasReachableFalse = /reachable\s+false/.test(normalizedOutput)
  const mentionsUnreachable =
    normalizedOutput.includes('not reachable') || normalizedOutput.includes('unreachable')

  const labels = collectPropertyLabels(property)
  const primaryLabel = labels[0] || property.targetLabel || ''
  const secondaryLabel = labels[1] || property.secondaryLabel || ''
  const combinedLabelText = [primaryLabel, secondaryLabel].filter(Boolean).join(' & ')

  switch (property.type) {
    case 'reachability': {
      if (hasReachableTrue) {
        result.satisfied = true
      } else if (hasReachableFalse || mentionsUnreachable) {
        result.satisfied = false
      } else {
        result.satisfied = exitCode === 0
      }

      if (result.satisfied) {
        result.counterExample =
          `Reachable path found!\n\nTarget label: ${primaryLabel || 'n/a'}\nStatus: Reachable\n\n` +
          stdout
      }
      break
    }

    case 'safety': {
      if (hasReachableTrue) {
        result.satisfied = false
      } else if (hasReachableFalse || mentionsUnreachable) {
        result.satisfied = true
      } else {
        result.satisfied = !hasReachableTrue
      }

      if (!result.satisfied) {
        result.counterExample =
          `Safety violation found!\n\nViolating label: ${primaryLabel || 'n/a'}\nStatus: Unsafe\n\n` +
          stdout
      }
      break
    }

    case 'mutual-exclusion': {
      if (hasReachableTrue) {
        result.satisfied = false
      } else if (hasReachableFalse || mentionsUnreachable) {
        result.satisfied = true
      } else {
        result.satisfied = !hasReachableTrue
      }

      if (result.satisfied) {
        result.counterExample =
          `Mutual exclusion holds for labels: ${combinedLabelText || 'n/a'}\n\nNo reachable state contains all selected labels.\n\n` +
          stdout
      } else {
        result.counterExample =
          `Mutual exclusion violated!\n\nViolating labels: ${combinedLabelText || 'n/a'}\nStatus: Reachable\n\n` +
          stdout
      }
      break
    }

    case 'deadlock-free': {
      if (!normalizedOutput.includes('deadlock') || normalizedOutput.includes('deadlock-free')) {
        result.satisfied = true
      }

      if (result.satisfied) {
        result.counterExample =
          'System is deadlock-free\n\nCheck result: Pass\nSystem can operate normally without entering deadlock states\n\n' +
          stdout
      } else {
        result.counterExample =
          'Deadlock found!\n\nCheck result: Fail\nSystem has states that may lead to deadlock\n\n' +
          stdout
      }
      break
    }

    case 'logic-formula': {
      const clauseLabels = Array.isArray(property.clauseLabels) ? property.clauseLabels : labels
      const clauseText = clauseLabels.join(' && ') || property.formula || 'true'
      const mode = property.formulaMode === 'exists' ? 'exists' : 'forbid'

      const isReachable =
        hasReachableTrue || (!hasReachableFalse && !mentionsUnreachable && exitCode === 0)
      const isUnreachable = hasReachableFalse || mentionsUnreachable

      if (mode === 'exists') {
        result.satisfied = isReachable
        if (result.satisfied) {
          result.counterExample =
            `Formula satisfied for clause: ${clauseText}\n\nReachable state found.\n\n` + stdout
        } else {
          result.counterExample =
            `Formula not satisfied for clause: ${clauseText}\n\nNo reachable state matches this clause.\n\n` +
            stdout
        }
      } else {
        result.satisfied = !isReachable || isUnreachable
        if (result.satisfied) {
          result.counterExample =
            `No reachable state satisfies clause: ${clauseText}\n\nFormula remains safe.\n\n` +
            stdout
        } else {
          result.counterExample =
            `Violation: reachable state satisfies clause: ${clauseText}\n\n` + stdout
        }
      }

      result.evaluatedClause = clauseText
      break
    }

    default:
      throw new Error(`Unsupported verification type: ${property.type}`)
  }

  result.reachabilityInfo = extractReachabilityInfo(stdout)
  return result
}

function aggregateLogicFormulaResults(plan, clauseResults, property) {
  if (!Array.isArray(clauseResults) || clauseResults.length === 0) {
    throw new Error('Logic formula verification produced no clause results')
  }

  const mode = plan.formulaMode === 'exists' ? 'exists' : 'forbid'

  const satisfyingClause = clauseResults.find((entry) => entry.parsedResult.satisfied)
  const violatingClause = clauseResults.find((entry) => !entry.parsedResult.satisfied)

  let representativeEntry
  let finalSatisfied
  let evaluatedClauseText

  if (mode === 'exists') {
    finalSatisfied = Boolean(satisfyingClause)
    representativeEntry = satisfyingClause || clauseResults[0]
    const labels = satisfyingClause?.config?.labels || []
    evaluatedClauseText = finalSatisfied
      ? (Array.isArray(labels) && labels.length > 0 ? labels.join(' && ') : 'true')
      : 'No satisfying clause'
  } else {
    finalSatisfied = !violatingClause
    representativeEntry = violatingClause || clauseResults[0]
    const labels = violatingClause?.config?.labels || []
    evaluatedClauseText = violatingClause
      ? Array.isArray(labels) && labels.length > 0
        ? labels.join(' && ')
        : 'true'
      : 'All Clauses Safe'
  }

  const finalResult = {
    ...representativeEntry.parsedResult,
    satisfied: finalSatisfied,
    formula: property.formula,
    formulaMode: mode,
    evaluatedClause: evaluatedClauseText
  }

  if (!finalResult.dotGraph || !finalResult.dotGraph.trim()) {
    const firstWithGraph = clauseResults.find(
      (entry) => entry.parsedResult.dotGraph && entry.parsedResult.dotGraph.trim()
    )
    if (firstWithGraph) {
      finalResult.dotGraph = firstWithGraph.parsedResult.dotGraph
    }
  }

  finalResult.formulaEvaluation = clauseResults.map((entry, index) => {
    const runIndex =
      typeof entry.parsedResult.runId === 'number' ? entry.parsedResult.runId : index
    return {
      index: runIndex,
      clause: entry.config.labels,
      satisfied: entry.parsedResult.satisfied,
      exitCode: entry.exitCode,
      command: entry.commandUsed,
      dotGraph: entry.parsedResult.dotGraph,
      reachabilityInfo: entry.parsedResult.reachabilityInfo,
      counterExample: entry.parsedResult.counterExample,
      output: entry.combinedOutput
    }
  })

  finalResult.formulaClauseGraphs = clauseResults
    .filter((entry) => entry.parsedResult.dotGraph && entry.parsedResult.dotGraph.trim())
    .map((entry, index) => {
      const runIndex =
        typeof entry.parsedResult.runId === 'number' ? entry.parsedResult.runId : index
      return {
        index: runIndex,
        clause: entry.config.labels,
        dotGraph: entry.parsedResult.dotGraph,
        satisfied: entry.parsedResult.satisfied
      }
    })

  finalResult.output = clauseResults
    .map((entry, idx) => {
      const clauseText =
        Array.isArray(entry.config.labels) && entry.config.labels.length > 0
          ? entry.config.labels.join(' && ')
          : '(true)'
      return `Run ${idx + 1} | Clause: ${clauseText} | Exit: ${entry.exitCode}\n${entry.combinedOutput}`
    })
    .join('\n\n---\n\n')

  return finalResult
}

/**
 * Verify the specified property
 * @param {object} verificationRequest - Verification request containing property and model data
 * @returns {Promise<object>} - Verification results
 */
async function verifyProperty(verificationRequest) {
  const { property, modelData } = verificationRequest
  console.log('=== Starting property verification ===')
  console.log('Property:', JSON.stringify(property, null, 2))

  const tempTckFile = path.join(__dirname, `verify_${Date.now()}.tck`)
  const tempOutputFiles = []
  let lastStderrOutput = ''

  try {
    // 1. Generate TCK file
    const tckContent = generateTckFromJSON(modelData)
    console.log('Generated TCK content:')
    console.log(tckContent)
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    const plan = buildVerificationPlan(property, modelData)
    console.log('Verification plan:', plan)

    const reachCandidates = await resolveTckReachCandidates()
    console.log('可用 tck-reach 路径候选:', reachCandidates)

    const clauseResults = []
    let finalResult = null

    for (const run of plan.runs) {
      const { config, propertyOverride } = run
      const args = ['-a', config.algorithm, '-C', config.certificateType, '-s', config.searchOrder]

      if (config.labels && config.labels.length > 0) {
        args.push('-l', config.labels.join(','))
      }

      const outputFilePath = path.join(
        __dirname,
        `verify_output_${Date.now()}_${run.id}_${Math.random().toString(16).slice(2)}.dot`
      )
      tempOutputFiles.push(outputFilePath)

      args.push('-o', outputFilePath)
      args.push(tempTckFile)

      console.log(
        `执行命令 (run ${run.id}):`,
        args.join(' '),
        '| labels:',
        config.labels?.join(', ') || '(none)'
      )

      let stdout = ''
      let stderrOutput = ''
      let exitCode = 0
      let commandUsed = null
      let lastSpawnError = null

      for (const candidatePath of reachCandidates) {
        try {
          const result = await new Promise((resolve, reject) => {
            const child = spawn(candidatePath, args)
            let stdoutData = ''
            let stderrData = ''

            child.stdout.on('data', (data) => {
              stdoutData += data.toString()
            })

            child.stderr.on('data', (data) => {
              stderrData += data.toString()
            })

            child.on('close', (code) => {
              resolve({
                stdout: stdoutData,
                stderr: stderrData,
                exitCode: code
              })
            })

            child.on('error', reject)
          })

          stdout = result.stdout
          stderrOutput = result.stderr
          exitCode = result.exitCode
          commandUsed = candidatePath
          break
        } catch (spawnError) {
          lastSpawnError = spawnError
          console.warn(
            `Failed to execute ${candidatePath}: ${spawnError.message}. Trying next candidate if available.`
          )
        }
      }

      if (!commandUsed) {
        throw new Error(
          lastSpawnError
            ? `Failed to execute tck-reach: ${lastSpawnError.message}`
            : 'Failed to execute tck-reach: no executable candidates available'
        )
      }

      console.log('=== tck-reach 执行结果 (run', run.id, ')===')
      console.log('退出码:', exitCode)
      console.log('stdout 内容:')
      console.log(stdout)
      if (stderrOutput) {
        console.log('stderr 内容:')
        console.log(stderrOutput)
      }

      let outputFileContent = ''
      let dotContent = ''
      try {
        outputFileContent = await fs.readFile(outputFilePath, 'utf8')
        console.log('输出文件内容:', outputFileContent)

        if (outputFileContent.includes('digraph') || outputFileContent.includes('->')) {
          dotContent = outputFileContent
        }
      } catch (err) {
        console.log('无法读取输出文件:', err.message)
      }

      if (stderrOutput && stderrOutput.includes('ERROR:')) {
        console.error('模型验证错误:', stderrOutput)
        return {
          success: false,
          error: stderrOutput,
          isModelError: true,
          modelErrorDetails: stderrOutput,
          output: stderrOutput
        }
      }

      const combinedOutput =
        stdout + (outputFileContent ? `\n--- 证书输出 ---\n${outputFileContent}` : '')
      console.log('Combined output for parsing:', combinedOutput)
      console.log('Extracting reachability info from:', stdout || outputFileContent || 'no output')

      const parsedResult = parseVerificationResult(
        combinedOutput,
        stderrOutput,
        exitCode,
        propertyOverride
      )

      parsedResult.reachabilityInfo = extractReachabilityInfo(
        stdout || outputFileContent || combinedOutput
      )
      parsedResult.dotGraph = dotContent || extractDotGraph(combinedOutput)
      parsedResult.rawStdout = stdout
      parsedResult.certificateOutput = outputFileContent
      parsedResult.commandUsed = commandUsed
      parsedResult.labelsTested = config.labels
      parsedResult.runId = run.id

      console.log('Parsed reachabilityInfo:', parsedResult.reachabilityInfo)
      console.log('验证结果 run', run.id, ':', parsedResult)

      clauseResults.push({
        config,
        propertyOverride,
        parsedResult,
        stdout,
        stderr: stderrOutput,
        exitCode,
        combinedOutput,
        commandUsed
      })

      lastStderrOutput = stderrOutput

      if (plan.type !== 'logic-formula') {
        finalResult = { ...parsedResult }
        break
      }
    }

    if (plan.type === 'logic-formula') {
      finalResult = aggregateLogicFormulaResults(plan, clauseResults, property)
    } else if (!finalResult && clauseResults.length > 0) {
      finalResult = { ...clauseResults[clauseResults.length - 1].parsedResult }
    }

    if (!finalResult) {
      throw new Error('Verification did not produce any result')
    }

    return {
      success: true,
      ...finalResult
    }
  } catch (error) {
    console.error('验证过程出错:', error)
    return {
      success: false,
      error: error.message,
      isModelError:
        error.message.includes('out-of-bounds') ||
        error.message.includes('ERROR:') ||
        (lastStderrOutput && lastStderrOutput.includes('ERROR:')),
      modelErrorDetails: lastStderrOutput || error.message
    }
  } finally {
    // 7. 清理临时文件
    const cleanupTargets = [tempTckFile, ...tempOutputFiles]
    await Promise.allSettled(
      cleanupTargets.map(async (filePath) => {
        try {
          await fs.unlink(filePath)
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`清理临时文件失败 (${filePath}):`, err)
          }
        }
      })
    )
  }
}

/**
 * Extract reachability statistics from tck-reach output
 */
function extractReachabilityInfo(stdout) {
  const info = {}

  const patterns = [
    { key: 'reachable', regex: /REACHABLE\s+(\w+)/i },
    { key: 'coveredStates', regex: /COVERED_STATES\s+(\d+)/i },
    { key: 'storedStates', regex: /STORED_STATES\s+(\d+)/i },
    { key: 'visitedStates', regex: /VISITED_STATES\s+(\d+)/i },
    { key: 'visitedTransitions', regex: /VISITED_TRANSITIONS\s+(\d+)/i },
    { key: 'runningTime', regex: /RUNNING_TIME_SECONDS\s+([\d.]+)/i },
    { key: 'maxMemory', regex: /MEMORY_MAX_RSS\s+(\d+)/i }
  ]

  console.log('Extracting from stdout:', stdout)

  patterns.forEach(({ key, regex }) => {
    const match = stdout.match(regex)
    if (match) {
      console.log(`Found ${key}: ${match[1]}`)
      info[key] = match[1]
    } else {
      console.log(`No match for ${key} with regex ${regex}`)
    }
  })

  return info
}

module.exports = {
  verifyProperty
}
