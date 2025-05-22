import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, AppBar, Toolbar, Typography, Button, List, ListItem, ListItemText, TextField, IconButton, Snackbar, Alert } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Check as CheckIcon } from '@mui/icons-material';
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [summary, setSummary] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/todos');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };
  const handleAddTodo = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTodo }),
      });
      if (response.ok) {
        setNewTodo('');
        fetchTodos();
        setSnackbar({ open: true, message: 'Todo added successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to add todo', severity: 'error' });
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      setSnackbar({ open: true, message: 'Failed to add todo', severity: 'error' });
    }
  };
  const handleDeleteTodo = async (id) => {
    try {
      const response = await fetch(`http://localhost:3007/api/todos/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchTodos();
        setSnackbar({ open: true, message: 'Todo deleted successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete todo', severity: 'error' });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      setSnackbar({ open: true, message: 'Failed to delete todo', severity: 'error' });
    }
  };
  const handleGenerateSummary = async () => {
    try {
      const response = await fetch('http://localhost:3007/api/summarize', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setSummary(data.summary);
        setSnackbar({ 
          open: true, 
          message: `Summary generated and sent to Slack: ${data.slackStatus === 'success' ? '✅' : '❌'}`, 
          severity: data.slackStatus === 'success' ? 'success' : 'error' 
        });
      } else {
        setSnackbar({ open: true, message: 'Failed to generate summary', severity: 'error' });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSnackbar({ open: true, message: 'Failed to generate summary', severity: 'error' });
    }
  };
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Todo Summary Assistant
            </Typography>
            <Button
              color="inherit"
              variant="contained"
              onClick={handleGenerateSummary}
            >
              Generate Summary
            </Button>
          </Toolbar>
        </AppBar>

        <TextField
          fullWidth
          margin="normal"
          label="New Todo"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddTodo}
          sx={{ mt: 2 }}
        >
          Add Todo
        </Button>

        <List>
          {todos.map((todo) => (
            <ListItem
              key={todo.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  <DeleteIcon color="error" />
                </IconButton>
              }
            >
              <ListItemText
                primary={todo.title}
                secondary={todo.description}
              />
              {todo.completed && <CheckIcon color="primary" />}
            </ListItem>
          ))}
        </List>

        {summary && (
          <div>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Generated Summary:
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {summary}
            </Typography>
          </div>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default App;
