const { runSimulation } = require('./simulation-manager')

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

if (require.main === module) {
  runSimulation(trainGateModel)
    .then((result) => {
      console.log('Simulation Result:', result)
    })
    .catch((error) => {
      console.error('Simulation Error:', error)
    })
}
