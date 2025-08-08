import React from 'react'
import { Box, Tabs, Tab, IconButton, TextField, Typography, Snackbar, Alert } from '@mui/material'
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
  const { 
    processes, 
    activeProcess, 
    setActiveProcess, 
    addProcess, 
    renameProcess, 
    copyProcess,
    systemName,
    clocks,
    intVars,
    events,
    initializeSimulator
  } = useEditorStore()
  const [mainTab, setMainTab] = React.useState('editor')
  const [editingProcess, setEditingProcess] = React.useState(null)
  const [editingName, setEditingName] = React.useState('')
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'error' })

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

  // 模型校验函数
  const validateModel = () => {
    const errors = []

    // 检查系统名称
    if (!systemName || systemName.trim() === '') {
      errors.push('系统名称不能为空')
    }

    // 检查是否至少有一个进程
    const processNames = Object.keys(processes)
    if (processNames.length === 0) {
      errors.push('至少需要定义一个进程')
    }

    // 检查每个进程
    processNames.forEach(processName => {
      const process = processes[processName]
      
      // 检查进程是否有节点
      if (!process.nodes || process.nodes.length === 0) {
        errors.push(`进程 "${processName}" 没有定义任何位置节点`)
        return
      }

      // 检查是否有初始节点
      const initialNodes = process.nodes.filter(node => node.data?.isInitial)
      if (initialNodes.length === 0) {
        errors.push(`进程 "${processName}" 没有定义初始位置`)
      } else if (initialNodes.length > 1) {
        errors.push(`进程 "${processName}" 有多个初始位置，只能有一个`)
      }

      // 检查节点名称是否唯一且非空
      const nodeNames = new Set()
      process.nodes.forEach(node => {
        const name = node.data?.locationName
        if (!name || name.trim() === '') {
          errors.push(`进程 "${processName}" 中有位置节点名称为空`)
        } else if (nodeNames.has(name)) {
          errors.push(`进程 "${processName}" 中有重复的位置名称: "${name}"`)
        } else {
          nodeNames.add(name)
        }
      })

      // 检查边
      if (process.edges && process.edges.length > 0) {
        process.edges.forEach((edge, index) => {
          // 检查边的源节点和目标节点是否存在
          const sourceExists = process.nodes.some(node => node.id === edge.source)
          const targetExists = process.nodes.some(node => node.id === edge.target)
          
          if (!sourceExists) {
            errors.push(`进程 "${processName}" 中边 ${index + 1} 的源节点不存在`)
          }
          if (!targetExists) {
            errors.push(`进程 "${processName}" 中边 ${index + 1} 的目标节点不存在`)
          }
        })
      }
    })

    return errors
  }

  // 处理tab切换
  const handleTabChange = async (newTab) => {
    if (newTab === 'simulator' && mainTab !== 'simulator') {
      // 切换到模拟器时进行模型校验
      const validationErrors = validateModel()
      
      if (validationErrors.length > 0) {
        setSnackbar({
          open: true,
          message: `模型定义有误，请修正后重试：\n${validationErrors.join('\n')}`,
          severity: 'error'
        })
        return // 阻止切换
      }

      // 模型校验通过，初始化模拟器
      try {
        await initializeSimulator()
        setMainTab(newTab)
      } catch (error) {
        setSnackbar({
          open: true,
          message: `模拟器初始化失败：${error.message}`,
          severity: 'error'
        })
      }
    } else {
      setMainTab(newTab)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
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
      <Menubar onTabChange={handleTabChange} activeTab={mainTab} />
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            whiteSpace: 'pre-line' // 支持换行显示
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App
