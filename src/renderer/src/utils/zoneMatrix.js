const normalizeClockName = (clock) => {
  if (!clock) return ''
  if (typeof clock === 'string') return clock
  if (typeof clock === 'object') {
    if (clock === null) return ''
    return clock.name || ''
  }
  return String(clock)
}

const cloneZoneMatrix = (matrix) => {
  if (!matrix || !Array.isArray(matrix.headers) || !Array.isArray(matrix.rows)) {
    return null
  }

  return {
    headers: [...matrix.headers],
    rows: matrix.rows.map((row) => ({
      label: row.label,
      values: Array.isArray(row.values)
        ? row.values.map((cell) => ({
            value: typeof cell?.value === 'number' ? cell.value : Number.POSITIVE_INFINITY,
            strict: Boolean(cell?.strict)
          }))
        : []
    }))
  }
}

const createEmptyMatrix = (clockNames) => {
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

const parseTerm = (raw) => {
  const term = (raw || '').trim()
  if (/^-?\d+(?:\.\d+)?$/.test(term)) {
    return { type: 'const', value: Number.parseFloat(term) }
  }
  const diffMatch = term.match(/^([A-Za-z_][A-Za-z0-9_]*?)-([A-Za-z_][A-Za-z0-9_]*)$/)
  if (diffMatch) {
    return { type: 'diff', left: diffMatch[1], right: diffMatch[2] }
  }
  return { type: 'var', name: term }
}

const setConstraint = (matrix, i, j, bound, strict) => {
  if (!Number.isFinite(bound)) return
  const row = matrix[i]
  if (!row) return
  const cell = row[j]
  if (!cell) return
  if (bound < cell.value || (bound === cell.value && strict && !cell.strict)) {
    cell.value = bound
    cell.strict = strict
  }
}

const applySimpleConstraint = (matrix, headersMap, leftTerm, operator, rightTerm) => {
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
    const j = resolveIndex(rightTerm.name)
    const zeroIndex = resolveIndex('0')
    if (j == null || zeroIndex == null) return
    if (operator === '<=' || operator === '<') {
      toUpperBound(zeroIndex, j, leftTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(j, zeroIndex, -leftTerm.value, strict)
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
      toUpperBound(j, i, leftTerm.value, strict)
    } else if (operator === '>=' || operator === '>') {
      toUpperBound(i, j, -leftTerm.value, strict)
    }
  }
}

const processConstraint = (matrix, headersMap, rawConstraint) => {
  const cleaned = (rawConstraint || '').trim()
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
  }
}

export const computeZoneMatrix = (zoneString, clocks = []) => {
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

export const extractZoneMatrix = (backendState, clocks = []) => {
  if (!backendState || typeof backendState !== 'object') {
    return null
  }

  if (backendState.zoneMatrix) {
    const cloned = cloneZoneMatrix(backendState.zoneMatrix)
    if (cloned) {
      return cloned
    }
  }

  const zoneString =
    backendState.zone ||
    backendState.zone_matrix ||
    (backendState.attributes && backendState.attributes.zone) ||
    (backendState.attributes && backendState.attributes.zone_matrix)

  if (typeof zoneString === 'string' && zoneString.trim().length > 0) {
    return computeZoneMatrix(zoneString, clocks)
  }

  return null
}
