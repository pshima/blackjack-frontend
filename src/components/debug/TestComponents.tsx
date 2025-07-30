import React from 'react';

export const BlackjackTestComponent: React.FC = () => {
  console.log('BlackjackTestComponent rendering');
  
  return (
    <div className="text-center py-8">
      <h1 className="text-4xl font-bold text-white mb-4">🃏 Blackjack Test</h1>
      <div className="bg-primary-800 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-primary-200 mb-4">✅ Basic component loaded successfully</p>
        <p className="text-primary-300 text-sm">
          Time: {new Date().toLocaleTimeString()}
        </p>
        <p className="text-primary-300 text-sm mt-2">
          This is a test component to verify navigation works.
        </p>
      </div>
    </div>
  );
};

export const ApiTestTestComponent: React.FC = () => {
  console.log('ApiTestTestComponent rendering');
  
  return (
    <div className="text-center py-8">
      <h1 className="text-4xl font-bold text-white mb-4">🔌 API Test</h1>
      <div className="bg-primary-800 rounded-lg p-6 max-w-md mx-auto">
        <p className="text-primary-200 mb-4">✅ Basic component loaded successfully</p>
        <p className="text-primary-300 text-sm">
          Time: {new Date().toLocaleTimeString()}
        </p>
        <p className="text-primary-300 text-sm mt-2">
          This is a test component to verify navigation works.
        </p>
      </div>
    </div>
  );
};

export const HomeTestComponent: React.FC = () => {
  console.log('HomeTestComponent rendering');
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">🎰 Blackjack Casino Development</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Production Pages */}
        <div className="bg-primary-800 rounded-lg p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-bold text-green-400 mb-4">🎮 Production Pages</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <span className="text-green-400">🃏</span>
              <div>
                <p className="text-white font-medium">Blackjack Game</p>
                <p className="text-primary-300 text-sm">Real game implementation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-blue-400">🔌</span>
              <div>
                <p className="text-white font-medium">API Test</p>
                <p className="text-primary-300 text-sm">Basic API connectivity testing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug/Development Pages */}
        <div className="bg-primary-800 rounded-lg p-6 border-l-4 border-yellow-500">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">🧪 Development Tools</h2>
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <span className="text-yellow-400">🧪</span>
              <div>
                <p className="text-white font-medium">Blackjack Test</p>
                <p className="text-primary-300 text-sm">Complete workflow simulator</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-purple-400">🛠️</span>
              <div>
                <p className="text-white font-medium">API Tools</p>
                <p className="text-primary-300 text-sm">Advanced API debugging suite</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-3">📊 System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-green-400 font-bold">✅ Navigation</div>
            <div className="text-primary-300">Working</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-bold">✅ Error Boundaries</div>
            <div className="text-primary-300">Active</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-bold">🚧 Game Logic</div>
            <div className="text-primary-300">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-400 font-bold">🚧 API Integration</div>
            <div className="text-primary-300">Testing</div>
          </div>
        </div>
        <p className="text-primary-300 text-xs mt-4 text-center">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};