import React from 'react';
import { Truck, Bell, User, Settings } from 'lucide-react';

const Header = () => {
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);

  return (
    <>
      <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold text-white">FleetTracker</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowDiagnostics(true)}
                className="relative p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-200"
                title="Диагностика системы"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button className="relative p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-200">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Diagnostic Panel */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50">
          <DiagnosticPanel
            isOpen={showDiagnostics}
            onClose={() => setShowDiagnostics(false)}
          />
        </div>
      )}
    </>
  );
};

export default Header;