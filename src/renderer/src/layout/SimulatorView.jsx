import { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Button,
  Stack,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  PlayArrow as NextIcon,
  Refresh as ResetIcon,
  Shuffle as RandomIcon,
  PlayArrow as AutoPlayIcon,
  Pause as PauseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import CytoscapeAutomaton from '../components/CytoscapeAutomaton'
import useEditorStore from '../store/editorStore'

const parseIntegerValuations = (intvalString = '') => {
  if (!intvalString || typeof intvalString !== 'string') {
    return {}
  }

  const valuations = {}
  const regex = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([-+]?\d+(?:\.\d+)?)/g
  let match

  while ((match = regex.exec(intvalString)) !== null) {
    const name = match[1]
    const numericValue = Number(match[2])
    valuations[name] = Number.isNaN(numericValue) ? match[2] : numericValue
  }

  return valuations
}

const computeClockRanges = (zoneMatrix) => {
  if (!zoneMatrix || !Array.isArray(zoneMatrix.headers) || !Array.isArray(zoneMatrix.rows)) {
    return {}
  }

  const zeroIndex = zoneMatrix.headers.indexOf('0')
  if (zeroIndex === -1) {
    return {}
  }

  const rowMap = new Map(zoneMatrix.rows.map((row) => [row.label, row]))
  const zeroRow = rowMap.get('0')

  if (!zeroRow || !Array.isArray(zeroRow.values)) {
    return {}
  }

  const ranges = {}

  zoneMatrix.headers.forEach((header, headerIndex) => {
    if (header === '0') return

    const row = rowMap.get(header)
    if (!row || !Array.isArray(row.values)) return

    const upperCell = row.values[zeroIndex]
    const lowerCell = zeroRow.values[headerIndex]

    const upperBound =
      upperCell && Number.isFinite(upperCell.value)
        ? { value: upperCell.value, strict: Boolean(upperCell.strict) }
        : null

    const lowerBound =
      lowerCell && Number.isFinite(lowerCell.value)
        ? { value: -lowerCell.value, strict: Boolean(lowerCell.strict) }
        : null

    ranges[header] = { lower: lowerBound, upper: upperBound }
  })

  return ranges
}

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return 'inf'
  if (Number.isInteger(value)) return value.toString()
  const fixed = value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return fixed.length ? fixed : value.toString()
}

const formatClockRange = (clockName, range) => {
  if (!range) {
    return `${clockName} = ?`
  }

  const { lower, upper } = range

  if (
    lower &&
    upper &&
    !lower.strict &&
    !upper.strict &&
    Number.isFinite(lower.value) &&
    Number.isFinite(upper.value) &&
    Math.abs(lower.value - upper.value) < 1e-6
  ) {
    return `${clockName} = ${formatNumber(lower.value)}`
  }

  const lowerBracket = lower ? (lower.strict ? '(' : '[') : '('
  const upperBracket = upper ? (upper.strict ? ')' : ']') : ')'
  const lowerValue = lower ? formatNumber(lower.value) : '-inf'
  const upperValue = upper ? formatNumber(upper.value) : 'inf'

  return `${clockName} in ${lowerBracket}${lowerValue}, ${upperValue}${upperBracket}`
}

const extractClockName = (clock) => {
  if (!clock) return ''
  if (typeof clock === 'string') return clock
  if (typeof clock === 'object') return clock.name || ''
  return String(clock)
}

