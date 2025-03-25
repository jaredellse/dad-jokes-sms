import { useState, useEffect } from 'react'
import { SmsSender } from './components/SmsSender'
import './App.css'

// Get the API base URL from environment variables
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

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

function App() {
  const [joke, setJoke] = useState<string>('');
  const [currentJokeIndex, setCurrentJokeIndex] = useState<number>(-1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getRandomJoke = () => {
    const newIndex = Math.floor(Math.random() * sophisticatedJokes.length);
    setCurrentJokeIndex(newIndex);
    const selectedJoke = sophisticatedJokes[newIndex];
    setJoke(`${selectedJoke.question} ${selectedJoke.punchline}`);
  };

  const generateAIJoke = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Determine API base URL
      const apiUrl = `${apiBaseUrl}/api/generate-joke`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.joke) {
        setCurrentJokeIndex(-1);
        const aiJoke: { setup: string, punchline: string } = data.joke;
        setJoke(`${aiJoke.setup} ${aiJoke.punchline}`);
        
        // Update the DOM directly for the joke container
        const jokeElement = document.querySelector('.joke-container');
        if (jokeElement) {
          const questionElement = jokeElement.querySelector('.joke-question');
          const punchlineElement = jokeElement.querySelector('.joke-punchline');
          
          if (questionElement && punchlineElement) {
            questionElement.textContent = aiJoke.setup;
            punchlineElement.textContent = aiJoke.punchline;
          }
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error generating AI joke:', err);
      const errorMessage = handleApiError(err);
      setError(`Failed to generate joke: ${errorMessage}`);
      
      // Fallback to random joke if AI fails
      getRandomJoke();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRandomJoke();
  }, []);

  return (
    <div className="app">
      <h1>Family-Friendly Dad Jokes</h1>
      <div className="joke-container">
        {currentJokeIndex !== -1 ? (
          <>
            <p className="joke-question">{sophisticatedJokes[currentJokeIndex].question}</p>
            <p className="joke-punchline">{sophisticatedJokes[currentJokeIndex].punchline}</p>
          </>
        ) : (
          <>
            <p className="joke-question">Loading joke...</p>
            <p className="joke-punchline"></p>
          </>
        )}
        <div className="buttons">
          <button onClick={getRandomJoke} disabled={loading}>Get Random Joke</button>
          <button onClick={generateAIJoke} disabled={loading}>
            {loading ? 'Generating...' : 'Generate AI Joke'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      {joke && <SmsSender joke={joke} />}
    </div>
  )
}

export default App
