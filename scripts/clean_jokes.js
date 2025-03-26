import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanSetup(text) {
  // Remove escaped quotes
  text = text.replace(/\\"/g, '"');
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');
  // Remove trailing punctuation except question marks
  text = text.replace(/[.,!]+$/, '');
  // Add question mark if missing and it's a question
  if (text.match(/^(What|Why|How|Where|When|Who|Can|Did|Want|Ever)/i) && !text.endsWith('?')) {
    text += '?';
  }
  // Capitalize first letter
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return text.trim();
}

function cleanPunchline(text) {
  // Remove escaped quotes
  text = text.replace(/\\"/g, '"');
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');
  // Remove trailing punctuation
  text = text.replace(/[.,!?]+$/, '');
  // Capitalize first letter if it's a sentence and not dialogue
  if (text.length > 0 && !text.startsWith('"')) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  return text.trim();
}

function cleanDialogue(text) {
  // Handle dialogue with proper quotes
  if (text.includes('"')) {
    // Split by quotes but keep empty strings to preserve structure
    const parts = text.split('"').filter(Boolean);
    // Clean each part
    const cleanedParts = parts.map(part => part.trim());
    // Join back with quotes
    return cleanedParts.map(part => `"${part}"`).join(' ');
  }
  return text;
}

function isDialogueJoke(setup, punchline) {
  // Check if either part contains dialogue markers
  return (
    setup.includes('"') ||
    punchline.includes('"') ||
    setup.includes('Dad,') ||
    punchline.includes('Dad:') ||
    (setup.includes('?') && setup.includes('How does')) // Common dialogue pattern
  );
}

function cleanJokes(jokes) {
  return jokes.map(joke => {
    let setup = cleanSetup(joke.setup);
    let punchline = cleanPunchline(joke.punchline);

    // Special handling for dialogue jokes
    if (isDialogueJoke(setup, punchline)) {
      // Handle "Dad," prefix in setup
      if (setup.startsWith('Dad,')) {
        setup = `"${setup}"`;
      }

      // Handle "Dad:" prefix in punchline
      if (punchline.startsWith('Dad:')) {
        punchline = `"${punchline.replace('Dad:', '').trim()}"`;
      }

      // If setup has a question mark and punchline doesn't have quotes, it's probably dialogue
      if (setup.includes('?') && !punchline.includes('"')) {
        punchline = `"${punchline}"`;
      }

      // Clean dialogue in both parts if they contain quotes
      if (setup.includes('"')) {
        setup = cleanDialogue(setup);
      }
      if (punchline.includes('"')) {
        punchline = cleanDialogue(punchline);
      }

      // Special case for "How does he smell?" type jokes
      if (setup.includes('How does') && setup.includes('?')) {
        const parts = setup.split('"').filter(Boolean);
        if (parts.length === 2) {
          setup = `"${parts[0]}" "How does he smell?"`;
        }
      }
    }

    return {
      ...joke,
      setup,
      punchline
    };
  });
}

async function main() {
  // Read the current jokes
  const jokesPath = path.join(__dirname, '../src/jokes.ts');
  const jokesContent = fs.readFileSync(jokesPath, 'utf8');
  const jokesMatch = jokesContent.match(/export const jokes = (\[[\s\S]*\]);/);
  
  if (!jokesMatch) {
    console.error('Could not find jokes array in file');
    return;
  }

  const jokes = JSON.parse(jokesMatch[1]);
  console.log(`Loaded ${jokes.length} jokes`);

  // Clean the jokes
  const cleanedJokes = cleanJokes(jokes);
  
  // Write back to file
  const newContent = `export const jokes = ${JSON.stringify(cleanedJokes, null, 2)};`;
  fs.writeFileSync(jokesPath, newContent);
  
  console.log('Successfully cleaned and saved jokes');
}

main().catch(console.error); 