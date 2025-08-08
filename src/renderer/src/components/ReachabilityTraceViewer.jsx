import React from 'react'
import {
  Box,
  Typography,
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
  LinearProgress
} from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  AccountTree as StatesIcon,
  Timeline as TransitionsIcon
} from '@mui/icons-material'

/**
 * 可达性验证结果查看器
 * 专门用于显示tck-reach的验证结果和统计信息
 */
const ReachabilityTraceViewer = ({ 
  verificationResult, 
  selectedProperty, 
  title = "验证分析结果" 
}) => {
  if (!verificationResult) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <InfoIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
        <Typography>暂无验证结果</Typography>
      </Box>
    )
  }

  const { reachabilityInfo = {}, satisfied, counterExample } = verificationResult

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      {/* 验证结果摘要 */}
      <Alert 
        severity={satisfied ? 'success' : 'error'} 
        icon={satisfied ? <CheckCircleIcon /> : <ErrorIcon />}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          {getResultSummary(selectedProperty, satisfied)}
        </Typography>
        <Typography variant="body2">
          属性类型: {getPropertyTypeText(selectedProperty?.type)}
          {selectedProperty?.targetLabel && ` | 目标标签: ${selectedProperty.targetLabel}`}
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* 验证统计信息 */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                <StatesIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                验证统计信息
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>指标</strong></TableCell>
                      <TableCell><strong>数值</strong></TableCell>
                      <TableCell><strong>说明</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <StatRow 
                      label="可达性结果" 
                      value={reachabilityInfo.reachable} 
                      description="目标状态是否可达"
                      icon={reachabilityInfo.reachable === 'true' ? 
                        <CheckCircleIcon color="success" fontSize="small" /> : 
                        <ErrorIcon color="error" fontSize="small" />}
                    />
                    <StatRow 
                      label="访问状态数" 
                      value={reachabilityInfo.visitedStates} 
                      description="验证过程中访问的状态总数"
                    />
                    <StatRow 
                      label="存储状态数" 
                      value={reachabilityInfo.storedStates} 
                      description="存储在内存中的状态数"
                    />
                    <StatRow 
                      label="覆盖状态数" 
                      value={reachabilityInfo.coveredStates} 
                      description="被覆盖优化的状态数"
                    />
                    <StatRow 
                      label="访问转换数" 
                      value={reachabilityInfo.visitedTransitions} 
                      description="执行的状态转换总数"
                    />
                    <StatRow 
                      label="运行时间" 
                      value={reachabilityInfo.runningTime ? `${reachabilityInfo.runningTime}s` : '-'} 
                      description="验证算法执行时间"
                    />
                    <StatRow 
                      label="内存使用" 
                      value={reachabilityInfo.maxMemory ? formatMemory(reachabilityInfo.maxMemory) : '-'} 
                      description="最大内存使用量"
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 性能指标可视化 */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                性能指标
              </Typography>

              {/* 状态空间探索进度 */}
              {reachabilityInfo.visitedStates && reachabilityInfo.storedStates && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    状态存储效率
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, (parseInt(reachabilityInfo.storedStates) / parseInt(reachabilityInfo.visitedStates)) * 100)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {reachabilityInfo.storedStates} / {reachabilityInfo.visitedStates} 状态
                  </Typography>
                </Box>
              )}

              {/* 时间信息 */}
              {reachabilityInfo.runningTime && (
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    icon={<SpeedIcon />}
                    label={`${reachabilityInfo.runningTime}秒`}
                    color="primary" 
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}

              {/* 内存信息 */}
              {reachabilityInfo.maxMemory && (
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    icon={<MemoryIcon />}
                    label={formatMemory(reachabilityInfo.maxMemory)}
                    color="secondary" 
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 验证结果解释 */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" color="primary" gutterBottom>
                结果解释
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {getResultExplanation(selectedProperty, satisfied, reachabilityInfo)}
                </Typography>
              </Alert>

              {/* 详细说明 */}
              <Typography variant="body2" color="textSecondary">
                {getDetailedExplanation(selectedProperty, satisfied, reachabilityInfo)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

/**
 * 统计信息行组件
 */
const StatRow = ({ label, value, description, icon }) => (
  <TableRow>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {icon}
        {label}
      </Box>
    </TableCell>
    <TableCell>
      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
        {value || '-'}
      </Typography>
    </TableCell>
    <TableCell>
      <Typography variant="caption" color="textSecondary">
        {description}
      </Typography>
    </TableCell>
  </TableRow>
)

/**
 * 格式化内存大小
 */
function formatMemory(bytes) {
  if (!bytes) return '-'
  const kb = parseInt(bytes) / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

/**
 * 获取属性类型文本
 */
function getPropertyTypeText(type) {
  switch (type) {
    case 'reachability': return '可达性验证'
    case 'safety': return '安全性验证'
    case 'deadlock-free': return '无死锁验证'
    default: return type
  }
}

/**
 * 获取结果摘要
 */
function getResultSummary(property, satisfied) {
  switch (property?.type) {
    case 'reachability':
      return satisfied ? 
        `目标状态可达！标签 "${property.targetLabel}" 是可达的` : 
        `目标状态不可达。标签 "${property.targetLabel}" 无法到达`
    case 'safety':
      return satisfied ? 
        `系统安全！永远不会到达标签 "${property.targetLabel}"` : 
        `安全性违反！可能到达标签 "${property.targetLabel}"`
    case 'deadlock-free':
      return satisfied ? '系统无死锁！' : '发现死锁状态！'
    default:
      return satisfied ? '验证通过' : '验证失败'
  }
}

/**
 * 获取结果解释
 */
function getResultExplanation(property, satisfied, reachabilityInfo) {
  const states = reachabilityInfo.visitedStates
  const transitions = reachabilityInfo.visitedTransitions
  
  switch (property?.type) {
    case 'reachability':
      return satisfied ? 
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，找到了到达目标标签的路径。` :
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，未找到到达目标标签的路径。`
    case 'safety':
      return satisfied ? 
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，证明系统永远不会到达危险状态。` :
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，发现了可以到达危险状态的路径。`
    case 'deadlock-free':
      return satisfied ? 
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，证明系统不存在死锁。` :
        `在探索了 ${states} 个状态和 ${transitions} 个转换后，发现了可能导致死锁的状态。`
    default:
      return `验证过程探索了 ${states} 个状态和 ${transitions} 个转换。`
  }
}

/**
 * 获取详细解释
 */
function getDetailedExplanation(property, satisfied, reachabilityInfo) {
  const explanations = []
  
  explanations.push("验证统计说明:")
  explanations.push("• 访问状态数：算法在验证过程中遍历的所有状态")
  explanations.push("• 存储状态数：为了避免重复计算而存储在内存中的状态")
  explanations.push("• 覆盖状态数：通过状态覆盖技术优化掉的状态")
  explanations.push("• 访问转换数：执行的状态间转换总数")
  
  if (reachabilityInfo.runningTime) {
    const time = parseFloat(reachabilityInfo.runningTime)
    if (time < 0.001) {
      explanations.push("• 验证速度：非常快（小于1毫秒）")
    } else if (time < 0.1) {
      explanations.push("• 验证速度：很快（毫秒级）")
    } else {
      explanations.push("• 验证速度：正常")
    }
  }
  
  return explanations.join('\n')
}

export default ReachabilityTraceViewer