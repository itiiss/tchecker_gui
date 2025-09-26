const ATTRIBUTE_SPLIT_REGEX = /:/

function extractDeclarationValue(line, prefixLength) {
  let rest = line.slice(prefixLength).trim()
  if (!rest) return ''

  const braceIndex = rest.indexOf('{')
  if (braceIndex !== -1) {
    rest = rest.slice(0, braceIndex).trim()
  }

  return rest
}

function parseAttributes(attributeString = '') {
  const trimmed = attributeString.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    return {}
  }

  const body = trimmed.slice(1, -1)
  if (!body) return {}

  const tokens = body.split(ATTRIBUTE_SPLIT_REGEX)
  const attributes = {}
  for (let i = 0; i < tokens.length; i += 2) {
    const key = tokens[i]?.trim()
    if (!key) continue
    const value = tokens[i + 1] != null ? tokens[i + 1].trim() : ''
    attributes[key] = value
  }
  return attributes
}

function parseProcessLine(line) {
  if (!line.startsWith('process:')) return null
  const name = extractDeclarationValue(line, 'process:'.length)
  return name || null
}

function parseLocationLine(line) {
  const match = line.match(/^location:([^:]+):([^{}]+)\{([^}]*)\}/)
  if (!match) return null
  const [, processName, locationName, attrString] = match
  const attributes = parseAttributes(`{${attrString}}`)
  return {
    processName: processName.trim(),
    locationName: locationName.trim(),
    attributes
  }
}

function parseEdgeLine(line) {
  const match = line.match(/^edge:([^:]+):([^:]+):([^:]+):([^{}]+)\{([^}]*)\}/)
  if (!match) return null
  const [, processName, source, target, event, attrString] = match
  const attributes = parseAttributes(`{${attrString}}`)
  return {
    processName: processName.trim(),
    source: source.trim(),
    target: target.trim(),
    event: event.trim(),
    attributes
  }
}

function parseTckToModel(tckContent) {
  if (typeof tckContent !== 'string' || tckContent.trim() === '') {
    throw new Error('TCK content is empty')
  }

  const lines = tckContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  const model = {
    systemName: 'Untitled System',
    clocks: [],
    intVars: [],
    events: [],
    synchronizations: [],
    processes: {}
  }

  lines.forEach((line) => {
    if (line.startsWith('system:')) {
      const systemName = extractDeclarationValue(line, 'system:'.length)
      if (systemName) {
        model.systemName = systemName
      }
      return
    }

    if (line.startsWith('event:')) {
      const eventName = extractDeclarationValue(line, 'event:'.length)
      if (eventName && !model.events.includes(eventName)) {
        model.events.push(eventName)
      }
      return
    }

    if (line.startsWith('clock:')) {
      const decl = extractDeclarationValue(line, 'clock:'.length)
      const [sizePart, namePart] = decl.split(':').map((part) => part?.trim())
      if (namePart) {
        const size = Number(sizePart)
        if (!model.clocks.some((clock) => clock.name === namePart)) {
          model.clocks.push({ name: namePart, size: Number.isFinite(size) ? size : 1 })
        }
      }
      return
    }

    if (line.startsWith('int:')) {
      const decl = extractDeclarationValue(line, 'int:'.length)
      const parts = decl.split(':').map((part) => part?.trim())
      if (parts.length >= 5) {
        const [sizeRaw, minRaw, maxRaw, initialRaw, name] = parts
        const size = Number(sizeRaw)
        const min = Number(minRaw)
        const max = Number(maxRaw)
        const initial = Number(initialRaw)
        if (name) {
          model.intVars.push({
            name,
            size: Number.isFinite(size) ? size : 1,
            min: Number.isFinite(min) ? min : 0,
            max: Number.isFinite(max) ? max : 0,
            initial: Number.isFinite(initial) ? initial : 0
          })
        }
      }
      return
    }

    if (line.startsWith('sync:')) {
      const syncBody = extractDeclarationValue(line, 'sync:'.length)
      if (syncBody) {
        model.synchronizations.push({
          constraints: syncBody
            .split(':')
            .map((item) => item.trim())
            .filter(Boolean)
        })
      }
      return
    }

    const processMatch = parseProcessLine(line)
    if (processMatch) {
      if (!model.processes[processMatch]) {
        model.processes[processMatch] = {
          locations: {},
          edges: []
        }
      }
      return
    }

    const locationMatch = parseLocationLine(line)
    if (locationMatch) {
      const { processName, locationName, attributes } = locationMatch
      if (!model.processes[processName]) {
        model.processes[processName] = {
          locations: {},
          edges: []
        }
      }
      model.processes[processName].locations[locationName] = {
        isInitial: attributes.initial !== undefined,
        invariant: attributes.invariant || '',
        labels: attributes.labels ? attributes.labels.split(',').map((label) => label.trim()).filter(Boolean) : [],
        isCommitted: attributes.committed !== undefined,
        isUrgent: attributes.urgent !== undefined
      }
      return
    }

    const edgeMatch = parseEdgeLine(line)
    if (edgeMatch) {
      const { processName, source, target, event, attributes } = edgeMatch
      if (!model.processes[processName]) {
        model.processes[processName] = {
          locations: {},
          edges: []
        }
      }
      model.processes[processName].edges.push({
        source,
        target,
        event,
        guard: attributes.provided || '',
        action: attributes.do || ''
      })
      return
    }
  })

  return model
}

module.exports = { parseTckToModel }
