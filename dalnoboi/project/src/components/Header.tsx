import React from 'react';
import { Truck, Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Дальнобойщики
              </h1>
              <p className="text-xs text-gray-400">Грузоперевозки</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
            </button>
            <button className="p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-all duration-200">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;