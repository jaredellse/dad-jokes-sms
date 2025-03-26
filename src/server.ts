import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import twilio, { Twilio } from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
console.log('Loading environment variables');
dotenv.config();

// Set environment mode
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('Running in', isDevelopment ? 'development' : 'production', 'mode');

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
console.log('Root directory:', rootDir);

// Debug logging for environment variables
console.log('Checking Twilio configuration...');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Present' : 'Missing');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'Present' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

const app = express();
app.use(express.json());

// Very simple CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  optionsSuccessStatus: 204
}));

// Log all incoming requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from the dist directory (Vite output)
if (!isDevelopment) {
  try {
    const distPath = path.join(rootDir, 'dist');
    console.log('Setting up static file serving from:', distPath);
    app.use(express.static(distPath));
  } catch (error) {
    console.error('Error setting up static file serving:', error);
  }
}

interface TwilioMessageParams {
  to: string;
  body: string;
  from?: string;
  messagingServiceSid?: string;
}

interface MockTwilioClient {
  messages: {
    create: (params: TwilioMessageParams) => Promise<{ sid: string }>;
  }
}

// Mock Twilio client for development
const mockTwilioClient: MockTwilioClient = {
  messages: {
    create: async (params: TwilioMessageParams) => {
      console.log('\n📱 MOCK SMS SENT:');
      console.log('To:', params.to);
      console.log('From:', params.from);
      console.log('Message:', params.body);
      console.log('-------------------\n');
      return { sid: 'MOCK_' + Date.now() };
    }
  }
};

// Function to get required environment variable
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Initialize Twilio client with proper type checking
const client: Twilio | MockTwilioClient = isDevelopment ? mockTwilioClient : twilio(
  getRequiredEnvVar('TWILIO_ACCOUNT_SID'),
  getRequiredEnvVar('TWILIO_AUTH_TOKEN')
);

// Test configuration
if (!isDevelopment) {
  const twilioClient = client as Twilio;
  try {
    console.log('Testing Twilio client configuration...');
    twilioClient.messages.list({ limit: 1 }).then(() => {
      console.log('Twilio client configuration successful!');
    }).catch((error: Error) => {
      console.error('Twilio client configuration error:', error.message);
    });
  } catch (error) {
    console.error('Error creating Twilio client:', error);
  }
}

// Initialize OpenAI client with proper type checking
const openai = new OpenAI({
  apiKey: getRequiredEnvVar('OPENAI_API_KEY'),
});

// Add a list of fallback jokes
const fallbackJokes = [
  {
    setup: "Why don't scientists trust atoms?",
    punchline: "Because they make up everything!"
  },
  {
    setup: "What did the coffee report to the police?",
    punchline: "A mugging!"
  },
  {
    setup: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field!"
  },
  {
    setup: "What do you call a bear with no teeth?",
    punchline: "A gummy bear!"
  },
  {
    setup: "What do you call a fake noodle?",
    punchline: "An impasta!"
  }
];

// Function to get a random fallback joke
function getRandomFallbackJoke() {
  const randomIndex = Math.floor(Math.random() * fallbackJokes.length);
  return fallbackJokes[randomIndex];
}

// Cache to store recently generated jokes
const recentJokesCache = new Set<string>();
const MAX_CACHE_SIZE = 1000; // Store last 1000 jokes to avoid repeats

// Function to get a random joke category and theme
function getRandomJokeParams(): { category: string, theme: string, style: string } {
  const categories = [
    "technology", "food", "animals", "weather", "sports", "music", "science",
    "nature", "office", "books", "art", "travel", "space", "ocean", "gardening",
    "computers", "internet", "coffee", "pizza", "cats", "dogs", "birds",
    "mathematics", "physics", "chemistry", "biology", "astronomy", "geology",
    "history", "geography", "cooking", "baking", "vegetables", "fruits",
    "programming", "coding", "gaming", "movies", "television", "radio",
    "photography", "painting", "dancing", "singing", "instruments", "theater",
    "camping", "hiking", "swimming", "running", "cycling", "yoga", "meditation"
  ];

  const themes = [
    "wordplay", "puns", "situational", "observational", "comparison", "contrast",
    "absurdist", "reversal", "misdirection", "cultural", "educational", "seasonal",
    "metaphorical", "literal", "exaggeration", "understatement"
  ];

  const styles = [
    "classic", "modern", "silly", "clever", "nerdy", "witty", "playful",
    "unexpected", "wholesome", "goofy", "smart", "quirky"
  ];

  return {
    category: categories[Math.floor(Math.random() * categories.length)],
    theme: themes[Math.floor(Math.random() * themes.length)],
    style: styles[Math.floor(Math.random() * styles.length)]
  };
}

