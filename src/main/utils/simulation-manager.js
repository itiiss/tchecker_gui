const fs = require('fs').promises
const path = require('path')
const { spawn } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')
const { parseDot } = require('./dot-parser')

/**
 * 运行 TChecker 模拟，生成 DOT 和 JSON 文件
 * @param {object} modelJson - 输入的 JSON 模型
 * @returns {Promise<object>} - 包含状态图的 JSON 对象
 */
async function runSimulation(modelJson) {
  const tempTckFile = path.join(__dirname, 'temp_model.tck')
  const tempDotFile = path.join(__dirname, 'output.dot')
  const finalJsonFile = path.join(__dirname, 'parsed_output.json') // 最终的 JSON 输出文件

  try {
    // 1. 从 JSON 生成 TCK 文件内容
    const tckContent = generateTckFromJSON(modelJson)
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    // 2. 执行 tck-simulate 以生成 DOT 格式的轨迹
    await new Promise((resolve, reject) => {
      const command = '/Users/zhaochen/Documents/tchecker_gui/src/main/build/src/tck-simulate'
      const args = [tempTckFile, '-t', '-r', '10', '-o', tempDotFile]

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

    // 3. 读取输出的 DOT 文件
    const dotContent = await fs.readFile(tempDotFile, 'utf8')

    // 4. 解析 DOT 内容
    const parsedJson = parseDot(dotContent)

    // 5. 将解析后的 JSON 写入最终文件
    await fs.writeFile(finalJsonFile, JSON.stringify(parsedJson, null, 2), 'utf8')
    console.log(`Successfully wrote parsed JSON to ${finalJsonFile}`)

    // 6. 返回解析结果
    return parsedJson
  } finally {
    // 7. 清理临时文件 (为调试目的暂时禁用)
    console.log('Cleanup of temporary files is disabled for debugging.')
    try {
      await fs.unlink(tempTckFile)
      // 保留 tempDotFile 以便检查
      // await fs.unlink(tempDotFile);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error cleaning up temporary files:', err)
      }
    }
  }
}

module.exports = { runSimulation }
