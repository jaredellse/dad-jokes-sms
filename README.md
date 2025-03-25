# Dad Jokes SMS

A simple service that generates dad jokes and sends them via SMS using Twilio.

## Quick Deploy

### Deploy to Render (Recommended)

For the fastest and most reliable deployment:

1. Create a free account at [render.com](https://render.com)
2. Click this button to deploy directly to Render:
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jaredellse/dad-jokes-sms)
3. Once deployed, your API will be available at:
   - https://dad-jokes-sms-api.onrender.com/api/generate-joke
   - https://dad-jokes-sms-api.onrender.com/api/health
   - https://dad-jokes-sms-api.onrender.com/api/sms-webhook (for Twilio)

4. Add these webhook URLs to your Twilio configuration.

## API Endpoints

- `GET /api/generate-joke` - Generates a random dad joke
- `POST /api/sms-webhook` - Webhook for Twilio SMS (STOP/START commands)
- `GET /api/health` - Health check endpoint

## Development

```
npm install
npm run dev        # Run frontend development server
npm run server:dev # Run backend development server
```

## License

MIT License
