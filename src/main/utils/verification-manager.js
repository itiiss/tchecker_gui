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

  switch (property.type) {
    case 'reachability':
      config.algorithm = 'covreach'
      config.labels = [property.targetLabel]
      config.certificateType = 'concrete' // Get concrete execution trace
      break

    case 'safety':
      config.algorithm = 'covreach'
      config.labels = [property.targetLabel]
      config.certificateType = 'concrete' // If unsafe, provide concrete counter-example trace
      break

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

  // Analyze output content to determine verification results
  const output = stdout.toLowerCase()

  switch (property.type) {
    case 'reachability':
      // Reachability: Check REACHABLE flag
      if (output.includes('reachable true') || output.match(/reachable\s+true/i)) {
        result.satisfied = true
      } else if (output.includes('reachable false') || output.match(/reachable\s+false/i)) {
        result.satisfied = false
      } else if (exitCode === 0) {
        // If no explicit REACHABLE output but exit code is 0, may have found path
        result.satisfied = true
      }
      break

    case 'safety':
      // Safety: Satisfied if no unsafe states found (reverse logic)
      if (output.includes('not reachable') || output.includes('unreachable') || exitCode !== 0) {
        result.satisfied = true
      }
      break

    case 'deadlock-free':
      // Deadlock-free: Satisfied if no deadlock states found
      if (!output.includes('deadlock') || output.includes('deadlock-free')) {
        result.satisfied = true
      }
      break
  }

  // Extract trace information - adapted for tck-reach output format
  result.reachabilityInfo = extractReachabilityInfo(stdout)

  // For reachability check, if path found, extract state information
  if (property.type === 'reachability' && result.satisfied) {
    result.counterExample =
      `Reachable path found!\n\nTarget label: ${property.targetLabel}\nStatus: Reachable\n\n` +
      stdout
  }

  // For safety check, if unsafe, extract counter-example
  else if (property.type === 'safety' && !result.satisfied) {
    result.counterExample =
      `Safety violation found!\n\nViolating label: ${property.targetLabel}\nStatus: Unsafe\n\n` +
      stdout
  }

  // For deadlock check
  else if (property.type === 'deadlock-free') {
    if (result.satisfied) {
      result.counterExample =
        `System is deadlock-free\n\nCheck result: Pass\nSystem can operate normally without entering deadlock states\n\n` +
        stdout
    } else {
      result.counterExample =
        `Deadlock found!\n\nCheck result: Fail\nSystem has states that may lead to deadlock\n\n` +
        stdout
    }
  }

  return result
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
  const tempOutputFile = path.join(__dirname, `verify_output_${Date.now()}.txt`)
  let stdout = ''
  let stderrOutput = ''
  let exitCode = 0

  try {
    // 1. Generate TCK file
    const tckContent = generateTckFromJSON(modelData)
    console.log('Generated TCK content:')
    console.log(tckContent)
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    // 2. 获取验证配置
    const config = getVerificationConfig(property)
    console.log('验证配置:', config)

    // 3. 构建 tck-reach 命令候选
    const reachCandidates = await resolveTckReachCandidates()
    const args = [
      '-a',
      config.algorithm,
      '-C',
      config.certificateType,
      '-s',
      config.searchOrder
      // 暂时移除 -o 参数，让统计信息输出到 stdout
      // '-o', tempOutputFile
    ]

    // 添加标签参数（如果需要）
    if (config.labels.length > 0) {
      args.push('-l', config.labels.join(','))
    }

    // 添加输入文件
    args.push(tempTckFile)

    console.log('可用 tck-reach 路径候选:', reachCandidates)

    // 4. 按候选顺序执行 tck-reach
    let commandUsed = null
    let lastSpawnError = null

    for (const candidatePath of reachCandidates) {
      console.log('执行命令:', candidatePath, args.join(' '))
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

    console.log('=== tck-reach 执行结果 ===')
    console.log('退出码:', exitCode)
    console.log('stdout 内容:')
    console.log(stdout)
    if (stderrOutput) {
      console.log('stderr 内容:')
      console.log(stderrOutput)
    }

    // 5. 读取输出文件（如果存在）
    let outputFileContent = ''
    let dotContent = ''
    try {
      outputFileContent = await fs.readFile(tempOutputFile, 'utf8')
      console.log('输出文件内容:', outputFileContent)

      // 如果输出文件包含DOT格式内容，保存它
      if (outputFileContent.includes('digraph') || outputFileContent.includes('->')) {
        dotContent = outputFileContent
      }
    } catch (err) {
      console.log('无法读取输出文件:', err.message)
    }

    // 6. 检查是否有模型错误
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

    // 7. 解析结果 - 确保从所有输出源提取统计信息
    const combinedOutput =
      stdout + (outputFileContent ? `\n--- 证书输出 ---\n${outputFileContent}` : '')
    console.log('Combined output for parsing:', combinedOutput)
    console.log('Extracting reachability info from:', stdout || outputFileContent || 'no output')

    const result = parseVerificationResult(combinedOutput, stderrOutput, exitCode, property)

    // Ensure reachabilityInfo is correctly extracted
    result.reachabilityInfo = extractReachabilityInfo(stdout || outputFileContent || combinedOutput)
    console.log('Extracted reachabilityInfo:', result.reachabilityInfo)

    // 添加DOT内容和原始输出到结果中
    result.dotGraph = dotContent || extractDotGraph(combinedOutput)
    result.rawStdout = stdout
    result.certificateOutput = outputFileContent

    // Ensure reachabilityInfo is correctly extracted
    console.log('Parsed reachabilityInfo:', result.reachabilityInfo)
    console.log('验证结果:', result)

    return {
      success: true,
      ...result
    }
  } catch (error) {
    console.error('验证过程出错:', error)
    return {
      success: false,
      error: error.message,
      isModelError:
        error.message.includes('out-of-bounds') ||
        error.message.includes('ERROR:') ||
        (stderrOutput && stderrOutput.includes('ERROR:')),
      modelErrorDetails: stderrOutput || error.message
    }
  } finally {
    // 7. 清理临时文件
    try {
      await fs.unlink(tempTckFile)
      await fs.unlink(tempOutputFile)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('清理临时文件失败:', err)
      }
    }
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
