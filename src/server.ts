import express, { Request, Response } from 'express';
import cors from 'cors';
import { jokes } from './jokes';

const app = express();
app.use(cors());
app.use(express.json());

// API endpoint to get a random joke
app.get('/api/generate-joke', (_, res) => {
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  res.json({ success: true, joke: randomJoke });
});

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 