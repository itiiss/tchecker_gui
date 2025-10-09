import { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material'
import useEditorStore from '../store/editorStore'
import PropertyForm from './PropertyForm'
import VerificationGraph from './VerificationGraph'

const VerifierTab = () => {
  const { processes } = useEditorStore()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationError, setVerificationError] = useState(null)

  const allLabels = useMemo(() => {
    const labels = new Set()
    Object.values(processes).forEach((process) => {
      process.nodes?.forEach((node) => {
        if (Array.isArray(node.data.labels)) {
          node.data.labels.forEach((label) => {
            if (label && label.trim()) {
              labels.add(label.trim())
            }
          })
        }
      })
    })
    return Array.from(labels)
  }, [processes])

  const typeSuffixMap = {
    reachability: 'Reachability',
    safety: 'Safety',
    'deadlock-free': 'DeadlockFree',
    'mutual-exclusion': 'Mutex',
    'logic-formula': 'Formula'
  }

  const buildPropertyName = ({ type, targetLabel, secondaryLabel, formula }) => {
    const suffix = typeSuffixMap[type] || 'Property'
    if (type === 'deadlock-free') {
      return suffix
    }
    if (type === 'mutual-exclusion') {
      const labelA = targetLabel && targetLabel.trim() ? targetLabel.trim() : 'LabelA'
      const labelB = secondaryLabel && secondaryLabel.trim() ? secondaryLabel.trim() : 'LabelB'
      return `${labelA}_${labelB}_${suffix}`
    }
    if (type === 'logic-formula') {
      const simplified = (formula || 'Formula').replace(/\s+/g, ' ').trim()
      const truncated =
        simplified.length > 32 ? `${simplified.slice(0, 29)}...` : simplified || 'Formula'
      return `${truncated}_${suffix}`
    }
    const baseLabel = targetLabel && targetLabel.trim() ? targetLabel.trim() : 'Property'
    return `${baseLabel}_${suffix}`
  }

  const ensureUniqueName = (baseName, ignoreId = null) => {
    let name = baseName
    let counter = 2
    const isDuplicate = (candidate) =>
      properties.some((property) => property.name === candidate && property.id !== ignoreId)

    while (isDuplicate(name)) {
      name = `${baseName}_${counter}`
      counter += 1
    }

    return name
  }

  const handleAddProperty = () => {
    setEditingProperty(null)
    setShowPropertyForm(true)
  }

  const handleEditProperty = (property) => {
    setEditingProperty(property)
    setShowPropertyForm(true)
  }

  const handleDeleteProperty = (propertyId) => {
    setProperties((prev) => prev.filter((p) => p.id !== propertyId))
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null)
    }
  }

  const handleSaveProperty = (formValues) => {
    const {
      type,
      targetLabel,
      secondaryLabel,
      formula,
      formulaMode,
      formulaLabels = []
    } = formValues

    const baseName = buildPropertyName(formValues)
    const name = ensureUniqueName(baseName, editingProperty?.id || null)

    const labels = (() => {
      if (type === 'logic-formula') {
        return formulaLabels
      }
      const collected = []
      if (targetLabel) {
        collected.push(targetLabel)
      }
      if (type === 'mutual-exclusion' && secondaryLabel) {
        collected.push(secondaryLabel)
      }
      return collected
    })()

    if (editingProperty) {
      const updatedProperty = {
        ...editingProperty,
        type,
        targetLabel: type === 'logic-formula' ? '' : targetLabel,
        secondaryLabel: type === 'mutual-exclusion' ? secondaryLabel : '',
        formula: type === 'logic-formula' ? formula : '',
        formulaMode: type === 'logic-formula' ? formulaMode : undefined,
        labels,
        name
      }

      setProperties((prev) => prev.map((p) => (p.id === editingProperty.id ? updatedProperty : p)))

      if (selectedProperty?.id === editingProperty.id) {
        setSelectedProperty(updatedProperty)
      }
    } else {
      const newProperty = {
        id: Date.now().toString(),
        type,
        targetLabel: type === 'logic-formula' ? '' : targetLabel,
        secondaryLabel: type === 'mutual-exclusion' ? secondaryLabel : '',
        formula: type === 'logic-formula' ? formula : '',
        formulaMode: type === 'logic-formula' ? formulaMode : undefined,
        labels,
        name
      }
      setProperties((prev) => [...prev, newProperty])
      setSelectedProperty(newProperty)
    }

    setShowPropertyForm(false)
    setEditingProperty(null)
  }

  const handleSelectProperty = (property) => {
    setSelectedProperty(property)
    setVerificationResult(null)
    setVerificationError(null)
  }

  const handleVerifyProperty = async () => {
    if (!selectedProperty) return

    setIsVerifying(true)
    setVerificationResult(null)
    setVerificationError(null)

    try {
      const { ipcRenderer } = window.require('electron')
      const result = await ipcRenderer.invoke('verify-property', {
        property: selectedProperty,
        modelData: useEditorStore.getState().convertModelDataForBackend()
      })

      if (result.success) {
        setVerificationResult(result)
      } else {
        // Handle different types of errors
        if (result.isModelError) {
          setVerificationError(
            `Model Error: ${result.modelErrorDetails}\n\nThis usually occurs due to:\n• Variable values exceeding defined ranges\n• Syntax errors in the model\n• Inappropriate clock constraints\n\nPlease check the model definition, especially variable ranges and transition actions.`
          )
        } else {
          setVerificationError(result.error)
        }
      }
    } catch (error) {
      setVerificationError(error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const getPropertyTypeText = (type) => {
    switch (type) {
      case 'reachability':
        return 'Reachability'
      case 'safety':
        return 'Safety'
      case 'deadlock-free':
        return 'Deadlock-free'
      case 'mutual-exclusion':
        return 'Mutual Exclusion'
      case 'logic-formula':
        return 'Logical Formula'
      default:
        return type
    }
  }

  const getVerificationStatusColor = (result) => {
    if (!result) return 'info'
    return result.satisfied ? 'success' : 'error'
  }

  const getVerificationStatusText = (result) => {
    if (!result) return ''

    switch (selectedProperty.type) {
      case 'reachability':
        return result.satisfied ? 'Property Reachable' : 'Property Unreachable'
      case 'safety':
        return result.satisfied
          ? 'Property Safe (Never Reached)'
          : 'Property Unsafe (Can Be Reached)'
      case 'deadlock-free':
        return result.satisfied ? 'No Deadlock' : 'Deadlock Exists'
      case 'mutual-exclusion':
        return result.satisfied ? 'Mutual Exclusion Holds' : 'Mutual Exclusion Violated'
      case 'logic-formula':
        if (selectedProperty.formulaMode === 'exists') {
          return result.satisfied ? 'Formula Reachable' : 'Formula Unreachable'
        }
        return result.satisfied ? 'Formula Forbidden (Safe)' : 'Formula Reached (Violation)'
      default:
        return result.satisfied ? 'Property Satisfied' : 'Property Not Satisfied'
    }
  }

  return (
    <Box
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}
    >
      <Typography variant="h5" gutterBottom>
        Formal Verification
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Property List */}
        <Paper sx={{ width: '40%', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">Verification Properties</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddProperty}
              variant="outlined"
              size="small"
            >
              Add Property
            </Button>
          </Box>

          <List sx={{ flex: 1, overflow: 'auto' }}>
            {properties.map((property) => (
              <ListItem
                key={property.id}
                selected={selectedProperty?.id === property.id}
                onClick={() => handleSelectProperty(property)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  border: selectedProperty?.id === property.id ? 1 : 0,
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  mb: 1
                }}
              >
                <ListItemText
                  primary={property.name}
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary">
                        Type: {getPropertyTypeText(property.type)}
                      </Typography>
                      {property.targetLabel && (
                        <Typography variant="body2" color="textSecondary">
                          Primary Label: {property.targetLabel}
                        </Typography>
                      )}
                      {property.type === 'mutual-exclusion' && property.secondaryLabel && (
                        <Typography variant="body2" color="textSecondary">
                          Second Label: {property.secondaryLabel}
                        </Typography>
                      )}
                      {property.type === 'logic-formula' && (
                        <>
                          <Typography variant="body2" color="textSecondary">
                            Formula: {property.formula || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Mode:{' '}
                            {property.formulaMode === 'exists' ? 'Reachable (∃)' : 'Forbidden (¬∃)'}
                          </Typography>
                        </>
                      )}
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditProperty(property)
                    }}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteProperty(property.id)
                    }}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {properties.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography>No properties added yet</Typography>
                <Typography variant="body2">
                  Click &quot;Add Property&quot; to get started
                </Typography>
              </Box>
            )}
          </List>

          {/* Verification Button */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {selectedProperty ? (
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={isVerifying ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleVerifyProperty}
                disabled={isVerifying}
                sx={{ py: 1.5 }}
              >
                {isVerifying ? 'Verifying...' : 'Start Verification'}
              </Button>
            ) : (
              <Button fullWidth variant="outlined" disabled size="large" sx={{ py: 1.5 }}>
                Please select a property
              </Button>
            )}
          </Box>
        </Paper>

        {/* Right: Verification Results */}
        <Paper sx={{ flex: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>
            Verification Results
          </Typography>

          {!selectedProperty && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'text.secondary'
              }}
            >
              <Typography>Please select a property to verify</Typography>
            </Box>
          )}

          {selectedProperty && !verificationResult && !verificationError && !isVerifying && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                color: 'text.secondary'
              }}
            >
              <Typography>
                Click &quot;Start Verification&quot; to check the selected property
              </Typography>
            </Box>
          )}

          {isVerifying && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                flexDirection: 'column',
                gap: 2
              }}
            >
              <CircularProgress size={60} />
              <Typography>Verifying property: {selectedProperty.name}</Typography>
            </Box>
          )}

          {verificationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Verification failed: {verificationError}
            </Alert>
          )}

          {verificationResult && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
              <Alert
                severity={getVerificationStatusColor(verificationResult)}
                sx={{ flexShrink: 0 }}
              >
                <Typography variant="h6">
                  {getVerificationStatusText(verificationResult)}
                </Typography>
                <Typography variant="body2">Property: {selectedProperty.name}</Typography>
              </Alert>

              {verificationResult.reachabilityInfo && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(verificationResult.reachabilityInfo)
                      .filter(([, value]) => value !== undefined && value !== null && value !== '')
                      .map(([key, value]) => (
                        <Chip key={key} label={`${key}: ${value}`} variant="outlined" />
                      ))}
                  </Box>
                </Paper>
              )}

              {selectedProperty.type === 'logic-formula' &&
                Array.isArray(verificationResult.formulaEvaluation) && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Formula Evaluation
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Mode:{' '}
                      {selectedProperty.formulaMode === 'exists'
                        ? 'Reachable (∃)'
                        : 'Forbidden (¬∃)'}{' '}
                      | Evaluated clause: {verificationResult.evaluatedClause || 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {verificationResult.formulaEvaluation.map((entry) => (
                        <Chip
                          key={`formula-clause-${entry.index}`}
                          color={entry.satisfied ? 'success' : 'error'}
                          label={`Clause ${entry.index + 1}: ${entry.clause && entry.clause.length > 0 ? entry.clause.join(' && ') : 'true'} | ${entry.satisfied ? 'Satisfied' : 'Not satisfied'}`}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Paper>
                )}

              {verificationResult.dotGraph && verificationResult.dotGraph.trim() && (
                <Paper variant="outlined" sx={{ p: 2, minHeight: 360 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    State Space
                  </Typography>
                  <VerificationGraph dotText={verificationResult.dotGraph} height={380} />
                </Paper>
              )}

              {verificationResult.counterExample && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Execution Trace
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      m: 0,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {verificationResult.counterExample}
                  </Box>
                </Paper>
              )}

              <Paper
                variant="outlined"
                sx={{ p: 2, flex: verificationResult.counterExample ? '0' : 1 }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  Detailed Output
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    m: 0,
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 360,
                    overflow: 'auto'
                  }}
                >
                  {verificationResult.output || ''}
                </Box>
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Property Form Dialog */}
      {showPropertyForm && (
        <PropertyForm
          open={showPropertyForm}
          property={editingProperty}
          availableLabels={allLabels}
          onSave={handleSaveProperty}
          onClose={() => {
            setShowPropertyForm(false)
            setEditingProperty(null)
          }}
        />
      )}
    </Box>
  )
}

export default VerifierTab
