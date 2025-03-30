import React, { useState, useEffect } from 'react';

interface Joke {
  setup: string;
  punchline: string;
}

interface JokeResponse {
  success: boolean;
  joke: Joke;
}

export default function OpenAIJokes() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const API_BASE_URL = import.meta.env.DEV 
    ? 'http://localhost:3001'
    : 'https://dad-jokes-sms-api.onrender.com';

  const checkResponseAndParseJson = async (response: Response) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content type:', contentType);
      throw new Error(`Server returned non-JSON response (${contentType}). Please try again later.`);
    }
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Server error response:', text);
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      } catch (e) {
        throw new Error(`Server error ${response.status}: ${text.slice(0, 100)}`);
      }
    }

    return response.json();
  };

  const fetchJoke = async (): Promise<Joke> => {
    const response = await fetch(`${API_BASE_URL}/api/generate-joke`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const jokeResponse = await checkResponseAndParseJson(response) as JokeResponse;
    return jokeResponse.joke;
  };

  const isJokeUnique = (joke: Joke, existingJokes: Joke[]): boolean => {
    return !existingJokes.some(
      existing => existing.setup === joke.setup || existing.punchline === joke.punchline
    );
  };

  const generateJokes = async () => {
    setIsLoading(true);
    setError(null);
    setJokes([]);
    
    // Try the health check endpoint first
    try {
      console.log('Checking server health...');
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
      await checkResponseAndParseJson(healthResponse);
      console.log('Server health check passed');
    } catch (err) {
      console.error('Health check failed:', err);
      setError('Server is not available. Please ensure the server is running.');
      setIsLoading(false);
      return;
    }

    try {
      // Generate unique jokes sequentially
      const uniqueJokes: Joke[] = [];
      const maxAttempts = 10; // Prevent infinite loop if can't get unique jokes
      let attempts = 0;

      while (uniqueJokes.length < 5 && attempts < maxAttempts) {
        const joke = await fetchJoke();
        if (isJokeUnique(joke, uniqueJokes)) {
          uniqueJokes.push(joke);
        }
        attempts++;
      }

      console.log('Received jokes:', uniqueJokes);
      
      if (uniqueJokes.length === 0) {
        throw new Error('Could not generate any unique jokes');
      }

      setJokes(uniqueJokes);
      setCurrentJokeIndex(0);
    } catch (err) {
      console.error('Error fetching jokes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch jokes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateJokes();
  }, []);

  const handleNextJoke = () => {
    if (currentJokeIndex < jokes.length - 1) {
      setCurrentJokeIndex(prev => prev + 1);
    } else {
      generateJokes();
    }
  };

  const copyToClipboard = async (joke: Joke) => {
    try {
      await navigator.clipboard.writeText(`${joke.setup}\n${joke.punchline}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return <div className="loading-text">Loading jokes...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-text">{error}</div>
        <button className="next-pun" onClick={generateJokes}>
          Try Again
        </button>
      </div>
    );
  }

  if (jokes.length === 0) {
    return null;
  }

  const currentJoke = jokes[currentJokeIndex];

  return (
    <div className="content">
      <div className="joke-card">
        <div className="copy-button-container">
          <button 
            className="copy-button"
            onClick={() => copyToClipboard(currentJoke)}
            title={copySuccess ? 'Copied!' : 'Copy to clipboard'}
          >
            {copySuccess ? '✓' : '📋'}
          </button>
        </div>
        <p className="setup">{currentJoke.setup}</p>
        <p className="punchline">{currentJoke.punchline}</p>
      </div>
      <button 
        className="next-pun"
        onClick={handleNextJoke}
        disabled={isLoading}
      >
        Next Pun
      </button>
    </div>
  );
}