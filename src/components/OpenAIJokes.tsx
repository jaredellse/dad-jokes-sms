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
  'food', 'cooking', 'restaurants', 'baking', 'coffee', 'pizza', 'desserts', 'vegetables',
  
  // Animals and Nature
  'animals', 'dogs', 'cats', 'birds', 'fish', 'wildlife', 'garden', 'plants', 'ocean',
  
  // Technology
  'tech', 'computers', 'phones', 'internet', 'programming', 'robots', 'gadgets', 'social-media',
  
  // Music and Arts
  'music', 'instruments', 'bands', 'singing', 'dancing', 'painting', 'theater', 'movies',
  
  // Weather and Nature
  'weather', 'seasons', 'rain', 'snow', 'sun', 'clouds', 'storms', 'rainbows',
  
  // Sports and Activities
  'sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'golf', 'swimming',
  
  // Jobs and Professions
  'doctors', 'teachers', 'chefs', 'artists', 'scientists', 'lawyers', 'pilots', 'firefighters',
  
  // Places
  'beach', 'mountains', 'city', 'farm', 'park', 'school', 'office', 'library', 'zoo',
  
  // Transportation
  'cars', 'bikes', 'trains', 'planes', 'boats', 'buses', 'rockets', 'submarines',
  
  // Science
  'space', 'chemistry', 'physics', 'biology', 'astronomy', 'dinosaurs', 'experiments',
  
  // Everyday Objects
  'furniture', 'tools', 'toys', 'books', 'clothes', 'shoes', 'hats', 'glasses',
  
  // Holidays and Events
  'holidays', 'birthday', 'halloween', 'christmas', 'vacation', 'parties', 'camping',
  
  // Fantasy and Adventure
  'magic', 'dragons', 'pirates', 'superheroes', 'aliens', 'monsters', 'wizards',
  
  // Time
  'morning', 'night', 'time-travel', 'history', 'future', 'calendar', 'clocks'
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
    const response = await fetch(`${API_BASE_URL}/api/generate-joke`, {
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
    return !existingJokes.some(
      existing => existing.setup === joke.setup || existing.punchline === joke.punchline
    );
  };

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