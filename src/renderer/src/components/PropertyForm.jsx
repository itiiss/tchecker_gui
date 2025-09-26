import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert
} from '@mui/material'

const PropertyForm = ({ open, property, availableLabels, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'reachability',
    targetLabel: ''
  })
  const [errors, setErrors] = useState({})

  const needsTargetLabel = formData.type === 'reachability' || formData.type === 'safety'

  useEffect(() => {
    const initialType = property?.type || 'reachability'
    const initialLabel =
      initialType === 'deadlock-free'
        ? ''
        : property?.targetLabel || availableLabels[0] || ''

    setFormData({ type: initialType, targetLabel: initialLabel })
    setErrors({})
  }, [property, open, availableLabels])

  useEffect(() => {
    if (!needsTargetLabel && formData.targetLabel) {
      setFormData((prev) => ({ ...prev, targetLabel: '' }))
    }

    if (needsTargetLabel && !formData.targetLabel && availableLabels.length > 0) {
      setFormData((prev) => ({ ...prev, targetLabel: availableLabels[0] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type, availableLabels])

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (needsTargetLabel && !formData.targetLabel) {
      newErrors.targetLabel = 'Please select a target label'
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
        return 'Check if there exists a path to a state with the specified label'
      case 'safety':
        return 'Check if the system will never reach a state with the specified label'
      case 'deadlock-free':
        return 'Check if the system is free of deadlock states'
      default:
        return ''
    }
  }

  const labelSelectionDisabled = needsTargetLabel && availableLabels.length === 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{property ? 'Edit Property' : 'Add Property'}</DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2}}>
        <FormControl fullWidth required sx={{ mt:1}}>
          <InputLabel>Property Type</InputLabel>
          <Select value={formData.type} onChange={handleChange('type')} label="Property Type">
            <MenuItem value="reachability">Reachability</MenuItem>
            <MenuItem value="safety">Safety</MenuItem>
            <MenuItem value="deadlock-free">Deadlock-Free</MenuItem>
          </Select>
        </FormControl>

        <Alert severity="info">
          <Typography variant="body2">{getVerificationTypeDescription(formData.type)}</Typography>
        </Alert>

        {needsTargetLabel && (
          <FormControl fullWidth required={!labelSelectionDisabled} error={!!errors.targetLabel}>
            <InputLabel>Target Label</InputLabel>
            <Select
              value={formData.targetLabel}
              onChange={handleChange('targetLabel')}
              label="Target Label"
              disabled={labelSelectionDisabled}
            >
              {availableLabels.length === 0 && (
                <MenuItem disabled>No labels defined in the model</MenuItem>
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

        {labelSelectionDisabled && (
          <Alert severity="warning">
            <Typography variant="body2">
              No labels defined in the current model. Please add labels in location before verification.
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={labelSelectionDisabled}
        >
          {property ? 'Save Changes' : 'Add Property'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PropertyForm
