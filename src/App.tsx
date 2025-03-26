import { useState, useEffect } from 'react'
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

// Function to test if an API endpoint is reachable with timeout
async function testApiConnection(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout for initial load

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

function App() {
  const [joke, setJoke] = useState<string>('');
  const [currentJokeIndex, setCurrentJokeIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [effectiveApiUrl, setEffectiveApiUrl] = useState<string>(apiBaseUrl);
  const [isCheckingApi, setIsCheckingApi] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<string>('');
  
  // Function to copy text to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setCopySuccess('Failed to copy');
    }
  };

  // Test API connection on initial load
  useEffect(() => {
    async function checkApiConnectivity() {
      setIsCheckingApi(true);
      try {
        // First try the configured URL
        if (apiBaseUrl) {
          console.log('Trying configured API URL:', apiBaseUrl);
          if (await testApiConnection(apiBaseUrl)) {
            console.log('Using configured API URL:', apiBaseUrl);
            setEffectiveApiUrl(apiBaseUrl);
            setIsCheckingApi(false);
            return;
          }
        }
        
        // Try Railway production URL as fallback
        const railwayUrl = 'https://dad-jokes-sms-production.up.railway.app';
        console.log('Trying Railway URL:', railwayUrl);
        if (await testApiConnection(railwayUrl)) {
          console.log('Using Railway URL:', railwayUrl);
          setEffectiveApiUrl(railwayUrl);
          setIsCheckingApi(false);
          return;
        }
        
        // Fall back to localhost for development
        if (import.meta.env.MODE === 'development') {
          const localUrl = 'http://localhost:3001';
          console.log('Trying localhost URL:', localUrl);
          if (await testApiConnection(localUrl)) {
            console.log('Using localhost URL:', localUrl);
            setEffectiveApiUrl(localUrl);
            setIsCheckingApi(false);
            return;
          }
        }
        
        // No working API found, will use fallback jokes
        console.warn('No working API found, using client-side jokes only');
        setEffectiveApiUrl('');
      } catch (error) {
        console.error('Error checking API connectivity:', error);
        setEffectiveApiUrl('');
      } finally {
        setIsCheckingApi(false);
      }
    }
    
    checkApiConnectivity();
  }, []);

  // Load initial joke after API check is complete
  useEffect(() => {
    if (!isCheckingApi) {
      getRandomJoke();
    }
  }, [isCheckingApi]);

  const getRandomJoke = () => {
    const newIndex = Math.floor(Math.random() * sophisticatedJokes.length);
    setCurrentJokeIndex(newIndex);
    const selectedJoke = sophisticatedJokes[newIndex];
    setJoke(`${selectedJoke.question}\n${selectedJoke.punchline}`);
  };

  const generateAIJoke = async () => {
    // Don't proceed if we're still checking API availability
    if (isCheckingApi) {
      console.log('Still checking API availability, please wait...');
      return;
    }

    setLoading(true);
    setError(null);
    
    // If no API is available, just show a random joke
    if (!effectiveApiUrl) {
      console.log('No API URL available, using local jokes');
      getRandomJoke();
      setLoading(false);
      return;
    }
    
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      console.log('Environment:', import.meta.env.MODE);
      console.log('Using API URL:', effectiveApiUrl);
      
      // Add timestamp to prevent caching and ensure unique jokes
      const timestamp = Date.now();
      const apiUrl = `${effectiveApiUrl}/api/generate-joke?t=${timestamp}`;
      console.log('Full API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.joke) {
        setCurrentJokeIndex(-1); // Mark as AI joke
        setJoke(`${data.joke.setup}\n${data.joke.punchline}`);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error('Error fetching joke:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timed out. Using a random joke instead!');
        getRandomJoke(); // Show a random joke on timeout
      } else {
        setError(handleApiError(error));
        getRandomJoke(); // Show a random joke on error
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="content">
        <h1>Dad Jokes</h1>
        <p>Generate dad jokes with AI!</p>
        
        <div className="joke-section">
          <div className="joke-container">
            {isCheckingApi ? (
              <p className="loading-text">Loading...</p>
            ) : joke ? (
              <>
                <div className="joke-content">
                  {joke.split('\n').map((line, index) => (
                    <p key={index} className={index === 0 ? "joke-setup" : "joke-punchline"}>
                      {line}
                    </p>
                  ))}
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(joke)}
                    title="Copy joke to clipboard"
                  >
                    📋 Copy Joke
                  </button>
                  {copySuccess && <span className="copy-feedback">{copySuccess}</span>}
                </div>
                <p className="joke-source">
                  {currentJokeIndex === -1 ? 
                    "🤖 AI-Generated Joke" : 
                    "📚 Pre-stored Joke"}
                </p>
                {loading && <p className="loading-text">Loading new joke...</p>}
              </>
            ) : (
              <p className="joke-text">Click the button to generate a joke!</p>
            )}
            {error && <p className="error-text">{error}</p>}
          </div>
          
          <button 
            onClick={generateAIJoke} 
            disabled={loading || isCheckingApi}
            className={loading ? 'loading' : ''}
          >
            {loading ? 'Generating...' : 'Next Pun'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App
