import React, { useState } from 'react';
import { api, CargoDetails, TruckerDetails } from './services/api';
import Header from './components/Header';
import Navigation from './components/Navigation';
import TruckerCard from './components/TruckerCard';
import MapView from './components/MapView';
import FullScreenMap from './components/FullScreenMap';
import Modal from './components/Modal';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CargoDetails | TruckerDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFullScreenMap, setShowFullScreenMap] = useState(false);
  const [isCargoDetailPanelOpen, setIsCargoDetailPanelOpen] = useState(false);
  const [isNearbyCargosPanelOpen, setIsNearbyCargosPanelOpen] = useState(false);

  const truckerData = [
    {
      id: 1,
      name: 'Алексей Петров',
      experience: '12 лет',
      rating: 4.9,
      truck: 'Volvo FH16',
      capacity: '25 тонн',
      location: 'Москва',
      available: true,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      id: 2,
      name: 'Сергей Иванов',
      experience: '8 лет',
      rating: 4.8,
      truck: 'Mercedes Actros',
      capacity: '20 тонн',
      location: 'Санкт-Петербург',
      available: false,
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    },
    {
      id: 3,
      name: 'Михаил Козлов',
      experience: '15 лет',
      rating: 5.0,
      truck: 'Scania R730',
      capacity: '30 тонн',
      location: 'Краснодар',
      available: true,
      avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
    }
  ];

  const handleItemClick = async (item: any) => {
    setLoading(true);
    setSelectedItem(item);
    setIsModalOpen(true);
    setLoading(false);
  };

  const handleCargoClick = async (cargoId: number) => {
    setLoading(true);
    const response = await api.getCargoDetails(cargoId);
    
    if (response.success && response.data) {
      setSelectedItem(response.data);
      setIsModalOpen(true);
    }
    setLoading(false);
  };

  const handleItemUpdate = (updatedItem: CargoDetails | TruckerDetails) => {
    setSelectedItem(updatedItem);
    // In a real app, you would also update the item in the main list
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {!isModalOpen && !isCargoDetailPanelOpen && !isNearbyCargosPanelOpen && <Header />}
      
      <main className="container mx-auto px-4 py-4 flex-grow main-content">
        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out flex-grow">
          {activeTab === 'truckers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {truckerData.map((trucker) => (
                <TruckerCard
                  key={trucker.id}
                  trucker={trucker}
                  onClick={() => handleItemClick(trucker)}
                />
              ))}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="flex flex-col flex-grow">
              <MapView 
                onCargoClick={handleCargoClick} 
                setIsCargoDetailPanelOpen={setIsCargoDetailPanelOpen}
                setIsNearbyCargosPanelOpen={setIsNearbyCargosPanelOpen}
                onToggleFullScreen={() => setShowFullScreenMap(true)}
              />
            </div>
          )}
        </div>
      </main>

      {!showFullScreenMap && !isCargoDetailPanelOpen && (
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        onItemUpdate={handleItemUpdate}
      />

      {/* Full Screen Map */}
      {showFullScreenMap && (
        <FullScreenMap
          onClose={() => setShowFullScreenMap(false)}
          setIsCargoDetailPanelOpen={setIsCargoDetailPanelOpen}
          setIsNearbyCargosPanelOpen={setIsNearbyCargosPanelOpen}
        />
      )}
    </div>
  );
}

export default App;