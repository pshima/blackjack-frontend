import React, { useState } from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import type { Card as CardType } from '../types/blackjack';

const HomePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  // Sample cards for demonstration
  const sampleCards: CardType[] = [
    { suit: 'hearts', rank: 'A', value: 11 },
    { suit: 'spades', rank: 'K', value: 10 },
    { suit: 'diamonds', rank: '7', value: 7 },
  ];

  const handleStartDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleShowError = () => {
    setShowError(!showError);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-casino-felt via-primary-800 to-casino-felt">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-size-[20px_20px]" />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl font-bold text-casino-black mb-4 font-casino">
                Blackjack
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Welcome to your production-ready blackjack frontend
              </p>
              <p className="text-sm text-gray-500">
                Built with React 19, TypeScript, Tailwind CSS, and modern best practices
              </p>
            </div>

            {/* Sample cards display */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Sample Cards
              </h2>
              <div className="flex justify-center space-x-2 mb-4">
                {sampleCards.map((card, index) => (
                  <Card
                    key={`${card.suit}-${card.rank}`}
                    card={card}
                    size="md"
                    className="animate-card-deal"
                    // @ts-expect-error - style prop for animation delay
                    style={{ animationDelay: `${index * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Accessible cards with ARIA labels and keyboard navigation
              </p>
            </div>

            {/* Feature demonstration */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Loading demo */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Loading States</h3>
                <Button 
                  onClick={handleStartDemo}
                  loading={isLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Loading...' : 'Demo Loading'}
                </Button>
                {isLoading && (
                  <div className="mt-4">
                    <LoadingSpinner text="Starting game..." />
                  </div>
                )}
              </div>

              {/* Error demo */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Error Handling</h3>
                <Button 
                  onClick={handleShowError}
                  variant="danger"
                  className="w-full"
                >
                  {showError ? 'Hide Error' : 'Demo Error'}
                </Button>
                {showError && (
                  <div className="mt-4">
                    <ErrorMessage
                      error="Sample error message for demonstration"
                      retry={() => setShowError(false)}
                      variant="inline"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Feature list */}
            <div className="text-left max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                🚀 Production-Ready Features
              </h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>TypeScript domain types</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Enhanced API service</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Component architecture</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Error boundaries</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Zustand state management</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Casino-themed design</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Accessible components</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Performance optimized</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="font-semibold">
              Start Playing
            </Button>
            <Button variant="secondary" size="lg">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;