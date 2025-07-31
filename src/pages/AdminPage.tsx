import { useState } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { 
  ApiTestTestComponent, 
  HomeTestComponent 
} from '../components/debug/TestComponents';
import { BlackjackWorkflowTest } from '../components/debug/BlackjackWorkflowTest';
import { BlackjackGameDebug } from '../components/debug/BlackjackGameDebug';
import { BlackjackGameFixed } from '../components/game/BlackjackGameFixed';
import { ApiConnectionDebug } from '../components/debug/ApiConnectionDebug';
import { BlackjackGameFixedTest } from '../components/debug/BlackjackGameFixedTest';

export function AdminPage() {
  const [currentPage, setCurrentPage] = useState<'home' | 'blackjack' | 'blackjack-test' | 'blackjack-debug' | 'blackjack-fixed-test' | 'api-test' | 'api-test-tools'>('home');

  return (
    <div className="min-h-screen bg-linear-to-br from-primary-900 via-primary-800 to-primary-900 p-5">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white mb-2">🔧 Admin Dashboard</h1>
        <p className="text-primary-300">Development and testing tools</p>
      </div>
      
      <nav className="bg-primary-800 text-white p-4 shadow-lg border-b border-primary-600 rounded-lg mb-5">
        <div className="flex flex-wrap gap-2">
          {/* Main Navigation */}
          <button
            onClick={() => setCurrentPage('home')}
            className={`px-4 py-2 rounded transition-all ${
              currentPage === 'home' ? 'bg-primary-600 shadow-md' : 'hover:bg-primary-700'
            }`}
          >
            🏠 Home
          </button>
          
          {/* Game Pages */}
          <div className="flex gap-1 bg-primary-900 rounded-sm px-1 py-1">
            <button
              onClick={() => setCurrentPage('blackjack')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'blackjack' ? 'bg-green-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              🃏 Blackjack Game
            </button>
            <button
              onClick={() => setCurrentPage('blackjack-test')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'blackjack-test' ? 'bg-yellow-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              🧪 Blackjack Test
            </button>
            <button
              onClick={() => setCurrentPage('blackjack-debug')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'blackjack-debug' ? 'bg-orange-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              🔧 Debug Fix
            </button>
            <button
              onClick={() => setCurrentPage('blackjack-fixed-test')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'blackjack-fixed-test' ? 'bg-pink-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              ✅ Fixed Test
            </button>
          </div>
          
          {/* API Pages */}
          <div className="flex gap-1 bg-primary-900 rounded-sm px-1 py-1">
            <button
              onClick={() => setCurrentPage('api-test')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'api-test' ? 'bg-blue-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              🔌 API Test
            </button>
            <button
              onClick={() => setCurrentPage('api-test-tools')}
              className={`px-3 py-1 rounded text-sm transition-all ${
                currentPage === 'api-test-tools' ? 'bg-purple-600 shadow-md' : 'hover:bg-primary-600'
              }`}
            >
              🛠️ API Tools
            </button>
          </div>
          
          {/* Debug indicator */}
          <div className="ml-auto flex items-center">
            <span className="text-xs text-primary-300 bg-primary-900 px-2 py-1 rounded-sm">
              🚧 Debug Mode
            </span>
          </div>
        </div>
      </nav>
      
      <div className="text-center text-white">
        <ErrorBoundary componentName="Home Page">
          {currentPage === 'home' && <HomeTestComponent />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="Blackjack Game Fixed">
          {currentPage === 'blackjack' && <BlackjackGameFixed />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="Blackjack Workflow Test">
          {currentPage === 'blackjack-test' && <BlackjackWorkflowTest />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="Blackjack Game Debug">
          {currentPage === 'blackjack-debug' && <BlackjackGameDebug />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="API Test Page">
          {currentPage === 'api-test' && <ApiTestTestComponent />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="API Test Tools">
          {currentPage === 'api-test-tools' && <ApiConnectionDebug />}
        </ErrorBoundary>
        
        <ErrorBoundary componentName="BlackjackGameFixed Test">
          {currentPage === 'blackjack-fixed-test' && <BlackjackGameFixedTest />}
        </ErrorBoundary>
      </div>
    </div>
  );
}