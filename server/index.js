const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Add debugging for environment variables
console.log('Environment variables:', {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  apiKeyAvailable: !!process.env.OPENAI_API_KEY,
  apiKeyLength: process.env.OPENAI_API_KEY?.length
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Updated CORS configuration with more permissive settings for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST']
}));

// Parse JSON bodies
app.use(express.json());

// Set proper MIME types
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.url.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

// Serve static files from the frontend build directory with proper MIME types
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Joke components for generating variations
const jokeComponents = {
  characters: {
    food: [
      'pizza', 'spaghetti', 'taco', 'sushi', 'burger',
      'pancake', 'donut', 'cookie', 'burrito', 'sandwich'
    ],
    animals: [
      'penguin', 'giraffe', 'kangaroo', 'octopus', 'platypus',
      'flamingo', 'panda', 'koala', 'sloth', 'dolphin'
    ],
    tech: [
      'robot', 'computer', 'smartphone', 'printer', 'smartwatch',
      'drone', 'microchip', 'calculator', 'headphones', 'keyboard'
    ],
    music: [
      'trombone', 'saxophone', 'accordion', 'tambourine', 'ukulele',
      'bagpipes', 'kazoo', 'triangle', 'tuba', 'banjo'
    ],
    weather: [
      'tornado', 'hurricane', 'rainbow', 'snowflake', 'lightning',
      'avalanche', 'blizzard', 'tsunami', 'volcano', 'meteor'
    ],
    sports: [
      'bowling pin', 'hockey puck', 'frisbee', 'ping pong ball', 'skateboard',
      'surfboard', 'volleyball', 'boomerang', 'unicycle', 'trampoline'
    ]
  },
  actions: [
    'learn to breakdance', 'become a comedian', 'join a circus', 'start meditating',
    'try skydiving', 'become a chef', 'learn magic tricks', 'start a band',
    'become a detective', 'join a yoga class', 'enter a race', 'write poetry',
    'learn to juggle', 'become a superhero', 'start a podcast'
  ],
  locations: [
    'at a haunted house', 'in a submarine', 'on a space station', 'at a circus',
    'in a time machine', 'at a comedy club', 'in a treehouse', 'at a magic show',
    'in a hot air balloon', 'at a karaoke bar', 'in a castle', 'on a pirate ship',
    'at a ninja academy', 'in a secret laboratory', 'at a dinosaur park'
  ],
  situations: [
    'during a solar eclipse', 'in zero gravity', 'while riding a unicorn',
    'during a pie eating contest', 'in the middle of a flash mob',
    'during a talent show', 'while chasing rainbows', 'in a bubble bath',
    'during a food fight', 'while walking on stilts', 'in a pillow fort',
    'during a dance-off', 'while juggling flamingos', 'in a room full of balloons'
  ]
};

// Template patterns for generating setups with proper grammar
const setupTemplates = [
  {
    template: "What happens when a {character} tries to {action}?",
    requiresSingular: true
  },
  {
    template: "What do you get when a {character} goes {location}?",
    requiresSingular: true
  },
  {
    template: "Have you heard about the {character} {situation}?",
    requiresSingular: true
  },
  {
    template: "What do you call a {character} that decides to {action}?",
    requiresSingular: true
  },
  {
    template: "Why did the {character} end up {location}?",
    requiresSingular: true
  },
  {
    template: "What made the {character} {action}?",
    requiresSingular: true
  }
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Grammar helpers
function pluralize(word) {
  if (word.endsWith('s')) return word;
  if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
  return word + 's';
}

function addArticle(word) {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const firstLetter = word.charAt(0).toLowerCase();
  return (vowels.includes(firstLetter) ? 'an ' : 'a ') + word;
}

function generateSetup(category) {
  const templateObj = getRandomElement(setupTemplates);
  const template = templateObj.template;
  
  // Get base components
  const character = getRandomElement(jokeComponents.characters[category] || 
    jokeComponents.characters[Object.keys(jokeComponents.characters)[0]]);
  const location = getRandomElement(jokeComponents.locations);
  const action = getRandomElement(jokeComponents.actions);
  const situation = getRandomElement(jokeComponents.situations);

  // Format the components based on grammar rules
  let formattedSetup = template
    .replace('{character}', character)
    .replace('{location}', location)
    .replace('{action}', action)
    .replace('{situation}', situation);

  // Fix common grammar issues
  formattedSetup = formattedSetup
    // Fix "during" phrases
    .replace(/ when during /g, ' during ')
    // Fix "to at" phrases
    .replace(/ to at /g, ' to ')
    // Fix "to to" phrases
    .replace(/ to to /g, ' to ')
    // Fix article usage
    .replace(/ a ([aeiou])/gi, ' an $1')
    // Fix plural agreement
    .replace(/does a .* s\b/g, match => match.replace('does a', 'do'))
    // Ensure proper spacing
    .replace(/\s+/g, ' ')
    .trim();

  return formattedSetup;
}

app.post('/api/jokes', async (req, res) => {
  try {
    console.log('Received request for jokes, count:', req.body.count);
    const count = Math.min(req.body.count || 5, 5); // Limit to 5 jokes max
    
    // Generate all jokes in parallel for better performance
    const jokePromises = Object.keys(jokeComponents.characters).slice(0, count).map(async (category) => {
      try {
        const setup = generateSetup(category);
        console.log('Generated setup:', setup);

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a dad joke generator specializing in clever punchlines. Rules for punchlines:
              1. Must contain a pun or wordplay related to the setup
              2. Should be concise and punchy
              3. Must be family-friendly
              4. Should not explain the joke
              5. Should not use the same wordplay as the setup
              6. Avoid using "because" to start the punchline
              7. Aim for surprise and cleverness
              8. Don't use exclamation points
              9. Don't repeat words from the setup unless part of the pun
              10. Focus on delivering the pun efficiently

              Respond with ONLY the punchline.`
            },
            {
              role: "user",
              content: setup
            }
          ],
          temperature: 1,
          max_tokens: 50,
          frequency_penalty: 0.5,
          presence_penalty: 0.5
        });

        const punchline = completion.choices[0].message.content.trim();
        console.log('Generated punchline:', punchline);

        return {
          setup,
          punchline
        };
      } catch (error) {
        console.error('Error generating joke:', error);
        throw error;
      }
    });

    const jokes = await Promise.all(jokePromises);
    console.log('Sending jokes:', jokes);
    res.json(jokes);
  } catch (error) {
    console.error('Error in /api/jokes:', error);
    res.status(500).json({ 
      error: 'Failed to generate jokes',
      details: error.message 
    });
  }
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server with error handling
const server = app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
  console.log(`Server running on port ${port}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
    process.exit(1);
  }
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 