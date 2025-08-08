/* eslint-disable react/prop-types */
import { AppBar, Toolbar as MuiToolbar, Box, Tabs, Tab } from '@mui/material'
import Toolbar from './Toolbar'

const Menubar = ({ onTabChange, activeTab }) => {
  const handleChange = (event, newValue) => {
    onTabChange(newValue)
  }

  return (
    <AppBar position="static" color="default">
      <MuiToolbar>
        <Toolbar activeTab={activeTab} onTabChange={onTabChange} />
        <Box sx={{ flexGrow: 1 }} />
        <Tabs value={activeTab} onChange={handleChange}>
          <Tab label="编辑器" value="editor" />
          <Tab label="模拟器" value="simulator" />
          <Tab label="验证器" value="verifier" />
        </Tabs>
      </MuiToolbar>
    </AppBar>
  )
}

export default Menubar