const SimulatorView = () => {
  const {
    simulatorInitialized,
    currentState,
    enabledTransitions,
    simulationTrace,
    tracePosition,
    clockValues,
    currentZoneMatrix,
    processes,
    clocks,
    intVars,
    simulationLoading,
    simulationError,
    initializeSimulator,
    executeTransition,
    resetSimulation,
    stepBackward,
    randomStep,
    jumpToTracePosition
  } = useEditorStore()

  const [selectedTransition, setSelectedTransition] = useState(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000) // milliseconds
  const [zoneMatrixOpen, setZoneMatrixOpen] = useState(false)

  useEffect(() => {
    if (!simulatorInitialized) {
      initializeSimulator().catch((error) => {
        console.error('Failed to initialize simulator:', error)
      })
    }
  }, [simulatorInitialized, initializeSimulator])

  // Auto play functionality
  useEffect(() => {
    let interval
    if (autoPlay && enabledTransitions.length > 0) {
      interval = setInterval(async () => {
        await randomStep().catch((error) => {
          console.error('Auto play error:', error)
          setAutoPlay(false)
        })
      }, playSpeed)
    }
    return () => clearInterval(interval)
  }, [autoPlay, enabledTransitions, playSpeed, randomStep])

  // Prepare visualization data for all processes - optimized to minimize re-computation
  const visualizationData = useMemo(() => {
    return Object.entries(processes)
      .map(([processName, processData]) => {
        if (!processData.nodes) return null

        // Create nodes with current state highlighting
        const nodes = processData.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            // Highlight current location in red
            isCurrentLocation:
              currentState?.[processName] === (node.data.locationName || node.id.split('.').pop())
          }
        }))

        return {
          processName,
          nodes,
          edges: processData.edges || []
        }
      })
      .filter(Boolean)
  }, [
    // More specific dependencies to avoid unnecessary re-computations
    Object.keys(processes).length,
    Object.values(processes)
      .map((p) => p.nodes?.length || 0)
      .join(','),
    Object.values(processes)
      .map((p) => p.edges?.length || 0)
      .join(','),
    JSON.stringify(currentState) // Only re-compute when actual state changes
  ])

  // [A] Enabled Transitions List
  const renderEnabledTransitions = () => (
    <Paper sx={{ flexBasis: 260, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Enabled Transitions</Typography>
      </Box>
      <List
        dense
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          '& .MuiListItemButton-root.selected': {
            backgroundColor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }
        }}
      >
        {simulationLoading ? (
          <ListItem>
            <ListItemText secondary="Loading..." />
          </ListItem>
        ) : simulationError ? (
          <ListItem>
            <ListItemText secondary={`Error: ${simulationError}`} sx={{ color: 'error.main' }} />
          </ListItem>
        ) : enabledTransitions.length === 0 ? (
          <ListItem>
            <ListItemText secondary="No transitions available" />
          </ListItem>
        ) : (
          enabledTransitions.map((transition, index) => (
            <ListItemButton
              key={transition.id}
              className={selectedTransition === index ? 'selected' : ''}
              onClick={async () => {
                setSelectedTransition(index)
                await executeTransition(transition.id).catch((error) => {
                  console.error('Execute transition error:', error)
                })
              }}
            >
              <ListItemText
                primary={`${transition.processName}@${transition.event}`}
                // secondary={`${transition.sourceLocation} → ${transition.targetLocation}${transition.guard !== 'true' ? ` [${transition.guard}]` : ''}`}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Paper>
  )

  // [B] Process Visualizations with Cytoscape
  const renderProcessVisualizations = () => (
    <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Process Visualizations</Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 2,
          alignContent: 'start',
          minHeight: 0
        }}
      >
        {visualizationData.map((processViz) => (
          <Box
            key={processViz.processName}
            sx={{
              height: 250,
              width: '100%',
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              position: 'relative'
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                position: 'absolute',
                top: 8,
                left: 12,
                zIndex: 1000,
                backgroundColor: 'white',
                px: 1,
                borderRadius: 0.5,
                border: '1px solid #ccc'
              }}
            >
              {processViz.processName}: {currentState?.[processViz.processName] || 'Unknown'}
            </Typography>
            <CytoscapeAutomaton
              key={`simulator-${processViz.processName}`} // Stable key to prevent recreation
              nodes={processViz.nodes}
              edges={processViz.edges}
              autoCenter
              showToolbar={false}
              onNodeUpdate={() => {}} // Read-only in simulator
              onEdgeUpdate={() => {}} // Read-only in simulator
              onEdgeCreate={() => {}} // Read-only in simulator
            />
          </Box>
        ))}
      </Box>
    </Paper>
  )

  // [C] Variables & Clocks
  const renderZoneMatrixTable = (matrix) => {
    if (!matrix) {
      if (Object.keys(clockValues || {}).length > 0) {
        return (
          <Box
            sx={{
              backgroundColor: 'grey.50',
              p: 1,
              borderRadius: 1,
              fontFamily: 'monospace',
              fontSize: '0.75rem'
            }}
          >
            {Object.entries(clockValues || {}).map(([clockName, value]) => (
              <Typography key={clockName} variant="body2" sx={{ fontSize: '0.75rem' }}>
                {clockName} = {value}
              </Typography>
            ))}
          </Box>
        )
      }

      return (
        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
          Zone matrix unavailable
        </Typography>
      )
    }

    const formatCell = (cell, isDiagonal) => {
      if (!cell) return '∞'
      if (!Number.isFinite(cell.value)) return '∞'
      if (isDiagonal) return '0'
      const prefix = cell.strict ? '<' : '<='
      return `${prefix}${cell.value}`
    }

    return (
      <TableContainer component={Box} sx={{ maxHeight: 240, overflow: 'auto', borderRadius: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}
              ></TableCell>
              {matrix.headers.map((header) => (
                <TableCell
                  key={`header-${header}`}
                  align="center"
                  sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {matrix.rows.map((row, rowIndex) => (
              <TableRow key={`row-${row.label}`} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                  {row.label}
                </TableCell>
                {row.values.map((cell, colIndex) => (
                  <TableCell
                    key={`cell-${row.label}-${matrix.headers[colIndex]}`}
                    align="center"
                    sx={{ fontFamily: 'monospace', fontSize: '0.75rem', px: 1 }}
                  >
                    {formatCell(cell, rowIndex === colIndex)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  const renderVariablesAndClocks = () => {
    const currentTraceEntry = simulationTrace[tracePosition]
    const zoneMatrix = currentTraceEntry?.zoneMatrix || currentZoneMatrix
    const backendState = currentTraceEntry?.backendState
    const intValuations = parseIntegerValuations(backendState?.attributes?.intval)
    const clockRanges = computeClockRanges(zoneMatrix)
    const definedClockNames = (clocks || []).map(extractClockName).filter(Boolean)
    const allClockNames =
      definedClockNames.length > 0 ? definedClockNames : Object.keys(clockRanges)
    const extraIntVars = Object.keys(intValuations).filter(
      (name) => !intVars.some((intVar) => intVar.name === name)
    )

    return (
      <Paper sx={{ flexBasis: 320, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle1">Variables & Clocks</Typography>
        </Box>
        <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
          {/* Variables Section */}
          <Typography variant="subtitle2" gutterBottom>
            Variables:
          </Typography>
          <Box sx={{ mb: 2 }}>
            {intVars.length === 0 && extraIntVars.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                No integer variables defined
              </Typography>
            ) : (
              <>
                {intVars.map((intVar) => {
                  const fallbackInitial =
                    typeof intVar.initial === 'number'
                      ? intVar.initial
                      : Number.isFinite(Number(intVar.initial))
                        ? Number(intVar.initial)
                        : 0
                  const value = intValuations[intVar.name]
                  return (
                    <Typography
                      key={intVar.name}
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                    >
                      {intVar.name} = {value ?? fallbackInitial}
                    </Typography>
                  )
                })}
                {extraIntVars.map((name) => (
                  <Typography
                    key={name}
                    variant="body2"
                    sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                  >
                    {name} = {intValuations[name]}
                  </Typography>
                ))}
              </>
            )}
          </Box>

          {/* Clocks Section */}
          <Typography variant="subtitle2" gutterBottom>
            Clocks:
          </Typography>
          <Box sx={{ mb: 2 }}>
            {allClockNames.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                No clocks defined
              </Typography>
            ) : (
              allClockNames.map((clockName) => (
                <Typography
                  key={clockName}
                  variant="body2"
                  sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                >
                  {formatClockRange(clockName, clockRanges[clockName])}
                </Typography>
              ))
            )}
          </Box>

          {/* Zone Matrix Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2">Zone Matrix (DBM):</Typography>
            <IconButton
              size="small"
              onClick={() => setZoneMatrixOpen((prev) => !prev)}
              aria-label="Toggle zone matrix"
            >
              {zoneMatrixOpen ? (
                <ExpandLessIcon fontSize="small" />
              ) : (
                <ExpandMoreIcon fontSize="small" />
              )}
            </IconButton>
          </Box>
          <Collapse in={zoneMatrixOpen} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1 }}>{renderZoneMatrixTable(zoneMatrix)}</Box>
          </Collapse>
        </Box>
      </Paper>
    )
  }

  // [D] Simulation Trace & [E] Control Panel
  const renderTraceAndControls = () => (
    <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Simulation Trace & Controls</Typography>
      </Box>

      {/* Simulation Trace */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {simulationTrace.map((entry, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              mb: 0.5,
              p: 0.5,
              backgroundColor: index === tracePosition ? 'primary.light' : 'transparent',
              borderRadius: 1,
              cursor: 'pointer',
              fontSize: '0.8rem',
              '&:hover': {
                backgroundColor: index === tracePosition ? 'primary.light' : 'grey.100'
              }
            }}
            onClick={() => jumpToTracePosition(index)}
          >
            {index === 0
              ? `Initial: (${Object.entries(entry.state)
                  .map(([, loc]) => loc)
                  .join(', ')})`
              : entry.transition
                ? `Sync: ${entry.transition.processName}@${entry.transition.event }`
                : `State: (${Object.entries(entry.state)
                    .map(([, loc]) => loc)
                    .join(', ')})`}
          </Typography>
        ))}
      </Box>

      {/* Control Panel */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            startIcon={<NextIcon />}
            disabled={enabledTransitions.length === 0 || simulationLoading}
            onClick={async () => {
              console.log('Next step clicked. Available transitions:', enabledTransitions.length)
              console.log('Current state:', JSON.stringify(currentState))
              console.log('Trace position:', tracePosition, 'of', simulationTrace.length)

              try {
                if (selectedTransition !== null && enabledTransitions[selectedTransition]) {
                  console.log(
                    'Executing selected transition:',
                    selectedTransition,
                    enabledTransitions[selectedTransition]
                  )
                  await executeTransition(enabledTransitions[selectedTransition].id)
                } else if (enabledTransitions.length > 0) {
                  console.log('Executing first available transition:', enabledTransitions[0])
                  await executeTransition(enabledTransitions[0].id)
                } else {
                  console.warn('No transitions available to execute')
                }
              } catch (error) {
                console.error('Execute transition error:', error)
              }
            }}
          >
            Next {simulationLoading ? '...' : ''}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={autoPlay ? <PauseIcon /> : <AutoPlayIcon />}
            onClick={() => setAutoPlay(!autoPlay)}
            disabled={enabledTransitions.length === 0}
          >
            {autoPlay ? 'Pause' : 'Play'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RandomIcon />}
            disabled={enabledTransitions.length === 0}
            onClick={async () => {
              await randomStep().catch((error) => {
                console.error('Random step error:', error)
              })
            }}
          >
            Random
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={async () => {
              setAutoPlay(false)
              await resetSimulation().catch((error) => {
                console.error('Reset simulation error:', error)
              })
            }}
          >
            Reset
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Trace length: {simulationTrace.length}
        </Typography>
      </Box>
    </Paper>
  )

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', gap: 2, minHeight: 0 }}>
      {/* Left Column */}
      <Box sx={{ width: 320, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        {renderEnabledTransitions()}
        {renderTraceAndControls()}
      </Box>

      {/* Right Column */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
        {renderProcessVisualizations()}
        {renderVariablesAndClocks()}
      </Box>
    </Box>
  )
}

export default SimulatorView
