const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', (req, res) => {
  const backendUrl = 'http://localhost:3007/api';
  const url = `${backendUrl}${req.url}`;
  
  const options = {
    method: req.method,
    headers: req.headers,
    body: req.body
  };

  fetch(url, options)
    .then(response => response.text())
    .then(data => res.send(data))
    .catch(error => {
      console.error('Error proxying request:', error);
      res.status(500).send('Error proxying request');
    });
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
