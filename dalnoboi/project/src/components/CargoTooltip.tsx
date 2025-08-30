import React, { forwardRef } from 'react';
import { MapPin, Package, DollarSign, Clock, ArrowRight, Truck, X } from 'lucide-react';
import { CargoMarkerData } from '../services/mapboxService';

interface CargoTooltipProps {
  cargo: CargoMarkerData;
  position: { x: number; y: number };
  onShowDetails: (cargo: CargoMarkerData) => void;
  onShowNearbyCargos: (cargo: CargoMarkerData) => void;
  onCloseTooltip: () => void;
}

const CargoTooltip = forwardRef<HTMLDivElement, CargoTooltipProps>(
  ({ cargo, position, onShowDetails, onShowNearbyCargos, onCloseTooltip }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute z-50 bg-gray-800/95 backdrop-blur-md border border-gray-600 rounded-xl p-3 shadow-2xl max-w-xs pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-200 transition-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onCloseTooltip}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-700 transition-all duration-200"
      >
        <X className="w-3 h-3 text-gray-400" />
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-2 pr-6">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-1.5 rounded-lg">
            <Package className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm">{cargo.title}</h4>
            <p className="text-gray-400 text-xs">{cargo.type}</p>
          </div>
        </div>
        {cargo.urgent && (
          <div className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded-md text-xs font-medium">
            Срочно
          </div>
        )}
      </div>

      {/* Route */}
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
          <span className="text-gray-300 truncate">{cargo.city}</span>
          <ArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
          <span className="text-gray-300 truncate">Пункт назначения</span>
        </div>
        {cargo.distance && (
          <div className="text-xs text-gray-400 mt-1 ml-5">{cargo.distance}</div>
        )}
      </div>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3 h-3 text-green-400" />
          <span className="text-white font-semibold text-sm">{cargo.price}</span>
        </div>
        {cargo.weight && (
          <div className="flex items-center gap-2">
            <Truck className="w-3 h-3 text-gray-400" />
            <span className="text-gray-300 text-sm">{cargo.weight}</span>
          </div>
        )}
      </div>

      {/* Profitability Indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">Прибыльность:</span>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ 
              backgroundColor: cargo.profitabilityRate >= 70 ? '#22c55e' : 
                              cargo.profitabilityRate >= 40 ? '#eab308' : '#ef4444'
            }}
          />
          <span className="text-xs text-white font-medium">{cargo.profitabilityRate}%</span>
        </div>
      </div>

      {/* More Details Button */}
      <div className="space-y-2">
        <button
          onClick={() => onShowDetails(cargo)}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25"
        >
          <span>Подробнее</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        
        <button
          onClick={() => onShowNearbyCargos(cargo)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25"
        >
          <span>Грузы поблизости</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
});

CargoTooltip.displayName = 'CargoTooltip';

export default CargoTooltip;