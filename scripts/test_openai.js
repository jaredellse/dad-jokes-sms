import OpenAI from 'openai';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prompts = [
  // Food & Cooking
  "Generate a dad joke about food",
  "Generate a dad joke about cooking",
  "Generate a dad joke about restaurants",
  "Generate a dad joke about breakfast",
  "Generate a dad joke about pizza",
  "Generate a dad joke about coffee",
  "Generate a dad joke about sandwiches",
  "Generate a dad joke about desserts",
  "Generate a dad joke about vegetables",
  "Generate a dad joke about fast food",
  
  // Animals & Nature
  "Generate a dad joke about animals",
  "Generate a dad joke about dogs",
  "Generate a dad joke about cats",
  "Generate a dad joke about birds",
  "Generate a dad joke about fish",
  "Generate a dad joke about insects",
  "Generate a dad joke about plants",
  "Generate a dad joke about trees",
  "Generate a dad joke about gardening",
  "Generate a dad joke about the ocean",
  
  // Technology
  "Generate a dad joke about technology",
  "Generate a dad joke about computers",
  "Generate a dad joke about phones",
  "Generate a dad joke about the internet",
  "Generate a dad joke about social media",
  "Generate a dad joke about video games",
  "Generate a dad joke about robots",
  "Generate a dad joke about AI",
  "Generate a dad joke about apps",
  "Generate a dad joke about gadgets",
  
  // Sports & Recreation
  "Generate a dad joke about sports",
  "Generate a dad joke about baseball",
  "Generate a dad joke about football",
  "Generate a dad joke about basketball",
  "Generate a dad joke about soccer",
  "Generate a dad joke about golf",
  "Generate a dad joke about fishing",
  "Generate a dad joke about camping",
  "Generate a dad joke about hiking",
  "Generate a dad joke about swimming",
  
  // Work & Business
  "Generate a dad joke about work",
  "Generate a dad joke about meetings",
  "Generate a dad joke about deadlines",
  "Generate a dad joke about emails",
  "Generate a dad joke about office supplies",
  "Generate a dad joke about commuting",
  "Generate a dad joke about business",
  "Generate a dad joke about sales",
  "Generate a dad joke about customers",
  "Generate a dad joke about coworkers",
  
  // Family & Home
  "Generate a dad joke about family",
  "Generate a dad joke about kids",
  "Generate a dad joke about parenting",
  "Generate a dad joke about marriage",
  "Generate a dad joke about home improvement",
  "Generate a dad joke about cleaning",
  "Generate a dad joke about laundry",
  "Generate a dad joke about yard work",
  "Generate a dad joke about pets",
  "Generate a dad joke about chores",
  
  // Weather & Seasons
  "Generate a dad joke about weather",
  "Generate a dad joke about rain",
  "Generate a dad joke about snow",
  "Generate a dad joke about summer",
  "Generate a dad joke about winter",
  "Generate a dad joke about spring",
  "Generate a dad joke about fall",
  "Generate a dad joke about storms",
  "Generate a dad joke about sunshine",
  "Generate a dad joke about clouds",
  
  // Music & Entertainment
  "Generate a dad joke about music",
  "Generate a dad joke about movies",
  "Generate a dad joke about TV shows",
  "Generate a dad joke about books",
  "Generate a dad joke about concerts",
  "Generate a dad joke about instruments",
  "Generate a dad joke about dancing",
  "Generate a dad joke about singing",
  "Generate a dad joke about radio",
  "Generate a dad joke about podcasts",
  
  // Travel & Transportation
  "Generate a dad joke about travel",
  "Generate a dad joke about airplanes",
  "Generate a dad joke about cars",
  "Generate a dad joke about trains",
  "Generate a dad joke about boats",
  "Generate a dad joke about hotels",
  "Generate a dad joke about vacations",
  "Generate a dad joke about road trips",
  "Generate a dad joke about luggage",
  "Generate a dad joke about maps",
  
  // Education & Learning
  "Generate a dad joke about school",
  "Generate a dad joke about teachers",
  "Generate a dad joke about homework",
  "Generate a dad joke about tests",
  "Generate a dad joke about reading",
  "Generate a dad joke about writing",
  "Generate a dad joke about math",
  "Generate a dad joke about science",
  "Generate a dad joke about history",
  "Generate a dad joke about art",

  // Health & Fitness
  "Generate a dad joke about exercise",
  "Generate a dad joke about gym",
  "Generate a dad joke about running",
  "Generate a dad joke about yoga",
  "Generate a dad joke about diet",
  "Generate a dad joke about sleep",
  "Generate a dad joke about doctors",
  "Generate a dad joke about medicine",
  "Generate a dad joke about vitamins",
  "Generate a dad joke about health",

  // Shopping & Retail
  "Generate a dad joke about shopping",
  "Generate a dad joke about malls",
  "Generate a dad joke about stores",
  "Generate a dad joke about sales",
  "Generate a dad joke about prices",
  "Generate a dad joke about coupons",
  "Generate a dad joke about returns",
  "Generate a dad joke about cashiers",
  "Generate a dad joke about receipts",
  "Generate a dad joke about discounts",

  // Time & Dates
  "Generate a dad joke about time",
  "Generate a dad joke about clocks",
  "Generate a dad joke about calendars",
  "Generate a dad joke about schedules",
  "Generate a dad joke about deadlines",
  "Generate a dad joke about waiting",
  "Generate a dad joke about punctuality",
  "Generate a dad joke about time zones",
  "Generate a dad joke about seasons",
  "Generate a dad joke about holidays",

  // Money & Finance
  "Generate a dad joke about money",
  "Generate a dad joke about banks",
  "Generate a dad joke about savings",
  "Generate a dad joke about investments",
  "Generate a dad joke about bills",
  "Generate a dad joke about taxes",
  "Generate a dad joke about budgets",
  "Generate a dad joke about credit cards",
  "Generate a dad joke about cash",
  "Generate a dad joke about expenses",

  // Communication
  "Generate a dad joke about talking",
  "Generate a dad joke about texting",
  "Generate a dad joke about emails",
  "Generate a dad joke about phones",
  "Generate a dad joke about messages",
  "Generate a dad joke about letters",
  "Generate a dad joke about words",
  "Generate a dad joke about languages",
  "Generate a dad joke about writing",
  "Generate a dad joke about speaking"
];

// Function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function generateJokes(count = 5) {
  const jokes = [];
  const shuffledPrompts = shuffleArray([...prompts]);
  
  for (let i = 0; i < count; i++) {
    try {
      const prompt = shuffledPrompts[i % shuffledPrompts.length];
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a dad joke generator. Generate a dad joke with a setup and punchline. The joke should be clean, family-friendly, and genuinely funny. Format the response as JSON with 'setup' and 'punchline' fields. Make sure each joke is unique and different from the others. The setup must end with a question mark. Do not use exclamation points at the end of sentences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 150,
      });

      const response = completion.choices[0].message.content;
      if (response) {
        try {
          const jokeData = JSON.parse(response);
          // Remove exclamation points and ensure setup ends with question mark
          let setup = jokeData.setup.replace(/!+$/, '');
          if (!setup.endsWith('?')) {
            setup += '?';
          }
          const punchline = jokeData.punchline.replace(/!+$/, '');
          
          jokes.push({
            id: jokes.length + 1,
            setup,
            punchline
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