import React, { useState } from 'react';

export const CorsDebug: React.FC = () => {
  const [corsTest, setCorsTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'cors-error' | 'other-error';
    message: string;
    details?: string;
  }>({ status: 'idle', message: 'Click test to check CORS' });

  const testCors = async () => {
    setCorsTest({ status: 'testing', message: 'Testing CORS...' });
    
    try {
      const response = await fetch('http://localhost:8080/hello', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.text();
        setCorsTest({ 
          status: 'success', 
          message: '✅ CORS working! Backend response received',
          details: data
        });
      } else {
        setCorsTest({ 
          status: 'other-error', 
          message: `❌ Non-CORS error: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      const errorMessage = String(error);
      if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control')) {
        setCorsTest({ 
          status: 'cors-error', 
          message: '❌ CORS Error: Backend blocking cross-origin requests',
          details: errorMessage
        });
      } else {
        setCorsTest({ 
          status: 'other-error', 
          message: `❌ Network Error: ${errorMessage}` 
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🌐 CORS Debug & Fix
      </h1>

      {/* CORS Test */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">🧪 CORS Connection Test</h2>
        
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={testCors}
            disabled={corsTest.status === 'testing'}
            className={`px-6 py-3 rounded font-bold transition-all ${
              corsTest.status === 'testing' 
                ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {corsTest.status === 'testing' ? '🔄 Testing...' : '🧪 Test CORS to localhost:8080'}
          </button>
        </div>

        <div className={`p-4 rounded border ${
          corsTest.status === 'success' ? 'bg-green-900 border-green-600' :
          corsTest.status === 'cors-error' ? 'bg-red-900 border-red-600' :
          corsTest.status === 'other-error' ? 'bg-yellow-900 border-yellow-600' :
          'bg-primary-900 border-primary-600'
        }`}>
          <div className={`font-medium ${
            corsTest.status === 'success' ? 'text-green-400' :
            corsTest.status === 'cors-error' ? 'text-red-400' :
            corsTest.status === 'other-error' ? 'text-yellow-400' :
            'text-primary-300'
          }`}>
            {corsTest.message}
          </div>
          {corsTest.details && (
            <div className="mt-2 text-sm text-primary-300 font-mono">
              {corsTest.details}
            </div>
          )}
        </div>
      </div>

      {/* CORS Fix Instructions */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">🔧 CORS Fix Instructions</h2>
        
        <div className="space-y-4">
          <div className="bg-primary-900 p-4 rounded border border-primary-700">
            <h3 className="text-green-400 font-semibold mb-2">✅ Frontend (Already Fixed)</h3>
            <p className="text-primary-300 text-sm">
              Frontend is correctly configured to send requests to <code>http://localhost:8080</code>
            </p>
          </div>

          <div className="bg-red-900 p-4 rounded border border-red-600">
            <h3 className="text-red-400 font-semibold mb-2">❌ Backend (Needs CORS Headers)</h3>
            <p className="text-primary-300 text-sm mb-3">
              The cardgame-api backend needs to add CORS headers to allow requests from <code>http://localhost:3001</code>
            </p>
            
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              <div className="mb-2 text-primary-300"># Add these headers to your backend responses:</div>
              <div>Access-Control-Allow-Origin: http://localhost:3001</div>
              <div>Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS</div>
              <div>Access-Control-Allow-Headers: Content-Type, Authorization</div>
              <div>Access-Control-Allow-Credentials: true</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fix Examples */}
      <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
        <h2 className="text-xl font-semibold text-white mb-4">🚀 Quick Fix Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Python/Flask */}
          <div className="bg-primary-900 p-4 rounded border border-primary-700">
            <h3 className="text-blue-400 font-semibold mb-2">🐍 Python/Flask</h3>
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              <div>from flask_cors import CORS</div>
              <div className="mt-1">CORS(app, origins=['http://localhost:3001'])</div>
            </div>
          </div>

          {/* Node.js/Express */}
          <div className="bg-primary-900 p-4 rounded border border-primary-700">
            <h3 className="text-yellow-400 font-semibold mb-2">🟨 Node.js/Express</h3>
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              <div>const cors = require('cors');</div>
              <div className="mt-1">app.use(cors({`{origin: 'http://localhost:3001'}`}));</div>
            </div>
          </div>

          {/* FastAPI */}
          <div className="bg-primary-900 p-4 rounded border border-primary-700">
            <h3 className="text-green-400 font-semibold mb-2">⚡ FastAPI</h3>
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              <div>from fastapi.middleware.cors import CORSMiddleware</div>
              <div className="mt-1">app.add_middleware(CORSMiddleware,</div>
              <div>    allow_origins=['http://localhost:3001'])</div>
            </div>
          </div>

          {/* Manual Headers */}
          <div className="bg-primary-900 p-4 rounded border border-primary-700">
            <h3 className="text-purple-400 font-semibold mb-2">🔧 Manual Headers</h3>
            <div className="bg-black p-3 rounded font-mono text-xs text-green-400 overflow-x-auto">
              <div>response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3001'</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-3">📋 Current Status</h3>
        <div className="text-primary-300 text-sm space-y-2">
          <p>✅ <strong>Frontend:</strong> Correctly configured, sending requests to localhost:8080</p>
          <p>✅ <strong>Backend:</strong> Running and reachable on localhost:8080</p>
          <p>❌ <strong>CORS:</strong> Backend not allowing cross-origin requests from localhost:3001</p>
          <p>🎯 <strong>Solution:</strong> Add CORS headers to cardgame-api backend</p>
        </div>
      </div>
    </div>
  );
};