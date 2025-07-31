import React, { useState } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

// Let's test actual imports at the top level to see if they work
const TestActualImports: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loadedComponents, setLoadedComponents] = useState<{[key: string]: React.ComponentType<unknown>}>({});

  const testComponentImport = async (componentName: string, importPath: string) => {
    try {
      setTestResults(prev => [...prev, `🔄 Testing ${componentName}...`]);
      
      const module = await import(/* @vite-ignore */ importPath);
      const Component = module[componentName];
      
      if (!Component) {
        throw new Error(`${componentName} not found in module exports`);
      }
      
      // Try to instantiate the component
      setLoadedComponents(prev => ({ ...prev, [componentName]: Component }));
      setTestResults(prev => [...prev, `✅ ${componentName}: Successfully imported and verified`]);
      
    } catch (error) {
      setTestResults(prev => [...prev, `❌ ${componentName}: ${String(error)}`]);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    setLoadedComponents({});
    
    // Test the components that BlackjackGame needs
    await testComponentImport('GameTable', '../game/GameTable');
    await testComponentImport('BettingControls', '../game/BettingControls');
    await testComponentImport('BlackjackControls', '../game/BlackjackControls');
    
    // Test the hooks (we can't instantiate these but we can check they exist)
    try {
      const useBlackjackGameModule = await import('../../hooks/useBlackjackGame');
      if (typeof useBlackjackGameModule.useBlackjackGame === 'function') {
        setTestResults(prev => [...prev, `✅ useBlackjackGame: Hook function found`]);
      } else {
        setTestResults(prev => [...prev, `❌ useBlackjackGame: Not a function`]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ useBlackjackGame: ${String(error)}`]);
    }

    try {
      const useBlackjackResultsModule = await import('../../hooks/useBlackjackResults');
      if (typeof useBlackjackResultsModule.useBlackjackResults === 'function') {
        setTestResults(prev => [...prev, `✅ useBlackjackResults: Hook function found`]);
      } else {
        setTestResults(prev => [...prev, `❌ useBlackjackResults: Not a function`]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ useBlackjackResults: ${String(error)}`]);
    }

    // Test config
    try {
      const configModule = await import('../../config/environment');
      if (configModule.config && typeof configModule.config === 'object') {
        setTestResults(prev => [...prev, `✅ config: Configuration object found`]);
      } else {
        setTestResults(prev => [...prev, `❌ config: Not found or not an object`]);
      }
    } catch (error) {
      setTestResults(prev => [...prev, `❌ config: ${String(error)}`]);
    }
  };

  const TestComponentRender: React.FC<{ componentName: string; Component: React.ComponentType<unknown> }> = ({ componentName, Component }) => {
    try {
      // Try to render with minimal props
      if (componentName === 'GameTable') {
        return <Component dealer={null} player={null} />;
      } else if (componentName === 'BettingControls') {
        return <Component balance={1000} currentBet={10} minBet={5} maxBet={100} onBetChange={() => {}} onDeal={() => {}} disabled={false} />;
      } else if (componentName === 'BlackjackControls') {
        return <Component onHit={() => {}} onStand={() => {}} onNewGame={() => {}} canHit={true} canStand={true} isGameOver={false} isLoading={false} />;
      }
      return <div>Component type not handled</div>;
    } catch (error) {
      return <div className="text-red-400">Error rendering: {String(error)}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">
        🧪 Component Import Testing
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">Import Tests</h2>
          
          <button
            onClick={runAllTests}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
          >
            Test All Component Imports
          </button>
          
          <div className="max-h-64 overflow-y-auto space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className={`text-sm font-mono ${
                result.includes('✅') ? 'text-green-400' : 
                result.includes('❌') ? 'text-red-400' : 
                'text-yellow-400'
              }`}>
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Component Rendering Tests */}
        <div className="bg-primary-800 rounded-lg p-6 border border-primary-600">
          <h2 className="text-xl font-semibold text-white mb-4">Component Render Tests</h2>
          
          <div className="space-y-4">
            {Object.entries(loadedComponents).map(([componentName, Component]) => (
              <div key={componentName}>
                <h3 className="text-white font-medium mb-2">{componentName}</h3>
                <ErrorBoundary componentName={`${componentName} Render Test`}>
                  <div className="bg-primary-900 p-3 rounded border">
                    <TestComponentRender componentName={componentName} Component={Component} />
                  </div>
                </ErrorBoundary>
              </div>
            ))}
            
            {Object.keys(loadedComponents).length === 0 && (
              <div className="text-primary-300 text-center py-4">
                Run import tests first to load components
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestActualImports;