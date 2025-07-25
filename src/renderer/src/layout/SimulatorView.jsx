import React from 'react'
import { Box, Typography } from '@mui/material'
import SimulatorPanel from './SimulatePanel'

const SimulatorView = () => {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Box sx={{ width: 240, borderRight: '1px solid #e0e0e0', p: 2 }}>
        <Typography variant="h6">模拟器侧边栏</Typography>
        {/* 模拟器侧边栏内容 */}
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <SimulatorPanel />
      </Box>
    </Box>
  )
}

export default SimulatorView
