import { mockCargos, getTestCargos, type Cargo } from '../data/mockCargos';
import { ProfitabilityColorSystem } from './mapboxService';

// Debug: Check if mock data is loaded
console.log('Mock cargos imported:', mockCargos.length, 'items');

// API service for handling all server requests
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface CargoDetails {
  id: number;
  title: string;
  weight: string;
  from: string;
  to: string;
  price: string;
  distance: string;
  deadline: string;
  rating: number;
  urgent: boolean;
  type: string;
  profitabilityRate: number; // 0-100 scale where 100 is most profitable
  profitPerKm?: number; // calculated profit per kilometer
  bodyType?: string; // тип кузова
  loadingType?: string; // тип загрузки
  volume?: string; // объем груза
  loadingDate?: string; // дата погрузки
  fromCoords?: { lat: number; lng: number; }; // координаты места загрузки
  toCoords?: { lat: number; lng: number; }; // координаты места выгрузки
  description?: string;
  loadingInstructions?: string;
  parkingInfo?: string;
  requirements?: string[];
  contactInfo?: {
    name: string;
    phone: string;
  };
  isFavorite?: boolean;
  isBooked?: boolean;
  bookingStatus?: 'available' | 'reserved' | 'arrived' | 'loading' | 'loaded' | 'in_transit' | 'delivered';
}

export interface TruckerDetails {
  id: number;
  name: string;
  experience: string;
  rating: number;
  truck: string;
  capacity: string;
  location: string;
  available: boolean;
  avatar: string;
  phone?: string;
  completedJobs?: number;
  reviews?: number;
}

export interface ReportData {
  loadId: number;
  reason: 'low_rate' | 'spam' | 'error' | 'other';
  comment: string;
  userId: number;
}

export interface BookingData {
  userId: number;
  loadId: number;
}

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Show toast notifications
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  // In a real app, this would integrate with a toast library
  console.log(`${type.toUpperCase()}: ${message}`);
  
  // Create a simple toast element
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
};

// Get cargo list with filters including map bounds
export const getCargosInBounds = async (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
  radius?: number;
}): Promise<ApiResponse<CargoDetails[]>> => {
  try {
    await delay(600);
    
    console.log('📦 getCargosInBounds called with bounds:', bounds);
    console.log('📊 Available mockCargos:', mockCargos.length);
    
    // Transform mockCargos to CargoDetails format
    const transformedCargos: CargoDetails[] = mockCargos.map(cargo => {
      const priceStr = `${cargo.price.toLocaleString('ru-RU')} ₽`;
      const weightStr = `${cargo.weight} тонн`;
      const distanceStr = `${cargo.distance} км`;
      
      // Map cargo types to internal types
      const getCargoType = (cargoType: string): string => {
        if (cargoType.includes('Продукты') || cargoType.includes('питания')) return 'food';
        if (cargoType.includes('Стройматериалы') || cargoType.includes('материалы')) return 'construction';
        if (cargoType.includes('Автозапчасти') || cargoType.includes('авто')) return 'auto';
        if (cargoType.includes('Текстиль')) return 'textiles';
        if (cargoType.includes('Электроника')) return 'electronics';
        return 'other';
      };
      
      // Generate random but consistent values for missing fields
      const cargoId = parseInt(cargo.id);
      const urgentChance = cargoId % 3 === 0; // Every 3rd cargo is urgent
      const rating = 4.5 + (cargoId % 5) * 0.1; // Rating between 4.5-4.9
      
      return {
        id: cargoId,
        title: cargo.cargoType,
        weight: weightStr,
        from: cargo.origin.city,
        to: cargo.destination.city,
        price: priceStr,
        distance: distanceStr,
        deadline: `${Math.ceil(cargo.distance / 500)} дня`, // Rough estimate: 1 day per 500km
        rating: rating,
        urgent: urgentChance,
        type: getCargoType(cargo.cargoType),
        profitabilityRate: ProfitabilityColorSystem.calculateProfitabilityRate(priceStr, distanceStr, weightStr),
        isFavorite: false,
        isBooked: false,
        bookingStatus: 'available' as const,
        bodyType: cargo.weight > 15 ? 'tented' : 'refrigerator', // Simple logic for body type
        loadingType: cargoId % 2 === 0 ? 'rear' : 'side', // Alternate loading types
        volume: `${Math.round(cargo.weight * 4)} м³`, // Rough volume calculation
        loadingDate: cargo.loadingDate,
        fromCoords: { lat: cargo.origin.latitude, lng: cargo.origin.longitude },
        toCoords: { lat: cargo.destination.latitude, lng: cargo.destination.longitude },
        description: cargo.description,
        contactInfo: {
          name: cargo.contactName,
          phone: cargo.contactPhone
        }
      };
    });
    
    console.log('🔄 Transformed cargos:', transformedCargos.length);
    console.log('📍 Sample cargo coordinates:', transformedCargos[0]?.fromCoords, transformedCargos[0]?.toCoords);
    
    // Filter cargos based on bounds (basic implementation)
    const filteredCargos = transformedCargos.filter(cargo => {
      if (!cargo.fromCoords || !cargo.toCoords) return false;
      
      // Check if either loading or unloading point is within bounds
      const fromInBounds = cargo.fromCoords.lat >= bounds.south && 
                          cargo.fromCoords.lat <= bounds.north &&
                          cargo.fromCoords.lng >= bounds.west && 
                          cargo.fromCoords.lng <= bounds.east;
                          
      const toInBounds = cargo.toCoords.lat >= bounds.south && 
                        cargo.toCoords.lat <= bounds.north &&
                        cargo.toCoords.lng >= bounds.west && 
                        cargo.toCoords.lng <= bounds.east;
      
      return fromInBounds || toInBounds;
    });
    
    console.log('🎯 Filtered cargos within bounds:', filteredCargos.length);
    console.log('📊 Bounds used for filtering:', bounds);
    
    return { data: filteredCargos, success: true };
  } catch (error) {
    console.error('❌ Error in getCargosInBounds:', error);
    showToast('Не удалось загрузить список грузов', 'error');
    return { error: 'Failed to load cargos', success: false };
  }
};

