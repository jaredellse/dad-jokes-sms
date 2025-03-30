import React, { useState, useEffect } from 'react';

interface Joke {
  setup: string;
  punchline: string;
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
      // Make a single request for multiple jokes
      const response = await fetch(`${API_BASE_URL}/api/jokes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          count: 5
        })
      });

      console.log('Waiting for jokes...');
      const jokes = await checkResponseAndParseJson(response);
      console.log('Received jokes:', jokes);
      
      if (!Array.isArray(jokes) || jokes.some(joke => !joke.setup || !joke.punchline)) {
        console.error('Invalid joke format:', jokes);
        throw new Error('Invalid joke format received from server');
      }
      setJokes(jokes);
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