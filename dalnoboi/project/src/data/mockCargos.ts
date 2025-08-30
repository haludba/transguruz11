export interface Cargo {
  id: string;
  origin: {
    city: string;
    region: string;
    coordinates: [number, number]; // [lng, lat]
    latitude: number;
    longitude: number;
  };
  destination: {
    city: string;
    region: string;
    coordinates: [number, number]; // [lng, lat]
    latitude: number;
    longitude: number;
  };
  description: string;
  weight: number; // в тоннах
  price: number; // в рублях
  contactPhone: string;
  contactName: string;
  contactName: string;
  loadingDate: string;
  cargoType: string;
  distance: number; // в км
}

export const mockCargos: Cargo[] = [
  {
    id: '1',
    origin: {
      city: 'Махачкала',
      region: 'Дагестан',
      coordinates: [47.5047, 42.9849],
      latitude: 42.9849,
      longitude: 47.5047
    },
    destination: {
      city: 'Москва',
      region: 'Московская область',
      coordinates: [37.6176, 55.7558],
      latitude: 55.7558,
      longitude: 37.6176
    },
    description: 'Фрукты и овощи (яблоки, груши, виноград)',
    weight: 20,
    price: 180000,
    contactPhone: '+7 (928) 555-0101',
    contactName: 'Магомед Алиев',
    loadingDate: '2025-01-20',
    cargoType: 'Продукты питания',
    distance: 1520
  },
  {
    id: '2',
    origin: {
      city: 'Дербент',
      region: 'Дагестан',
      coordinates: [48.2898, 42.0579],
      latitude: 42.0579,
      longitude: 48.2898
    },
    destination: {
      city: 'Санкт-Петербург',
      region: 'Ленинградская область',
      coordinates: [30.3351, 59.9311],
      latitude: 59.9311,
      longitude: 30.3351
    },
    description: 'Консервированные овощи и соленья',
    weight: 15,
    price: 220000,
    contactPhone: '+7 (928) 555-0102',
    contactName: 'Рашид Гасанов',
    loadingDate: '2025-01-22',
    cargoType: 'Консервы',
    distance: 1890
  },
  {
    id: '3',
    origin: {
      city: 'Каспийск',
      region: 'Дагестан',
      coordinates: [47.6386, 42.8816],
      latitude: 42.8816,
      longitude: 47.6386
    },
    destination: {
      city: 'Екатеринбург',
      region: 'Свердловская область',
      coordinates: [60.6122, 56.8431],
      latitude: 56.8431,
      longitude: 60.6122
    },
    description: 'Рыба и морепродукты (осетр, судак, вобла)',
    weight: 12,
    price: 165000,
    contactPhone: '+7 (928) 555-0103',
    contactName: 'Ибрагим Мусаев',
    loadingDate: '2025-01-25',
    cargoType: 'Морепродукты',
    distance: 1680
  },
  {
    id: '4',
    origin: {
      city: 'Буйнакск',
      region: 'Дагестан',
      coordinates: [47.1167, 42.8167],
      latitude: 42.8167,
      longitude: 47.1167
    },
    destination: {
      city: 'Новосибирск',
      region: 'Новосибирская область',
      coordinates: [82.9346, 55.0084],
      latitude: 55.0084,
      longitude: 82.9346
    },
    description: 'Сухофрукты и орехи (курага, изюм, грецкие орехи)',
    weight: 8,
    price: 280000,
    contactPhone: '+7 (928) 555-0104',
    contactName: 'Амир Абдуллаев',
    loadingDate: '2025-01-28',
    cargoType: 'Сухофрукты',
    distance: 2850
  },
  {
    id: '5',
    origin: {
      city: 'Хасавюрт',
      region: 'Дагестан',
      coordinates: [46.5881, 43.2509],
      latitude: 43.2509,
      longitude: 46.5881
    },
    destination: {
      city: 'Краснодар',
      region: 'Краснодарский край',
      coordinates: [38.9769, 45.0355],
      latitude: 45.0355,
      longitude: 38.9769
    },
    description: 'Мед и продукты пчеловодства',
    weight: 5,
    price: 85000,
    contactPhone: '+7 (928) 555-0105',
    contactName: 'Салман Магомедов',
    loadingDate: '2025-01-30',
    cargoType: 'Продукты пчеловодства',
    distance: 580
  },
  {
    id: '6',
    origin: {
      city: 'Избербаш',
      region: 'Дагестан',
      coordinates: [47.8667, 42.5667],
      latitude: 42.5667,
      longitude: 47.8667
    },
    destination: {
      city: 'Ростов-на-Дону',
      region: 'Ростовская область',
      coordinates: [39.7015, 47.2357],
      latitude: 47.2357,
      longitude: 39.7015
    },
    description: 'Ковры и текстильные изделия ручной работы',
    weight: 3,
    price: 95000,
    contactPhone: '+7 (928) 555-0106',
    contactName: 'Гаджи Исмаилов',
    loadingDate: '2025-02-02',
    cargoType: 'Текстиль',
    distance: 650
  },
  {
    id: '7',
    origin: {
      city: 'Кизляр',
      region: 'Дагестан',
      coordinates: [46.7133, 43.8567],
      latitude: 43.8567,
      longitude: 46.7133
    },
    destination: {
      city: 'Казань',
      region: 'Республика Татарстан',
      coordinates: [49.1221, 55.7887],
      latitude: 55.7887,
      longitude: 49.1221
    },
    description: 'Коньяк и алкогольные напитки',
    weight: 10,
    price: 140000,
    contactPhone: '+7 (928) 555-0107',
    contactName: 'Руслан Омаров',
    loadingDate: '2025-02-05',
    cargoType: 'Алкогольные напитки',
    distance: 1250
  },
  {
    id: '8',
    origin: {
      city: 'Махачкала',
      region: 'Дагестан',
      coordinates: [47.5047, 42.9849],
      latitude: 42.9849,
      longitude: 47.5047
    },
    destination: {
      city: 'Нижний Новгород',
      region: 'Нижегородская область',
      coordinates: [44.0020, 56.2965],
      latitude: 56.2965,
      longitude: 44.0020
    },
    description: 'Строительные материалы (камень, песок)',
    weight: 25,
    price: 200000,
    contactPhone: '+7 (928) 555-0108',
    contactName: 'Арсен Гаджиев',
    loadingDate: '2025-02-08',
    cargoType: 'Стройматериалы',
    distance: 1180
  },
  {
    id: '9',
    origin: {
      city: 'Дагестанские Огни',
      region: 'Дагестан',
      coordinates: [48.1917, 42.1167],
      latitude: 42.1167,
      longitude: 48.1917
    },
    destination: {
      city: 'Воронеж',
      region: 'Воронежская область',
      coordinates: [39.1843, 51.6720],
      latitude: 51.6720,
      longitude: 39.1843
    },
    description: 'Минеральная вода и безалкогольные напитки',
    weight: 18,
    price: 155000,
    contactPhone: '+7 (928) 555-0109',
    contactName: 'Камиль Рамазанов',
    loadingDate: '2025-02-10',
    cargoType: 'Напитки',
    distance: 1050
  },
  {
    id: '10',
    origin: {
      city: 'Южно-Сухокумск',
      region: 'Дагестан',
      coordinates: [45.6500, 44.6667],
      latitude: 44.6667,
      longitude: 45.6500
    },
    destination: {
      city: 'Самара',
      region: 'Самарская область',
      coordinates: [50.1155, 53.2001],
      latitude: 53.2001,
      longitude: 50.1155
    },
    description: 'Сельскохозяйственная продукция (зерно, бобовые)',
    weight: 22,
    price: 175000,
    contactPhone: '+7 (928) 555-0110',
    contactName: 'Заур Абакаров',
    loadingDate: '2025-02-12',
    cargoType: 'Зерновые',
    distance: 980
  }
];

// Debug: Log mock data on module load
console.log('mockCargos.ts loaded with', mockCargos.length, 'cargo items');
console.log('First cargo sample:', mockCargos[0]);

export const getTestCargos = (): Cargo[] => {
  return mockCargos;
};