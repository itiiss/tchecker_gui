import React from 'react'
import { Tooltip, IconButton } from '@mui/material'
import {
  NoteAdd as NoteAddIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon
} from '@mui/icons-material'

const Toolbar = () => {
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
    </div>
  )
}

export default Toolbar
