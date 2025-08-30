import React from 'react';
import { Users, MapPin } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'truckers', label: 'Водители', icon: Users },
    { id: 'map', label: 'Карта', icon: MapPin },
  ];

  return (
    <nav className="navigation-panel fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-md border-t border-gray-700 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-tab flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 active'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-1 transition-all duration-300 gpu-accelerated ${
                  isActive ? 'scale-110' : ''
                }`} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;