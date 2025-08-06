import React from 'react';
import { Box, Tabs, Tab, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Menubar from './layout/Menubar';
import EditorView from './layout/EditorView';
import SimulatorView from './layout/SimulatorView';
import VerifierView from './layout/VerifierView';
import DeclarationsView from './layout/DeclarationsView';
import useEditorStore from './store/editorStore';

function App() {
  const { processes, activeProcess, setActiveProcess, addProcess } = useEditorStore();
  const [mainTab, setMainTab] = React.useState('editor');

  React.useEffect(() => {
    setActiveProcess('declarations');
  }, [setActiveProcess]);

  const handleProcessTabChange = (event, newValue) => {
    setActiveProcess(newValue);
  };

  const handleAddProcess = () => {
    const newProcessName = `process_${Object.keys(processes).length + 1}`;
    addProcess(newProcessName);
    setActiveProcess(newProcessName);
  };

  const renderContent = () => {
    if (mainTab === 'editor') {
      return activeProcess === 'declarations' ? <DeclarationsView /> : <EditorView />;
    } else if (mainTab === 'simulator') {
      return <SimulatorView />;
    } else if (mainTab === 'verifier') {
      return <VerifierView />;
    }
    return null;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Menubar onTabChange={setMainTab} activeTab={mainTab} />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
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
              <Tab key={processName} label={processName} value={processName} />
            ))}
          </Tabs>
          <IconButton onClick={handleAddProcess} sx={{ mt: 'auto' }}>
            <AddIcon />
          </IconButton>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}

export default App;
