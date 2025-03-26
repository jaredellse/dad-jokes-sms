import { useState, useEffect } from 'react'
import './App.css'
import { jokes } from './jokes'

const App = () => {
  const [currentJoke, setCurrentJoke] = useState<{ setup: string; punchline: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const generateJoke = () => {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    setCurrentJoke(randomJoke);
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
          className="next-pun"
        >
          Next Pun
        </button>
      </div>
    </div>
  );
}

export default App
