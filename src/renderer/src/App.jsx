/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { Box } from '@mui/material'
import Menubar from './layout/Menubar'
import EditorView from './layout/EditorView'
import SimulatorView from './layout/SimulatorView'
import VerifierView from './layout/VerifierView'

const TabPanel = (props) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%' }}>{children}</Box>}
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('editor')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Menubar onTabChange={setActiveTab} activeTab={activeTab} />
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
          <TabPanel value={activeTab} index="editor">
            <EditorView />
          </TabPanel>
          <TabPanel value={activeTab} index="simulator">
            <SimulatorView />
          </TabPanel>
          <TabPanel value={activeTab} index="simulator2">
            <SimulatorView />
          </TabPanel>
          <TabPanel value={activeTab} index="verifier">
            <VerifierView />
          </TabPanel>
        </Box>
      </Box>
    </Box>
  )
}

export default App
