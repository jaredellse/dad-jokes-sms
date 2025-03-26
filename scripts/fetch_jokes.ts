import axios from 'axios';
import fs from 'fs';
import path from 'path';

const JOKES_API_URL = 'https://icanhazdadjoke.com/';
const NUM_JOKES = 500;
const DELAY_MS = 1000; // 1 second delay between requests to respect rate limits

interface Joke {
  id: string;
  setup: string;
  punchline: string;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJoke(): Promise<Joke | null> {
  try {
    const response = await axios.get(JOKES_API_URL, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Dad Jokes SMS App (https://github.com/jaredellse/dad-jokes-sms)'
      }
    });

    // Split the joke into setup and punchline
    const jokeText = response.data.joke;
    const [setup, ...punchlineParts] = jokeText.split('?');
    const punchline = punchlineParts.join('?').trim();

    return {
      id: response.data.id,
      setup: setup.trim() + '?',
      punchline: punchline
    };
  } catch (error) {
    console.error('Error fetching joke:', error.message);
    return null;
  }
}

async function main() {
  const jokes: Joke[] = [];
  const seenJokes = new Set<string>();

  console.log('Starting to fetch jokes...');

  while (jokes.length < NUM_JOKES) {
    const joke = await fetchJoke();
    
    if (joke && !seenJokes.has(joke.setup)) {
      jokes.push(joke);
      seenJokes.add(joke.setup);
      console.log(`Fetched ${jokes.length}/${NUM_JOKES} unique jokes`);
    }

    await sleep(DELAY_MS);
  }

  // Sort jokes by ID
  jokes.sort((a, b) => a.id.localeCompare(b.id));

  // Write to jokes.ts file
  const jokesContent = `export const jokes = ${JSON.stringify(jokes, null, 2)};`;
  const outputPath = path.join(__dirname, '../src/jokes.ts');
  
  fs.writeFileSync(outputPath, jokesContent);
  console.log(`Successfully wrote ${jokes.length} jokes to ${outputPath}`);
}

main().catch(console.error); 