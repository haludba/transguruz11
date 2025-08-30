import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Package, 
  DollarSign, 
  Clock, 
  Truck, 
  Phone, 
  Mail, 
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Weight,
  Ruler,
  Calendar,
  User,
  CreditCard,
  FileText,
  Star,
  Navigation
} from 'lucide-react';
import { CargoMarkerData } from '../services/mapboxService';
import { api } from '../services/api';
import { getOrderPreviewByCargoId } from '../mocks/orderPreview';
import CargoActionPanel from './CargoActionPanel';
import RouteBuilderModal from './RouteBuilderModal';

interface CargoDetailPanelProps {
  cargo: CargoMarkerData | null;
  isOpen: boolean;
  onClose: () => void;
  onTakeCargo?: () => void;
}

const CargoDetailPanel: React.FC<CargoDetailPanelProps> = ({ 
  cargo, 
  isOpen, 
  onClose, 
  onTakeCargo 
}) => {
  const [showRouteBuilderModal, setShowRouteBuilderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [showCargoActionPanel, setShowCargoActionPanel] = useState(false);

  console.log('CargoDetailPanel rendered, isOpen:', isOpen, 'cargo:', cargo?.id);

  if (!isOpen || !cargo) return null;

  // Handle cargo booking
  const handleBookCargo = async () => {
    if (!cargo) return;
    
    setLoading(true);
    console.log('CargoDetailPanel: Начинаем бронирование груза с ID:', cargo.id);
    
    const response = await api.bookCargo({
      userId: 1, // Mock user ID
      loadId: cargo.id
    });
    
    console.log('CargoDetailPanel: Результат api.bookCargo:', response);
    
    if (response.success) {
      console.log('CargoDetailPanel: Бронирование успешно, показываем CargoActionPanel.');
      setShowBookingConfirm(false);
      setShowCargoActionPanel(true);
    } else {
      console.log('CargoDetailPanel: Бронирование не удалось:', response.error);
    }
    setLoading(false);
  };

  // Handle closing CargoActionPanel
  const handleCloseCargoActionPanel = () => {
    console.log('CargoDetailPanel: Закрываем CargoActionPanel и весь DetailPanel');
    setShowCargoActionPanel(false);
    onClose(); // Close the entire detail panel
  };

  // If showing CargoActionPanel, render it instead of the detail panel
  if (showCargoActionPanel && cargo) {
    const orderData = getOrderPreviewByCargoId(cargo.id);
    return (
      <CargoActionPanel
        orderData={orderData}
        onClose={handleCloseCargoActionPanel}
        onBack={() => setShowCargoActionPanel(false)}
      />
    );
  }
  // Mock user location (in production, this would be obtained from geolocation API)
  const userLocation = { lat: 55.7558, lng: 37.6176 }; // Moscow as default

  // Mock detailed data - in real app this would come from API
  const detailedInfo = {
    fullDescription: `Перевозка ${cargo.title.toLowerCase()} по маршруту ${cargo.city} - пункт назначения. Требуется аккуратная погрузка и соблюдение температурного режима.`,
    dimensions: '12м x 2.5м x 2.8м',
    specialRequirements: ['Тентованный кузов', 'Температурный режим +2°C до +8°C', 'Опыт работы от 3 лет'],
    paymentTerms: 'Оплата в течение 3 дней после доставки',
    paymentMethods: ['Банковский перевод', 'Наличные при получении'],
    loadingTime: '08:00 - 17:00',
    unloadingTime: '09:00 - 18:00',
    contact: {
      name: 'Иван Петрович Сидоров',
      phone: '+7 (999) 123-45-67',
      email: 'cargo@example.com',
      company: 'ООО "Грузоперевозки"'
    },
    rating: 4.8,
    reviewsCount: 127,
    completedDeliveries: 1250,
    // Mock coordinates for route building
    fromCoords: { lat: 55.7558, lng: 37.6176 }, // Moscow
    toCoords: { lat: 59.9311, lng: 30.3609 } // Saint Petersburg
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-0 w-full bg-gray-800 z-70 animate-in slide-in-from-right-0 duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 p-4 sm:p-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-white">{cargo.title}</h2>
                <p className="text-sm sm:text-base text-gray-400">Детальная информация о грузе</p>
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
        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto pb-32 sm:pb-40">
          {/* Status & Urgency */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Доступен</span>
            </div>
            {cargo.urgent && (
              <div className="flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Срочная доставка</span>
              </div>
            )}
          </div>

          {/* Route Information */}
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Маршрут доставки
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">{cargo.city}</p>
                  <p className="text-gray-400 text-sm">Пункт загрузки</p>
                </div>
              </div>
              <div className="ml-1.5 border-l-2 border-dashed border-gray-600 h-8"></div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div>
                  <p className="text-white font-medium">Пункт назначения</p>
                  <p className="text-gray-400 text-sm">Место выгрузки</p>
                </div>
              </div>
              {cargo.distance && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <p className="text-gray-300 text-sm">Общее расстояние: <span className="text-white font-medium">{cargo.distance}</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Cargo Details */}
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Характеристики груза
            </h3>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed">{detailedInfo.fullDescription}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cargo.weight && (
                  <div className="flex items-center gap-3">
                    <Weight className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-400 text-xs">Вес</p>
                      <p className="text-white font-medium">{cargo.weight}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Ruler className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Габариты</p>
                    <p className="text-white font-medium">{detailedInfo.dimensions}</p>
                  </div>
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Особые требования:</p>
                <div className="space-y-2">
                  {detailedInfo.specialRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Payment */}
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Стоимость и оплата
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Общая стоимость:</span>
                <span className="text-xl sm:text-2xl font-bold text-green-400">{cargo.price}</span>
              </div>
              
              {cargo.profitPerKm && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Доход за км:</span>
                  <span className="text-white font-medium">{cargo.profitPerKm.toFixed(0)} ₽/км</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-600">
                <p className="text-gray-400 text-sm mb-2">Условия оплаты:</p>
                <p className="text-gray-300 text-sm">{detailedInfo.paymentTerms}</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-2">Способы оплаты:</p>
                <div className="flex flex-wrap gap-2">
                  {detailedInfo.paymentMethods.map((method, index) => (
                    <span key={index} className="bg-gray-600 text-gray-300 px-3 py-1 rounded-lg text-sm">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" />
              Расписание
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cargo.loadingDate && (
                <div>
                  <p className="text-gray-400 text-sm">Дата загрузки:</p>
                  <p className="text-white font-medium">
                    {new Date(cargo.loadingDate).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-400 text-sm">Время загрузки:</p>
                <p className="text-white font-medium">{detailedInfo.loadingTime}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Время выгрузки:</p>
                <p className="text-white font-medium">{detailedInfo.unloadingTime}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-700/50 rounded-xl p-3 sm:p-4">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Контактная информация
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">{detailedInfo.contact.name}</p>
                  <p className="text-gray-400 text-sm">{detailedInfo.contact.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{detailedInfo.contact.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{detailedInfo.contact.email}</span>
                </div>
              </div>

              {/* Rating */}
              <div className="pt-3 border-t border-gray-600">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-white font-medium">{detailedInfo.rating}</span>
                  <span className="text-gray-400 text-sm">({detailedInfo.reviewsCount} отзывов)</span>
                </div>
                <p className="text-gray-400 text-sm">Выполнено заказов: {detailedInfo.completedDeliveries}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-800/98 backdrop-blur-md border-t border-gray-700 p-3 sm:p-4 lg:p-6">
          {/* Booking Confirmation */}
          {showBookingConfirm && (
            <div className="mb-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <h4 className="text-cyan-400 font-medium mb-3">Подтверждение бронирования</h4>
              <p className="text-gray-300 text-sm mb-4">
                Вы уверены, что хотите взять этот груз? После подтверждения вы будете обязаны выполнить заказ.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log('CargoDetailPanel: Нажата кнопка "Подтвердить", вызываем handleBookCargo.');
                    handleBookCargo();
                  }}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Бронирование...' : 'Подтвердить'}
                </button>
                <button
                  onClick={() => setShowBookingConfirm(false)}
                  className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-all duration-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {!showBookingConfirm && (
            <>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button 
                onClick={() => {
                  console.log('CargoDetailPanel: Нажата кнопка "Взять груз", показываем подтверждение.');
                  setShowBookingConfirm(true);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105 min-h-[48px]"
              >
                <Package className="w-5 h-5" />
                <span>Взять груз</span>
              </button>
              <button 
                onClick={() => {
                  // Handle contact
                  window.open(`tel:${detailedInfo.contact.phone}`, '_self');
                }}
                className="sm:flex-none bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 min-h-[48px]"
              >
                <Phone className="w-5 h-5" />
                <span>Связаться</span>
              </button>
            </div>
            
            {/* Route Builder Button */}
            <button
              onClick={() => setShowRouteBuilderModal(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 min-h-[48px]"
            >
              <Navigation className="w-5 h-5" />
              <span>Построить маршрут</span>
            </button>
            </>
          )}
          </div>

      {/* Route Builder Modal */}
      <RouteBuilderModal
        cargo={cargo}
        userLocation={userLocation}
        isOpen={showRouteBuilderModal}
        onClose={() => setShowRouteBuilderModal(false)}
      />
      </div>
    </>
  );
};

export default CargoDetailPanel;