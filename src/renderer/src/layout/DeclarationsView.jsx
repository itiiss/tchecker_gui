import React from 'react';
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import useEditorStore from '../store/editorStore';

const DeclarationsView = () => {
  const {
    systemName,
    clocks,
    intVars,
    events,
    synchronizations,
    setSystemName,
    setClocks,
    setIntVars,
    setEvents,
    setSynchronizations
  } = useEditorStore();

  const handleAddClock = () => {
    setClocks([...clocks, { name: '', size: 1 }]);
  };

  const handleClockChange = (index, field, value) => {
    const newClocks = [...clocks];
    newClocks[index][field] = value;
    setClocks(newClocks);
  };

  const handleRemoveClock = (index) => {
    const newClocks = clocks.filter((_, i) => i !== index);
    setClocks(newClocks);
  };

  const handleAddIntVar = () => {
    setIntVars([...intVars, { name: '', size: 1, min: 0, max: 1, initial: 0 }]);
  };

  const handleIntVarChange = (index, field, value) => {
    const newIntVars = [...intVars];
    newIntVars[index][field] = value;
    setIntVars(newIntVars);
  };

  const handleRemoveIntVar = (index) => {
    const newIntVars = intVars.filter((_, i) => i !== index);
    setIntVars(newIntVars);
  };

  const handleAddSynchronization = () => {
    setSynchronizations([...synchronizations, { constraints: [] }]);
  };

  const handleSynchronizationChange = (index, value) => {
    const newSynchronizations = [...synchronizations];
    newSynchronizations[index].constraints = value.split(',').map(s => s.trim());
    setSynchronizations(newSynchronizations);
  };

  const handleRemoveSynchronization = (index) => {
    const newSynchronizations = synchronizations.filter((_, i) => i !== index);
    setSynchronizations(newSynchronizations);
  };

  // Similar handlers for intVars, events, and synchronizations can be added here

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Global Declarations
      </Typography>
      <TextField
        label="System Name"
        value={systemName}
        onChange={(e) => setSystemName(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <Typography variant="h6">Clocks</Typography>
      <List>
        {clocks.map((clock, index) => (
          <ListItem key={index}>
            <TextField
              label="Name"
              value={clock.name}
              onChange={(e) => handleClockChange(index, 'name', e.target.value)}
              sx={{ mr: 1 }}
            />
            <TextField
              label="Size"
              type="number"
              value={clock.size}
              onChange={(e) => handleClockChange(index, 'size', parseInt(e.target.value, 10))}
              sx={{ mr: 1 }}
            />
            <IconButton onClick={() => handleRemoveClock(index)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAddClock}>
        Add Clock
      </Button>

      <Typography variant="h6" sx={{ mt: 3 }}>Integer Variables</Typography>
      <List>
        {intVars.map((intVar, index) => (
          <ListItem key={index}>
            <TextField
              label="Name"
              value={intVar.name}
              onChange={(e) => handleIntVarChange(index, 'name', e.target.value)}
              sx={{ mr: 1 }}
            />
            <TextField
              label="Size"
              type="number"
              value={intVar.size}
              onChange={(e) => handleIntVarChange(index, 'size', parseInt(e.target.value, 10))}
              sx={{ mr: 1 }}
            />
            <TextField
              label="Min"
              type="number"
              value={intVar.min}
              onChange={(e) => handleIntVarChange(index, 'min', parseInt(e.target.value, 10))}
              sx={{ mr: 1 }}
            />
            <TextField
              label="Max"
              type="number"
              value={intVar.max}
              onChange={(e) => handleIntVarChange(index, 'max', parseInt(e.target.value, 10))}
              sx={{ mr: 1 }}
            />
            <TextField
              label="Initial"
              type="number"
              value={intVar.initial}
              onChange={(e) => handleIntVarChange(index, 'initial', parseInt(e.target.value, 10))}
              sx={{ mr: 1 }}
            />
            <IconButton onClick={() => handleRemoveIntVar(index)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAddIntVar}>
        Add Integer Variable
      </Button>

      <Typography variant="h6" sx={{ mt: 3 }}>Synchronizations</Typography>
      <List>
        {synchronizations.map((sync, index) => (
          <ListItem key={index}>
            <TextField
              label="Constraints"
              value={sync.constraints.join(', ')}
              onChange={(e) => handleSynchronizationChange(index, e.target.value)}
              fullWidth
              sx={{ mr: 1 }}
            />
            <IconButton onClick={() => handleRemoveSynchronization(index)}>
              <DeleteIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddIcon />} onClick={handleAddSynchronization}>
        Add Synchronization
      </Button>
    </Box>
  );
};

export default DeclarationsView;