// Function to generate a dad joke using OpenAI with timeout
async function generateDadJoke(): Promise<{ setup: string, punchline: string }> {
  try {
    // Create a promise that rejects after 8 seconds (increased timeout for more creative generation)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI request timed out')), 8000);
    });

    // Get random elements to make the joke more unique
    const { category, theme, style } = getRandomJokeParams();
    const timestamp = Date.now();

    // Create the OpenAI request promise with increased randomness
    const openAiPromise = openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a dad joke generator specializing in unique, original jokes. Follow these rules:
1. Create a NEW, ORIGINAL dad joke combining ${category} with ${theme} humor in a ${style} style
2. Never use common or overused dad joke formats
3. Avoid any puns or jokes that might have been used before
4. Make it clever and family-friendly
5. Return ONLY a JSON object with format {"setup": "joke setup", "punchline": "joke punchline"}
6. Keep the setup concise (under 60 characters if possible)
7. Make the punchline unexpected and memorable
8. Use creative wordplay that combines multiple meanings
9. Incorporate specific terminology from the ${category} field
10. Make the connection between setup and punchline non-obvious but satisfying
11. Do not explain the joke or add any other text`
        },
        {
          role: "user",
          content: `Generate a completely unique ${style} dad joke about ${category} using ${theme} humor. Make it unlike any joke that exists. Current time: ${timestamp}`
        }
      ],
      temperature: 1.0,
      presence_penalty: 1.0,
      frequency_penalty: 1.0,
      max_tokens: 150
    });

    // Race between the timeout and the actual request
    const response = await Promise.race([openAiPromise, timeoutPromise]) as Awaited<typeof openAiPromise>;
    const content = response.choices[0]?.message?.content?.trim() || '';
    
    try {
      // Parse the JSON response
      const jokeObject = JSON.parse(content);
      if (typeof jokeObject.setup === 'string' && typeof jokeObject.punchline === 'string' &&
          jokeObject.setup.length > 0 && jokeObject.punchline.length > 0) {
        
        // Create a unique identifier for the joke
        const jokeId = `${jokeObject.setup}|${jokeObject.punchline}`;
        
        // Check if this joke was recently used
        if (recentJokesCache.has(jokeId)) {
          console.log('Joke was recently used, generating another one');
          return generateDadJoke(); // Recursively try again
        }
        
        // Add to cache and maintain cache size
        recentJokesCache.add(jokeId);
        if (recentJokesCache.size > MAX_CACHE_SIZE) {
          const firstItem = Array.from(recentJokesCache)[0];
          if (firstItem) {
            recentJokesCache.delete(firstItem);
          }
        }
        
        return {
          setup: jokeObject.setup,
          punchline: jokeObject.punchline
        };
      } else {
        console.warn('Invalid joke format from OpenAI, using fallback');
        return getRandomFallbackJoke();
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return getRandomFallbackJoke();
    }
  } catch (error) {
    console.error('Error generating joke with OpenAI:', error);
    return getRandomFallbackJoke();
  }
}

// Add endpoint to generate a new dad joke
app.get('/api/generate-joke', async (_: Request, res: Response) => {
  try {
    const joke = await generateDadJoke();
    res.json({ success: true, joke });
  } catch (error) {
    console.error('Error in joke endpoint:', error);
    // Even if there's an error, return a fallback joke
    res.json({ 
      success: true, 
      joke: getRandomFallbackJoke(),
      wasError: true
    });
  }
});

// Create a simple HTML page to display opt-in records
app.get('/', async (_: Request, res: Response) => {
  try {
    const consents = await readConsents();
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dad Jokes SMS - Consent Records</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
            .consent-record { border: 1px solid #ccc; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
            .timestamp { color: #666; font-size: 0.9rem; }
            .messages { margin-top: 0.5rem; padding-left: 1rem; }
            .message { margin: 0.25rem 0; }
          </style>
        </head>
        <body>
          <h1>Dad Jokes SMS - Consent Records</h1>
          <p>This page shows records of user consent for receiving dad jokes via SMS.</p>
          ${consents.map(consent => `
            <div class="consent-record">
              <p><strong>Phone Number:</strong> ${maskPhoneNumber(consent.phoneNumber)}</p>
              <p><strong>Consent Given:</strong> ${consent.consentText}</p>
              <p class="timestamp">${new Date(consent.timestamp).toLocaleString()}</p>
              <p>IP Address: ${consent.ipAddress}</p>
              ${consent.messages ? `
                <div class="messages">
                  <p><strong>Messages Sent:</strong></p>
                  ${consent.messages.map((msg: string, i: number) => `
                    <p class="message">${i + 1}. ${msg}</p>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading consent records');
  }
});

// Function to mask phone number for privacy
function maskPhoneNumber(phoneNumber: string): string {
  return phoneNumber.slice(0, -4).replace(/\d/g, '*') + phoneNumber.slice(-4);
}

