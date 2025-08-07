import React from 'react'
import { Box, Tabs, Tab, IconButton, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import Menubar from './layout/Menubar'
import EditorView from './layout/EditorView'
import SimulatorView from './layout/SimulatorView'
import VerifierView from './layout/VerifierView'
import DeclarationsView from './layout/DeclarationsView'
import useEditorStore from './store/editorStore'

function App() {
  const { processes, activeProcess, setActiveProcess, addProcess, renameProcess, copyProcess } = useEditorStore()
  const [mainTab, setMainTab] = React.useState('editor')
  const [editingProcess, setEditingProcess] = React.useState(null)
  const [editingName, setEditingName] = React.useState('')

  React.useEffect(() => {
    setActiveProcess('declarations')
  }, [setActiveProcess])

  const handleProcessTabChange = (event, newValue) => {
    setActiveProcess(newValue)
  }

  const handleAddProcess = () => {
    const newProcessName = `process_${Object.keys(processes).length + 1}`
    addProcess(newProcessName)
    setActiveProcess(newProcessName)
  }

  const handleStartEditing = (processName) => {
    setEditingProcess(processName)
    setEditingName(processName)
  }

  const handleFinishEditing = () => {
    if (editingName.trim() && editingName !== editingProcess) {
      renameProcess(editingProcess, editingName.trim())
    }
    setEditingProcess(null)
    setEditingName('')
  }

  const handleCancelEditing = () => {
    setEditingProcess(null)
    setEditingName('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFinishEditing()
    } else if (e.key === 'Escape') {
      handleCancelEditing()
    }
  }

  const handleCopyProcess = (processName) => {
    const newProcessName = copyProcess(processName)
    setActiveProcess(newProcessName)
  }

  const renderContent = () => {
    if (mainTab === 'editor') {
      return activeProcess === 'declarations' ? <DeclarationsView /> : <EditorView />
    } else if (mainTab === 'simulator') {
      return <SimulatorView />
    } else if (mainTab === 'verifier') {
      return <VerifierView />
    }
    return null
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Menubar onTabChange={setMainTab} activeTab={mainTab} />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Only show sidebar for editor view */}
        {mainTab === 'editor' && (
          <Box
            sx={{
              width: '200px',
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={activeProcess}
              onChange={handleProcessTabChange}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab label="Declarations" value="declarations" />
              {Object.keys(processes).map((processName) => (
                <Tab
                  key={processName}
                  value={processName}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {editingProcess === processName ? (
                        <TextField
                          size="small"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleFinishEditing}
                          onKeyDown={handleKeyPress}
                          autoFocus
                          sx={{ '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
                        />
                      ) : (
                        <>
                          <span>{processName}</span>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartEditing(processName)
                            }}
                            sx={{
                              ml: 0.5,
                              p: 0.25,
                              opacity: 0.6,
                              '&:hover': { opacity: 1 }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyProcess(processName)
                            }}
                            sx={{
                              p: 0.25,
                              opacity: 0.6,
                              '&:hover': { opacity: 1 }
                            }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  }
                />
              ))}
            </Tabs>
            <IconButton onClick={handleAddProcess} sx={{ mt: 'auto' }}>
              <AddIcon />
              <Typography variant="caption" sx={{ ml: 1 }}>
                New Process
              </Typography>
            </IconButton>
          </Box>
        )}
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  )
}

export default App
