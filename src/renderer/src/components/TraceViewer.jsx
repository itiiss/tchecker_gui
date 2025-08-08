import React, { useState } from 'react'
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Collapse,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Info as InfoIcon
} from '@mui/icons-material'

/**
 * 轨迹查看器组件
 * 以结构化方式显示验证反例轨迹
 */
const TraceViewer = ({ traceContent, rawOutput, title = "反例轨迹" }) => {
  const [activeStep, setActiveStep] = useState(0)
  const [expandedSteps, setExpandedSteps] = useState(new Set([0]))
  const [showRawOutput, setShowRawOutput] = useState(false)

  // 解析轨迹内容
  const traceSteps = React.useMemo(() => {
    if (!traceContent) return []
    return parseTraceContent(traceContent)
  }, [traceContent])

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex)
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex)
      } else {
        newSet.add(stepIndex)
      }
      return newSet
    })
  }

  if (!traceContent && !rawOutput) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <InfoIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
        <Typography>暂无轨迹数据</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="primary">
          {title}
        </Typography>
        {rawOutput && (
          <IconButton
            onClick={() => setShowRawOutput(!showRawOutput)}
            size="small"
            color="primary"
          >
            {showRawOutput ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              原始输出
            </Typography>
          </IconButton>
        )}
      </Box>

      {/* 原始输出折叠区域 */}
      <Collapse in={showRawOutput}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            原始tck-reach输出:
          </Typography>
          <Box
            component="pre"
            sx={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              overflow: 'auto',
              maxHeight: '200px',
              backgroundColor: 'grey.100',
              p: 1,
              borderRadius: 1,
              mt: 1
            }}
          >
            {rawOutput}
          </Box>
        </Alert>
      </Collapse>

      {/* 结构化轨迹显示 */}
      {traceSteps.length > 0 ? (
        <Stepper orientation="vertical" activeStep={activeStep}>
          {traceSteps.map((step, index) => (
            <Step key={index} expanded={expandedSteps.has(index)}>
              <StepLabel
                onClick={() => handleStepClick(index)}
                sx={{ cursor: 'pointer' }}
                icon={
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    backgroundColor: index === 0 ? 'success.main' : 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    {index === 0 ? <PlayArrowIcon fontSize="small" /> : index}
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
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
                <Card variant="outlined" sx={{ mt: 1, mb: 2 }}>
                  <CardContent>
                    {/* 状态信息 */}
                    {step.state && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          系统状态:
                        </Typography>
                        <StateDisplay state={step.state} />
                      </Box>
                    )}

                    {/* 时钟约束 */}
                    {step.clockConstraints && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          时钟约束:
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                          {step.clockConstraints}
                        </Typography>
                      </Box>
                    )}

                    {/* 变量赋值 */}
                    {step.variables && Object.keys(step.variables).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          变量赋值:
                        </Typography>
                        <VariableDisplay variables={step.variables} />
                      </Box>
                    )}

                    {/* 转换信息 */}
                    {step.transition && (
                      <Box>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          转换详情:
                        </Typography>
                        <Typography variant="body2">
                          {step.transition}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      ) : (
        <Alert severity="info">
          <Typography>
            轨迹格式复杂，显示原始输出内容。请点击上方"原始输出"查看详细信息。
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

/**
 * 状态显示组件
 */
const StateDisplay = ({ state }) => {
  const stateEntries = Object.entries(state)
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {stateEntries.map(([process, location]) => (
        <Chip
          key={process}
          label={`${process}: ${location}`}
          size="small"
          color="secondary"
          variant="filled"
        />
      ))}
    </Box>
  )
}

/**
 * 变量显示组件
 */
const VariableDisplay = ({ variables }) => {
  const varEntries = Object.entries(variables)
  
  if (varEntries.length === 0) return null
  
  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>变量名</TableCell>
            <TableCell>值</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {varEntries.map(([name, value]) => (
            <TableRow key={name}>
              <TableCell component="th" scope="row">
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {name}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {value}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

/**
 * 解析轨迹内容为结构化步骤
 */
function parseTraceContent(traceContent) {
  if (!traceContent) return []
  
  const steps = []
  const lines = traceContent.split('\n').filter(line => line.trim())
  
  let currentStep = null
  let stepIndex = 0
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 检测状态行 (STATE n)
    const stateMatch = trimmedLine.match(/^STATE\s+(\d+)/i)
    if (stateMatch) {
      // 保存前一步
      if (currentStep) {
        steps.push(currentStep)
      }
      
      // 开始新的步骤
      stepIndex = parseInt(stateMatch[1])
      currentStep = {
        title: stepIndex === 0 ? '初始状态' : `状态 ${stepIndex}`,
        state: {},
        variables: {},
        clockConstraints: '',
        transition: '',
        event: ''
      }
      continue
    }
    
    if (!currentStep) continue
    
    // 解析位置信息 (process.location)
    if (trimmedLine.includes('.') && !trimmedLine.includes('=') && !trimmedLine.includes('<=')) {
      const parts = trimmedLine.split('.')
      if (parts.length === 2) {
        currentStep.state[parts[0]] = parts[1]
      }
    }
    
    // 解析变量赋值 (variable = value)
    const varMatch = trimmedLine.match(/(\w+)\s*=\s*([+-]?\d+(?:\.\d+)?)/);
    if (varMatch) {
      currentStep.variables[varMatch[1]] = varMatch[2]
    }
    
    // 解析时钟约束
    if (trimmedLine.includes('<=') || trimmedLine.includes('>=') || trimmedLine.includes('<') || trimmedLine.includes('>')) {
      currentStep.clockConstraints += (currentStep.clockConstraints ? ', ' : '') + trimmedLine
    }
    
    // 解析事件信息
    const eventMatch = trimmedLine.match(/@(\w+)/);
    if (eventMatch) {
      currentStep.event = eventMatch[1]
    }
    
    // 其他转换信息
    if (trimmedLine.includes('->') || trimmedLine.includes('transition')) {
      currentStep.transition += (currentStep.transition ? '\n' : '') + trimmedLine
    }
  }
  
  // 添加最后一步
  if (currentStep) {
    steps.push(currentStep)
  }
  
  return steps
}

export default TraceViewer