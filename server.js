(async () => {
  const express = require('express');
  const cors = require('cors');
  const axios = require('axios');
  const OpenAI = require('openai');

  const app = express();
  const port = 3007;
  require('dotenv').config();

  let openai;
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('OpenAI initialized successfully');
  } catch (error) {
    console.error('Failed to initialize OpenAI:', error);
    openai = null;
  }

  app.use(cors());
  app.use(express.json());

  app.use(express.static('client/build'));

  app.get('/', (req, res) => {
    res.json({
      message: 'Welcome to Todo Summary Assistant',
      endpoints: {
        '/api/todos': 'GET/POST - Manage todos',
        '/api/todos/:id': 'DELETE - Delete a todo',
        '/api/summarize': 'POST - Generate summary of todos'
      }
    });
  });

  let todos = [];
  app.get('/api/todos', (req, res) => {
    try {
      res.json(todos);
    } catch (error) {
      console.error('Error fetching todos:', error);
      res.status(500).json({ error: 'Failed to fetch todos' });
    }
  });

  app.post('/api/todos', (req, res) => {
    try {
      const { title } = req.body;
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      const todo = {
        id: Date.now(),
        title,
        completed: false
      };
      todos.push(todo);
      res.json(todo);
    } catch (error) {
      console.error('Error creating todo:', error);
      res.status(500).json({ error: 'Failed to create todo' });
    }
  });

  app.delete('/api/todos/:id', (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const index = todos.findIndex(todo => todo.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      todos.splice(index, 1);
      res.json({ message: 'Todo deleted successfully' });
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({ error: 'Failed to delete todo' });
    }
  });

  
  app.post('/api/summarize', async (req, res) => {
    try {

      const pendingTodos = todos.filter(todo => !todo.completed);
      
      if (pendingTodos.length === 0) {
        return res.status(400).json({ error: 'No pending todos to summarize' });
      }


      const todosText = pendingTodos.map(todo => 
        `- ${todo.title}`
      ).join('\n');

      let summary = '';

      if (!openai) {
        console.log('OpenAI not initialized, using fallback summary');
        summary = 'OpenAI API not initialized. Here is a basic summary:';
        const themes = new Set();
        pendingTodos.forEach(todo => {
          const words = todo.title.toLowerCase().split(' ');
          words.forEach(word => {
            if (word.length > 3) {
              themes.add(word);
            }
          });
        });
        
        summary += `\nMain themes: ${Array.from(themes).join(', ')}`;
        summary += `\nNumber of pending todos: ${pendingTodos.length}`;
      } else {
        try {
          console.log('Generating summary with OpenAI...');
          console.log('Todos text:', todosText);
          
          const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are a helpful assistant that generates concise summaries of todo lists. Focus on the main themes and priorities. Keep it brief."
              },
              {
                role: "user",
                content: `Here are the todos:\n${todosText}\nPlease provide a concise summary of these todos. Focus on the main themes and priorities. Keep it brief.`
              }
            ]
          });

          summary = chatCompletion.choices[0].message.content;
          console.log('Generated summary:', summary);
        } catch (openaiError) {
          console.error('OpenAI API error:', openaiError);
          summary = 'Summary generation with OpenAI failed. Here is a basic summary:';
          const themes = new Set();
          pendingTodos.forEach(todo => {
            const words = todo.title.toLowerCase().split(' ');
            words.forEach(word => {
              if (word.length > 3) {
                themes.add(word);
              }
            });
          });
          
          summary += `\nMain themes: ${Array.from(themes).join(', ')}`;
          summary += `\nNumber of pending todos: ${pendingTodos.length}`;
        }
      }

      let slackStatus = 'not_configured';
      try {
        if (process.env.SLACK_WEBHOOK_URL && process.env.SLACK_WEBHOOK_URL !== 'https://hooks.slack.com/services/your/webhook/url') {
          console.log('Sending to Slack...');
          const slackResponse = await axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: `*Todo Summary:*
${summary}

*Pending Todos:*
${todosText}`
          });
          slackStatus = slackResponse.status === 200 ? 'success' : 'failed';
        }
      } catch (slackError) {
        console.error('Slack error:', slackError);
        slackStatus = 'failed';
      }

      res.json({
        summary,
        slackStatus,
        todos: todosText
      });
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      if (error.response) {
        console.error('API Response:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to generate summary',
        details: error.message 
      });
    }
  });

  app.get('/api/summarize', (req, res) => {
    res.json({
      message: 'Please use POST method to generate summary',
      example: {
        method: 'POST',
        url: '/api/summarize',
        body: '{}' 
      }
    });
  });


  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });


  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
})();
