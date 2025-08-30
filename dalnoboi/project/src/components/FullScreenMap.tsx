import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Filter,
  Package,
  SlidersHorizontal,
  Loader,
  ChevronUp,
  Minus,
  Plus,
  NavigationIcon,
  RotateCcw,
} from 'lucide-react';
import * as turf from '@turf/turf';
import { mapboxService, CargoMarkerData, ProfitabilityColorSystem } from '../services/mapboxService';
import { api } from '../services/api';
import Slider from './Slider';
import CargoTooltip from './CargoTooltip';
import CargoDetailPanel from './CargoDetailPanel';
import NearbyCargosPanel from './NearbyCargosPanel';

interface FilterState {
  cargoTypes: string[];
  profitabilityRange: [number, number];
  weightRange: [number, number];
  distanceRange: [number, number];
  bodyTypes: string[];
  loadingTypes: string[];
  volumeRange: [number, number];
  loadingDateRange: {
    from: string;
    to: string;
  };
  urgentOnly: boolean;
  availableOnly: boolean;
}

interface FullScreenMapProps {
  onClose: () => void;
  setIsCargoDetailPanelOpen: (isOpen: boolean) => void;
  setIsNearbyCargosPanelOpen: (isOpen: boolean) => void;
}

const FullScreenMap: React.FC<FullScreenMapProps> = ({ onClose, setIsCargoDetailPanelOpen, setIsNearbyCargosPanelOpen }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const cargosRef = useRef<CargoMarkerData[]>([]);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isLoadingCargos, setIsLoadingCargos] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [cargos, setCargos] = useState<CargoMarkerData[]>([]);
  const [filteredCargos, setFilteredCargos] = useState<CargoMarkerData[]>([]);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const [loadingRadius, setLoadingRadius] = useState(100);
  const [unloadingRadius, setUnloadingRadius] = useState(3000);

  const [hoveredCargo, setHoveredCargo] = useState<CargoMarkerData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedCargo, setSelectedCargo] = useState<CargoMarkerData | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // mapCenter — ТОЛЬКО положение камеры (вид)
  const [mapCenter, setMapCenter] = useState({ lat: 55.7558, lng: 37.6176 });

  // Новое: независимая геопозиция пользователя (не меняется при панорамировании карты)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [showNearbyCargosPanel, setShowNearbyCargosPanel] = useState(false);
  const [nearbyCargosUnloadingCoords, setNearbyCargosUnloadingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [isLocating, setIsLocating] = useState(false);

  // Geolocation error handling
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationSupported, setGeolocationSupported] = useState(true);

  const cargoTypeOptions = [
    { id: 'construction', label: 'Стройматериалы', color: 'from-orange-500 to-red-500' },
    { id: 'food', label: 'Продукты питания', color: 'from-green-500 to-emerald-500' },
    { id: 'auto', label: 'Автозапчасти', color: 'from-blue-500 to-cyan-500' },
    { id: 'electronics', label: 'Электроника', color: 'from-purple-500 to-pink-500' },
    { id: 'textiles', label: 'Текстиль', color: 'from-yellow-500 to-orange-500' }
  ];

  const bodyTypeOptions = [
    { id: 'refrigerator', label: 'Рефрижератор' },
    { id: 'tented', label: 'Тентованный' },
    { id: 'container', label: 'Контейнер' },
    { id: 'flatbed', label: 'Площадка без бортов' },
    { id: 'sideboard', label: 'Бортовой' },
    { id: 'car_carrier', label: 'Автовоз' },
    { id: 'grain_carrier', label: 'Зерновоз' }
  ];

  const loadingTypeOptions = [
    { id: 'rear', label: 'Задняя' },
    { id: 'side', label: 'Боковая' },
    { id: 'full_uncovering', label: 'С полной растентовкой' },
    { id: 'ramps', label: 'Аппарели' },
    { id: 'top', label: 'Верхняя' },
    { id: 'bulk', label: 'Налив' }
  ];

  const [filters, setFilters] = useState<FilterState>({
    cargoTypes: [],
    profitabilityRange: [0, 100],
    weightRange: [0, 50],
    distanceRange: [0, 2000],
    bodyTypes: [],
    loadingTypes: [],
    volumeRange: [0, 200],
    loadingDateRange: {
      from: '',
      to: ''
    },
    urgentOnly: false,
    availableOnly: true
  });

  // ==== Tooltip пересчёт позиции при движении карты
  useEffect(() => {
    if (!isMapLoaded || !hoveredCargo) return;

    const map = mapboxService.getMap();
    if (!map) return;

    const updateTooltipPosition = () => {
      if (hoveredCargo) {
        const pixel = map.project([hoveredCargo.lng, hoveredCargo.lat]);
        setTooltipPosition({ x: pixel.x, y: pixel.y });
      }
    };

    map.on('move', updateTooltipPosition);
    map.on('zoom', updateTooltipPosition);
    map.on('rotate', updateTooltipPosition);
    map.on('pitch', updateTooltipPosition);

    updateTooltipPosition();

    return () => {
      map.off('move', updateTooltipPosition);
      map.off('zoom', updateTooltipPosition);
      map.off('rotate', updateTooltipPosition);
      map.off('pitch', updateTooltipPosition);
    };
  }, [isMapLoaded, hoveredCargo]);

  // ==== Закрытие тултипа по клику вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const container = mapRef.current;
      const tip = tooltipRef.current;
      if (container && (container.contains(target) || (tip && tip.contains(target)))) return;
      setHoveredCargo(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ==== Инициализация карты
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoadingMap(true);
        if (mapRef.current) {
          mapboxService.initializeMap(
            mapRef.current,
            { center: [37.6176, 55.7558], zoom: 5 },
            (newCenter) => setMapCenter(newCenter) // это только камера
          );
          mapboxService.setupCargoLayers(handleCargoClick, () => {
            console.log('🗺️ Fullscreen map is fully loaded and ready');
            // Now that the map is ready, we can safely load cargos and get geolocation
            loadCargos();
            getUserGpsLocation();
          });

          setIsMapLoaded(true);

          setTimeout(() => mapboxService.getMap()?.resize(), 100);
        }
      } catch (e) {
        console.error('Failed to initialize map:', e);
      } finally {
        setIsLoadingMap(false);
      }
    };
    init();
    return () => mapboxService.destroy();
  }, []);

  // ==== Кнопка «ко мне»: если уже знаем userLocation — просто центрируем камеру.
  const getUserGpsLocation = () => {
    setGeolocationError(null);

    const map = mapboxService.getMap();

    if (userLocation) {
      if (map) map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 10, duration: 1200 });
      return;
    }

    if (!navigator.geolocation) {
      const errorMsg = 'Геолокация не поддерживается вашим браузером';
      console.error(errorMsg);
      setGeolocationError(errorMsg);
      setGeolocationSupported(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log('✅ Geolocation success:', { latitude, longitude, accuracy: pos.coords.accuracy });
        
        setUserLocation({ lat: latitude, lng: longitude });
        if (map) map.flyTo({ center: [longitude, latitude], zoom: 10, duration: 1200 });
        setIsLocating(false);
      },
      (err) => {
        let errorMessage = 'Не удалось определить местоположение';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна. Проверьте подключение к интернету.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Превышено время ожидания определения местоположения. Попробуйте еще раз.';
            break;
          default:
            errorMessage = `Ошибка геолокации: ${err.message}`;
            break;
        }
        
        console.error('❌ Geolocation error:', err.code, err.message);
        setGeolocationError(errorMessage);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000,
        maximumAge: 300000
      }
    );
  };

  // ==== Загрузка грузов (данные для слоёв)
  const loadCargos = async () => {
    try {
      setIsLoadingCargos(true);
      // bounds для примера — реальный API можешь привязать к видимой области карты
      const bounds = { north: 70, south: 40, east: 60, west: 20, radius: loadingRadius };
      const response = await api.getCargosInBounds(bounds);
      if (response.success && response.data) {
        const data: CargoMarkerData[] = response.data.map((cargo) => ({
          id: cargo.id,
          lat: cargo.toCoords?.lat || 0,
          lng: cargo.toCoords?.lng || 0,
          title: cargo.title,
          price: cargo.price,
          urgent: cargo.urgent,
          type: cargo.type,
          city: cargo.from,
          weight: cargo.weight,
          distance: cargo.distance,
          profitabilityRate: ProfitabilityColorSystem.calculateProfitabilityRate(
            cargo.price,
            cargo.distance,
            cargo.weight
          ),
          profitPerKm:
            parseFloat(cargo.price.replace(/[^\d.]/g, '') || '0') /
            parseFloat(cargo.distance.replace(/[^\d.]/g, '') || '1'),
          bodyType: cargo.bodyType,
          loadingType: cargo.loadingType,
          volume: cargo.volume,
          loadingDate: cargo.loadingDate,
          fromCoords: cargo.fromCoords,
          toCoords: cargo.toCoords,
        }));
        setCargos(data);
        setFilteredCargos(data);
        cargosRef.current = data;
        if (isMapLoaded) mapboxService.updateCargoData(data);
      }
    } catch (e) {
      console.error('Failed to load cargos:', e);
    } finally {
      setIsLoadingCargos(false);
    }
  };

  // ==== Обновление кругов/метки: ТОЛЬКО от userLocation
  useEffect(() => {
    if (!isMapLoaded) return;

    if (userLocation) {
      // Показываем радиусы и метку только при определенной геолокации
      mapboxService.updateRadiusCircles([userLocation.lng, userLocation.lat], loadingRadius, unloadingRadius);
      mapboxService.updateUserLocationMarker([userLocation.lng, userLocation.lat]);
    } else {
      // Скрываем радиусы и метку если геолокация не определена
      mapboxService.clearRadiusCircles();
      mapboxService.clearUserLocationMarker();
    }
  }, [isMapLoaded, userLocation, loadingRadius, unloadingRadius]);

  // ==== Синхронизация ref
  useEffect(() => {
    cargosRef.current = cargos;
  }, [cargos]);

  // ==== Клик по грузу
  const handleCargoClick = (cargoId: number, event: any) => {
    const numericId = Number(cargoId);
    const clicked = cargosRef.current.find((c) => c.id === numericId);
    if (!clicked) return;

    if (hoveredCargo && hoveredCargo.id === numericId) {
      handleShowDetails(clicked);
      return;
    }

    setHoveredCargo(clicked);
    if (mapRef.current && event.point) {
      setTooltipPosition({ x: event.point.x, y: event.point.y });
    }
  };

  const handleShowDetails = (cargo: CargoMarkerData) => {
    setSelectedCargo(cargo);
    setShowDetailPanel(true);
    setIsCargoDetailPanelOpen(true);
    setHoveredCargo(null);
  };

  const handleCloseDetailPanel = () => {
    setShowDetailPanel(false);
    setSelectedCargo(null);
    setIsCargoDetailPanelOpen(false);
  };

  const handleShowNearbyCargos = (cargo: CargoMarkerData) => {
    if (cargo.toCoords) {
      setNearbyCargosUnloadingCoords(cargo.toCoords);
      setShowNearbyCargosPanel(true);
      setIsNearbyCargosPanelOpen(true);
      setHoveredCargo(null);
    }
  };

  const handleCloseNearbyCargosPanel = () => {
    setShowNearbyCargosPanel(false);
    setIsNearbyCargosPanelOpen(false);
    setNearbyCargosUnloadingCoords(null);
  };

  // ==== Применение фильтров — считаем расстояния от userLocation; если GPS ещё нет — от mapCenter
  useEffect(() => {
    let filtered = [...cargos];
    let activeCount = 0;

    const origin = userLocation ?? mapCenter;
    const originPoint = turf.point([origin.lng, origin.lat]);

    filtered = filtered.filter((cargo) => {
      if (!cargo.fromCoords || !cargo.toCoords) return false;

      const loadingPoint = turf.point([cargo.fromCoords.lng, cargo.fromCoords.lat]);
      const unloadingPoint = turf.point([cargo.toCoords.lng, cargo.toCoords.lat]);

      const dLoad = turf.distance(loadingPoint, originPoint, { units: 'kilometers' });
      const dUnload = turf.distance(unloadingPoint, originPoint, { units: 'kilometers' });

      return dLoad <= loadingRadius && dUnload <= unloadingRadius;
    });

    if (filters.cargoTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter((c) => filters.cargoTypes.includes(c.type));
    }
    if (filters.bodyTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter((c) => c.bodyType && filters.bodyTypes.includes(c.bodyType));
    }
    if (filters.loadingTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter((c) => c.loadingType && filters.loadingTypes.includes(c.loadingType));
    }
    if (filters.profitabilityRange[0] > 0 || filters.profitabilityRange[1] < 100) {
      activeCount++;
      filtered = filtered.filter(
        (c) => c.profitabilityRate >= filters.profitabilityRange[0] && c.profitabilityRate <= filters.profitabilityRange[1]
      );
    }
    const [minW, maxW] = filters.weightRange;
    if (minW > 0 || maxW < 50) {
      activeCount++;
      filtered = filtered.filter((c) => {
        const w = parseFloat(c.weight?.replace(/[^\d.]/g, '') || '0');
        return w >= minW && w <= maxW;
      });
    }
    const [minV, maxV] = filters.volumeRange;
    if (minV > 0 || maxV < 200) {
      activeCount++;
      filtered = filtered.filter((c) => {
        const v = parseFloat(c.volume?.replace(/[^\d.]/g, '') || '0');
        return v >= minV && v <= maxV;
      });
    }
    const [minD, maxD] = filters.distanceRange;
    if (minD > 0 || maxD < 2000) {
      activeCount++;
      filtered = filtered.filter((c) => {
        const d = parseFloat(c.distance?.replace(/[^\d.]/g, '') || '0');
        return d >= minD && d <= maxD;
      });
    }
    if (filters.loadingDateRange.from || filters.loadingDateRange.to) {
      activeCount++;
      filtered = filtered.filter((c) => {
        if (!c.loadingDate) return false;
        const date = new Date(c.loadingDate);
        const from = filters.loadingDateRange.from ? new Date(filters.loadingDateRange.from) : null;
        const to = filters.loadingDateRange.to ? new Date(filters.loadingDateRange.to) : null;
        if (from && date < from) return false;
        if (to && date > to) return false;
        return true;
      });
    }
    if (filters.urgentOnly) {
      activeCount++;
      filtered = filtered.filter((c) => c.urgent);
    }

    setFilteredCargos(filtered);
    setActiveFiltersCount(activeCount);
    cargosRef.current = filtered;
    if (isMapLoaded) mapboxService.updateCargoData(filtered);
  }, [filters, cargos, isMapLoaded, userLocation, mapCenter, loadingRadius, unloadingRadius]);

  // ==== Сброс фильтров
  const resetFilters = () => {
    setFilters({
      cargoTypes: [],
      profitabilityRange: [0, 100],
      weightRange: [0, 50],
      distanceRange: [0, 2000],
      bodyTypes: [],
      loadingTypes: [],
      volumeRange: [0, 200],
      loadingDateRange: { from: '', to: '' },
      urgentOnly: false,
      availableOnly: true,
    });
  };

  // ==== Тогглеры фильтров
  const toggleCargoType = (typeId: string) => {
    setFilters((p) => ({
      ...p,
      cargoTypes: p.cargoTypes.includes(typeId) ? p.cargoTypes.filter((id) => id !== typeId) : [...p.cargoTypes, typeId],
    }));
  };
  const toggleBodyType = (typeId: string) => {
    setFilters((p) => ({
      ...p,
      bodyTypes: p.bodyTypes.includes(typeId) ? p.bodyTypes.filter((id) => id !== typeId) : [...p.bodyTypes, typeId],
    }));
  };
  const toggleLoadingType = (typeId: string) => {
    setFilters((p) => ({
      ...p,
      loadingTypes: p.loadingTypes.includes(typeId) ? p.loadingTypes.filter((id) => id !== typeId) : [...p.loadingTypes, typeId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Map Container */}
      <div className="absolute inset-0">
        {isLoadingMap && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-gray-400 animate-pulse">Загрузка карты...</span>
            </div>
          </div>
        )}

        <div
          ref={mapRef}
          className={`w-full h-full transition-opacity duration-500 ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Tooltip в пределах контейнера карты */}
          {hoveredCargo && (
            <CargoTooltip
              ref={tooltipRef}
              cargo={hoveredCargo}
              position={tooltipPosition}
              onShowDetails={handleShowDetails}
              onShowNearbyCargos={handleShowNearbyCargos}
              onCloseTooltip={() => setHoveredCargo(null)}
            />
          )}
        </div>
      </div>

      {/* Верхняя панель управления */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-xl transition-all duration-200">
              <X className="w-5 h-5 text-gray-300" />
            </button>

            <div className="flex-1">
              <h1 className="text-xl font-semibold text-white">Карта грузов</h1>
              <p className="text-sm text-gray-400">Используйте фильтры для поиска подходящих грузов</p>
            </div>

            {/* Геолокация / «ко мне» */}
            <button
              onClick={getUserGpsLocation}
              disabled={isLocating}
              className={`p-3 rounded-xl transition-all duration-200 ${
                !geolocationSupported 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : geolocationError 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={userLocation ? 'Показать мою позицию' : 'Определить мою позицию'}
            >
              {isLocating ? (
                <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : geolocationError ? (
                <NavigationIcon className="w-5 h-5 text-red-300" />
              ) : (
                <NavigationIcon className="w-5 h-5 text-cyan-400" />
              )}
            </button>

            {/* Фильтры */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-200 ${
                activeFiltersCount > 0 ? 'ring-2 ring-cyan-500' : ''
              }`}
            >
              <Filter className="w-5 h-5 text-gray-300" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Настройки */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-200 ${
                showSettings ? 'ring-2 ring-purple-500' : ''
              }`}
              title="Настройки радиуса поиска"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Панель фильтров */}
      {showFilters && (
        <div className="absolute top-24 left-4 w-80 max-h-[calc(100vh-120px)] z-20 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Фильтры</h3>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button onClick={resetFilters} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                    <span className="sr-only">Сбросить фильтры</span>
                    {/* иконка сброса */}
                  </button>
                )}
                <button onClick={() => setShowFilters(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
                  <ChevronUp className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
            {/* Cargo Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Тип груза</h4>
              <div className="space-y-2">
                {cargoTypeOptions.map(type => (
                  <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.cargoTypes.includes(type.id)}
                      onChange={() => toggleCargoType(type.id)}
                      className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${type.color}`}></div>
                    <span className="text-sm text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Body Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Тип кузова</h4>
              <div className="space-y-2">
                {bodyTypeOptions.map(type => (
                  <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.bodyTypes.includes(type.id)}
                      onChange={() => toggleBodyType(type.id)}
                      className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Loading Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Тип загрузки</h4>
              <div className="space-y-2">
                {loadingTypeOptions.map(type => (
                  <label key={type.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.loadingTypes.includes(type.id)}
                      onChange={() => toggleLoadingType(type.id)}
                      className="w-4 h-4 text-cyan-500 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm text-gray-300">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Profitability Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Прибыльность: {filters.profitabilityRange[0]}% - {filters.profitabilityRange[1]}%
              </h4>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={100}
                  value={filters.profitabilityRange[0]}
                  onChange={(value) => setFilters(prev => ({ ...prev, profitabilityRange: [value, prev.profitabilityRange[1]] }))}
                  thumbColor="#06b6d4"
                />
                <Slider
                  min={0}
                  max={100}
                  value={filters.profitabilityRange[1]}
                  onChange={(value) => setFilters(prev => ({ ...prev, profitabilityRange: [prev.profitabilityRange[0], value] }))}
                  thumbColor="#06b6d4"
                />
              </div>
            </div>

            {/* Weight Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Вес: {filters.weightRange[0]}т - {filters.weightRange[1]}т
              </h4>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={50}
                  value={filters.weightRange[0]}
                  onChange={(value) => setFilters(prev => ({ ...prev, weightRange: [value, prev.weightRange[1]] }))}
                  thumbColor="#06b6d4"
                />
                <Slider
                  min={0}
                  max={50}
                  value={filters.weightRange[1]}
                  onChange={(value) => setFilters(prev => ({ ...prev, weightRange: [prev.weightRange[0], value] }))}
                  thumbColor="#06b6d4"
                />
              </div>
            </div>

            {/* Volume Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Объем: {filters.volumeRange[0]}м³ - {filters.volumeRange[1]}м³
              </h4>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={200}
                  step={5}
                  value={filters.volumeRange[0]}
                  onChange={(value) => setFilters(prev => ({ ...prev, volumeRange: [value, prev.volumeRange[1]] }))}
                  thumbColor="#06b6d4"
                />
                <Slider
                  min={0}
                  max={200}
                  step={5}
                  value={filters.volumeRange[1]}
                  onChange={(value) => setFilters(prev => ({ ...prev, volumeRange: [prev.volumeRange[0], value] }))}
                  thumbColor="#06b6d4"
                />
              </div>
            </div>

            {/* Distance Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Расстояние: {filters.distanceRange[0]}км - {filters.distanceRange[1]}км
              </h4>
              <div className="space-y-2">
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={filters.distanceRange[0]}
                  onChange={(value) => setFilters(prev => ({ ...prev, distanceRange: [value, prev.distanceRange[1]] }))}
                  thumbColor="#06b6d4"
                />
                <Slider
                  min={0}
                  max={2000}
                  step={50}
                  value={filters.distanceRange[1]}
                  onChange={(value) => setFilters(prev => ({ ...prev, distanceRange: [prev.distanceRange[0], value] }))}
                  thumbColor="#06b6d4"
                />
              </div>
            </div>

            {/* Loading Date Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">Дата погрузки</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">От:</label>
                  <input
                    type="date"
                    value={filters.loadingDateRange.from}
                    onChange={(e) => setFilters(prev => ({ ...prev, loadingDateRange: { ...prev.loadingDateRange, from: e.target.value } }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">До:</label>
                  <input
                    type="date"
                    value={filters.loadingDateRange.to}
                    onChange={(e) => setFilters(prev => ({ ...prev, loadingDateRange: { ...prev.loadingDateRange, to: e.target.value } }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.urgentOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, urgentOnly: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-300">Только срочные</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, availableOnly: e.target.checked }))}
                  className="w-4 h-4 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-300">Только доступные</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Панель настроек (дублирую контролы радиусов, если тебе удобнее там) */}
      {showSettings && (
        <div className="absolute top-24 right-4 w-80 z-20 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Настройки радиуса поиска</h3>
            <button onClick={() => setShowSettings(false)} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200">
              <ChevronUp className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          {/* Geolocation Status */}
          {geolocationError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <NavigationIcon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-400 text-xs font-medium mb-1">Проблема с геолокацией</p>
                  <p className="text-red-300 text-xs mb-2">{geolocationError}</p>
                  {geolocationSupported && (
                    <button
                      onClick={getUserGpsLocation}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200"
                    >
                      Попробовать снова
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {userLocation && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <NavigationIcon className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-green-400 text-xs font-medium">Местоположение определено</p>
                  <p className="text-green-300 text-xs">
                    {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Loading Radius */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Радиус загрузки</span>
                <span className="text-sm text-cyan-400 font-medium">{loadingRadius} км</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setLoadingRadius(Math.max(10, loadingRadius - 10))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <Minus className="w-4 h-4 text-gray-300" />
                </button>
                <div className="flex-1">
                  <Slider
                    min={10}
                    max={400}
                    step={10}
                    value={loadingRadius}
                    onChange={setLoadingRadius}
                    thumbColor="#06b6d4"
                  />
                </div>
                <button
                  onClick={() => setLoadingRadius(Math.min(400, loadingRadius + 10))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Unloading Radius */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Радиус выгрузки</span>
                <span className="text-sm text-purple-400 font-medium">{unloadingRadius} км</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUnloadingRadius(Math.max(500, unloadingRadius - 500))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <Minus className="w-4 h-4 text-gray-300" />
                </button>
                <div className="flex-1">
                  <Slider
                    min={500}
                    max={5000}
                    step={500}
                    value={unloadingRadius}
                    onChange={setUnloadingRadius}
                    thumbColor="#8b5cf6"
                  />
                </div>
                <button
                  onClick={() => setUnloadingRadius(Math.min(5000, unloadingRadius + 500))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Счётчик результатов */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white">
              {isLoadingCargos ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-3 h-3 animate-spin" />
                  Загрузка...
                </span>
              ) : (
                `${filteredCargos.length} из ${cargos.length} грузов`
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Панель деталей */}
      <CargoDetailPanel cargo={selectedCargo} isOpen={showDetailPanel} onClose={handleCloseDetailPanel} />

      {/* Панель «похожие поблизости» */}
      <NearbyCargosPanel
       isOpen={showNearbyCargosPanel}
        onClose={handleCloseNearbyCargosPanel}
        unloadingCoords={nearbyCargosUnloadingCoords}
        allCargos={cargosRef.current}
      />
    </div>
  );
};

export default FullScreenMap;