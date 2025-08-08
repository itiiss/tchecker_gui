import React, { useState, useEffect } from 'react'
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
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Tabs,
  Tab
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  AccountTree as GraphIcon,
  Timeline as TraceIcon,
  Description as OutputIcon
} from '@mui/icons-material'
import useEditorStore from '../store/editorStore'
import PropertyForm from './PropertyForm'
import DotGraphViewer from './DotGraphViewer'
import TraceViewer from './TraceViewer'
import ReachabilityTraceViewer from './ReachabilityTraceViewer'
import ExecutionTraceViewer from './ExecutionTraceViewer'

const VerifierTab = () => {
  const { processes } = useEditorStore()
  const [properties, setProperties] = useState([])
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)
  const [verificationError, setVerificationError] = useState(null)
  const [resultTab, setResultTab] = useState('output') // 'output', 'graph', 'trace'

  // Extract all labels
  const getAllLabels = () => {
    const labels = new Set()
    Object.values(processes).forEach(process => {
      process.nodes?.forEach(node => {
        if (node.data.labels && Array.isArray(node.data.labels)) {
          node.data.labels.forEach(label => {
            if (label && label.trim()) {
              labels.add(label.trim())
            }
          })
        }
      })
    })
    return Array.from(labels)
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
    setProperties(properties.filter(p => p.id !== propertyId))
    if (selectedProperty?.id === propertyId) {
      setSelectedProperty(null)
    }
  }

  const handleSaveProperty = (property) => {
    if (editingProperty) {
      // Edit existing property
      setProperties(properties.map(p => 
        p.id === editingProperty.id ? { ...property, id: editingProperty.id } : p
      ))
    } else {
      // Add new property
      const newProperty = { ...property, id: Date.now().toString() }
      setProperties([...properties, newProperty])
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
        // Auto-select tab based on available content
        if (result.dotGraph) {
          setResultTab('graph')
        } else if (result.counterExample) {
          setResultTab('trace')
        } else {
          setResultTab('output')
        }
      } else {
        // Handle different types of errors
        if (result.isModelError) {
          setVerificationError(`Model Error: ${result.modelErrorDetails}\n\nThis usually occurs due to:\n• Variable values exceeding defined ranges\n• Syntax errors in the model\n• Inappropriate clock constraints\n\nPlease check the model definition, especially variable ranges and transition actions.`)
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
      case 'reachability': return 'Reachability'
      case 'safety': return 'Safety'
      case 'deadlock-free': return 'Deadlock-free'
      default: return type
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
        return result.satisfied ? 'Property Safe (Never Reached)' : 'Property Unsafe (Can Be Reached)'
      case 'deadlock-free':
        return result.satisfied ? 'No Deadlock' : 'Deadlock Exists'
      default:
        return result.satisfied ? 'Property Satisfied' : 'Property Not Satisfied'
    }
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
      <Typography variant="h5" gutterBottom>
        Formal Verification
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left: Property List */}
        <Paper sx={{ width: '40%', p: 2, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                          Target Label: {property.targetLabel}
                        </Typography>
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
                <Typography variant="body2">Click "Add Property" to get started</Typography>
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
              <Button
                fullWidth
                variant="outlined"
                disabled
                size="large"
                sx={{ py: 1.5 }}
              >
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
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              color: 'text.secondary'
            }}>
              <Typography>Please select a property to verify</Typography>
            </Box>
          )}

          {selectedProperty && !verificationResult && !verificationError && !isVerifying && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              color: 'text.secondary'
            }}>
              <Typography>Click "Start Verification" to check the selected property</Typography>
            </Box>
          )}

          {isVerifying && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              flexDirection: 'column',
              gap: 2
            }}>
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
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Alert 
                severity={getVerificationStatusColor(verificationResult)} 
                sx={{ mb: 2, flexShrink: 0 }}
              >
                <Typography variant="h6">
                  {getVerificationStatusText(verificationResult)}
                </Typography>
                <Typography variant="body2">
                  Property: {selectedProperty.name}
                </Typography>
              </Alert>

              {/* Result View Tabs */}
              <Tabs 
                value={resultTab} 
                onChange={(e, newValue) => setResultTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}
              >
                <Tab 
                  icon={<OutputIcon />} 
                  label="Detailed Output" 
                  value="output" 
                  iconPosition="start"
                />
                {verificationResult.dotGraph && verificationResult.dotGraph.trim() && (
                  <Tab 
                    icon={<GraphIcon />} 
                    label="State Graph" 
                    value="graph" 
                    iconPosition="start"
                  />
                )}
                <Tab 
                  icon={<TraceIcon />} 
                  label="Execution Trace" 
                  value="trace" 
                  iconPosition="start"
                />
              </Tabs>

              {/* Tab Content */}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', pt: 2 }}>
                {resultTab === 'output' && (
                  <TextField
                    multiline
                    value={verificationResult.output || ''}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      sx: { 
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        height: '100%',
                        width: '100%',
                        '& .MuiInputBase-input': {
                          overflow: 'auto',
                          height: '100% !important',
                          width: '100% !important'
                        }
                      }
                    }}
                    sx={{ 
                      height: '100%',
                      width: '100%',
                      '& .MuiInputBase-root': {
                        height: '100%',
                        width: '100%'
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '100%',
                        width: '100%'
                      }
                    }}
                  />
                )}

                {resultTab === 'graph' && verificationResult.dotGraph && verificationResult.dotGraph.trim() && (
                  <DotGraphViewer 
                    dotContent={verificationResult.dotGraph}
                    title="Verification State Space"
                  />
                )}

                {resultTab === 'trace' && (
                  <Box sx={{ height: '100%', overflow: 'hidden' }}>
                    <ExecutionTraceViewer
                      verificationResult={verificationResult}
                      selectedProperty={selectedProperty}
                      title="Execution Trace Analysis"
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Property Form Dialog */}
      {showPropertyForm && (
        <PropertyForm
          open={showPropertyForm}
          property={editingProperty}
          availableLabels={getAllLabels()}
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