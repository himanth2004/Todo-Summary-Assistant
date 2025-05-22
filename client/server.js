const express = require('express');
const path = require('path');
const app = express();
const port = 3003; 

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res) => {
  const backendUrl = 'http://localhost:3007';
  const url = `${backendUrl}${req.url}`;
  
  console.log('Proxying request to:', url);
  
  const options = {
    method: req.method,
    headers: req.headers
  };

  if (req.method === 'POST' || req.method === 'PUT') {
    options.body = req.body;
  }

  fetch(url, options)
    .then(response => {
      console.log('Backend response status:', response.status);
      return response.text();
    })
    .then(data => {
      console.log('Backend response data:', data);
      res.send(data);
    })
    .catch(error => {
      console.error('Error proxying request:', error);
      res.status(500).send('Error proxying request');
    });
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please try again later.`);
    process.exit(1);
  }
  console.error('Server error:', error);
});
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
