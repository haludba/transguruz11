// Mock data for order preview after cargo booking
// Contains all necessary data for different cargo statuses and UI states

export interface OrderPreviewData {
  orderId: string;
  driverId: string;
  commentFromShipper: string; // короткий текст от грузовладельца
  loadingLocation: {
    coords: { lat: number; lng: number };
    address?: string;
  };
  media: Array<
    | { type: 'image'; url: string; title?: string }
    | { type: 'video'; url: string; title?: string; poster?: string }
  >;
  status: 'ready' | 'waiting'; // ready -> показываем QR; waiting -> показываем экран ожидания
  queue: { 
    position: number; 
    total: number; 
    avgPerTruckMin: number; // среднее время на одну машину в минутах
  };
  parking?: {
    coords: { lat: number; lng: number };
    title?: string;
    note?: string;
  };
}

// Mock data examples for different scenarios
export const mockOrderPreviews: OrderPreviewData[] = [
  // Scenario 1: Cargo is ready for pickup (status: 'ready')
  {
    orderId: 'ORD-2025-001234',
    driverId: 'DRV-789456',
    commentFromShipper: 'Груз готов к погрузке. Подъезжайте к 3-м воротам, покажите QR-код охране.',
    loadingLocation: {
      coords: { lat: 55.7558, lng: 37.6176 }, // Moscow
      address: 'г. Москва, ул. Складская, д. 15, стр. 3'
    },
    media: [
      {
        type: 'image',
        url: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'Фото груза - стройматериалы'
      },
      {
        type: 'image',
        url: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'Упаковка и маркировка'
      },
      {
        type: 'video',
        url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        title: 'Видео инструкция по погрузке',
        poster: 'https://images.pexels.com/photos/1267338/pexels-photo-1267338.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        type: 'image',
        url: 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=800',
        title: 'Документы на груз'
      }
    ],
    status: 'ready',
    queue: { position: 0, total: 0, avgPerTruckMin: 0 }, // не используется для ready
    parking: {
      coords: { lat: 55.7548, lng: 37.6186 }, // рядом с местом погрузки
      title: 'Стоянка для ожидания',
      note: 'Бесплатная стоянка в 200м от ворот. Есть туалет и кафе.'
    }
  },
  
  // Scenario 2: Cargo is not ready, driver needs to wait (status: 'waiting')
  {
    orderId: 'ORD-2025-001235',
    driverId: 'DRV-789457',
    commentFromShipper: 'Груз ещё готовится. Ожидайте на стоянке, уведомим когда будет готов.',
    loadingLocation: {
      coords: { lat: 59.9311, lng: 30.3609 }, // Saint Petersburg
      address: 'г. Санкт-Петербург, Индустриальный пр., д. 44'
    },
    media: [], // пустая галерея для waiting статуса
    status: 'waiting',
    queue: { 
      position: 3, 
      total: 8, 
      avgPerTruckMin: 25 // 25 минут на одну машину
    },
    parking: {
      coords: { lat: 59.9301, lng: 30.3619 }, // рядом с местом погрузки
      title: 'Стоянка водителей',
      note: 'Охраняемая стоянка. Работает круглосуточно. Есть душ, столовая и комната отдыха.'
    }
  }
];

// Helper function to get order preview by cargo ID (for demo purposes)
export const getOrderPreviewByCargoId = (cargoId: number): OrderPreviewData => {
  // В реальном приложении здесь был бы API запрос
  // Для демо возвращаем разные данные в зависимости от ID
  const isEvenId = cargoId % 2 === 0;
  return mockOrderPreviews[isEvenId ? 0 : 1];
};