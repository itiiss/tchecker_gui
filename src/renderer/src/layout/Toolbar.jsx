import React from 'react'
import { Tooltip, IconButton, CircularProgress } from '@mui/material'
import {
  NoteAdd as NoteAddIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material'
import useEditorStore from '../store/editorStore'

const Toolbar = ({ onTabChange }) => {
  const { initializeSimulator, simulationLoading } = useEditorStore()

  const handleRunSimulation = async () => {
    try {
      console.log('window.api:', window.api)
      console.log('window.api.runSimulation:', window.api?.runSimulation)
      await initializeSimulator()
      // Switch to simulator tab after running simulation
      if (onTabChange) {
        onTabChange('simulator')
      }
    } catch (error) {
      console.error('Simulation failed:', error)
    }
  }

  return (
    <div>
      <Tooltip title="New File">
        <IconButton>
          <NoteAddIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Open File">
        <IconButton>
          <FolderOpenIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Save File">
        <IconButton>
          <SaveIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Run Simulation">
        <IconButton onClick={handleRunSimulation} disabled={simulationLoading} color="primary">
          {simulationLoading ? <CircularProgress size={24} /> : <PlayArrowIcon />}
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default Toolbar
