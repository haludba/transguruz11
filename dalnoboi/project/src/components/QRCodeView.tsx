import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Package, User, Hash } from 'lucide-react';

interface QRCodeViewProps {
  orderId: string;
  driverId: string;
}

const QRCodeView: React.FC<QRCodeViewProps> = ({ orderId, driverId }) => {
  // Create QR code data with order and driver information
  const qrData = JSON.stringify({
    orderId,
    driverId,
    timestamp: Date.now(),
    type: 'cargo_pickup'
  });

  return (
    <div className="bg-gray-700/50 rounded-xl p-4 h-64 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-1.5 rounded-lg">
          <Package className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-white font-semibold">QR-код для погрузки</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white p-3 rounded-lg">
          <QRCodeCanvas
            value={qrData}
            size={120}
            level="M"
            includeMargin={false}
            fgColor="#000000"
            bgColor="#ffffff"
          />
        </div>
      </div>
      
      <div className="mt-3 space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Hash className="w-3 h-3" />
          <span>Заказ: {orderId}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User className="w-3 h-3" />
          <span>Водитель: {driverId}</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Покажите этот QR-код охране или диспетчеру
      </div>
    </div>
  );
};

export default QRCodeView;