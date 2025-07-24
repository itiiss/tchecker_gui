import React, { useState } from 'react';
import {
  Box,
} from '@mui/material';
import Menubar from './components/menubar';
import Sidebar from './components/sidebar';
import EditorCanvas from './components/editorCanva';
import SimulatorPanel from './components/simulatePanel';
import VerifierPanel from './components/verifyPanel';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState('editor');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Menubar onTabChange={setActiveTab} activeTab={activeTab} />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <TabPanel value={activeTab} index="editor">
            <EditorCanvas />
          </TabPanel>
          <TabPanel value={activeTab} index="simulator">
            <SimulatorPanel />
          </TabPanel>
          <TabPanel value={activeTab} index="simulator2">
            <SimulatorPanel />
          </TabPanel>
          <TabPanel value={activeTab} index="verifier">
            <VerifierPanel />
          </TabPanel>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
