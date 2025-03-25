// Ultra-simple Express server for Railway deployment
import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Just provide static jokes - no OpenAI dependency
const jokes = [
  { setup: "I'm reading a book on anti-gravity.", punchline: "It's impossible to put down!" },
  { setup: "What do you call a fish with no eyes?", punchline: "Fsh!" },
  { setup: "Why did the developer go broke?", punchline: "Because they used up all their cache!" },
  { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything!" },
  { setup: "What do you call a factory that makes products that are just OK?", punchline: "A satisfactory!" },
  { setup: "Why couldn't the bicycle stand up by itself?", punchline: "It was two tired!" },
  { setup: "Did you hear about the mathematician who's afraid of negative numbers?", punchline: "He'll stop at nothing to avoid them!" },
  { setup: "Why do we tell actors to 'break a leg?'", punchline: "Because every play has a cast!" },
  { setup: "Helvetica and Times New Roman walk into a bar.", punchline: "The bartender says, 'We don't serve your type.'" },
  { setup: "What did the janitor say when he jumped out of the closet?", punchline: "Supplies!" }
];

// API endpoint to generate jokes
app.get('/api/generate-joke', (_, res) => {
  // Get a random joke
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  res.json({ success: true, joke: randomJoke });
});

// SMS webhook endpoint
app.post('/api/sms-webhook', express.urlencoded({ extended: false }), (req, res) => {
  console.log('Received SMS webhook:', req.body);
  res.type('text/xml');
  res.send('<Response></Response>');
});

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default route
app.get('/', (_, res) => {
  res.send(`
    <html>
      <head>
        <title>Dad Jokes API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
        </style>
      </head>
      <body>
        <h1>Dad Jokes API</h1>
        <p>This is the API server for Dad Jokes SMS service.</p>
        <p>Available endpoints:</p>
        <ul>
          <li><a href="/api/generate-joke">/api/generate-joke</a> - Generate a dad joke</li>
          <li><a href="/api/health">/api/health</a> - Server health check</li>
        </ul>
      </body>
    </html>
  `);
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 