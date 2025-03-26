import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JOKES_API_URL = 'https://icanhazdadjoke.com/';
const NUM_JOKES = 300;
const BATCH_SIZE = 10; // Reduced batch size
const DELAY_MS = 3000; // 3 second delay between batches
const TEMP_FILE = path.join(__dirname, 'temp_jokes.json');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanJokeText(text) {
  // Remove escaped newlines
  text = text.replace(/\\r\\n/g, ' ');
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');
  // Remove trailing question marks
  text = text.replace(/\?+$/, '');
  return text.trim();
}

async function fetchJoke() {
  try {
    const response = await axios.get(JOKES_API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dad Jokes SMS App (https://github.com/jaredellse/dad-jokes-sms)'
      }
    });

    // Split the joke into setup and punchline
    const jokeText = cleanJokeText(response.data.joke);
    const [setup, ...punchlineParts] = jokeText.split('?');
    const punchline = punchlineParts.join('?').trim();

    // Skip jokes without a punchline
    if (!punchline) {
      return null;
    }

    return {
      id: response.data.id,
      setup: cleanJokeText(setup) + '?',
      punchline: cleanJokeText(punchline)
    };
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('Rate limit hit, waiting 60 seconds...');
      await sleep(60000); // Wait 60 seconds on rate limit
      return fetchJoke(); // Retry after waiting
    }
    console.error('Error fetching joke:', error.message);
    return null;
  }
}

async function fetchBatch() {
  const promises = Array(BATCH_SIZE).fill().map(() => fetchJoke());
  return Promise.all(promises);
}

async function saveJokes(jokes) {
  // Remove duplicates based on setup
  const uniqueJokes = jokes.filter((joke, index, self) =>
    index === self.findIndex((j) => j.setup === joke.setup)
  );

  // Save to temporary file
  fs.writeFileSync(TEMP_FILE, JSON.stringify(uniqueJokes, null, 2));
  
  // Also save to jokes.ts
  const jokesContent = `export const jokes = ${JSON.stringify(uniqueJokes, null, 2)};`;
  const outputPath = path.join(__dirname, '../src/jokes.ts');
  fs.writeFileSync(outputPath, jokesContent);
}

async function main() {
  let jokes = [];
  const seenJokes = new Set();

  // Try to load existing jokes from temp file
  try {
    if (fs.existsSync(TEMP_FILE)) {
      jokes = JSON.parse(fs.readFileSync(TEMP_FILE, 'utf8'));
      jokes.forEach(joke => seenJokes.add(joke.setup));
      console.log(`Loaded ${jokes.length} existing jokes from temp file`);
    }
  } catch (error) {
    console.error('Error loading temp file:', error.message);
  }

  console.log('Starting to fetch jokes...');

  while (jokes.length < NUM_JOKES) {
    const batch = await fetchBatch();
    const newJokes = batch.filter(joke => joke && !seenJokes.has(joke.setup));
    
    jokes.push(...newJokes);
    newJokes.forEach(joke => seenJokes.add(joke.setup));
    
    console.log(`Fetched ${jokes.length}/${NUM_JOKES} unique jokes`);
    
    // Save after each batch
    await saveJokes(jokes);
    
    // Wait before next batch
    await sleep(DELAY_MS);
  }

  // Sort jokes by ID
  jokes.sort((a, b) => a.id.localeCompare(b.id));
  
  // Final save
  await saveJokes(jokes);
  
  // Clean up temp file
  if (fs.existsSync(TEMP_FILE)) {
    fs.unlinkSync(TEMP_FILE);
  }
  
  console.log(`Successfully wrote ${jokes.length} jokes to jokes.ts`);
}

main().catch(console.error); 