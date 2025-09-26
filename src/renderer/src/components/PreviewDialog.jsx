import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material'
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Download as DownloadIcon
} from '@mui/icons-material'

/* eslint-disable react/prop-types */
const PreviewDialog = ({ open, onClose, tckContent, loading, error, syntaxResult }) => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tckContent)
      setSnackbar({
        open: true,
        message: 'TCK内容已复制到剪贴板',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: '复制失败: ' + error.message,
        severity: 'error'
      })
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([tckContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `model_preview_${Date.now()}.tck`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setSnackbar({
        open: true,
        message: 'TCK文件已下载',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: '下载失败: ' + error.message,
        severity: 'error'
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const renderSyntaxResult = () => {
    if (!syntaxResult) {
      return null
    }

    const severity = syntaxResult.passed ? 'success' : 'error'

    return (
      <Box sx={{ mb: 2 }}>
        <Alert severity={severity}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {syntaxResult.passed ? 'Grammar check passed' : 'Grammar check failed'}
          </Typography>
          {/* {syntaxResult.command && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              Command: {syntaxResult.command}
            </Typography>
          )} */}
          {syntaxResult.error && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {syntaxResult.error}
            </Typography>
          )}
          {syntaxResult.stdout && (
            <Box
              component="pre"
              sx={{
                mt: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                bgcolor: 'transparent'
              }}
            >
              {syntaxResult.stdout.trim()}
            </Box>
          )}
          {syntaxResult.stderr && (
            <Box
              component="pre"
              sx={{
                mt: 1,
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '0.85rem',
                bgcolor: 'transparent'
              }}
            >
              {syntaxResult.stderr.trim()}
            </Box>
          )}
        </Alert>
      </Box>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>正在生成TCK预览...</Typography>
        </Box>
      )
    }

    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">
            <Typography variant="h6">生成预览时出错</Typography>
            <Typography>{error}</Typography>
          </Alert>
        </Box>
      )
    }

    if (!tckContent) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography color="text.secondary">无预览内容</Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          zIndex: 1,
          display: 'flex',
          gap: 1
        }}>
          <IconButton
            size="small"
            onClick={handleCopyToClipboard}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.default' }
            }}
            title="Copy to Clipboard"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={handleDownload}
            sx={{ 
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.default' }
            }}
            title="Download TCK File"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box
          component="pre"
          sx={{
            bgcolor: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            p: 2,
            fontSize: '13px',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
            lineHeight: 1.5,
            overflow: 'auto',
            maxHeight: '60vh',
            minHeight: '300px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            '& .comment': { color: '#6a737d', fontStyle: 'italic' },
            '& .keyword': { color: '#d73a49', fontWeight: 'bold' },
            '& .string': { color: '#032f62' },
            '& .number': { color: '#005cc5' }
          }}
        >
          {tckContent}
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh', maxHeight: '800px' }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6">TCK file preview</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {renderSyntaxResult()}
          {renderContent()}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} variant="contained">
            关闭
          </Button>
        </DialogActions>
      </Dialog>

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

export default PreviewDialog
