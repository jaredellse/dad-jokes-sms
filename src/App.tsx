import { useState, useEffect } from 'react'
import './App.css'
import { jokes } from './jokes'

// Get the API base URL from environment variables or use a default
const API_URL = import.meta.env.MODE === 'development' 
  ? 'http://localhost:3001'
  : 'https://dad-jokes-sms.onrender.com';

console.log('Using API URL:', API_URL);

// Family-friendly dad jokes array
const sophisticatedJokes = [
  {
    question: "Why don't eggs tell jokes?",
    punchline: "They'd crack up"
  },
  {
    question: "What did the grape say when it got stepped on?",
    punchline: "Nothing, it just let out a little wine"
  },
  {
    question: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field"
  },
  {
    question: "What do you call a bear with no teeth?",
    punchline: "A gummy bear"
  },
  {
    question: "Why did the math book look sad?",
    punchline: "Because it had too many problems"
  },
  {
    question: "What did the buffalo say to his son when he left for college?",
    punchline: "Bison"
  },
  {
    question: "Why did the cookie go to the doctor?",
    punchline: "Because it was feeling crumbly"
  },
  {
    question: "What do you call a fake noodle?",
    punchline: "An impasta"
  },
  {
    question: "Why don't oysters donate to charity?",
    punchline: "Because they're shellfish"
  },
  {
    question: "Why did the tomato turn red?",
    punchline: "Because it saw the salad dressing"
  },
  {
    question: "What did the clock do when it was hungry?",
    punchline: "It went back four seconds"
  },
  {
    question: "Why did the bicycle fall over?",
    punchline: "It was two-tired"
  },
  {
    question: "Why did the golfer bring two pairs of pants?",
    punchline: "In case he got a hole in one"
  },
  {
    question: "What did the tree say to the wind?",
    punchline: "Just leaf me alone"
  },
  {
    question: "Why did the banana go to the doctor?",
    punchline: "Because it wasn't peeling well"
  },
  {
    question: "What do you call a bear with no teeth?",
    punchline: "A gummy bear"
  },
  {
    question: "Why did the pencil go to the doctor?",
    punchline: "It was feeling rather dull"
  },
  {
    question: "What did the cloud say to the rain?",
    punchline: "You're making me misty"
  },
  {
    question: "Why did the music note go to the doctor?",
    punchline: "Because it had a flat"
  },
  {
    question: "What did the flower say to the bee?",
    punchline: "You can buzz off now"
  }
];

// Add error handling utility
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    return `Server error: ${error.response.data?.error || 'Unknown error'}`;
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received');
    return 'No response from server. Please check your connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error setting up request:', error.message);
    return error.message;
  }
};

// Function to test if an API endpoint is reachable with timeout
async function testApiConnection(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // Reduced timeout for faster initial load

    const response = await fetch(`${url}/api/generate-joke`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-cache',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (err) {
    console.error(`Connection test failed for ${url}:`, err);
    return false;
  }
}

interface JokeResponse {
  success: boolean;
  joke: string;
  isPreStored?: boolean;
  wasError?: boolean;
  error?: string;
  timestamp: number;
}

const App = () => {
  const [currentJoke, setCurrentJoke] = useState<{ setup: string; punchline: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const generateJoke = async () => {
    setLoading(true);
    try {
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
      setCurrentJoke(randomJoke);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyJokeToClipboard = async () => {
    if (!currentJoke) return;
    
    try {
      const jokeText = `${currentJoke.setup}\n${currentJoke.punchline}`;
      await navigator.clipboard.writeText(jokeText);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopySuccess('Failed to copy');
    }
  };

  useEffect(() => {
    generateJoke();
  }, []);

  return (
    <div className="app-container">
      <h1>Dad Jokes</h1>
      <p className="subtitle">Because someone has to keep the puns alive.</p>

      <div className="content">
        {currentJoke ? (
          <>
            <div className="joke-container">
              <p className="setup">{currentJoke.setup}</p>
              <p className="punchline">{currentJoke.punchline.replace(/[!]+$/, '')}</p>
            </div>
            <button 
              onClick={copyJokeToClipboard} 
              className="copy-button"
              title="Copy joke to clipboard"
            >
              📋 Copy
            </button>
            {copySuccess && <div className="copy-success">{copySuccess}</div>}
          </>
        ) : (
          <p className="loading-text">Click the button to see a joke!</p>
        )}
      </div>
      
      <div className="button-container">
        <button 
          onClick={generateJoke} 
          disabled={loading}
          className="next-pun"
        >
          Next Pun
        </button>
      </div>
    </div>
  );
}

export default App
