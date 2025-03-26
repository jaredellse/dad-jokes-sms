import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface Joke {
  id: string;
  setup: string;
  punchline: string;
}

interface IcanhazdadjokeResponse {
  id: string;
  joke: string;
  status: number;
}

async function fetchJokes(count: number): Promise<Joke[]> {
  const jokes: Joke[] = [];
  const seen = new Set<string>();

  while (jokes.length < count) {
    try {
      const response = await axios.get('https://icanhazdadjoke.com/', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Dad Jokes App (https://github.com/yourusername/dad-jokes)'
        }
      });

      const data = response.data as IcanhazdadjokeResponse;
      const joke = data.joke;

      if (!seen.has(joke)) {
        seen.add(joke);
        const [setup, punchline] = splitJoke(joke);
        jokes.push({
          id: data.id,
          setup,
          punchline
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching joke:', error.message);
      } else {
        console.error('An unknown error occurred while fetching jokes');
      }
      // Continue trying to fetch more jokes
      continue;
    }
  }

  return jokes;
}

function splitJoke(joke: string): [string, string] {
  // Split on common joke delimiters
  const delimiters = ['? ', '! ', '. ', '... ', ': '];
  for (const delimiter of delimiters) {
    const parts = joke.split(delimiter);
    if (parts.length === 2) {
      return [parts[0] + (delimiter.trim() || '?'), parts[1]];
    }
  }
  
  // If no delimiter found, try to split at a reasonable point
  const words = joke.split(' ');
  const midpoint = Math.floor(words.length / 2);
  return [
    words.slice(0, midpoint).join(' ') + '?',
    words.slice(midpoint).join(' ')
  ];
}

async function main() {
  try {
    const jokes = await fetchJokes(500);
    await fs.writeFile(
      path.join(process.cwd(), 'scripts', 'temp_jokes.json'),
      JSON.stringify(jokes, null, 2)
    );
    console.log(`Successfully fetched and saved ${jokes.length} jokes`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in main:', error.message);
    } else {
      console.error('An unknown error occurred in main');
    }
    process.exit(1);
  }
}

main(); 