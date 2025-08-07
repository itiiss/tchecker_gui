import React, { useEffect, useState, useMemo } from 'react'
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
  Stack,
  Chip
} from '@mui/material'
import { 
  PlayArrow as NextIcon,
  Refresh as ResetIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as ForwardIcon,
  Shuffle as RandomIcon,
  PlayArrow as AutoPlayIcon,
  Pause as PauseIcon
} from '@mui/icons-material'
import { ReactFlow, ReactFlowProvider, Background, Controls } from '@xyflow/react'
import TimedAutomatonNode from '../components/node'
import TimedAutomatonEdge from '../components/edge'
import useEditorStore from '../store/editorStore'
import '@xyflow/react/dist/style.css'

const nodeTypes = {
  timedAutomatonNode: TimedAutomatonNode
}
const edgeTypes = {
  timedAutomatonEdge: TimedAutomatonEdge
}

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
    stepForward,
    randomStep,
    jumpToTracePosition
  } = useEditorStore()

  const [selectedTransition, setSelectedTransition] = useState(null)
  const [autoPlay, setAutoPlay] = useState(false)
  const [playSpeed, setPlaySpeed] = useState(1000) // milliseconds

  useEffect(() => {
    if (!simulatorInitialized) {
      initializeSimulator().catch(error => {
        console.error('Failed to initialize simulator:', error)
      })
    }
  }, [simulatorInitialized, initializeSimulator])

  // Auto play functionality
  useEffect(() => {
    let interval
    if (autoPlay && enabledTransitions.length > 0) {
      interval = setInterval(async () => {
        await randomStep().catch(error => {
          console.error('Auto play error:', error)
          setAutoPlay(false)
        })
      }, playSpeed)
    }
    return () => clearInterval(interval)
  }, [autoPlay, enabledTransitions, playSpeed, randomStep])

  // Prepare visualization data for all processes
  const visualizationData = useMemo(() => {
    return Object.entries(processes).map(([processName, processData]) => {
      if (!processData.nodes) return null
      
      // Create nodes with current state highlighting
      const nodes = processData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          // Highlight current location in red
          isCurrentLocation: currentState?.[processName] === (node.data.locationName || node.id.split('.').pop())
        }
      }))
      
      return {
        processName,
        nodes,
        edges: processData.edges || []
      }
    }).filter(Boolean)
  }, [processes, currentState])

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
            <ListItemText 
              secondary={`Error: ${simulationError}`}
              sx={{ color: 'error.main' }}
            />
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
                await executeTransition(transition.id).catch(error => {
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

  // [B] Process Visualizations with ReactFlow
  const renderProcessVisualizations = () => (
    <Paper sx={{ height: '70%', display: 'flex', flexDirection: 'column', mb: 2 }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0' }}>
        <Typography variant="subtitle1">Process Visualizations</Typography>
      </Box>
      <Box sx={{ 
        flexGrow: 1, 
        p: 2, 
        overflow: 'auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 2,
        alignContent: 'start'
      }}>
        {visualizationData.map((processViz) => (
          <Box key={processViz.processName} sx={{ 
            height: '250px',
            width: '100%',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            position: 'relative'
          }}>
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
            <ReactFlowProvider>
              <ReactFlow
                nodes={processViz.nodes}
                edges={processViz.edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                panOnDrag={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                panOnScroll={false}
                preventScrolling={true}
                minZoom={0.5}
                maxZoom={2}
              >
                <Background />
              </ReactFlow>
            </ReactFlowProvider>
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
              <Typography key={intVar.name} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {intVar.name} = {intVar.initial || 0}
              </Typography>
            ))
          )}
        </Box>

        {/* Clock Constraints (Zone) Section */}
        <Typography variant="subtitle2" gutterBottom>
          Clock Constraints (Zone):
        </Typography>
        <Box sx={{ 
          backgroundColor: 'grey.50', 
          p: 1, 
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.75rem'
        }}>
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
            {index === 0 ? (
              `Initial: (${Object.entries(entry.state).map(([proc, loc]) => loc).join(', ')})`
            ) : entry.transition ? (
              `Sync: ${entry.transition.processName}@${entry.transition.event || 'τ'}`
            ) : (
              `State: (${Object.entries(entry.state).map(([proc, loc]) => loc).join(', ')})`
            )}
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
            上一步
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<NextIcon />}
            disabled={enabledTransitions.length === 0}
            onClick={async () => {
              try {
                if (selectedTransition !== null && enabledTransitions[selectedTransition]) {
                  await executeTransition(enabledTransitions[selectedTransition].id)
                } else if (enabledTransitions.length > 0) {
                  await executeTransition(enabledTransitions[0].id)
                }
              } catch (error) {
                console.error('Execute transition error:', error)
              }
            }}
          >
            下一步
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={autoPlay ? <PauseIcon /> : <AutoPlayIcon />}
            onClick={() => setAutoPlay(!autoPlay)}
            disabled={enabledTransitions.length === 0}
          >
            {autoPlay ? '暂停' : '自动播放'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RandomIcon />}
            disabled={enabledTransitions.length === 0}
            onClick={async () => {
              await randomStep().catch(error => {
                console.error('Random step error:', error)
              })
            }}
          >
            随机
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ResetIcon />}
            onClick={async () => {
              setAutoPlay(false)
              await resetSimulation().catch(error => {
                console.error('Reset simulation error:', error)
              })
            }}
          >
            重置
          </Button>
        </Stack>
        
        {/* Speed Control */}
        <Box>
          <Typography variant="body2" gutterBottom sx={{ fontSize: '0.8rem' }}>
            速度: Slow ← → Fast
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
