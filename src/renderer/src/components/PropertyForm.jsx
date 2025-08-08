import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert
} from '@mui/material'

const PropertyForm = ({ open, property, availableLabels, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'reachability',
    targetLabel: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        type: property.type || 'reachability',
        targetLabel: property.targetLabel || ''
      })
    } else {
      setFormData({
        name: '',
        type: 'reachability',
        targetLabel: ''
      })
    }
    setErrors({})
  }, [property, open])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // 当类型改为无死锁检查时，清除目标标签
    if (field === 'type' && value === 'deadlock-free') {
      setFormData(prev => ({ ...prev, targetLabel: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = '属性名称不能为空'
    }

    // 可达性和安全性检查需要目标标签
    if ((formData.type === 'reachability' || formData.type === 'safety') && !formData.targetLabel) {
      newErrors.targetLabel = '该验证类型需要选择目标标签'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  const getVerificationTypeDescription = (type) => {
    switch (type) {
      case 'reachability':
        return '检查是否存在路径能够到达具有指定标签的状态'
      case 'safety':
        return '检查是否永远不会到达具有指定标签的状态（安全属性）'
      case 'deadlock-free':
        return '检查系统是否不存在死锁状态'
      default:
        return ''
    }
  }

  const needsTargetLabel = formData.type === 'reachability' || formData.type === 'safety'

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        {property ? '编辑验证属性' : '添加验证属性'}
      </DialogTitle>
      
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
        <TextField
          label="属性名称"
          value={formData.name}
          onChange={handleChange('name')}
          error={!!errors.name}
          helperText={errors.name || '为这个验证属性起一个描述性的名字'}
          fullWidth
          required
        />

        <FormControl fullWidth required>
          <InputLabel>验证类型</InputLabel>
          <Select
            value={formData.type}
            onChange={handleChange('type')}
            label="验证类型"
          >
            <MenuItem value="reachability">可达性 (Is Reachable?)</MenuItem>
            <MenuItem value="safety">安全性 (Is Invariant / Never Reached?)</MenuItem>
            <MenuItem value="deadlock-free">无死锁 (Is Deadlock-Free?)</MenuItem>
          </Select>
        </FormControl>

        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="body2">
            {getVerificationTypeDescription(formData.type)}
          </Typography>
        </Alert>

        {needsTargetLabel && (
          <FormControl 
            fullWidth 
            required={needsTargetLabel}
            error={!!errors.targetLabel}
          >
            <InputLabel>目标标签</InputLabel>
            <Select
              value={formData.targetLabel}
              onChange={handleChange('targetLabel')}
              label="目标标签"
            >
              {availableLabels.length === 0 && (
                <MenuItem disabled>
                  <Typography color="textSecondary">
                    模型中未定义任何标签
                  </Typography>
                </MenuItem>
              )}
              {availableLabels.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
            {errors.targetLabel && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errors.targetLabel}
              </Typography>
            )}
          </FormControl>
        )}

        {availableLabels.length === 0 && needsTargetLabel && (
          <Alert severity="warning">
            <Typography variant="body2">
              当前模型中没有定义任何标签。请在位置(Location)上添加标签后再创建可达性或安全性属性。
            </Typography>
          </Alert>
        )}

        {/* 属性预览 */}
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            属性预览:
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {formData.name || '[未命名属性]'} - {getVerificationTypeDescription(formData.type)}
            {formData.targetLabel && ` (标签: ${formData.targetLabel})`}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          取消
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={needsTargetLabel && availableLabels.length === 0}
        >
          {property ? '保存修改' : '添加属性'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PropertyForm