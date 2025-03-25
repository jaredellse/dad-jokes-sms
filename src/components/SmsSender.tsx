import React, { useState } from 'react';

interface SmsSenderProps {
  joke: string;
}

export const SmsSender: React.FC<SmsSenderProps> = ({ joke }) => {
  const [phoneNumbers, setPhoneNumbers] = useState<string>('');
  const [hasConsent, setHasConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const isGitHubPages = window.location.hostname.includes('github.io');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) {
      setStatus('error');
      setErrorMessage('Please provide consent to receive messages');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      console.log('Received joke:', joke);

      // Split the joke into question and punchline
      let question, punchline;
      const questionMarkIndex = joke.indexOf('?');
      
      if (questionMarkIndex === -1) {
        question = joke;
        punchline = null;
      } else {
        question = joke.slice(0, questionMarkIndex + 1);
        punchline = joke.slice(questionMarkIndex + 1).trim();
      }

      console.log('Question part:', question);
      console.log('Punchline part:', punchline);
      
      // If in GitHub Pages environment, show a message instead of making API calls
      if (isGitHubPages) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        setStatus('success');
        
        // Reset form
        setPhoneNumbers('');
        setHasConsent(false);
        return;
      }
      
      // Split phone numbers by comma and trim whitespace
      const numbers = phoneNumbers.split(',').map(num => num.trim());
      
      // Send the question to all numbers
      const questionPromises = numbers.map(number => 
        fetch('/api/send-sms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: number,
            message: question || 'No joke text available',
            isQuestion: true
          }),
        }).then(res => res.json())
      );

      const questionResults = await Promise.all(questionPromises);
      const questionErrors = questionResults.filter(result => !result.success);
      
      if (questionErrors.length > 0) {
        throw new Error('Failed to send question to some numbers');
      }

      // Only send punchline if it exists and isn't empty
      if (punchline && punchline.length > 0) {
        // Wait 3 seconds before sending the punchline
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Send the punchline to all numbers
        const punchlinePromises = numbers.map(number =>
          fetch('/api/send-sms', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: number,
              message: punchline,
              isQuestion: false
            }),
          }).then(res => res.json())
        );

        const punchlineResults = await Promise.all(punchlinePromises);
        const punchlineErrors = punchlineResults.filter(result => !result.success);
        
        if (punchlineErrors.length > 0) {
          throw new Error('Failed to send punchline to some numbers');
        }
      }

      setStatus('success');
      setPhoneNumbers('');
      setHasConsent(false);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send messages');
    }
  };

  return (
    <div className="sms-sender">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            placeholder="Enter phone numbers separated by commas (e.g., +1234567890, +1987654321)"
            required
            pattern="^(\+?[1-9]\d{1,14}(,\s*\+?[1-9]\d{1,14})*)$"
          />
          <small className="input-help">Format: +1234567890, +1987654321</small>
        </div>
        
        <div className="consent-group">
          <label className="consent-label">
            <input
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
            />
            I consent to receive dad jokes via SMS at the phone numbers provided
          </label>
        </div>

        <button type="submit" disabled={status === 'sending' || !hasConsent}>
          {status === 'sending' ? 'Sending joke...' : 'Send Joke via SMS'}
        </button>
      </form>

      {status === 'success' && (
        <p className="success">
          {isGitHubPages 
            ? 'This is a demo mode in GitHub Pages. In the real app, the joke would be sent to the specified numbers.' 
            : 'Joke sent successfully to all numbers!'}
        </p>
      )}

      {status === 'error' && (
        <p className="error">{errorMessage}</p>
      )}
      
      {isGitHubPages && status !== 'success' && (
        <p className="notice">
          Note: This is running on GitHub Pages. SMS functionality is simulated and won't actually send messages.
        </p>
      )}
    </div>
  );
}; 