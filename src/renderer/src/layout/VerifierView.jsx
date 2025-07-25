import React from 'react'
import { Box, Typography } from '@mui/material'
import VerifierPanel from './VerifyPanel'

const VerifierView = () => {
  return (
    <Box sx={{ display: 'flex', flexGrow: 1, height: '100%' }}>
      <Box sx={{ width: 240, borderRight: '1px solid #e0e0e0', p: 2 }}>
        <Typography variant="h6">验证器侧边栏</Typography>
        {/* 验证器侧边栏内容 */}
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <VerifierPanel />
      </Box>
    </Box>
  )
}

export default VerifierView
