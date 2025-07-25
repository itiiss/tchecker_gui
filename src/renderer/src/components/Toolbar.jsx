import React from 'react';
import {
  Tooltip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  NoteAdd as NoteAddIcon,
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';

const Toolbar = ({ activeTab }) => {
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
  );
};

export default Toolbar;
