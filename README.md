# Dad Jokes App

A simple React app that displays random dad jokes. Built with React, TypeScript, and Vite.

## Features

- Display random dad jokes
- Copy jokes to clipboard
- Clean, modern UI
- No external API dependencies - all jokes are stored locally

## Environment Setup

1. Copy the example environment file:
```bash
cp server/.env.example server/.env
```

2. Update the environment variables in `server/.env`:
   - `PORT`: The port number for the server (default: 3001)
   - `OPENAI_API_KEY`: Your OpenAI API key (required)

Note: Never commit your `.env` file or share your API keys publicly.

## Development

1. Clone the repository:
```bash
git clone https://github.com/your-username/dad-jokes-sms.git
cd dad-jokes-sms
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Building for Production

To create a production build:

```bash
npm run build
```

The build files will be in the `dist` directory.

## Contributing

Feel free to submit issues and enhancement requests!
