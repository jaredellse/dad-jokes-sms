/// <reference types="express" />
/// <reference types="cors" />

import express, { Request, Response } from 'express';
import cors from 'cors';
import { jokes } from './jokes';

const app = express();
app.use(cors());

// Categorize jokes based on keywords
const categorizedJokes = new Map<string, typeof jokes>();

// Track recently used jokes per category
const recentlyUsedJokes = new Map<string, Set<string>>();

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

// Helper function to get a weighted random index
function getWeightedRandomIndex(length: number, temperature: number): number {
  // Higher temperature = more random
  // Lower temperature = favor earlier indices
  if (temperature >= 1) {
    return Math.floor(Math.random() * length);
  }
  
  // Create weights that favor earlier indices
  const weights = Array.from({length}, (_, i) => Math.pow(1 - (i / length), 1 / temperature));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i;
    }
  }
  return weights.length - 1;
}

// API endpoint to get a random joke
app.get('/api/generate-joke', (req: Request, res: Response) => {
  const category = (req.query.category as string)?.toLowerCase() || 'general';
  const temperature = parseFloat(req.query.temperature as string) || 0.7;
  
  // Get jokes for the requested category, fallback to general if category not found
  const categoryJokes = categorizedJokes.get(category) || categorizedJokes.get('general')!;
  
  // Initialize recently used set for this category if it doesn't exist
  if (!recentlyUsedJokes.has(category)) {
    recentlyUsedJokes.set(category, new Set());
  }
  const recentlyUsed = recentlyUsedJokes.get(category)!;
  
  // Get available jokes (not recently used)
  const availableJokes = categoryJokes.filter(joke => !recentlyUsed.has(joke.id));
  
  // If we've used all jokes in the category, reset the recently used list
  if (availableJokes.length === 0) {
    recentlyUsed.clear();
    availableJokes.push(...categoryJokes);
  }
  
  // Use weighted random selection based on temperature
  const randomIndex = getWeightedRandomIndex(availableJokes.length, temperature);
  const joke = availableJokes[randomIndex];
  
  // Add to recently used
  recentlyUsed.add(joke.id);
  
  // Keep recently used list at a reasonable size
  if (recentlyUsed.size > Math.ceil(categoryJokes.length * 0.75)) {
    const oldestJokes = Array.from(recentlyUsed).slice(0, Math.floor(categoryJokes.length * 0.25));
    oldestJokes.forEach(id => recentlyUsed.delete(id));
  }
  
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