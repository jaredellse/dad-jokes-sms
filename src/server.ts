/// <reference types="express" />
/// <reference types="cors" />

import express, { Request, Response } from 'express';
import cors from 'cors';
import { jokes } from './jokes';

const app = express();
app.use(cors());

// Categorize jokes based on keywords
const categorizedJokes = new Map<string, typeof jokes>();

// Helper function to categorize a joke
function categorizeJoke(joke: typeof jokes[0]) {
  const text = (joke.setup + ' ' + joke.punchline).toLowerCase();
  
  const categories = {
    'food': ['food', 'eat', 'cook', 'restaurant', 'pizza', 'sandwich', 'kitchen', 'chef', 'bake', 'recipe', 'lunch', 'dinner', 'breakfast'],
    'animals': ['animal', 'dog', 'cat', 'bird', 'fish', 'pet', 'zoo', 'wildlife', 'bear', 'lion', 'tiger'],
    'tech': ['computer', 'phone', 'tech', 'internet', 'web', 'code', 'program', 'software', 'hardware', 'robot'],
    'music': ['music', 'song', 'sing', 'band', 'concert', 'instrument', 'note', 'rhythm', 'melody'],
    'weather': ['weather', 'rain', 'snow', 'sun', 'cloud', 'storm', 'wind', 'temperature'],
    'sports': ['sport', 'game', 'ball', 'team', 'play', 'score', 'win', 'athlete', 'football', 'baseball', 'basketball'],
    'science': ['science', 'scientist', 'lab', 'experiment', 'chemistry', 'physics', 'biology'],
    'math': ['math', 'number', 'count', 'calculate', 'equation', 'geometry'],
    'space': ['space', 'star', 'planet', 'moon', 'sun', 'galaxy', 'astronaut', 'rocket'],
    'time': ['time', 'clock', 'minute', 'hour', 'day', 'night', 'calendar'],
    'work': ['work', 'job', 'office', 'business', 'career', 'meeting', 'boss', 'employee'],
    'school': ['school', 'teacher', 'student', 'class', 'homework', 'study', 'learn', 'education'],
    'family': ['family', 'parent', 'child', 'mom', 'dad', 'brother', 'sister'],
    'holiday': ['holiday', 'vacation', 'christmas', 'halloween', 'birthday', 'celebration'],
    'transportation': ['car', 'bus', 'train', 'plane', 'ship', 'boat', 'drive', 'travel']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      if (!categorizedJokes.has(category)) {
        categorizedJokes.set(category, []);
      }
      categorizedJokes.get(category)!.push(joke);
    }
  }
}

// Categorize all jokes on startup
jokes.forEach(categorizeJoke);

// Add all jokes to a general category
categorizedJokes.set('general', jokes);

// API endpoint to get a random joke
app.get('/api/generate-joke', (req: Request, res: Response) => {
  const category = (req.query.category as string)?.toLowerCase() || 'general';
  const temperature = parseFloat(req.query.temperature as string) || 0.7;
  
  // Get jokes for the requested category, fallback to general if category not found
  const categoryJokes = categorizedJokes.get(category) || categorizedJokes.get('general')!;
  
  // Use temperature to vary randomness (higher temperature = more random selection)
  const randomIndex = Math.floor(Math.random() * categoryJokes.length);
  const joke = categoryJokes[randomIndex];
  
  res.json({ success: true, joke });
});

// Health check endpoint
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 