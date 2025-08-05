// 这是一个描述 JSON 结构的伪代码/TypeScript 接口
export const AutomatonModel = {
  systemName: 'string',
  clocks: [{ name: 'string', size: 'number' }],
  intVars: [{ name: 'string', size: 'number', min: 'number', max: 'number', initial: 'number' }],
  events: ['string'],
  processes: {
    // key 是进程名
    processName: {
      locations: {
        // key 是位置名
        locationName: {
          isInitial: 'boolean', // 对应 initial:
          invariant: 'string', // 对应 invariant:
          labels: ['string'], // 对应 labels:
          isCommitted: 'boolean', // 对应 committed:
          isUrgent: 'boolean' // 对应 urgent:
        }
      },
      edges: [
        {
          source: 'string',
          target: 'string',
          event: 'string',
          guard: 'string', // 对应 provided:
          action: 'string' // 对应 do:
        }
      ]
    }
  },
  synchronizations: [
    {
      // constraints 数组直接对应 p@e 这种格式
      constraints: ['string']
    }
  ]
}
