import { useState, useEffect } from 'react'
import { SmsSender } from './components/SmsSender'
import './App.css'

// Family-friendly dad jokes array
const sophisticatedJokes = [
  {
    question: "Why don't eggs tell jokes?",
    punchline: "They'd crack up!"
  },
  {
    question: "What did the grape say when it got stepped on?",
    punchline: "Nothing, it just let out a little wine!"
  },
  {
    question: "Why did the scarecrow win an award?",
    punchline: "Because he was outstanding in his field!"
  },
  {
    question: "What do you call a bear with no teeth?",
    punchline: "A gummy bear!"
  },
  {
    question: "Why did the math book look sad?",
    punchline: "Because it had too many problems!"
  },
  {
    question: "What did the buffalo say to his son when he left for college?",
    punchline: "Bison!"
  },
  {
    question: "Why did the cookie go to the doctor?",
    punchline: "Because it was feeling crumbly!"
  },
  {
    question: "What do you call a fake noodle?",
    punchline: "An impasta!"
  },
  {
    question: "Why don't oysters donate to charity?",
    punchline: "They're shellfish!"
  },
  {
    question: "Why did the tomato turn red?",
    punchline: "Because it saw the salad dressing!"
  },
  {
    question: "What did the clock do when it was hungry?",
    punchline: "It went back four seconds!"
  },
  {
    question: "Why did the bicycle fall over?",
    punchline: "It was two-tired!"
  },
  {
    question: "Why did the golfer bring two pairs of pants?",
    punchline: "In case he got a hole in one!"
  },
  {
    question: "What did the tree say to the wind?",
    punchline: "Leaf me alone!"
  },
  {
    question: "Why did the banana go to the doctor?",
    punchline: "Because it wasn't peeling well!"
  },
  {
    question: "What do you call a bear with no teeth?",
    punchline: "A gummy bear!"
  },
  {
    question: "Why did the pencil go to the doctor?",
    punchline: "Because it was feeling a bit dull!"
  },
  {
    question: "What did the cloud say to the rain?",
    punchline: "You're making me misty!"
  },
  {
    question: "Why did the music note go to the doctor?",
    punchline: "Because it had a flat!"
  },
  {
    question: "What did the flower say to the bee?",
    punchline: "Buzz off!"
  }
];

function App() {
  const [joke, setJoke] = useState<string>('');
  const [currentJokeIndex, setCurrentJokeIndex] = useState<number>(-1);

  const getRandomJoke = () => {
    const newIndex = Math.floor(Math.random() * sophisticatedJokes.length);
    setCurrentJokeIndex(newIndex);
    const selectedJoke = sophisticatedJokes[newIndex];
    setJoke(`${selectedJoke.question} ${selectedJoke.punchline}`);
  };

  useEffect(() => {
    getRandomJoke();
  }, []);

  return (
    <div className="app">
      <h1>Family-Friendly Dad Jokes</h1>
      <div className="joke-container">
        {currentJokeIndex !== -1 && (
          <>
            <p className="joke-question">{sophisticatedJokes[currentJokeIndex].question}</p>
            <p className="joke-punchline">{sophisticatedJokes[currentJokeIndex].punchline}</p>
          </>
        )}
        <button onClick={getRandomJoke}>Get New Joke</button>
      </div>
      {joke && <SmsSender joke={joke} />}
    </div>
  )
}

export default App