// API Functions
export const api = {
  // Get detailed cargo information
  async getCargoDetails(id: number): Promise<ApiResponse<CargoDetails>> {
    try {
      await delay(500); // Simulate network delay
      
      // Simulate API response with extended data
      const cargoData: CargoDetails = {
        id,
        title: 'Стройматериалы',
        weight: '20 тонн',
        from: 'Москва',
        to: 'Санкт-Петербург',
        price: '85 000 ₽',
        distance: '635 км',
        deadline: '2 дня',
        rating: 4.8,
        urgent: true,
        type: 'construction',
        profitabilityRate: ProfitabilityColorSystem.calculateProfitabilityRate('85 000 ₽', '635 км', '20 тонн'),
        profitPerKm: parseFloat('85 000 ₽'.replace(/[^\d.]/g, '')) / parseFloat('635 км'.replace(/[^\d.]/g, '')),
        description: 'Перевозка строительных материалов: кирпич, цемент, арматура. Требуется аккуратная погрузка.',
        loadingInstructions: 'Загрузка через 3-и ворота, повернуть направо после КПП. Время загрузки: 08:00-17:00',
        parkingInfo: 'Стоянка для ожидания находится в 200м от ворот. Есть туалет и кафе.',
        requirements: ['Тентованный кузов', 'Грузоподъемность от 20т', 'Опыт работы от 3 лет'],
        contactInfo: {
          name: 'Иван Петров',
          phone: '+7 (999) 123-45-67'
        },
        isFavorite: false,
        isBooked: false,
        bookingStatus: 'available',
        bodyType: 'tented',
        loadingType: 'rear',
        volume: '82 м³',
        loadingDate: '2025-01-20',
        fromCoords: { lat: 55.7558, lng: 37.6176 }, // Москва
        toCoords: { lat: 59.9311, lng: 30.3609 } // Санкт-Петербург
      };
      
      return { data: cargoData, success: true };
    } catch (error) {
      showToast('Не удалось загрузить данные о грузе', 'error');
      return { error: 'Failed to load cargo details', success: false };
    }
  },

  // Get detailed trucker information
  async getTruckerDetails(id: number): Promise<ApiResponse<TruckerDetails>> {
    try {
      await delay(500);
      
      const truckerData: TruckerDetails = {
        id,
        name: 'Алексей Петров',
        experience: '12 лет',
        rating: 4.9,
        truck: 'Volvo FH16',
        capacity: '25 тонн',
        location: 'Москва',
        available: true,
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        phone: '+7 (999) 987-65-43',
        completedJobs: 247,
        reviews: 127
      };
      
      return { data: truckerData, success: true };
    } catch (error) {
      showToast('Не удалось загрузить данные о водителе', 'error');
      return { error: 'Failed to load trucker details', success: false };
    }
  },

  // Submit a report
  async submitReport(reportData: ReportData): Promise<ApiResponse<void>> {
    try {
      await delay(800);
      
      // Simulate successful report submission
      showToast('Жалоба отправлена', 'success');
      return { success: true };
    } catch (error) {
      showToast('Не удалось отправить жалобу', 'error');
      return { error: 'Failed to submit report', success: false };
    }
  },

  // Toggle favorite status
  async toggleFavorite(cargoId: number, isFavorite: boolean): Promise<ApiResponse<boolean>> {
    try {
      await delay(300);
      
      const newStatus = !isFavorite;
      showToast(newStatus ? 'Добавлено в избранное' : 'Удалено из избранного', 'success');
      return { data: newStatus, success: true };
    } catch (error) {
      showToast('Не удалось обновить избранное', 'error');
      return { error: 'Failed to update favorite', success: false };
    }
  },

  // Book a cargo
  async bookCargo(bookingData: BookingData): Promise<ApiResponse<string>> {
    try {
      await delay(1000);
      
      // Simulate successful booking
      showToast('Груз забронирован', 'success');
      return { data: 'reserved', success: true };
    } catch (error) {
      showToast('Не удалось забронировать груз', 'error');
      return { error: 'Failed to book cargo', success: false };
    }
  },

  // Get cargo list with filters
  async getCargos(filters: {
    center?: { lat: number; lng: number };
    radius?: number;
    weightMin?: number;
    weightMax?: number;
  } = {}): Promise<ApiResponse<CargoDetails[]>> {
    // Use the new bounds-based function with a default bounds
    const defaultBounds = {
      north: 60,
      south: 50,
      east: 40,
      west: 30,
      radius: filters.radius
    };
    
    return getCargosInBounds(defaultBounds);
  },

  // Get cargos within map bounds
  getCargosInBounds
};