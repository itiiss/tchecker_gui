import React from 'react'
import { Tooltip, IconButton, Snackbar, Alert } from '@mui/material'
import {
  FolderOpen as FolderOpenIcon,
  Save as SaveIcon,
  FileUpload as ImportIcon
} from '@mui/icons-material'
import useEditorStore from '../store/editorStore'

/* eslint-disable react/prop-types */
const Toolbar = ({ onTabChange }) => {
  const { saveModel, loadModel, importUppaalModel } = useEditorStore()
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' })


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


  const handleImportUppaal = async () => {
    try {
      const result = await importUppaalModel()
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Uppaal模型已成功导入: ${result.filePath}`,
          severity: 'success'
        })
      } else if (result.error !== 'Import canceled by user') {
        setSnackbar({
          open: true,
          message: `导入失败: ${result.error}`,
          severity: 'error'
        })
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `导入失败: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <>
      <div>
        <Tooltip title="打开模型">
          <IconButton onClick={handleLoadModel}>
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="保存模型">
          <IconButton onClick={handleSaveModel}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="导入Uppaal模型">
          <IconButton onClick={handleImportUppaal}>
            <ImportIcon />
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
    </>
  )
}

export default Toolbar
