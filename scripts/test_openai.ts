import OpenAI from 'openai';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Joke {
  id: number;
  setup: string;
  punchline: string;
}

async function generateJokes(count: number = 10): Promise<Joke[]> {
  const jokes: Joke[] = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a dad joke generator. Generate a dad joke with a setup and punchline. The joke should be clean, family-friendly, and genuinely funny. Format the response as JSON with 'setup' and 'punchline' fields."
          },
          {
            role: "user",
            content: "Generate a dad joke"
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const response = completion.choices[0].message.content;
      if (response) {
        try {
          const jokeData = JSON.parse(response);
          jokes.push({
            id: jokes.length + 1,
            setup: jokeData.setup,
            punchline: jokeData.punchline
          });
        } catch (e) {
          console.error('Failed to parse joke JSON:', e);
        }
      }
    } catch (error) {
      console.error('Error generating joke:', error);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return jokes;
}

async function main() {
  try {
    console.log('Generating jokes using OpenAI...');
    const jokes = await generateJokes(5); // Generate 5 jokes for testing
    
    console.log('\nGenerated Jokes:');
    jokes.forEach((joke, index) => {
      console.log(`\nJoke ${index + 1}:`);
      console.log(`Setup: ${joke.setup}`);
      console.log(`Punchline: ${joke.punchline}`);
    });

    // Save to a temporary file for review
    await fs.writeFile(
      path.join(__dirname, 'temp_openai_jokes.json'),
      JSON.stringify(jokes, null, 2)
    );
    console.log('\nJokes saved to temp_openai_jokes.json');
  } catch (error) {
    console.error('Error in main:', error);
  }
}

main(); 