import React from 'react'
import { useState, useEffect } from 'react'
import './App.css'
import { jokes } from './jokes'

const App = () => {
  const [currentJoke, setCurrentJoke] = useState<{ setup: string; punchline: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [usedJokeIndices, setUsedJokeIndices] = useState<number[]>([]);

  const generateJoke = () => {
    // If we've used all jokes, reset the used indices
    if (usedJokeIndices.length === jokes.length) {
      setUsedJokeIndices([]);
    }

    // Get available joke indices (ones we haven't used yet)
    const availableIndices = Array.from(Array(jokes.length).keys())
      .filter(index => !usedJokeIndices.includes(index));

    // Select a random joke from available ones
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const randomJoke = jokes[randomIndex];

    // Add this joke's index to used indices
    setUsedJokeIndices(prev => [...prev, randomIndex]);
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
      <div className="header">
        <h1>Dad Jokes</h1>
      </div>
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
