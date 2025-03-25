// Simple Express server for Railway deployment
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();
console.log('Starting server in mode:', process.env.NODE_ENV || 'not set');

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate a dad joke using OpenAI
async function generateDadJoke() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a dad joke generator. Generate a funny, clean dad joke with a setup and punchline. Return ONLY a JSON object with format {\"setup\": \"joke setup\", \"punchline\": \"joke punchline\"}. No additional text or explanation."
        },
        {
          role: "user",
          content: "Generate a new dad joke"
        }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    
    try {
      const jokeObject = JSON.parse(content);
      return {
        setup: jokeObject.setup,
        punchline: jokeObject.punchline
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return {
        setup: "Why don't scientists trust atoms?",
        punchline: "Because they make up everything!"
      };
    }
  } catch (error) {
    console.error('Error generating joke with OpenAI:', error);
    return {
      setup: "Why don't scientists trust atoms?",
      punchline: "Because they make up everything!"
    };
  }
}

// API endpoint to generate jokes
app.get('/api/generate-joke', async (_, res) => {
  try {
    const joke = await generateDadJoke();
    res.json({ success: true, joke });
  } catch (error) {
    console.error('Error generating joke:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate joke'
    });
  }
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
          <li><a href="/api/generate-joke">/api/generate-joke</a> - Generate a new dad joke</li>
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