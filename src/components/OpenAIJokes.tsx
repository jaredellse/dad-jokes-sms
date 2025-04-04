import React, { useState, useEffect } from 'react';

interface Joke {
  setup: string;
  punchline: string;
}

interface JokeResponse {
  success: boolean;
  joke: Joke;
}

const CATEGORIES = [
  // Food and Drinks
  'food',
  
  // Animals and Nature
  'animals',
  
  // Technology
  'tech',
  
  // Music and Arts
  'music',
  
  // Weather
  'weather',
  
  // Sports
  'sports',
  
  // Science and Education
  'science',
  'math',
  
  // Space
  'space',
  
  // Time
  'time',
  
  // Work and Business
  'work',
  
  // Education
  'school',
  
  // Family
  'family',
  
  // Holidays and Events
  'holiday',
  
  // Transportation
  'transportation'
] as const;

type Category = typeof CATEGORIES[number];

export default function OpenAIJokes() {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [usedCategories, setUsedCategories] = useState<Category[]>([]);

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

  const getNextCategory = (): Category => {
    // Get unused categories first
    const unusedCategories = CATEGORIES.filter(cat => !usedCategories.includes(cat));
    
    // If all categories used, reset the list
    if (unusedCategories.length === 0) {
      setUsedCategories([]);
      return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    }
    
    // Pick a random unused category
    return unusedCategories[Math.floor(Math.random() * unusedCategories.length)];
  };

  const fetchJoke = async (): Promise<Joke> => {
    const category = getNextCategory();
    const response = await fetch(`${API_BASE_URL}/api/generate-joke?category=${encodeURIComponent(category)}&temperature=${encodeURIComponent(Math.random() * 0.4 + 0.7)}&exclude_recent=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    const jokeResponse = await checkResponseAndParseJson(response) as JokeResponse;
    
    // Add the used category to our list
    setUsedCategories(prev => [...prev, category]);
    
    return jokeResponse.joke;
  };

  const isJokeUnique = (joke: Joke, existingJokes: Joke[]): boolean => {
    // Make comparison more fuzzy to catch similar jokes, but less strict
    const normalizeText = (text: string) => 
      text.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    const jokeSetup = normalizeText(joke.setup);
    const jokePunchline = normalizeText(joke.punchline);
    
    return !existingJokes.some(existing => {
      const existingSetup = normalizeText(existing.setup);
      const existingPunchline = normalizeText(existing.punchline);
      
      // Only consider exact matches or very high overlap
      const setupMatch = jokeSetup === existingSetup;
      const punchlineMatch = jokePunchline === existingPunchline;
      
      // Calculate similarity percentage for partial matches
      const calculateSimilarity = (str1: string, str2: string) => {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0) return 1.0;
        return (longer.length - (longer.length - shorter.length)) / longer.length;
      };

      // Check for high similarity (90% or more) in both setup and punchline
      const setupSimilarity = calculateSimilarity(jokeSetup, existingSetup);
      const punchlineSimilarity = calculateSimilarity(jokePunchline, existingPunchline);
      
      return (setupMatch && punchlineMatch) || 
             (setupSimilarity > 0.9 && punchlineSimilarity > 0.9);
    });
  };

  // Add a cache of recently seen jokes to prevent repeats across sessions
  const [recentJokesCache, setRecentJokesCache] = useState<Set<string>>(() => {
    const cached = localStorage.getItem('recentJokes');
    return cached ? new Set(JSON.parse(cached)) : new Set<string>();
  });

  // Update cache whenever we get new jokes
  useEffect(() => {
    if (jokes.length > 0) {
      const jokeKeys = jokes.map(joke => `${joke.setup}:${joke.punchline}`);
      const newCache = new Set([...recentJokesCache, ...jokeKeys]);
      // Keep only the most recent 50 jokes in cache
      const cacheArray = Array.from(newCache);
      if (cacheArray.length > 50) {
        cacheArray.splice(0, cacheArray.length - 50);
      }
      const finalCache = new Set(cacheArray);
      setRecentJokesCache(finalCache);
      localStorage.setItem('recentJokes', JSON.stringify(Array.from(finalCache)));
    }
  }, [jokes]);

  const generateJokes = async () => {
    setIsLoading(true);
    setError(null);
    setJokes([]);
    setUsedCategories([]); // Reset categories when generating new batch
    
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
      const maxAttempts = 25; // Increased max attempts to give more chances
      let attempts = 0;

      while (uniqueJokes.length < 5 && attempts < maxAttempts) {
        const joke = await fetchJoke();
        const jokeKey = `${joke.setup}:${joke.punchline}`;
        
        // Check if joke is unique both in current batch and recent cache
        if (isJokeUnique(joke, uniqueJokes) && !recentJokesCache.has(jokeKey)) {
          uniqueJokes.push(joke);
        }
        attempts++;
        
        // Add a small delay between attempts to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
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