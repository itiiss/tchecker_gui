import React from 'react'
import { Box, Drawer, Typography, List, ListItem, ListItemText } from '@mui/material'

const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box', position: 'relative' }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          项目
        </Typography>
        <List>
          <ListItem button>
            <ListItemText primary="声明" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="Template" />
          </ListItem>
          <ListItem button>
            <ListItemText primary="模型声明" />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  )
}

export default Sidebar
