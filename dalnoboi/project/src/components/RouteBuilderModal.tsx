import React from 'react';
import { X, Navigation, ExternalLink } from 'lucide-react';
import { CargoMarkerData } from '../services/mapboxService';

interface RouteBuilderModalProps {
  cargo: CargoMarkerData | null;
  userLocation: { lat: number; lng: number };
  isOpen: boolean;
  onClose: () => void;
}

const RouteBuilderModal: React.FC<RouteBuilderModalProps> = ({ 
  cargo, 
  userLocation, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !cargo) return null;

  // Mock detailed coordinates - in real app this would come from cargo data
  const detailedInfo = {
    fromCoords: { lat: 55.7558, lng: 37.6176 }, // Moscow
    toCoords: { lat: 59.9311, lng: 30.3609 } // Saint Petersburg
  };

  // Navigation services configuration
  const navigationServices = [
    {
      id: 'google',
      name: 'Google Maps',
      icon: '🗺️', // TODO: Replace with actual Google Maps icon in production
      color: 'from-blue-500 to-blue-600',
      getUrl: (from: {lat: number, lng: number}, to: {lat: number, lng: number}) => 
        `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&travelmode=driving`
    },
    {
      id: 'yandex',
      name: 'Яндекс Карты',
      icon: '🚗', // TODO: Replace with actual Yandex Maps icon in production
      color: 'from-yellow-500 to-orange-500',
      getUrl: (from: {lat: number, lng: number}, to: {lat: number, lng: number}) => 
        `https://yandex.ru/maps/?rtext=${from.lat},${from.lng}~${to.lat},${to.lng}&rtt=auto`
    },
    {
      id: '2gis',
      name: '2ГИС',
      icon: '🧭', // TODO: Replace with actual 2GIS icon in production
      color: 'from-green-500 to-emerald-500',
      getUrl: (from: {lat: number, lng: number}, to: {lat: number, lng: number}) => 
        `https://2gis.ru/directions?from=${from.lng},${from.lat}&to=${to.lng},${to.lat}&type=car`
    }
  ];

  // Route types configuration
  const routeTypes = [
    {
      id: 'to-loading',
      title: 'До места загрузки',
      description: 'Маршрут от вашего местоположения до пункта загрузки',
      icon: '📍',
      color: 'text-green-400',
      getOrigin: () => userLocation,
      getDestination: () => cargo.fromCoords || detailedInfo.fromCoords
    },
    {
      id: 'to-unloading',
      title: 'До места выгрузки',
      description: 'Маршрут от вашего местоположения до пункта выгрузки',
      icon: '🎯',
      color: 'text-red-400',
      getOrigin: () => userLocation,
      getDestination: () => cargo.toCoords || detailedInfo.toCoords
    },
    {
      id: 'loading-to-unloading',
      title: 'От загрузки до выгрузки',
      description: 'Полный маршрут доставки груза',
      icon: '🚛',
      color: 'text-cyan-400',
      getOrigin: () => cargo.fromCoords || detailedInfo.fromCoords,
      getDestination: () => cargo.toCoords || detailedInfo.toCoords
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Построить маршрут</h2>
                <p className="text-gray-400">Выберите тип маршрута и навигатор</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Cargo Info */}
            <div className="bg-gray-700/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-2">{cargo.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span>📍 {cargo.city}</span>
                <span>→</span>
                <span>🎯 Пункт назначения</span>
              </div>
            </div>

            {/* Route Types */}
            <div className="space-y-4">
              {routeTypes.map((routeType) => {
                const origin = routeType.getOrigin();
                const destination = routeType.getDestination();
                
                // Skip if coordinates are not available
                if (!origin || !destination) return null;
                
                return (
                  <div key={routeType.id} className="bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{routeType.icon}</span>
                      <div>
                        <h4 className={`font-semibold ${routeType.color}`}>
                          {routeType.title}
                        </h4>
                        <p className="text-gray-400 text-sm">{routeType.description}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {navigationServices.map((service) => {
                        const routeUrl = service.getUrl(origin, destination);
                        
                        return (
                          <a
                            key={`${routeType.id}-${service.id}`}
                            href={routeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-between p-3 bg-gradient-to-r ${service.color} hover:shadow-lg hover:shadow-${service.color.split('-')[1]}-500/25 rounded-lg transition-all duration-200 text-white font-medium text-sm group hover:scale-105`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{service.icon}</span>
                              <span>{service.name}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note */}
            <div className="text-center text-xs text-gray-500 bg-gray-700/20 rounded-lg p-3">
              <p>Маршруты откроются в новой вкладке вашего браузера.</p>
              <p className="mt-1">Иконки навигаторов временные и будут заменены на оригинальные в продакшене.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RouteBuilderModal;