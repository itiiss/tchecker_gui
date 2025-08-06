/**
 * dot-parser.js (v2)
 * * 一个将 tck-simulate 生成的 DOT 格式字符串解析为 JSON 对象的健壮工具。
 */

/**
 * 将 DOT 图形字符串中的属性字符串 (例如 `key1="value1", key2="value2"`) 解析为对象。
 * @param {string} attrString - 包含属性的字符串。
 * @returns {object} - 包含属性的键值对对象。
 */
function parseAttributes(attrString) {
  const attributes = {}
  const attrRegex = /(\w+)="([^"]*)"/g
  let match
  while ((match = attrRegex.exec(attrString)) !== null) {
    attributes[match[1]] = match[2]
  }
  return attributes
}

/**
 * 将 DOT 图形字符串解析为结构化的 JSON 对象。
 * @param {string} dotString - tck-simulate 生成的 DOT 格式内容。
 * @returns {object} - 代表状态图的 JSON 对象，包含节点和边。
 */
function parseDot(dotString) {
  const graph = { nodes: [], edges: [] }

  // 正则表达式，用于匹配节点行，例如: 0 [initial="true", ...]
  const nodeRegex = /^\s*(\w+)\s*\[([^\]]+)\]/gm

  // 正则表达式，用于匹配边行，例如: 0 -> 1 [vedge="<p1@a>"]
  const edgeRegex = /^\s*(\w+)\s*->\s*(\w+)\s*\[([^\]]+)\]/gm

  let match

  // 1. 解析所有节点
  while ((match = nodeRegex.exec(dotString)) !== null) {
    // 确保这不是一条边 (一个简单的启发式方法)
    if (match[0].includes('->')) continue

    const nodeId = match[1]
    const attributesString = match[2]
    const attributes = parseAttributes(attributesString)

    graph.nodes.push({ id: nodeId, attributes })
  }

  // 2. 解析所有边
  while ((match = edgeRegex.exec(dotString)) !== null) {
    const source = match[1]
    const target = match[2]
    const attributesString = match[3]
    const attributes = parseAttributes(attributesString)

    graph.edges.push({
      source: source,
      target: target,
      attributes: attributes
    })
  }

  return graph
}

module.exports = { parseDot }
