import React from 'react';
import OpenAIJokes from './components/OpenAIJokes';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <div className="header">
        <h1>Dad Jokes</h1>
        <p className="subtitle">Because someone has to keep the puns alive.</p>
      </div>
      <OpenAIJokes />
    </div>
  );
}

export default App;
