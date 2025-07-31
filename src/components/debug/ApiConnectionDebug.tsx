import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { config } from '../../config/environment';
import { cardGameApi } from '../../services/cardgame-api';
import { CorsDebug } from './CorsDebug';

interface ConnectionTest {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  responseTime?: number;
}

export const ApiConnectionDebug: React.FC = () => {
  const [tests, setTests] = useState<ConnectionTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [debugMode, setDebugMode] = useState<'connection' | 'cors'>('connection');

  const addTest = (test: Omit<ConnectionTest, 'status' | 'message'> & { status?: ConnectionTest['status']; message?: string }) => {
    setTests(prev => [...prev, {
      status: 'pending',
      message: 'Testing...',
      ...test
    }]);
  };

  const updateTest = (name: string, updates: Partial<ConnectionTest>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const testConnection = async (name: string, url: string, options?: RequestInit): Promise<void> => {
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        ...options
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        await response.text();
        updateTest(name, {
          status: 'success',
          message: `✅ ${response.status} ${response.statusText} (${responseTime}ms)`,
          responseTime
        });
      } else {
        updateTest(name, {
          status: 'error',
          message: `❌ ${response.status} ${response.statusText} (${responseTime}ms)`,
          responseTime
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      updateTest(name, {
        status: 'error',
        message: `❌ ${String(error)} (${responseTime}ms)`,
        responseTime
      });
    }
  };

  const testCardGameApi = async (name: string, apiMethod: () => Promise<unknown>): Promise<void> => {
    const startTime = Date.now();
    try {
      await apiMethod();
      const responseTime = Date.now() - startTime;
      updateTest(name, {
        status: 'success',
        message: `✅ API call successful (${responseTime}ms)`,
        responseTime
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      updateTest(name, {
        status: 'error',
        message: `❌ ${String(error)} (${responseTime}ms)`,
        responseTime
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    // Test 1: Current API endpoint
    addTest({
      name: 'Current API Config',
      url: config.apiBaseUrl
    });
    await testConnection('Current API Config', config.apiBaseUrl);

    // Test 2: Cardgame API port (likely correct)
    addTest({
      name: 'Cardgame API (8080)',
      url: 'http://localhost:8080'
    });
    await testConnection('Cardgame API (8080)', 'http://localhost:8080');

    // Test 3: Cardgame API hello endpoint
    addTest({
      name: 'Cardgame API Hello',
      url: 'http://localhost:8080/hello'
    });
    await testConnection('Cardgame API Hello', 'http://localhost:8080/hello');

    // Test 4: Test with cardGameApi service
    addTest({
      name: 'CardGameApi.healthCheck()',
      url: 'via service'
    });
    await testCardGameApi('CardGameApi.healthCheck()', () => cardGameApi.healthCheck());

    // Test 5: Alternative ports
    const commonPorts = [3000, 3001, 8000, 8080, 8081];
    for (const port of commonPorts) {
      addTest({
        name: `localhost:${port}`,
        url: `http://localhost:${port}`
      });
      await testConnection(`localhost:${port}`, `http://localhost:${port}`);
    }

    setIsRunning(false);
  };

  const quickFixApi = () => {
    // This would update the config to point to the right endpoint
    console.log('Quick fix: Update API endpoint to http://localhost:8080');
    alert('Quick fix would update API endpoint to http://localhost:8080\n\nThis needs to be implemented in the config.');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🔌 API Connection Debug
      </h1>

      {/* Debug Mode Selector */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setDebugMode('connection')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'connection' ? 'bg-blue-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🔌 Connection Tests
        </button>
        <button
          onClick={() => setDebugMode('cors')}
          className={`px-4 py-2 rounded transition-all ${
            debugMode === 'cors' ? 'bg-red-600 text-white' : 'bg-primary-700 text-primary-200 hover:bg-primary-600'
          }`}
        >
          🌐 CORS Debug
        </button>
      </div>

      {debugMode === 'cors' ? (
        <ErrorBoundary componentName="CORS Debug">
          <CorsDebug />
        </ErrorBoundary>
      ) : (
        <div>

      {/* Current Configuration */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">🔧 Current Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-primary-300">API Base URL:</span>
            <code className="ml-2 text-yellow-400">{config.apiBaseUrl}</code>
          </div>
          <div>
            <span className="text-primary-300">API Timeout:</span>
            <code className="ml-2 text-yellow-400">{config.apiTimeout}ms</code>
          </div>
          <div>
            <span className="text-primary-300">Environment:</span>
            <code className="ml-2 text-yellow-400">{config.nodeEnv}</code>
          </div>
          <div>
            <span className="text-primary-300">Expected Backend:</span>
            <code className="ml-2 text-yellow-400">http://localhost:8080</code>
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <div className="flex gap-4 items-center">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded font-bold transition-all ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? '🔄 Testing...' : '🧪 Run All Connection Tests'}
          </button>
          
          <button
            onClick={quickFixApi}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-sm transition-all"
          >
            🚀 Quick Fix API Config
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
        <h2 className="text-xl font-semibold text-white mb-4">🧪 Connection Tests</h2>
        
        {tests.length === 0 ? (
          <div className="text-primary-300 text-center py-8">
            Click "Run All Connection Tests" to start debugging
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center justify-between bg-primary-900 p-4 rounded-sm border">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${
                      test.status === 'success' ? 'text-green-400' :
                      test.status === 'error' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {test.status === 'success' ? '✅' :
                       test.status === 'error' ? '❌' :
                       '🔄'}
                    </span>
                    <span className="text-white font-medium">{test.name}</span>
                  </div>
                  <div className="text-primary-300 text-sm mt-1">
                    {test.url !== 'via service' && (
                      <code className="text-xs">{test.url}</code>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${
                    test.status === 'success' ? 'text-green-400' :
                    test.status === 'error' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {test.message}
                  </div>
                  {test.responseTime && (
                    <div className="text-xs text-primary-400">
                      {test.responseTime}ms
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Diagnosis */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-3">🔍 Quick Diagnosis</h3>
        <div className="text-primary-300 text-sm space-y-2">
          <p><strong>Most Likely Issue:</strong> The cardgame-api backend server is not running</p>
          <p><strong>Expected Error:</strong> "Failed to fetch" when trying to reach http://localhost:8080</p>
          <p><strong>Solution:</strong> Start the cardgame-api backend server on port 8080</p>
          <p><strong>Quick Test:</strong> Check if http://localhost:8080/hello responds with a greeting</p>
          <p><strong>API Config:</strong> ✅ Already correctly set to localhost:8080 in .env file</p>
        </div>
      </div>
        </div>
      )}
    </div>
  );
};