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
  Slider,
  Stack
} from '@mui/material'
import {
  PlayArrow as NextIcon,
  Refresh as ResetIcon,
  NavigateBefore as PrevIcon,
  Shuffle as RandomIcon,
  PlayArrow as AutoPlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material'
import CytoscapeAutomaton from '../components/CytoscapeAutomaton'
import useEditorStore from '../store/editorStore'

const SimulatorView = () => {
  const {
    simulatorInitialized,
    currentState,
    enabledTransitions,
    simulationTrace,
    tracePosition,
    clockValues,
    processes,
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
    <Paper sx={{ height: '30%', display: 'flex', flexDirection: 'column', mb: 2 }}>
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
                primary={`sync: ${transition.processName}@${transition.event || 'τ'}`}
                secondary={`${transition.sourceLocation} → ${transition.targetLocation}${transition.guard !== 'true' ? ` [${transition.guard}]` : ''}`}
              />
            </ListItemButton>
          ))
        )}
      </List>
    </Paper>
  )

  // [B] Process Visualizations with Cytoscape
  const renderProcessVisualizations = () => (
    <Paper sx={{ height: '70%', display: 'flex', flexDirection: 'column', mb: 2 }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Process Visualizations</Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 2,
          alignContent: 'start'
        }}
      >
        {visualizationData.map((processViz) => (
          <Box
            key={processViz.processName}
            sx={{
              height: '250px',
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
  const renderVariablesAndClocks = () => (
    <Paper sx={{ height: '30%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Variables & Clocks</Typography>
      </Box>
      <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
        {/* Variables Section */}
        <Typography variant="subtitle2" gutterBottom>
          Variables:
        </Typography>
        <Box sx={{ mb: 2 }}>
          {intVars.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
              No integer variables defined
            </Typography>
          ) : (
            intVars.map((intVar) => (
              <Typography
                key={intVar.name}
                variant="body2"
                sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              >
                {intVar.name} = {intVar.initial || 0}
              </Typography>
            ))
          )}
        </Box>

        {/* Clock Constraints (Zone) Section */}
        <Typography variant="subtitle2" gutterBottom>
          Clock Constraints (Zone):
        </Typography>
        <Box
          sx={{
            backgroundColor: 'grey.50',
            p: 1,
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.75rem'
          }}
        >
          {Object.keys(clockValues || {}).length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
              No clock constraints
            </Typography>
          ) : (
            Object.entries(clockValues || {}).map(([clockName, value]) => (
              <Typography key={clockName} variant="body2" sx={{ fontSize: '0.75rem' }}>
                {clockName} = {value}
              </Typography>
            ))
          )}
        </Box>
      </Box>
    </Paper>
  )

  // [D] Simulation Trace & [E] Control Panel
  const renderTraceAndControls = () => (
    <Paper sx={{ height: '70%', display: 'flex', flexDirection: 'column' }}>
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
                ? `Sync: ${entry.transition.processName}@${entry.transition.event || 'τ'}`
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
            variant="outlined"
            startIcon={<PrevIcon />}
            disabled={tracePosition <= 0}
            onClick={stepBackward}
          >
            Prev
          </Button>
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

        {/* Speed Control */}
        <Box>
          <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            Speed: Slow ← → Fast
          </Typography>
          <Slider
            size="small"
            value={2000 - playSpeed}
            min={200}
            max={1800}
            step={200}
            onChange={(e, value) => setPlaySpeed(2000 - value)}
            sx={{ width: '100%' }}
          />
        </Box>
      </Box>
    </Paper>
  )

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', gap: 2 }}>
      {/* Left Column: 30% width */}
      <Box sx={{ width: '30%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Top: Enabled Transitions (30% height) */}
        {renderEnabledTransitions()}
        {/* Bottom: Simulation Trace & Controls (70% height) */}
        {renderTraceAndControls()}
      </Box>

      {/* Right Column: 70% width */}
      <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Top: Process Visualizations (70% height) */}
        {renderProcessVisualizations()}
        {/* Bottom: Variables & Clocks (30% height) */}
        {renderVariablesAndClocks()}
      </Box>
    </Box>
  )
}

export default SimulatorView
