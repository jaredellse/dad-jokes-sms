import { useState, useEffect } from 'react'
import { SmsSender } from './components/SmsSender'
import './App.css'

// Get the API base URL from environment variables
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
console.log('Initially configured API URL:', apiBaseUrl);

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

// Function to test if an API endpoint is reachable
async function testApiConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/generate-joke`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
      cache: 'no-cache',
    });
    return response.ok;
  } catch (err) {
    console.error(`Connection test failed for ${url}:`, err);
    return false;
  }
}

function App() {
  const [joke, setJoke] = useState<string>('');
  const [currentJokeIndex, setCurrentJokeIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveApiUrl, setEffectiveApiUrl] = useState<string>(apiBaseUrl);
  
  // Test API connection on initial load
  useEffect(() => {
    async function checkApiConnectivity() {
      // First try the configured URL
      if (apiBaseUrl && await testApiConnection(apiBaseUrl)) {
        console.log('Using configured API URL:', apiBaseUrl);
        setEffectiveApiUrl(apiBaseUrl);
        return;
      }
      
      // Try Railway production URL as fallback
      const railwayUrl = 'https://dad-jokes-sms-production.up.railway.app';
      if (await testApiConnection(railwayUrl)) {
        console.log('Using Railway URL:', railwayUrl);
        setEffectiveApiUrl(railwayUrl);
        return;
      }
      
      // Fall back to localhost for development
      const localUrl = 'http://localhost:3001';
      if (await testApiConnection(localUrl)) {
        console.log('Using localhost URL:', localUrl);
        setEffectiveApiUrl(localUrl);
        return;
      }
      
      // No working API found, will use fallback jokes
      console.warn('No working API found, using client-side jokes only');
      setEffectiveApiUrl('');
    }
    
    checkApiConnectivity();
  }, []);

  const getRandomJoke = () => {
    const newIndex = Math.floor(Math.random() * sophisticatedJokes.length);
    setCurrentJokeIndex(newIndex);
    const selectedJoke = sophisticatedJokes[newIndex];
    setJoke(`${selectedJoke.question} ${selectedJoke.punchline}`);
  };

  const generateAIJoke = async () => {
    setLoading(true);
    setError(null);
    
    // Show a random joke immediately
    getRandomJoke();
    
    // If no API is available, just keep the random joke
    if (!effectiveApiUrl) {
      console.log('No API URL available, using local jokes');
      setLoading(false);
      return;
    }
    
    try {
      // Show debug information
      console.log('Environment:', import.meta.env.MODE);
      console.log('Using API URL:', effectiveApiUrl);
      
      // Determine API base URL
      const apiUrl = `${effectiveApiUrl}/api/generate-joke`;
      console.log('Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.joke) {
        setJoke(`${data.joke.setup} ${data.joke.punchline}`);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching joke:', error);
      setError(handleApiError(error));
      // Keep the random joke displayed if there's an error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRandomJoke();
  }, []);

  return (
    <div className="app-container">
      <div className="content">
        <h1>Dad Jokes SMS</h1>
        <p>Generate and send dad jokes via SMS!</p>
        
        <div className="joke-section">
          <div className="joke-container">
            {joke ? (
              <>
                <p className="joke-text">{joke}</p>
                {loading && <p className="loading-text">Loading new joke...</p>}
              </>
            ) : (
              <p className="joke-text">Click the button to generate a joke!</p>
            )}
            {error && <p className="error-text">{error}</p>}
          </div>
          
          <button 
            onClick={generateAIJoke} 
            disabled={loading}
            className={loading ? 'loading' : ''}
          >
            {loading ? 'Generating...' : 'Generate AI Joke'}
          </button>
        </div>

        <SmsSender 
          joke={joke} 
          apiBaseUrl={effectiveApiUrl} 
          onError={(msg: string) => setError(msg)}
        />
      </div>
    </div>
  );
}

export default App
