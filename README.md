# Dad Jokes SMS

A web application that sends dad jokes via SMS using Twilio. Features include:
- Family-friendly dad jokes
- Two-part delivery (setup and punchline)
- User consent tracking
- Group messaging support

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid
   ```
4. Start the development server: `npm run dev`
5. Start the backend server: `npm run server`

## Development

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- SMS: Twilio API

## License

MIT
