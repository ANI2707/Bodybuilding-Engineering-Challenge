// src/app/advice/page.tsx
'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdvicePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: question }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get advice');
      }
      
      const data = await response.json();
      setAnswer(data.response);
    } catch (err) {
      setError('An error occurred while fetching advice. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "What's the best workout for building chest muscle fast?",
    "Give me a high-protein diet plan for muscle growth.",
    "How do I recover faster after an intense leg day?"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Bodybuilding Advice</h1>
        
        <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="mb-4">
              <label htmlFor="question" className="block text-sm font-medium mb-2">
                Ask a question about bodybuilding:
              </label>
              <textarea
                id="question"
                rows={3}
                className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What's the best workout for building chest muscle fast?"
              />
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Getting advice...' : 'Get Advice'}
            </button>
          </form>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-2">Try these example questions:</h3>
            <div className="flex flex-wrap gap-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  className="text-sm bg-gray-700 hover:bg-gray-600 rounded-full px-3 py-1"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          
          {answer && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Expert Advice:</h3>
              <div className="bg-gray-700 p-4 rounded-md whitespace-pre-wrap">
                {answer}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}