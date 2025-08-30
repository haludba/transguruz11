import React, { useState, useRef, useEffect } from 'react';
import { NavigationIcon, Minus, Plus, Loader, MapPin, Package, DollarSign, Clock, ArrowRight, Filter, X, RotateCcw, SlidersHorizontal, Maximize, Menu } from 'lucide-react';
import * as turf from '@turf/turf';
import { mapboxService, CargoMarkerData } from '../services/mapboxService';
import { getCargosInBounds } from '../services/api';
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

interface MapViewProps {
  onCargoClick: (cargoId: number) => void;
  setIsCargoDetailPanelOpen: (isOpen: boolean) => void;
  setIsNearbyCargosPanelOpen: (isOpen: boolean) => void;
  onTakeCargo?: () => void;
  onToggleFullScreen: () => void;
}

const MapView: React.FC<MapViewProps> = ({ onCargoClick, setIsCargoDetailPanelOpen, setIsNearbyCargosPanelOpen, onTakeCargo, onToggleFullScreen }) => {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [isLoadingMap, setIsLoadingMap] = React.useState(false);
  const [isLoadingCargos, setIsLoadingCargos] = React.useState(false);

  // ВАЖНО: mapCenter — это ТОЛЬКО камера (вид), НЕ геолокация пользователя
  const [mapCenter, setMapCenter] = React.useState({ lat: 55.7558, lng: 37.6176 });

  // Новое: независимая геопозиция пользователя (прибита и не зависит от панорамирования)
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  const [cargos, setCargos] = React.useState<CargoMarkerData[]>([]);
  const [filteredCargos, setFilteredCargos] = React.useState<CargoMarkerData[]>([]);
  const [loadingRadius, setLoadingRadius] = React.useState(100);
  const [unloadingRadius, setUnloadingRadius] = React.useState(3000);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showRadiusControls, setShowRadiusControls] = React.useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = React.useState(0);
  const cargosRef = React.useRef<CargoMarkerData[]>([]);
  const debounceTimer = React.useRef<NodeJS.Timeout>();
  const [hoveredCargo, setHoveredCargo] = React.useState<CargoMarkerData | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });
  const [selectedCargo, setSelectedCargo] = React.useState<CargoMarkerData | null>(null);
  const [showDetailPanel, setShowDetailPanel] = React.useState(false);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [showNearbyCargosPanel, setShowNearbyCargosPanel] = React.useState(false);
  const [nearbyCargosUnloadingCoords, setNearbyCargosUnloadingCoords] = React.useState<{ lat: number; lng: number; } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapResizeTimeout, setMapResizeTimeout] = useState<NodeJS.Timeout | null>(null);

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

  const [filters, setFilters] = React.useState<FilterState>({
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

  // Позиционирование тултипа при движении карты
  React.useEffect(() => {
    if (!isMapLoaded || !hoveredCargo) return;

    const map = mapboxService.getMap();
    if (!map) return;

    const updateTooltipPosition = () => {
      if (hoveredCargo) {
        const pixelCoords = map.project([hoveredCargo.lng, hoveredCargo.lat]);
        setTooltipPosition({ x: pixelCoords.x, y: pixelCoords.y });
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

  React.useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoadingMap(true);
        console.log('🗺️ Initializing map...');

        if (mapRef.current) {
          mapboxService.initializeMap(
            mapRef.current,
            { center: [mapCenter.lng, mapCenter.lat], zoom: 6 },
            (newCenter) => {
              // это просто положение камеры (вид)
              setMapCenter(newCenter);
            }
          );

          console.log('🎯 Setting up cargo layers with click handler');
          mapboxService.setupCargoLayers(handleCargoClick, () => {
            console.log('🗺️ Map is fully loaded and ready');
            // Now that the map is ready, we can safely load cargos and get geolocation
            loadCargos();
            getUserGpsLocation();
          });

          setIsMapLoaded(true);
          console.log('✅ Map loaded successfully');

          // Подстраховка: resize после загрузки
          setTimeout(() => {
            const map = mapboxService.getMap();
            if (map) map.resize();
          }, 100);
        }
      } catch (error) {
        console.error('Failed to initialize Mapbox:', error);
        setIsMapLoaded(false);
      } finally {
        setIsLoadingMap(false);
      }
    };

    initializeMap();
  }, []);

  // Кнопка «Ко мне»: если уже знаем userLocation — просто центрируем камеру, иначе 1 раз получаем геопозицию
  const getUserGpsLocation = () => {
    // Clear previous errors
    setGeolocationError(null);

    if (userLocation) {
      const map = mapboxService.getMap();
      if (map) {
        map.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 10, duration: 2000 });
      }
      return;
    }

    if (!navigator.geolocation) {
      const errorMsg = 'Геолокация не поддерживается вашим браузером';
      console.error(errorMsg);
      setGeolocationError(errorMsg);
      setGeolocationSupported(false);
      showGeolocationToast(errorMsg, 'error');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        console.log('✅ Geolocation success:', { latitude, longitude, accuracy: position.coords.accuracy });
        showGeolocationToast('Местоположение определено успешно', 'success');

        // Запоминаем ПОЛЬЗОВАТЕЛЬСКУЮ координату (не связанную с камерой)
        setUserLocation({ lat: latitude, lng: longitude });

        const map = mapboxService.getMap();
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 10, duration: 2000 });
        }

        setIsLocating(false);
      },
      (error) => {
        let errorMessage = 'Не удалось определить местоположение';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна. Проверьте подключение к интернету.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Превышено время ожидания определения местоположения. Попробуйте еще раз.';
            break;
          default:
            errorMessage = `Ошибка геолокации: ${error.message}`;
            break;
        }
        
        console.error('❌ Geolocation error:', error.code, error.message);
        setGeolocationError(errorMessage);
        showGeolocationToast(errorMessage, 'error');
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, // Увеличено с 10 до 15 секунд
        maximumAge: 300000 // 5 минут кэширования для повторных запросов
      }
    );
  };

  // Toast notification helper
  const showGeolocationToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded-lg text-white font-medium transition-all duration-300 max-w-sm ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  // Check geolocation support on component mount
  React.useEffect(() => {
    if (!navigator.geolocation) {
      setGeolocationSupported(false);
      setGeolocationError('Геолокация не поддерживается вашим браузером');
    }
  }, []);

  // Auto-request location on first load (optional)
  React.useEffect(() => {
    // Uncomment if you want to auto-request location on first load
    // if (geolocationSupported && !userLocation && !geolocationError) {
    //   getUserGpsLocation();
    // }
  }, [geolocationSupported]);

  // Retry geolocation function
  const retryGeolocation = () => {
    setGeolocationError(null);
    getUserGpsLocation();
  };

  // Check if user is on HTTPS (required for geolocation in many browsers)
  const isSecureContext = window.isSecureContext || location.protocol === 'https:';
  
  React.useEffect(() => {
    if (!isSecureContext) {
      console.warn('⚠️ Geolocation may not work properly on non-HTTPS connections');
      setGeolocationError('Для точной геолокации требуется HTTPS соединение');
    }
  }, [isSecureContext]);

  const handleCargoClick = (cargoId: number, event: any) => {
    console.log('🎯 handleCargoClick called with:', { cargoId, event });
    console.log('📦 Available cargos from state:', cargos.map(c => ({ id: c.id, title: c.title })));
    console.log('📦 Available cargos from ref:', cargosRef.current.map(c => ({ id: c.id, title: c.title })));

    const numericCargoId = Number(cargoId);
    console.log('🔢 Numeric cargo ID:', numericCargoId);

    const clickedCargo = cargosRef.current.find(cargo => cargo.id === numericCargoId);
    console.log('🔍 Found cargo:', clickedCargo);
    if (!clickedCargo) return;

    if (hoveredCargo && hoveredCargo.id === numericCargoId) {
      console.log('🔄 Same cargo clicked, opening details panel');
      handleShowDetails(clickedCargo);
      return;
    }

    console.log('💡 Setting hovered cargo and tooltip position');
    setHoveredCargo(clickedCargo);

    const mapContainer = mapRef.current;
    if (mapContainer && event.point) {
      const tooltipPos = { x: event.point.x, y: event.point.y };
      console.log('📍 Setting tooltip position:', tooltipPos);
      setTooltipPosition(tooltipPos);
    }
  };

  const handleShowDetails = (cargo: CargoMarkerData) => {
    console.log('📋 Opening details panel for cargo:', cargo.id);
    setSelectedCargo(cargo);
    setShowDetailPanel(true);
    setIsCargoDetailPanelOpen(true);
    setHoveredCargo(null);
  };

  const handleCloseDetailPanel = () => {
    console.log('❌ Closing details panel');
    // Trigger map resize after panel closes
    triggerMapResize('Detail panel closed');
    setShowDetailPanel(false);
    setSelectedCargo(null);
    setIsCargoDetailPanelOpen(false);
  };

  const handleShowNearbyCargos = (cargo: CargoMarkerData) => {
    console.log('🔍 Opening nearby cargos for cargo:', cargo.id);
    if (cargo.toCoords) {
      setNearbyCargosUnloadingCoords(cargo.toCoords);
      setShowNearbyCargosPanel(true);
      setIsNearbyCargosPanelOpen(true);
      setHoveredCargo(null);
    }
  };

  const handleCloseNearbyCargosPanel = () => {
    console.log('❌ Closing nearby cargos panel');
    // Trigger map resize after panel closes
    triggerMapResize('Nearby cargos panel closed');
    setShowNearbyCargosPanel(false);
    setIsNearbyCargosPanelOpen(false);
    setNearbyCargosUnloadingCoords(null);
  };

  // Helper function to trigger map resize with logging
  const triggerMapResize = (reason: string) => {
    console.log(`🗺️ Triggering map resize: ${reason}`);
    
    // Clear existing timeout
    if (mapResizeTimeout) {
      clearTimeout(mapResizeTimeout);
    }
    
    // Set new timeout for resize
    const timeout = setTimeout(() => {
      const map = mapboxService.getMap();
      if (map) {
        map.resize();
        console.log(`✅ Map resized after: ${reason}`);
      }
    }, 150);
    
    setMapResizeTimeout(timeout);
  };

  // Клик по карте вне тултипа — закрываем тултип
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const mapContainer = mapRef.current;
      const tooltipElement = tooltipRef.current;

      if (mapContainer && (mapContainer.contains(target) || (tooltipElement && tooltipElement.contains(target)))) {
        return;
      }
      setHoveredCargo(null);
    };

    if (hoveredCargo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [hoveredCargo]);

  const loadCargos = async () => {
    try {
      setIsLoadingCargos(true);
      console.log('📦 Loading cargos...');

      // Для API берём текущий вид карты (это ок), радиусы всё равно считаются отдельно от userLocation
      const bounds = {
        north: mapCenter.lat + 5,
        south: mapCenter.lat - 5,
        east: mapCenter.lng + 5,
        west: mapCenter.lng - 5,
        radius: loadingRadius
      };

      const response = await getCargosInBounds(bounds);

      if (response.success && response.data) {
        console.log('📊 API response successful, data length:', response.data.length);
        console.log('Cargos loaded:', response.data.length, response.data);
        const cargoData: CargoMarkerData[] = response.data.map(cargo => ({
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
          profitabilityRate: cargo.profitabilityRate,
          profitPerKm: cargo.profitPerKm,
          bodyType: cargo.bodyType,
          loadingType: cargo.loadingType,
          volume: cargo.volume,
          loadingDate: cargo.loadingDate,
          fromCoords: cargo.fromCoords,
          toCoords: cargo.toCoords
        }));

        setCargos(cargoData);
        cargosRef.current = cargoData;
        setFilteredCargos(cargoData);
        console.log('📦 Cargos set in state:', cargoData.length);
        console.log('📦 Cargos set in ref:', cargosRef.current.length);
        // updateCargoData случится в эффекте фильтров
      }
    } catch (error) {
      console.error('Failed to load cargos:', error);
    } finally {
      setIsLoadingCargos(false);
    }
  };

  // ВАЖНО: радиусы и маркер пользователя обновляем ТОЛЬКО от userLocation,
  // они больше не зависят от mapCenter. Изменение радиусов — перерисовка кругов вокруг userLocation.
  React.useEffect(() => {
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

    // Перезагрузка грузов по таймеру — как было
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadCargos();
    }, 350);
  }, [loadingRadius, unloadingRadius, isMapLoaded, userLocation]);

  // Синхронизация ref с состоянием
  React.useEffect(() => {
    cargosRef.current = cargos;
  }, [cargos]);

  // Применение фильтров. Радиусы считаются от userLocation; если GPS ещё нет — от mapCenter как запасной вариант.
  React.useEffect(() => {
    let filtered = [...cargos];
    let activeCount = 0;

    const origin = userLocation ?? mapCenter;
    const currentOriginPoint = turf.point([origin.lng, origin.lat]);
    const referencePoint = userLocation || mapCenter;
    console.log('Filtering cargos. Reference point:', referencePoint);
    console.log('Total cargos loaded:', cargos.length);

    filtered = filtered.filter(cargo => {
      if (!cargo.fromCoords || !cargo.toCoords) return false;

      const loadingPoint = turf.point([cargo.fromCoords.lng, cargo.fromCoords.lat]);
      const unloadingPoint = turf.point([cargo.toCoords.lng, cargo.toCoords.lat]);

      const distanceFromLoadingToOrigin = turf.distance(loadingPoint, currentOriginPoint, { units: 'kilometers' });
      const distanceFromUnloadingToOrigin = turf.distance(unloadingPoint, currentOriginPoint, { units: 'kilometers' });

      const passesLoadingRadius = distanceFromLoadingToOrigin <= loadingRadius;
      const passesUnloadingRadius = distanceFromUnloadingToOrigin <= unloadingRadius;

      return passesLoadingRadius && passesUnloadingRadius;
    });

    if (filters.cargoTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter(cargo => filters.cargoTypes.includes(cargo.type));
    }

    if (filters.bodyTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter(cargo => cargo.bodyType && filters.bodyTypes.includes(cargo.bodyType));
    }

    if (filters.loadingTypes.length > 0) {
      activeCount++;
      filtered = filtered.filter(cargo => cargo.loadingType && filters.loadingTypes.includes(cargo.loadingType));
    }

    if (filters.profitabilityRange[0] > 0 || filters.profitabilityRange[1] < 100) {
      activeCount++;
      filtered = filtered.filter(
        cargo => cargo.profitabilityRate >= filters.profitabilityRange[0] &&
                 cargo.profitabilityRate <= filters.profitabilityRange[1]
      );
    }

    const [minWeight, maxWeight] = filters.weightRange;
    if (minWeight > 0 || maxWeight < 50) {
      activeCount++;
      filtered = filtered.filter(cargo => {
        const weight = parseFloat(cargo.weight?.replace(/[^\d.]/g, '') || '0');
        return weight >= minWeight && weight <= maxWeight;
      });
    }

    const [minVolume, maxVolume] = filters.volumeRange;
    if (minVolume > 0 || maxVolume < 200) {
      activeCount++;
      filtered = filtered.filter(cargo => {
        const volume = parseFloat(cargo.volume?.replace(/[^\d.]/g, '') || '0');
        return volume >= minVolume && volume <= maxVolume;
      });
    }

    const [minDistance, maxDistance] = filters.distanceRange;
    if (minDistance > 0 || maxDistance < 2000) {
      activeCount++;
      filtered = filtered.filter(cargo => {
        const distance = parseFloat(cargo.distance?.replace(/[^\d.]/g, '') || '0');
        return distance >= minDistance && distance <= maxDistance;
      });
    }

    if (filters.loadingDateRange.from || filters.loadingDateRange.to) {
      activeCount++;
      filtered = filtered.filter(cargo => {
        if (!cargo.loadingDate) return false;
        const cargoDate = new Date(cargo.loadingDate);
        const fromDate = filters.loadingDateRange.from ? new Date(filters.loadingDateRange.from) : null;
        const toDate = filters.loadingDateRange.to ? new Date(filters.loadingDateRange.to) : null;
        if (fromDate && cargoDate < fromDate) return false;
        if (toDate && cargoDate > toDate) return false;
        return true;
      });
    }

    if (filters.urgentOnly) {
      activeCount++;
      filtered = filtered.filter(cargo => cargo.urgent);
    }

    console.log('Cargos within radius:', filtered.length, filtered);
    setFilteredCargos(filtered);
    setActiveFiltersCount(activeCount);
    cargosRef.current = filtered;

    if (isMapLoaded) {
      mapboxService.updateCargoData(filtered);
    }
  }, [filters, cargos, isMapLoaded, userLocation, mapCenter, loadingRadius, unloadingRadius]);

  const toggleCargoType = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      cargoTypes: prev.cargoTypes.includes(typeId)
        ? prev.cargoTypes.filter(id => id !== typeId)
        : [...prev.cargoTypes, typeId]
    }));
  };

  const toggleBodyType = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      bodyTypes: prev.bodyTypes.includes(typeId)
        ? prev.bodyTypes.filter(id => id !== typeId)
        : [...prev.bodyTypes, typeId]
    }));
  };

  const toggleLoadingType = (typeId: string) => {
    setFilters(prev => ({
      ...prev,
      loadingTypes: prev.loadingTypes.includes(typeId)
        ? prev.loadingTypes.filter(id => id !== typeId)
        : [...prev.loadingTypes, typeId]
    }));
  };

  const resetFilters = () => {
    setFilters({
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
  };

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      mapboxService.destroy();
    };
  }, []);

  return (
    <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 gpu-accelerated flex flex-col flex-grow min-h-0">
      {/* Map Header */}
      <div className="flex-shrink-0 py-2 px-3 border-b border-gray-700 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">Карта грузов</h2>
            {isLoadingCargos && (
              <p className="text-xs text-gray-400 mt-1 animate-pulse hidden sm:block">Обновление данных...</p>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={getUserGpsLocation}
              disabled={isLocating}
              className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 micro-bounce touch-target ${
                !geolocationSupported 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : geolocationError 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={userLocation ? 'Показать мою позицию' : 'Определить мою позицию'}
            >
              {isLocating ? (
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 animate-spin" />
              ) : geolocationError ? (
                <NavigationIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" />
              ) : (
                <NavigationIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              )}
            </button>
            <button
              onClick={() => setShowRadiusControls(!showRadiusControls)}
              className={`bg-gray-700 hover:bg-gray-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 micro-bounce touch-target ${
                showRadiusControls ? 'ring-2 ring-purple-500' : ''
              }`}
              title="Настройки радиуса поиска"
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className={`relative bg-gray-700 hover:bg-gray-600 p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 micro-bounce touch-target ${
                activeFiltersCount > 0 ? 'ring-2 ring-cyan-500' : ''
              }`}
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-cyan-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <button
              onClick={onToggleFullScreen}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25 touch-target"
              title="Полноэкранный режим"
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Radius Controls */}
        {showRadiusControls && (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-300 bg-gray-700/30 rounded-lg p-3">
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
                        onClick={retryGeolocation}
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

            {/* Loading Radius */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-gray-400">Радиус загрузки</span>
                <span className="text-xs sm:text-sm text-cyan-400 font-medium">{loadingRadius} км</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setLoadingRadius(Math.max(10, loadingRadius - 10))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110 touch-target"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
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
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110 touch-target"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Unloading Radius */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs sm:text-sm text-gray-400">Радиус выгрузки</span>
                <span className="text-xs sm:text-sm text-purple-400 font-medium">{unloadingRadius} км</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setUnloadingRadius(Math.max(500, unloadingRadius - 500))}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110 touch-target"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
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
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 hover:scale-110 touch-target"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="relative transition-all duration-500 overflow-hidden flex-grow min-h-0"
        style={{
          height: 'calc(100vh - 200px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
        }}
      >
        {isLoadingMap && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center animate-in z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
              <span className="text-gray-400 animate-pulse">Загрузка карты...</span>
            </div>
          </div>
        )}

        {!isLoadingMap && !isMapLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center animate-in z-20">
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 max-w-sm mx-4 animate-in slide-in-from-bottom-4">
              <div className="text-red-400 text-sm text-center">
                Не удалось загрузить карту. Проверьте подключение к интернету.
              </div>
            </div>
          </div>
        )}

        {/* Mapbox container */}
        <div
          ref={mapRef}
          className={`map-container transition-opacity duration-500 h-full w-full ${isMapLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Cargo Tooltip */}
        {hoveredCargo && (
          <CargoTooltip
            ref={tooltipRef}
            cargo={hoveredCargo}
            position={tooltipPosition}
            onShowDetails={handleShowDetails}
            onShowNearbyCargos={handleShowNearbyCargos}
            onCloseTooltip={() => setHoveredCargo(null)}
            onTakeCargo={onTakeCargo}
          />
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowFilters(false)}
          />
          {/* Filter panel - responsive positioning */}
          <div className="fixed inset-x-4 top-4 bottom-4 sm:left-4 sm:right-auto sm:w-80 sm:max-w-[calc(100vw-2rem)] z-50 bg-gray-800/95 backdrop-blur-md border border-gray-700 rounded-2xl overflow-hidden animate-in slide-in-from-left-0 duration-300 flex flex-col">
            <div className="flex-shrink-0 p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Фильтры</h3>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={resetFilters}
                      className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 touch-target"
                    >
                      <RotateCcw className="w-4 h-4 text-gray-300" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-200 touch-target"
                  >
                    <X className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 space-y-6 overflow-y-auto min-h-0">
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
        </>
      )}

      {/* Map Legend */}
      <div className="flex-shrink-0 py-2 px-3 bg-gray-700/50 transition-all duration-300">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm">
          <div className="flex items-center gap-2 stagger-item">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Низкая прибыльность</span>
          </div>
          <div className="flex items-center gap-2 stagger-item">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-300">Умеренная прибыльность</span>
          </div>
          <div className="flex items-center gap-2 stagger-item">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-300">Высокая прибыльность</span>
          </div>
        </div>
      </div>

      {/* Панель деталей груза */}
      <CargoDetailPanel
        isOpen={showDetailPanel}
        cargo={selectedCargo}
        onClose={handleCloseDetailPanel}
      />

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

export default MapView;