import React from 'react';
import { Star, Truck, MapPin, Clock } from 'lucide-react';

interface TruckerCardProps {
  trucker: {
    id: number;
    name: string;
    experience: string;
    rating: number;
    truck: string;
    capacity: string;
    location: string;
    available: boolean;
    avatar: string;
  };
  onClick: () => void;
}

const TruckerCard: React.FC<TruckerCardProps> = ({ trucker, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer group stagger-item gpu-accelerated"
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <img
            src={trucker.avatar}
            alt={trucker.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${
            trucker.available ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors duration-200">
            {trucker.name}
          </h3>
          <p className="text-sm text-gray-400 mb-2">Опыт: {trucker.experience}</p>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-300">{trucker.rating}</span>
            <span className="text-xs text-gray-500 ml-1">(127 отзывов)</span>
          </div>
        </div>
      </div>

      {/* Truck Info */}
      <div className="bg-gray-700/50 rounded-xl p-4 mb-4 hover:bg-gray-700/70 transition-all duration-300">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">{trucker.truck}</span>
        </div>
        <div className="text-sm text-gray-400">
          Грузоподъёмность: {trucker.capacity}
        </div>
      </div>

      {/* Location and Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{trucker.location}</span>
        </div>
        <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
          trucker.available
            ? 'bg-green-500/20 text-green-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {trucker.available ? 'Свободен' : 'Занят'}
        </div>
      </div>

      {/* Action Button */}
      <button 
        className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
          trucker.available
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25 animated-gradient'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
        disabled={!trucker.available}
      >
        {trucker.available ? 'Связаться' : 'Недоступен'}
      </button>
    </div>
  );
};

export default TruckerCard;