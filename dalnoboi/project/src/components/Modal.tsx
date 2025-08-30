import React from 'react';
import { X, Star, MapPin, Clock, Truck, Package, Phone, MessageCircle, Heart, AlertTriangle, CheckCircle, Timer, TrendingUp, DollarSign } from 'lucide-react';
import { api, CargoDetails, TruckerDetails } from '../services/api';
import { ProfitabilityColorSystem } from '../services/mapboxService';
import CargoActionPanel from './CargoActionPanel';
import { getOrderPreviewByCargoId } from '../mocks/orderPreview';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CargoDetails | TruckerDetails | null;
  onItemUpdate?: (updatedItem: CargoDetails | TruckerDetails) => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, item, onItemUpdate }) => {
  const [loading, setLoading] = React.useState(false);
  const [showReportForm, setShowReportForm] = React.useState(false);
  const [reportReason, setReportReason] = React.useState<'low_rate' | 'spam' | 'error' | 'other'>('low_rate');
  const [reportComment, setReportComment] = React.useState('');
  const [showBookingConfirm, setShowBookingConfirm] = React.useState(false);
  const [showCargoActionPanel, setShowCargoActionPanel] = React.useState(false);

  if (!isOpen || !item) return null;

  const isCargo = 'weight' in item;
  const cargoItem = item as CargoDetails;
  const truckerItem = item as TruckerDetails;

  const handleToggleFavorite = async () => {
    if (!isCargo) return;
    
    setLoading(true);
    const response = await api.toggleFavorite(cargoItem.id, cargoItem.isFavorite || false);
    
    if (response.success && response.data !== undefined) {
      const updatedItem = { ...cargoItem, isFavorite: response.data };
      onItemUpdate?.(updatedItem);
    }
    setLoading(false);
  };

  const handleSubmitReport = async () => {
    if (!isCargo) return;
    
    setLoading(true);
    const response = await api.submitReport({
      loadId: cargoItem.id,
      reason: reportReason,
      comment: reportComment,
      userId: 1 // Mock user ID
    });
    
    if (response.success) {
      setShowReportForm(false);
      setReportComment('');
    }
    setLoading(false);
  };

  const handleBookCargo = async () => {
    if (!isCargo) return;
    
    setLoading(true);
    console.log('handleBookCargo: Начинаем бронирование груза с ID:', cargoItem.id);
    const response = await api.bookCargo({
      userId: 1, // Mock user ID
      loadId: cargoItem.id
    });
    
    console.log('Результат api.bookCargo:', response);
    if (response.success) {
      console.log('Бронирование успешно, пытаемся показать CargoActionPanel.');
      const updatedItem = { 
        ...cargoItem, 
        isBooked: true, 
        bookingStatus: 'reserved' as const 
      };
      onItemUpdate?.(updatedItem);
      setShowBookingConfirm(false);
      // Показываем CargoActionPanel после успешного бронирования
      console.log('Устанавливаем showCargoActionPanel в true');
      setShowCargoActionPanel(true);
    } else {
      console.log('Бронирование не удалось:', response.error);
    }
    setLoading(false);
  };

  // Обработчик закрытия CargoActionPanel
  const handleCloseCargoActionPanel = () => {
    setShowCargoActionPanel(false);
    // Можно также закрыть основной модал
    onClose();
  };

  // Если показываем CargoActionPanel, рендерим его вместо основного модала
  if (showCargoActionPanel && isCargo) {
    const orderData = getOrderPreviewByCargoId(cargoItem.id);
    return (
      <CargoActionPanel
        orderData={orderData}
        onClose={handleCloseCargoActionPanel}
        onBack={() => setShowCargoActionPanel(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 z-60"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg modal-content flex flex-col gpu-accelerated z-70">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 transition-all duration-300">
          <h2 className="text-xl font-semibold text-white">
            {isCargo ? item.title : item.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200 rotate-on-hover"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isCargo ? (
            // Cargo Details
            <div className="space-y-6 pb-24">
              {/* Status Indicator */}
              {cargoItem.isBooked && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">
                      Груз забронирован - статус: {cargoItem.bookingStatus}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {cargoItem.description && (
                <div className="bg-gray-700/50 rounded-xl p-4 stagger-item">
                  <h4 className="text-white font-medium mb-2">Описание груза</h4>
                  <p className="text-gray-300 text-sm">{cargoItem.description}</p>
                </div>
              )}

              {/* Profitability Analysis */}
              {isCargo && (
                <div className="bg-gray-700/50 rounded-xl p-4 stagger-item hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-400">Анализ прибыльности</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Рейтинг прибыльности:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ProfitabilityColorSystem.getProfitabilityColor(cargoItem.profitabilityRate) }}
                        ></div>
                        <span className="text-white font-semibold">{cargoItem.profitabilityRate}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Категория:</span>
                      <span 
                        className="text-sm font-medium"
                        style={{ color: ProfitabilityColorSystem.getProfitabilityCategory(cargoItem.profitabilityRate).color }}
                      >
                        {ProfitabilityColorSystem.getProfitabilityCategory(cargoItem.profitabilityRate).description}
                      </span>
                    </div>
                    {cargoItem.profitPerKm && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Доход за км:</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-green-400" />
                          <span className="text-white font-medium">{cargoItem.profitPerKm.toFixed(0)} ₽/км</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4 stagger-item hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-400">Вес</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{cargoItem.weight}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 stagger-item hover:bg-gray-700/70 transition-all duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-400">Срок</span>
                  </div>
                  <div className="text-lg font-semibold text-white">{cargoItem.deadline}</div>
                </div>
              </div>

              {/* Route */}
              <div className="bg-gray-700/50 rounded-xl p-4 stagger-item hover:bg-gray-700/70 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Маршрут</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{cargoItem.from}</span>
                  <div className="flex-1 border-t border-dashed border-gray-600"></div>
                  <span className="text-white font-medium">{cargoItem.to}</span>
                </div>
                <div className="text-sm text-gray-400 mt-2">{cargoItem.distance}</div>
              </div>

              {/* Requirements */}
              {cargoItem.requirements && cargoItem.requirements.length > 0 && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Требования</h4>
                  <div className="space-y-2">
                    {cargoItem.requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading Instructions */}
              {cargoItem.loadingInstructions && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">Инструкции по загрузке</h4>
                  <p className="text-gray-300 text-sm">{cargoItem.loadingInstructions}</p>
                </div>
              )}

              {/* Parking Info */}
              {cargoItem.parkingInfo && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-2">Информация о стоянке</h4>
                  <p className="text-gray-300 text-sm">{cargoItem.parkingInfo}</p>
                </div>
              )}

              {/* Contact Info */}
              {cargoItem.contactInfo && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h4 className="text-white font-medium mb-3">Контактная информация</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Имя:</span>
                      <span className="text-sm text-white">{cargoItem.contactInfo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-white">{cargoItem.contactInfo.phone}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rating and Price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-lg font-semibold text-white">{cargoItem.rating}</span>
                  <span className="text-sm text-gray-400">(45 отзывов)</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {cargoItem.price}
                </div>
              </div>

              {/* Report Form */}
              {showReportForm && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <h4 className="text-red-400 font-medium mb-3">Пожаловаться на груз</h4>
                  <div className="space-y-3">
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value as any)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="low_rate">Низкая ставка</option>
                      <option value="spam">Спам</option>
                      <option value="error">Ошибка в данных</option>
                      <option value="other">Другое</option>
                    </select>
                    <textarea
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      placeholder="Комментарий (необязательно)"
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSubmitReport}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                      >
                        {loading ? 'Отправка...' : 'Отправить жалобу'}
                      </button>
                      <button
                        onClick={() => setShowReportForm(false)}
                        className="px-4 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-all duration-200"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking Confirmation */}
              {console.log('Текущее состояние showBookingConfirm:', showBookingConfirm)}
              {showBookingConfirm && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <h4 className="text-cyan-400 font-medium mb-3">Подтверждение бронирования</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Вы уверены, что хотите взять этот груз? После подтверждения вы будете обязаны выполнить заказ.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Нажата кнопка "Подтвердить", вызываем handleBookCargo.');
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

              {/* Action Buttons */}
              {!cargoItem.isBooked && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      console.log('Нажата кнопка "Взять груз", пытаемся показать подтверждение.');
                      setShowBookingConfirm(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 animated-gradient"
                  >
                    Взять груз
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={loading}
                    className={`p-3 rounded-xl transition-all duration-300 micro-bounce ${
                      cargoItem.isFavorite
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${cargoItem.isFavorite ? 'text-white fill-current' : 'text-gray-300'}`} />
                  </button>
                  <button 
                    onClick={() => setShowReportForm(true)}
                    className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-300 micro-bounce"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-300 micro-bounce">
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
              )}

              {/* Booked Status Actions */}
              {cargoItem.isBooked && (
                <div className="space-y-3">
                  <div className="bg-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Время до загрузки</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">02:45:30</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-all duration-200">
                        Я приехал
                      </button>
                      <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-all duration-200">
                        Груз не готов
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Trucker Details
            <div className="space-y-6 pb-24">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <img
                  src={truckerItem.avatar}
                  alt={truckerItem.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">{truckerItem.name}</h3>
                  <p className="text-gray-400 mb-2">Опыт: {truckerItem.experience}</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-white">{truckerItem.rating}</span>
                    <span className="text-sm text-gray-400">({truckerItem.reviews} отзывов)</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">Выполнено заказов</div>
                  <div className="text-xl font-bold text-white">{truckerItem.completedJobs}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-1">Рейтинг</div>
                  <div className="text-xl font-bold text-white">{truckerItem.rating}/5.0</div>
                </div>
              </div>

              {/* Truck Info */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-400">Транспорт</span>
                </div>
                <div className="text-lg font-semibold text-white mb-1">{truckerItem.truck}</div>
                <div className="text-sm text-gray-400">Грузоподъёмность: {truckerItem.capacity}</div>
              </div>

              {/* Location and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Местоположение</span>
                  </div>
                  <div className="text-white font-medium">{truckerItem.location}</div>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="text-sm text-gray-400 mb-2">Статус</div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${
                    truckerItem.available
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      truckerItem.available ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                    {truckerItem.available ? 'Свободен' : 'Занят'}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {truckerItem.phone && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">Телефон</span>
                  </div>
                  <div className="text-white font-medium">{truckerItem.phone}</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${
                    truckerItem.available
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!truckerItem.available}
                >
                  Связаться
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-200">
                  <Phone className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-none p-6 border-t border-gray-700">
          {isCargo && (
            <>
              {/* Action Buttons */}
              {!cargoItem.isBooked && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      console.log('Нажата кнопка "Взять груз" (футер), пытаемся показать подтверждение.');
                      setShowBookingConfirm(true);
                    }}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 animated-gradient"
                  >
                    Взять груз
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    disabled={loading}
                    className={`p-3 rounded-xl transition-all duration-300 micro-bounce ${
                      cargoItem.isFavorite
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${cargoItem.isFavorite ? 'text-white fill-current' : 'text-gray-300'}`} />
                  </button>
                  <button 
                    onClick={() => setShowReportForm(true)}
                    className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-300 micro-bounce"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-300 micro-bounce">
                    <MessageCircle className="w-5 h-5 text-gray-300" />
                  </button>
                </div>
              )}

              {/* Booked Status Actions */}
              {cargoItem.isBooked && (
                <div className="space-y-3">
                  <div className="bg-green-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Время до загрузки</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-4">02:45:30</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-all duration-200">
                        Я приехал
                      </button>
                      <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-medium transition-all duration-200">
                        Груз не готов
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!isCargo && (
            // Trucker Action Buttons
            <div className="flex gap-3">
              <button 
                className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${
                  truckerItem.available
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!truckerItem.available}
              >
                Связаться
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl transition-all duration-200">
                <Phone className="w-5 h-5 text-gray-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;