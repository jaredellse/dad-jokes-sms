import express, { Request, Response, RequestHandler } from 'express';
import twilio, { Twilio } from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This works better with Railway's file structure
const rootDir = process.env.NODE_ENV === 'production' 
  ? path.resolve(__dirname, '../..') // In production on Railway  
  : path.resolve(__dirname, '..'); // In development

// Load environment variables from .env file if it exists
// In Railway, these will be set through the dashboard
try {
  const envPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../.env')
    : path.join(rootDir, '.env');
  
  if (existsSync(envPath)) {
    console.log(`Loading .env file from ${envPath}`);
    dotenv.config({ path: envPath });
  } else {
    console.log(`No .env file found at ${envPath}, using environment variables`);
    dotenv.config();
  }
} catch (error) {
  console.warn('Error loading .env file:', error);
  dotenv.config(); // Fallback to default behavior
}

// Ensure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Set environment mode
const isDevelopment = process.env.NODE_ENV !== 'production';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDevelopment:', isDevelopment);
console.log('__dirname:', __dirname);
console.log('rootDir:', rootDir);

// Debug logging for environment variables
console.log('Checking Twilio configuration...');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Present' : 'Missing');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'Present' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

const app = express();
app.use(express.json());

// Configure CORS
const corsOptions = isDevelopment 
  ? {
      // Development - restrict to localhost
      origin: 'http://localhost:5174',
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      optionsSuccessStatus: 204
    }
  : {
      // Production - allow more origins
      origin: '*',
      methods: ['GET', 'POST', 'OPTIONS'],
      optionsSuccessStatus: 204
    };

console.log('CORS configuration:', corsOptions);

app.use(cors(corsOptions));

// Add preflight response for OPTIONS requests
app.options('*', cors(corsOptions));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files from the dist directory (Vite output)
if (!isDevelopment) {
  try {
    // For Railway, the static files are in the dist directory at the same level as server.js
    const clientDistPath = path.join(rootDir, 'dist');
    const altClientDistPath = path.resolve(__dirname, '../dist');
    
    // Try multiple possible paths
    const paths = [clientDistPath, altClientDistPath];
    let foundDistPath = null;
    
    for (const distPath of paths) {
      try {
        const stats = await fs.stat(distPath);
        if (stats.isDirectory()) {
          console.log(`Found static files at: ${distPath}`);
          foundDistPath = distPath;
          break;
        }
      } catch (err) {
        console.log(`No static files at: ${distPath}`);
      }
    }
    
    if (foundDistPath) {
      // Serve static files
      app.use(express.static(foundDistPath));
      
      // Catch-all route for SPA client-side routing
      app.get(/^(?!\/?api).+/, (req, res) => {
        try {
          const indexPath = path.join(foundDistPath, 'index.html');
          console.log(`Serving index.html at ${indexPath} for route: ${req.path}`);
          res.sendFile(indexPath);
        } catch (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send('Error serving application');
        }
      });
    } else {
      console.log('No static file directory found');
    }
  } catch (error) {
    console.error('Error setting up static file serving:', error);
  }
}

interface MockTwilioClient {
  messages: {
    create: (params: any) => Promise<{ sid: string }>;
  }
}

// Mock Twilio client for development
const mockTwilioClient: MockTwilioClient = {
  messages: {
    create: async (params: any) => {
      console.log('\n📱 MOCK SMS SENT:');
      console.log('To:', params.to);
      console.log('From:', params.from);
      console.log('Message:', params.body);
      console.log('-------------------\n');
      return { sid: 'MOCK_' + Date.now() };
    }
  }
};

const client: Twilio | MockTwilioClient = isDevelopment ? mockTwilioClient : twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate a dad joke using OpenAI
async function generateDadJoke(): Promise<{ setup: string, punchline: string }> {
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
      // Parse the JSON response
      const jokeObject = JSON.parse(content);
      return {
        setup: jokeObject.setup,
        punchline: jokeObject.punchline
      };
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      // Fallback in case parsing fails
      return {
        setup: "Why don't scientists trust atoms?",
        punchline: "Because they make up everything!"
      };
    }
  } catch (error) {
    console.error('Error generating joke with OpenAI:', error);
    // Fallback joke
    return {
      setup: "Why don't scientists trust atoms?",
      punchline: "Because they make up everything!"
    };
  }
}

// Add endpoint to generate a new dad joke
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

// Create a simple HTML page to display opt-in records
app.get('/', async (_, res) => {
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

// Function to read consents from file or memory
async function readConsents(): Promise<any[]> {
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
async function saveConsent(consent: any): Promise<void> {
  const consents = await readConsents();
  const existingIndex = consents.findIndex(c => 
    c.phoneNumber === consent.phoneNumber && 
    new Date(c.timestamp).toDateString() === new Date().toDateString()
  );

  if (existingIndex >= 0) {
    // Update existing consent for today
    consents[existingIndex].messages = consents[existingIndex].messages || [];
    consents[existingIndex].messages.push(consent.message);
  } else {
    // Create new consent record
    consents.push({
      ...consent,
      messages: [consent.message]
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

const sendSmsHandler: RequestHandler = async (req, res) => {
  try {
    const { to, message, isQuestion } = req.body;
    
    console.log('Received SMS request:', { to, message, isQuestion });
    
    // Convert single number to array if needed
    const recipients = Array.isArray(to) ? to : [to];
    
    // Filter out unsubscribed numbers
    const subscribedRecipients = [];
    for (const recipient of recipients) {
      if (!(await isUnsubscribed(recipient))) {
        subscribedRecipients.push(recipient);
      }
    }

    if (subscribedRecipients.length === 0) {
      res.json({ success: false, error: 'All recipients have unsubscribed' });
      return;
    }
    
    // Save consent for each recipient
    for (const recipient of subscribedRecipients) {
      await saveConsent({
        phoneNumber: recipient,
        consentText: "I consent to receive dad jokes via SMS at the phone number provided",
        timestamp: new Date().toISOString(),
        ipAddress: req.ip || req.connection.remoteAddress,
        message: message
      });
    }

    console.log('Attempting to send SMS to:', subscribedRecipients);
    
    // Add unsubscribe message for punchlines
    const finalMessage = !isQuestion 
      ? message + "\n\nTo stop receiving dad jokes, reply with STOP"
      : message;

    // Send message to all recipients as a group
    const result = await client.messages.create({
      body: finalMessage,
      to: subscribedRecipients.join(','),
      from: process.env.TWILIO_PHONE_NUMBER,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID
    });

    console.log('SMS sent successfully:', result.sid);
    res.json({ success: true, messageId: result.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS',
      details: error
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