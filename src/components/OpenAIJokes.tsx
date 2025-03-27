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

  const generateJokes = async () => {
    setIsLoading(true);
    setError(null);
    setJokes([]);
    try {
      const response = await fetch('/api/jokes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          count: 5,
          timestamp: Date.now() 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setJokes(data);
      setCurrentJokeIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jokes');
      console.error('Error fetching jokes:', err);
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