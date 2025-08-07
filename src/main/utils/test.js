const { initializeSimulator } = require('./simulation-manager')

// 一个最简化的测试模型，用于验证端到端流程
const simpleModel = {
  systemName: 'simple_test_system',
  clocks: [{ name: 'x', size: 1 }],
  events: ['a', 'b'],
  processes: {
    p1: {
      locations: {
        l0: { isInitial: true },
        l1: { invariant: 'x <= 2' },
        l2: {}
      },
      edges: [
        { source: 'l0', target: 'l1', event: 'a', action: 'x = 0' },
        { source: 'l1', target: 'l2', event: 'b', guard: 'x >= 1' }
      ]
    }
  }
  // 没有同步，因为只有一个进程
}

if (require.main === module) {
  initializeSimulator(simpleModel)
    .then((result) => {
      console.log('Initialize Simulator Result:', JSON.stringify(result, null, 2))
      process.exit(0) // 成功时退出
    })
    .catch((error) => {
      console.error('Initialize Simulator Error:', error)
      process.exit(1) // 失败时退出
    })
}
