const fs = require('fs').promises
const path = require('path')
const { exec } = require('child_process')
const { generateTckFromJSON } = require('./tck-generator')

/**
 * 运行 TChecker 模拟的完整流程
 * @param {object} modelJson - 输入的 JSON 模型
 * @returns {Promise<object>} - 包含模拟结果的 JSON 对象
 */
async function runSimulation(modelJson) {
  const tempTckFile = path.join(__dirname, 'temp_model.tck')
  const outputFile = path.join(__dirname, 'output.json')

  try {
    // 1. 从 JSON 生成 TCK 文件内容
    const tckContent = generateTckFromJSON(modelJson)

    // 2. 将 TCK 内容写入临时文件
    await fs.writeFile(tempTckFile, tckContent, 'utf8')

    // 3. 执行 tck-simulated 命令
    await new Promise((resolve, reject) => {
      const command = `../build/src/tck-simulate -i ${tempTckFile} -o ${outputFile}`
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行出错: ${error}`)
          return reject(error)
        }
        console.log(`stdout: ${stdout}`)
        console.error(`stderr: ${stderr}`)
        resolve()
      })
    })

    // 4. 读取输出的 JSON 文件
    const resultJson = await fs.readFile(outputFile, 'utf8')

    // 5. 解析并返回结果
    return JSON.parse(resultJson)
  } finally {
    // 6. 清理临时文件
    try {
      await fs.unlink(tempTckFile)
      await fs.unlink(outputFile)
    } catch (err) {
      // 如果文件不存在，忽略错误
      if (err.code !== 'ENOENT') {
        console.error('清理临时文件时出错:', err)
      }
    }
  }
}

module.exports = { runSimulation }
