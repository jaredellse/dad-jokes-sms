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
    : 'https://dad-jokes-sms-server.onrender.com';

  const generateJokes = async () => {
    setIsLoading(true);
    setError(null);
    setJokes([]);
    
    // Try the test endpoint first
    try {
      const testResponse = await fetch(`${API_BASE_URL}/api/test`);
      if (!testResponse.ok) {
        throw new Error('Server is not responding');
      }
    } catch (err) {
      setError('Server is not available. Please ensure the server is running.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/jokes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          count: 5,
          timestamp: Date.now() 
        })
      });
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch jokes';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.details || `Server error: ${response.status}`;
        } catch (e) {
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setJokes(data);
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