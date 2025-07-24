import React from 'react';
import {
  AppBar,
  Toolbar as MuiToolbar,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import Toolbar from './Toolbar';

const Menubar = ({ onTabChange, activeTab }) => {
  const handleChange = (event, newValue) => {
    onTabChange(newValue);
  };

  return (
    <AppBar position="static" color="default">
      <MuiToolbar>
        <Toolbar />
        <Box sx={{ flexGrow: 1 }} />
        <Tabs value={activeTab} onChange={handleChange}>
          <Tab label="编辑器" value="editor" />
          <Tab label="模拟器" value="simulator" />
          <Tab label="模拟器 2" value="simulator2" />
          <Tab label="验证器" value="verifier" />
        </Tabs>
      </MuiToolbar>
    </AppBar>
  );
};

export default Menubar;
