import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, Package, Clock, MapPin } from 'lucide-react';
import { OrderPreviewData } from '../mocks/orderPreview';
import QRCodeView from './QRCodeView';
import MediaGallery from './MediaGallery';
import LocationMap from './LocationMap';

/*
  Z-INDEX LAYERS DOCUMENTATION:
  - Map base layer: z-0 (default)
  - Navigation/header elements: z-10
  - Content panels and cards: z-20
  - Tooltips and dropdowns: z-40
  - Modal backdrops: z-50
  - Modal content: z-60
  - Critical overlays: z-70
  
  HEIGHT CALCULATIONS:
  - Mobile: max-h-[calc(100vh-120px)] (header + safe areas)
  - Tablet: max-h-[calc(100vh-140px)] (more header space)
  - Desktop: max-h-[calc(100vh-160px)] (full header + margins)
  
  RESPONSIVE BREAKPOINTS:
  - Mobile: < 768px (single column)
  - Tablet: 768px - 1024px (2 columns)
  - Desktop: > 1024px (3 columns)
*/

interface CargoActionPanelProps {
  orderData: OrderPreviewData;
  onClose: () => void;
  onBack?: () => void;
}

const CargoActionPanel: React.FC<CargoActionPanelProps> = ({ 
  orderData, 
  onClose, 
  onBack 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Debug logs
  console.log('CargoActionPanel: orderData.status =', orderData.status);
  console.log('CargoActionPanel: full orderData =', orderData);

  // Анимация появления панели
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Расчёт примерного времени ожидания для статуса 'waiting'
  const calculateWaitingTime = () => {
    if (orderData.status !== 'waiting') return 0;
    return orderData.queue.position * orderData.queue.avgPerTruckMin;
  };

  const waitingTimeMinutes = calculateWaitingTime();
  const waitingTimeHours = Math.floor(waitingTimeMinutes / 60);
  const remainingMinutes = waitingTimeMinutes % 60;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Main Panel */}
      <div className={`fixed inset-0 bg-gray-800 z-70 flex flex-col transition-all duration-300 ${
        isVisible ? 'animate-in slide-in-from-right-0' : 'translate-x-full'
      }`}>
        
        {/* Header - фиксированный, компактный */}
        <div className="flex-shrink-0 bg-gray-800/95 backdrop-blur-md border-b border-gray-700 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200"
                  title="Назад"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-2 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {orderData.status === 'ready' ? 'Груз готов к погрузке' : 'Ожидание погрузки'}
                </h2>
                <p className="text-sm text-gray-400">Заказ #{orderData.orderId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-xl transition-all duration-200"
              title="Закрыть"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content Body - адаптивная сетка с прокруткой */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* Status-specific content */}
            {orderData.status === 'ready' ? (
              // READY STATUS: QR + Map + Media Gallery
              <div className="space-y-6">
                
                {/* Shipper Comment - всегда вверху для ready статуса */}
                {orderData.commentFromShipper && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-blue-400 font-medium text-sm mb-1">Комментарий от грузовладельца</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{orderData.commentFromShipper}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Responsive Grid для ready статуса */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  {/* Column A: Loading Place Map */}
                  <div className="lg:col-span-1">
                    <LocationMap
                      coords={orderData.loadingLocation.coords}
                      title="Место погрузки"
                      address={orderData.loadingLocation.address}
                      markerColor="#06b6d4"
                    />
                  </div>

                  {/* Column B: QR Code View */}
                  <div className="lg:col-span-1">
                    <QRCodeView
                      orderId={orderData.orderId}
                      driverId={orderData.driverId}
                    />
                  </div>

                  {/* Column C: Media Gallery */}
                  {orderData.media.length > 0 && (
                    <div className="lg:col-span-1 xl:col-span-1">
                      <MediaGallery media={orderData.media} />
                    </div>
                  )}
                </div>

                {/* Parking info для ready статуса */}
                {orderData.parking && (
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <h4 className="text-purple-400 font-medium">Где можно подождать</h4>
                    </div>
                    <p className="text-gray-300 text-sm">{orderData.parking.note}</p>
                  </div>
                )}
              </div>
            ) : (
              // WAITING STATUS: Waiting Info + Parking
              <div className="space-y-6 bg-red-500 p-4 rounded-xl">
                <h1 className="text-white text-2xl font-bold">WAITING SCENARIO TEST - VISIBLE!</h1>
                
                {/* Waiting Info Block - будет создан в следующих шагах */}
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-orange-400" />
                    <div>
                      <h3 className="text-orange-400 font-semibold text-lg">Груз ещё не готов</h3>
                      <p className="text-gray-300 text-sm">{orderData.commentFromShipper}</p>
                    </div>
                  </div>
                  
                  {/* Queue Information */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Информация об очереди</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-cyan-400">{orderData.queue.position}</div>
                        <div className="text-xs text-gray-400">Ваша позиция</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{orderData.queue.total}</div>
                        <div className="text-xs text-gray-400">Всего в очереди</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">
                          {waitingTimeHours > 0 ? `${waitingTimeHours}ч ${remainingMinutes}м` : `${remainingMinutes}м`}
                        </div>
                        <div className="text-xs text-gray-400">Примерное ожидание</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parking/Waiting Area для waiting статуса */}
                {orderData.parking && (
                  <div className="bg-gray-700/50 rounded-xl p-4">
                    <LocationMap
                      coords={orderData.parking.coords}
                      title={orderData.parking.title || 'Место ожидания'}
                      address={orderData.parking.note}
                      markerColor="#8b5cf6"
                      className="h-48"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CargoActionPanel;