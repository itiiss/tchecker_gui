import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  LinearProgress,
  Button,
  IconButton,
  Collapse
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  AccountTree as StatesIcon,
  Timeline as TransitionsIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  SkipNext as SkipNextIcon,
  SkipPrevious as SkipPreviousIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'

/**
 * 执行轨迹可视化组件
 * 结合统计信息和步骤化轨迹展示
 */
const ExecutionTraceViewer = ({ 
  verificationResult, 
  selectedProperty, 
  title = "执行轨迹分析" 
}) => {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showStatistics, setShowStatistics] = useState(true)

  // 解析执行轨迹步骤
  const traceSteps = useMemo(() => {
    return parseExecutionTrace(verificationResult)
  }, [verificationResult])

  // 自动播放轨迹
  React.useEffect(() => {
    let interval
    if (isPlaying && traceSteps.length > 0) {
      interval = setInterval(() => {
        setActiveStep(prev => (prev + 1) % traceSteps.length)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isPlaying, traceSteps.length])

  if (!verificationResult) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <InfoIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
        <Typography>暂无验证结果</Typography>
      </Box>
    )
  }

  const { reachabilityInfo = {}, satisfied } = verificationResult
  
  // 调试信息
  console.log('ExecutionTraceViewer received:', { reachabilityInfo, satisfied, verificationResult })

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Performance Statistics */}
      {(reachabilityInfo.visitedStates || reachabilityInfo.runningTime || reachabilityInfo.maxMemory) && (
        <Card variant="outlined" sx={{ mb: 2, flexShrink: 0 }}>
          <CardContent sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" color="primary">
                Performance Statistics
              </Typography>
              <IconButton
                onClick={() => setShowStatistics(!showStatistics)}
                size="small"
              >
                {showStatistics ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={showStatistics}>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {reachabilityInfo.visitedStates && (
                  <Grid item xs={4}>
                    <StatisticCard
                      label="States Visited"
                      value={reachabilityInfo.visitedStates}
                      color="primary"
                    />
                  </Grid>
                )}
                {reachabilityInfo.runningTime && (
                  <Grid item xs={4}>
                    <StatisticCard
                      label="Execution Time"
                      value={`${reachabilityInfo.runningTime}s`}
                      color="secondary"
                    />
                  </Grid>
                )}
                {reachabilityInfo.maxMemory && (
                  <Grid item xs={4}>
                    <StatisticCard
                      label="Memory Usage"
                      value={formatMemory(reachabilityInfo.maxMemory)}
                      color="info"
                    />
                  </Grid>
                )}
              </Grid>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Trace Playback Controls */}
      {traceSteps.length > 0 && (
        <Card variant="outlined" sx={{ mb: 2, flexShrink: 0 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ minWidth: 'fit-content' }}>
                Execution Trace ({traceSteps.length} steps)
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  size="small"
                >
                  <SkipPreviousIcon />
                </IconButton>
                
                <IconButton
                  onClick={() => setIsPlaying(!isPlaying)}
                  size="small"
                  color="primary"
                >
                  {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                
                <IconButton
                  onClick={() => setActiveStep(Math.min(traceSteps.length - 1, activeStep + 1))}
                  disabled={activeStep === traceSteps.length - 1}
                  size="small"
                >
                  <SkipNextIcon />
                </IconButton>
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ ml: 'auto' }}>
                Step {activeStep + 1} / {traceSteps.length}
              </Typography>
            </Box>
            
            <LinearProgress 
              variant="determinate" 
              value={(activeStep / Math.max(1, traceSteps.length - 1)) * 100}
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Trace Steps Display */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {traceSteps.length > 0 ? (
          <Stepper orientation="vertical" activeStep={activeStep}>
            {traceSteps.map((step, index) => (
              <Step key={index} expanded={index <= activeStep + 1}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: 'pointer' }}
                  icon={
                    <Box sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      backgroundColor: index === 0 ? 'success.main' : 
                                     index === activeStep ? 'primary.main' : 'grey.400',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold'
                    }}>
                      {index === 0 ? 'S' : index}
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: index === activeStep ? 'bold' : 'normal' }}>
                      {step.title}
                    </Typography>
                    {step.event && (
                      <Chip 
                        label={step.event} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    )}
                  </Box>
                </StepLabel>
                
                <StepContent>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mt: 1, 
                      mb: 2,
                      backgroundColor: index === activeStep ? 'action.hover' : 'background.paper'
                    }}
                  >
                    <CardContent>
                      {/* Process States */}
                      {step.states && Object.keys(step.states).length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Process States:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(step.states).map(([process, location]) => (
                              <Chip
                                key={process}
                                label={`${process}: ${location}`}
                                size="small"
                                color="secondary"
                                variant="filled"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Variable Values */}
                      {step.variables && Object.keys(step.variables).length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Variable Assignments:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.entries(step.variables).map(([variable, value]) => (
                              <Chip
                                key={variable}
                                label={`${variable} = ${value}`}
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Clock Constraints */}
                      {step.clocks && step.clocks.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Clock Constraints:
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontFamily: 'monospace', 
                            bgcolor: 'grey.100', 
                            p: 1, 
                            borderRadius: 1 
                          }}>
                            {step.clocks.join(', ')}
                          </Typography>
                        </Box>
                      )}

                      {/* Description */}
                      {step.description && (
                        <Typography variant="body2" color="textSecondary">
                          {step.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        ) : (
          <Alert severity="info" sx={{ m: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Verification completed without detailed trace</strong>
            </Typography>
            <Typography variant="body2">
              {getResultExplanation(selectedProperty, satisfied, reachabilityInfo)}
            </Typography>
          </Alert>
        )}
      </Box>
    </Box>
  )
}

/**
 * 统计卡片组件
 */
const StatisticCard = ({ label, value, color = 'primary' }) => (
  <Box sx={{ 
    textAlign: 'center', 
    p: 1, 
    border: 1, 
    borderColor: `${color}.main`, 
    borderRadius: 1,
    backgroundColor: `${color}.50`
  }}>
    <Typography variant="h6" color={`${color}.main`} sx={{ fontWeight: 'bold' }}>
      {value}
    </Typography>
    <Typography variant="caption" color="textSecondary">
      {label}
    </Typography>
  </Box>
)

/**
 * 解析执行轨迹
 */
function parseExecutionTrace(verificationResult) {
  const { certificateOutput, rawStdout, counterExample } = verificationResult
  
  // 尝试从certificate输出解析轨迹
  if (certificateOutput) {
    return parseCertificateTrace(certificateOutput)
  }
  
  // 尝试从counterExample解析
  if (counterExample) {
    return parseCounterExampleTrace(counterExample)
  }
  
  // 尝试从原始输出解析
  if (rawStdout) {
    return parseRawStdoutTrace(rawStdout)
  }
  
  return []
}

/**
 * 解析certificate轨迹格式
 */
function parseCertificateTrace(content) {
  const steps = []
  const lines = content.split('\n').filter(line => line.trim())
  
  let currentStep = null
  let stepCounter = 0
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 检测状态行
    if (trimmedLine.includes('->') || trimmedLine.includes('STATE')) {
      // 保存前一步
      if (currentStep) {
        steps.push(currentStep)
      }
      
      // 开始新的步骤
      currentStep = {
        title: stepCounter === 0 ? 'Initial State' : `Transition ${stepCounter}`,
        states: {},
        variables: {},
        clocks: [],
        event: '',
        description: trimmedLine
      }
      stepCounter++
      continue
    }
    
    if (!currentStep) {
      // If no current step yet, create initial step
      currentStep = {
        title: 'Initial State',
        states: {},
        variables: {},
        clocks: [],
        event: '',
        description: ''
      }
    }
    
    // 解析进程状态 (process.location)
    const stateMatch = trimmedLine.match(/(\w+)\.(\w+)/)
    if (stateMatch) {
      currentStep.states[stateMatch[1]] = stateMatch[2]
    }
    
    // 解析变量赋值
    const varMatch = trimmedLine.match(/(\w+)\s*=\s*([+-]?\d+(?:\.\d+)?)/)
    if (varMatch) {
      currentStep.variables[varMatch[1]] = varMatch[2]
    }
    
    // 解析时钟约束
    if (trimmedLine.includes('<=') || trimmedLine.includes('>=')) {
      currentStep.clocks.push(trimmedLine)
    }
    
    // 解析事件
    const eventMatch = trimmedLine.match(/@(\w+)/)
    if (eventMatch) {
      currentStep.event = eventMatch[1]
    }
  }
  
  // 添加最后一步
  if (currentStep) {
    steps.push(currentStep)
  }
  
  return steps
}

/**
 * 解析counter example轨迹
 */
function parseCounterExampleTrace(content) {
  // 简单的解析逻辑，提取关键信息
  return [{
    title: 'Counter-example Found',
    states: {},
    variables: {},
    clocks: [],
    event: '',
    description: content.split('\n').slice(0, 3).join('\n')
  }]
}

/**
 * 解析原始stdout轨迹
 */
function parseRawStdoutTrace(content) {
  // 如果没有明确的轨迹格式，返回空数组
  return []
}

/**
 * 格式化内存大小
 */
function formatMemory(bytes) {
  if (!bytes) return '-'
  const kb = parseInt(bytes) / 1024
  if (kb < 1024) return `${kb.toFixed(1)}KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)}MB`
}

/**
 * 获取结果解释
 */
function getResultExplanation(property, satisfied, reachabilityInfo) {
  const states = reachabilityInfo.visitedStates || 'unknown'
  const transitions = reachabilityInfo.visitedTransitions || 'unknown'
  
  switch (property?.type) {
    case 'reachability':
      return satisfied ? 
        `Verification successful! Found reachable path to target label "${property.targetLabel}" after exploring ${states} states.` :
        `Verification complete. No path found to target label "${property.targetLabel}" after exploring ${states} states.`
    case 'safety':
      return satisfied ? 
        `Safety verification passed! Proved system never reaches dangerous label "${property.targetLabel}" after exploring ${states} states.` :
        `Safety violation found! Path to dangerous label "${property.targetLabel}" discovered after exploring ${states} states.`
    case 'deadlock-free':
      return satisfied ? 
        `Deadlock-free verification passed! Proved system has no deadlocks after exploring ${states} states.` :
        `Deadlock found! Discovered states that can lead to deadlock after exploring ${states} states.`
    default:
      return `Verification process explored ${states} states and ${transitions} transitions.`
  }
}

export default ExecutionTraceViewer