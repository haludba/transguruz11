import React, { useState, useEffect } from 'react';
import { X, MapPin, Package, DollarSign, ArrowRight, Loader } from 'lucide-react';
import * as turf from '@turf/turf';
import { CargoMarkerData } from '../services/mapboxService';

interface NearbyCargosItem {
  id: number;
  title: string;
  from: string;
  to: string;
  price: string;
  distance: number; // расстояние в км от места выгрузки до места загрузки
}

interface NearbyCargosProps {
  isOpen: boolean;
  onClose: () => void;
  unloadingCoords: { lat: number; lng: number; } | null;
  allCargos: CargoMarkerData[];
}

const NearbyCargosPanel: React.FC<NearbyCargosProps> = ({ 
  isOpen, 
  onClose, 
  unloadingCoords, 
  allCargos
}) => {
  const [nearbyCargos, setNearbyCargos] = useState<NearbyCargosItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  console.log('NearbyCargosPanel rendered, isOpen:', isOpen, 'unloadingCoords:', unloadingCoords);

  useEffect(() => {
    if (!isOpen || !unloadingCoords) {
      setNearbyCargos([]);
      return;
    }

    setIsLoading(true);

    // Фильтруем грузы в радиусе 500 км от места выгрузки
    const maxDistanceKm = 500;
    const unloadingPoint = turf.point([unloadingCoords.lng, unloadingCoords.lat]);
    
    const nearby: NearbyCargosItem[] = [];

    allCargos.forEach(cargo => {
      // Проверяем, есть ли координаты места загрузки
      if (!cargo.fromCoords) return;

      const loadingPoint = turf.point([cargo.fromCoords.lng, cargo.fromCoords.lat]);
      const distanceKm = turf.distance(unloadingPoint, loadingPoint, { units: 'kilometers' });

      // Если груз находится в пределах максимального расстояния
      if (distanceKm <= maxDistanceKm) {
        nearby.push({
          id: cargo.id,
          title: cargo.title,
          from: cargo.city,
          to: cargo.toCoords ? 'Пункт назначения' : 'Неизвестно', // В реальном приложении здесь был бы город назначения
          price: cargo.price,
          distance: Math.round(distanceKm)
        });
      }
    });

    // Сортируем по расстоянию (ближайшие первыми)
    nearby.sort((a, b) => a.distance - b.distance);

    setNearbyCargos(nearby);
    setIsLoading(false);
  }, [isOpen, unloadingCoords, allCargos]);

  if (!isOpen) return null;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-gray-800 border-l border-gray-700 z-70 animate-in slide-in-from-right-0 duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Грузы поблизости</h2>
                <p className="text-gray-400">Доступные грузы в радиусе 500 км</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
                <span className="text-gray-400">Поиск ближайших грузов...</span>
              </div>
            </div>
          ) : nearbyCargos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Грузы не найдены</h3>
                <p className="text-gray-500">В радиусе 500 км от места выгрузки нет доступных грузов</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-400 mb-4">
                Найдено {nearbyCargos.length} {nearbyCargos.length === 1 ? 'груз' : nearbyCargos.length < 5 ? 'груза' : 'грузов'}
              </div>
              
              {nearbyCargos.map((cargo, index) => (
                <div
                  key={cargo.id}
                  className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 hover:border-purple-500/50 transition-all duration-200"
                >
                  {/* Cargo Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{cargo.title}</h4>
                        <p className="text-gray-400 text-sm">#{cargo.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">{cargo.price}</div>
                      <div className="text-xs text-gray-400">за рейс</div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="text-gray-300 truncate">{cargo.from}</span>
                      <ArrowRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-300 truncate">{cargo.to}</span>
                    </div>
                  </div>

                  {/* Distance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-gray-400 text-sm">Расстояние от выгрузки:</span>
                    </div>
                    <span className="text-white font-medium">{cargo.distance} км</span>
                  </div>

                  {/* Position indicator */}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Позиция в списке: #{index + 1}</span>
                      <span>Сортировка: по расстоянию</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="text-center text-xs text-gray-500">
            Информация носит справочный характер и не является офертой
          </div>
        </div>
      </div>
    </>
  );
};

export default NearbyCargosPanel;