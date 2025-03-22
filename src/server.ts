import express, { Request, Response } from 'express';
import twilio, { Twilio } from 'twilio';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs/promises';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';

// Debug logging for environment variables
console.log('Checking Twilio configuration...');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Present' : 'Missing');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Present' : 'Missing');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Present' : 'Missing');
console.log('TWILIO_MESSAGING_SERVICE_SID:', process.env.TWILIO_MESSAGING_SERVICE_SID ? 'Present' : 'Missing');
console.log('Development mode:', isDevelopment ? 'Yes' : 'No');

const app = express();
app.use(express.json());
app.use(cors());

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

// Function to read consents from file
async function readConsents(): Promise<any[]> {
  try {
    const data = await fs.readFile('consents.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
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

  await fs.writeFile('consents.json', JSON.stringify(consents, null, 2));
}

// Function to read unsubscribed numbers
async function readUnsubscribed(): Promise<string[]> {
  try {
    const data = await fs.readFile('unsubscribed.json', 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Function to save unsubscribed number
async function saveUnsubscribed(phoneNumber: string): Promise<void> {
  const unsubscribed = await readUnsubscribed();
  if (!unsubscribed.includes(phoneNumber)) {
    unsubscribed.push(phoneNumber);
    await fs.writeFile('unsubscribed.json', JSON.stringify(unsubscribed, null, 2));
  }
}

// Function to check if number is unsubscribed
async function isUnsubscribed(phoneNumber: string): Promise<boolean> {
  const unsubscribed = await readUnsubscribed();
  return unsubscribed.includes(phoneNumber);
}

app.post('/api/send-sms', async (req, res) => {
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
      return res.json({ success: false, error: 'All recipients have unsubscribed' });
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
});

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
    await fs.writeFile('unsubscribed.json', JSON.stringify(filtered, null, 2));
    
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