// In-memory storage for production environment
const inMemoryStorage: {
  consents: any[];
  unsubscribed: string[];
} = {
  consents: [],
  unsubscribed: []
};

interface Consent {
  phoneNumber: string;
  consentText: string;
  timestamp: string;
  ipAddress: string;
  messages?: string[];
  message?: string;  // Add this for backward compatibility
}

// Function to read consents from file or memory
async function readConsents(): Promise<Consent[]> {
  if (isDevelopment) {
    try {
      const data = await fs.readFile(path.join(rootDir, 'consents.json'), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  } else {
    return inMemoryStorage.consents;
  }
}

// Function to save or update consent
async function saveConsent(consent: Consent): Promise<void> {
  const consents = await readConsents();
  const existingIndex = consents.findIndex(c => 
    c.phoneNumber === consent.phoneNumber && 
    new Date(c.timestamp).toDateString() === new Date().toDateString()
  );

  if (existingIndex >= 0) {
    consents[existingIndex].messages = consents[existingIndex].messages || [];
    if (consent.message) {
      consents[existingIndex].messages.push(consent.message);
    }
  } else {
    consents.push({
      ...consent,
      messages: consent.message ? [consent.message] : []
    });
  }

  if (isDevelopment) {
    await fs.writeFile(path.join(rootDir, 'consents.json'), JSON.stringify(consents, null, 2));
  } else {
    inMemoryStorage.consents = consents;
  }
}

// Function to read unsubscribed numbers
async function readUnsubscribed(): Promise<string[]> {
  if (isDevelopment) {
    try {
      const data = await fs.readFile(path.join(rootDir, 'unsubscribed.json'), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return empty array
      return [];
    }
  } else {
    return inMemoryStorage.unsubscribed;
  }
}

// Function to save unsubscribed number
async function saveUnsubscribed(phoneNumber: string): Promise<void> {
  const unsubscribed = await readUnsubscribed();
  if (!unsubscribed.includes(phoneNumber)) {
    unsubscribed.push(phoneNumber);
    if (isDevelopment) {
      await fs.writeFile(path.join(rootDir, 'unsubscribed.json'), JSON.stringify(unsubscribed, null, 2));
    } else {
      inMemoryStorage.unsubscribed = unsubscribed;
    }
  }
}

// Function to check if number is unsubscribed
async function isUnsubscribed(phoneNumber: string): Promise<boolean> {
  const unsubscribed = await readUnsubscribed();
  return unsubscribed.includes(phoneNumber);
}

const sendSmsHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { to, message } = req.body;
    
    if (!to || !message) {
      res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
      return;
    }

    // Validate phone number format
    if (typeof to !== 'string' || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Phone number and message must be strings'
      });
      return;
    }

    // Get the messaging configuration
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!twilioNumber && !messagingServiceSid) {
      res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Twilio phone number or messaging service'
      });
      return;
    }

    // Create base message params
    const messageParams: TwilioMessageParams = {
      to,
      body: message
    };

    // Add either phone number or messaging service
    if (twilioNumber) {
      messageParams.from = twilioNumber;
    } else if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    }

    const result = await client.messages.create(messageParams);

    // Save consent with proper type handling
    await saveConsent({
      phoneNumber: to,
      consentText: "I consent to receive dad jokes via SMS at the phone number provided",
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      message
    });

    console.log('SMS sent successfully:', result.sid);
    res.json({ success: true, messageSid: result.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    });
  }
};

app.post('/api/send-sms', sendSmsHandler);

// Handle incoming SMS (for unsubscribe)
app.post('/api/sms-webhook', express.urlencoded({ extended: false }), async (req: Request, res: Response) => {
  const { Body, From } = req.body;
  
  if (Body?.trim().toUpperCase() === 'STOP') {
    await saveUnsubscribed(From);
    
    // Send confirmation
    await client.messages.create({
      body: "You've been unsubscribed from dad jokes. We're sorry to see you go. Text START to resubscribe",
      to: From,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    res.type('text/xml');
    res.send('<Response></Response>');
  } else if (Body?.trim().toUpperCase() === 'START') {
    // Remove from unsubscribed list
    const unsubscribed = await readUnsubscribed();
    const filtered = unsubscribed.filter(num => num !== From);
    
    if (isDevelopment) {
      await fs.writeFile(path.join(rootDir, 'unsubscribed.json'), JSON.stringify(filtered, null, 2));
    } else {
      inMemoryStorage.unsubscribed = filtered;
    }
    
    // Send confirmation
    await client.messages.create({
      body: "Welcome back to dad jokes! You're now resubscribed",
      to: From,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    
    res.type('text/xml');
    res.send('<Response></Response>');
  } else {
    res.type('text/xml');
    res.send('<Response></Response>');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 