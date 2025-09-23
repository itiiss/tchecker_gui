import React from 'react'
import { Tooltip, IconButton, Snackbar, Alert } from '@mui/material'
import { FolderOpen as FolderOpenIcon, Save as SaveIcon, Visibility as VisibilityIcon } from '@mui/icons-material'
import useEditorStore from '../store/editorStore'
import PreviewDialog from '../components/PreviewDialog'

/* eslint-disable react/prop-types */
const Toolbar = ({ onTabChange }) => {
  const { saveModel, loadModel, generateTckPreview } = useEditorStore()
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' })
  const [previewDialog, setPreviewDialog] = React.useState({
    open: false,
    content: '',
    loading: false,
    error: null,
    syntaxResult: null
  })

  const handleSaveModel = async () => {
    try {
      const result = await saveModel()
      if (result.success) {
        setSnackbar({
          open: true,
          message: `模型已保存到: ${result.filePath}`,
          severity: 'success'
        })
      } else {
        setSnackbar({
          open: true,
          message: `保存失败: ${result.error}`,
          severity: 'error'
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `保存失败: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const handleLoadModel = async () => {
    try {
      const result = await loadModel()
      if (result.success) {
        setSnackbar({
          open: true,
          message: `模型已从文件加载: ${result.filePath}`,
          severity: 'success'
        })
      } else if (result.error !== 'Load canceled by user') {
        setSnackbar({
          open: true,
          message: `加载失败: ${result.error}`,
          severity: 'error'
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `加载失败: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handlePreview = async () => {
    setPreviewDialog({
      open: true,
      content: '',
      loading: true,
      error: null,
      syntaxResult: null
    })
    
    try {
      const result = await generateTckPreview()
      if (result.success) {
        setPreviewDialog({
          open: true,
          content: result.tckContent,
          loading: false,
          error: null,
          syntaxResult: result.syntaxResult || null
        })
      } else {
        setPreviewDialog({
          open: true,
          content: '',
          loading: false,
          error: result.error,
          syntaxResult: null
        })
      }
    } catch (error) {
      setPreviewDialog({
        open: true,
        content: '',
        loading: false,
        error: error.message,
        syntaxResult: null
      })
    }
  }

  const handleClosePreview = () => {
    setPreviewDialog({ ...previewDialog, open: false })
  }

  return (
    <>
      <div>
        <Tooltip title="open">
          <IconButton onClick={handleLoadModel}>
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="save">
          <IconButton onClick={handleSaveModel}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="preview TCK">
          <IconButton onClick={handlePreview}>
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <PreviewDialog
        open={previewDialog.open}
        onClose={handleClosePreview}
        tckContent={previewDialog.content}
        loading={previewDialog.loading}
        error={previewDialog.error}
        syntaxResult={previewDialog.syntaxResult}
      />
    </>
  )
}

export default Toolbar
