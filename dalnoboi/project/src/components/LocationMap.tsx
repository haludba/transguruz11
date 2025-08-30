import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { MapPin } from 'lucide-react';

interface LocationMapProps {
  coords: { lat: number; lng: number };
  title?: string;
  address?: string;
  markerColor?: string;
  className?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  coords, 
  title, 
  address, 
  markerColor = '#06b6d4',
  className = 'h-64'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1IjoiaGFsdWRiYSIsImEiOiJjbWM1dm5lYnowZDJhMmpzOXhwaWlqZDh1In0.wQCA4N58a0cox_9mp8n7KA';

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [coords.lng, coords.lat],
      zoom: 14,
      attributionControl: false,
      interactive: true
    });

    // Add marker
    const marker = new mapboxgl.Marker({
      color: markerColor
    })
      .setLngLat([coords.lng, coords.lat])
      .addTo(map);

    // Add popup if title is provided
    if (title) {
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        closeOnClick: false
      })
        .setLngLat([coords.lng, coords.lat])
        .setHTML(`
          <div class="text-sm">
            <div class="font-semibold text-gray-900">${title}</div>
            ${address ? `<div class="text-gray-600 mt-1">${address}</div>` : ''}
          </div>
        `)
        .addTo(map);
    }

    // Store map instance
    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.lat, coords.lng, title, address, markerColor]);

  return (
    <div className="bg-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white font-semibold">{title || 'Местоположение'}</h3>
      </div>
      
      {address && (
        <div className="text-gray-400 text-sm mb-3">
          {address}
        </div>
      )}
      
      <div className="text-gray-400 text-xs mb-3">
        Координаты: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
      </div>
      
      <div 
        ref={mapRef} 
        className={`${className} rounded-lg overflow-hidden border border-gray-600`}
      />
    </div>
  );
};

export default LocationMap;