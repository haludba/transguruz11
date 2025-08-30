import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

// Mapbox configuration
export interface MapboxConfig {
  accessToken: string;
  style: string;
  center: [number, number];
  zoom: number;
}

export interface CargoMarkerData {
  id: number;
  lat: number;
  lng: number;
  title: string;
  price: string;
  urgent: boolean;
  type: string;
  city: string;
  weight?: string;
  distance?: string;
  profitabilityRate: number; // 0-100 scale
  profitPerKm?: number;
  bodyType?: string;
  loadingType?: string;
  volume?: string;
  loadingDate?: string;
  fromCoords?: { lat: number; lng: number; }; // координаты места загрузки
  toCoords?: { lat: number; lng: number; }; // координаты места выгрузки
}

// Profitability color calculation utilities
export class ProfitabilityColorSystem {
  /**
   * Calculate color based on profitability rate (0-100)
   * Uses HSL color space for smooth transitions:
   * - 0-20: Red (HSL: 0°, high saturation)
   * - 21-40: Orange-Red (HSL: 15-30°)
   * - 41-60: Yellow (HSL: 45-60°)
   * - 61-80: Yellow-Green (HSL: 75-90°)
   * - 81-100: Green (HSL: 120°, high saturation)
   */
  static getProfitabilityColor(profitabilityRate: number): string {
    // Clamp the rate between 0 and 100
    const rate = Math.max(0, Math.min(100, profitabilityRate));
    
    // Calculate hue: 0° (red) to 120° (green)
    const hue = (rate / 100) * 120;
    
    // Calculate saturation: higher for extreme values (very profitable or unprofitable)
    const saturation = rate < 20 || rate > 80 ? 85 : 70;
    
    // Calculate lightness: slightly darker for better visibility on map
    const lightness = 50;
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  /**
   * Get profitability category for display purposes
   */
  static getProfitabilityCategory(profitabilityRate: number): {
    category: string;
    color: string;
    description: string;
  } {
    if (profitabilityRate >= 81) {
      return {
        category: 'excellent',
        color: '#22c55e', // green-500
        description: 'Отличная прибыльность'
      };
    } else if (profitabilityRate >= 61) {
      return {
        category: 'good',
        color: '#84cc16', // lime-500
        description: 'Хорошая прибыльность'
      };
    } else if (profitabilityRate >= 41) {
      return {
        category: 'moderate',
        color: '#eab308', // yellow-500
        description: 'Умеренная прибыльность'
      };
    } else if (profitabilityRate >= 21) {
      return {
        category: 'low',
        color: '#f97316', // orange-500
        description: 'Низкая прибыльность'
      };
    } else {
      return {
        category: 'poor',
        color: '#ef4444', // red-500
        description: 'Убыточный груз'
      };
    }
  }
  
  /**
   * Calculate profitability rate based on price and distance
   * This is a simplified calculation - in real app would include more factors
   */
  static calculateProfitabilityRate(price: string, distance: string, weight: string): number {
    // Extract numeric values
    const priceNum = parseFloat(price.replace(/[^\d.]/g, ''));
    const distanceNum = parseFloat(distance.replace(/[^\d.]/g, ''));
    const weightNum = parseFloat(weight.replace(/[^\d.]/g, ''));
    
    if (!priceNum || !distanceNum || !weightNum) return 50; // Default moderate
    
    // Calculate profit per km per ton (simplified metric)
    const profitPerKmPerTon = priceNum / (distanceNum * weightNum);
    
    // Map to 0-100 scale (these thresholds would be calibrated with real data)
    if (profitPerKmPerTon >= 200) return 95;
    if (profitPerKmPerTon >= 150) return 85;
    if (profitPerKmPerTon >= 100) return 75;
    if (profitPerKmPerTon >= 75) return 65;
    if (profitPerKmPerTon >= 50) return 55;
    if (profitPerKmPerTon >= 30) return 45;
    if (profitPerKmPerTon >= 20) return 35;
    if (profitPerKmPerTon >= 10) return 25;
    return 15;
  }
}

// Default Mapbox configuration
export const MAPBOX_CONFIG: MapboxConfig = {
  accessToken: 'pk.eyJ1IjoiaGFsdWRiYSIsImEiOiJjbWM1dm5lYnowZDJhMmpzOXhwaWlqZDh1In0.wQCA4N58a0cox_9mp8n7KA',
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [37.6176, 55.7558], // Moscow [lng, lat]
  zoom: 6
};

export class MapboxService {
  private static instance: MapboxService;
  private map: mapboxgl.Map | null = null;
  private eventHandlersSetup = false;
  private radiusCircle: GeoJSON.Feature<GeoJSON.Polygon> | null = null;
  private isLoaded = false;
  private resizeHandler: (() => void) | null = null;
  private userLocationMarkerAdded = false;

  private constructor() {}

  static getInstance(): MapboxService {
    if (!MapboxService.instance) {
      MapboxService.instance = new MapboxService();
    }
    return MapboxService.instance;
  }

  initializeMap(container: HTMLElement, config: Partial<MapboxConfig> = {}): mapboxgl.Map {
  }
  initializeMap(container: HTMLElement, config: Partial<MapboxConfig> = {}, onMapMoveEnd?: (center: { lat: number; lng: number }) => void): mapboxgl.Map {
    const finalConfig = { ...MAPBOX_CONFIG, ...config };
    
    // Set access token
    mapboxgl.accessToken = finalConfig.accessToken;

    this.map = new mapboxgl.Map({
      container,
      style: finalConfig.style,
      center: finalConfig.center,
      zoom: finalConfig.zoom,
      antialias: true,
      attributionControl: false
    });

    // Add navigation controls
    this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Setup resize handler
    this.resizeHandler = () => {
      if (this.map) {
        this.map.resize();
      }
    };
    
    // Add resize listener
    window.addEventListener('resize', this.resizeHandler);
    
    // Also listen for container size changes using ResizeObserver if available
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.resize();
        }
      });
      resizeObserver.observe(container);
      
      // Store observer for cleanup
      (this.map as any)._resizeObserver = resizeObserver;
    }
    
    // Add moveend event listener if callback is provided
    if (onMapMoveEnd) {
      this.map.on('moveend', () => {
        if (this.map && onMapMoveEnd) {
          const center = this.map.getCenter();
          onMapMoveEnd({ lat: center.lat, lng: center.lng });
        }
      });
    }
    
    return this.map;
  }

  setupCargoLayers(onCargoClick: (cargoId: number) => void): void {
  }
  setupCargoLayers(onCargoClick: (cargoId: number, event: any) => void): void {
  }
  setupCargoLayers(onCargoClick: (cargoId: number, event: any) => void, onMapReady?: () => void): void {
    if (!this.map) return;

    this.map.on('load', () => {
      // Ensure map is properly sized after load
      this.map!.resize();
      
      // Check if sources already exist before adding them
      if (!this.map!.getSource('cargos')) {
        this.addCargoSource();
        this.addCargoLayers();
      }
      
      if (!this.map!.getSource('loading-radius-circle')) {
        this.addRadiusSource();
        this.addRadiusLayer();
      }
      
      // Only setup event handlers once
      if (!this.eventHandlersSetup) {
        this.setupEventHandlers(onCargoClick);
        this.eventHandlersSetup = true;
      }
      
      // Add user location source and layer
      this.addUserLocationSourceAndLayer();
      
      // Call the ready callback after everything is set up
      onMapReady?.();
    });
  }

  private addCargoSource(): void {
    if (!this.map) return;

    this.map.addSource('cargos', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });
  }

  private addCargoLayers(): void {
    if (!this.map) return;

    // Cluster circles
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'cargos',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#06b6d4', // cyan for small clusters
          10,
          '#3b82f6', // blue for medium clusters
          30,
          '#8b5cf6'  // purple for large clusters
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20, // small clusters
          10,
          25, // medium clusters
          30,
          30  // large clusters
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Cluster count labels
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'cargos',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Individual cargo points
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'cargos',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'profitabilityColor'],
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['get', 'profitabilityRate'],
          0, 8,   // poor profitability - smaller
          50, 10, // moderate profitability - normal
          100, 14 // excellent profitability - larger
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['get', 'profitabilityRate'],
          0, 0.7,   // less opacity for poor profitability
          50, 0.8,  // normal opacity
          100, 0.95 // high opacity for excellent profitability
        ],
        'circle-pitch-alignment': 'map'
      }
    });

    // Cargo labels
    this.map.addLayer({
      id: 'cargo-labels',
      type: 'symbol',
      source: 'cargos',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'price'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 10,
        'text-offset': [0, 2],
        'text-anchor': 'top',
        'text-allow-overlap': false,
        'text-ignore-placement': false
      },
      paint: {
        'text-color': '#E6E6E6',
        'text-halo-color': '#0b0b0d',
        'text-halo-width': 2,
        'text-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.6,
          10, 1
        ]
      }
    });
  }

  private addRadiusSource(): void {
    if (!this.map) return;

    // Add loading radius circle source
    this.map.addSource('loading-radius-circle', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      lineMetrics: true
    });

    // Add unloading radius circle source
    this.map.addSource('unloading-radius-circle', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      lineMetrics: true
    });
  }

  private addRadiusLayer(): void {
    if (!this.map) return;

    // Add loading radius circle layers
    this.map.addLayer({
      id: 'loading-radius-fill',
      type: 'fill',
      source: 'loading-radius-circle',
      paint: {
        'fill-color': '#06b6d4',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.05,
          10, 0.1,
          15, 0.15
        ]
      }
    });

    this.map.addLayer({
      id: 'loading-radius-stroke',
      type: 'line',
      source: 'loading-radius-circle',
      paint: {
        'line-color': '#06b6d4',
        'line-width': 2,
        'line-opacity': 0.6
      }
    });

    // Add unloading radius circle layers
    this.map.addLayer({
      id: 'unloading-radius-fill',
      type: 'fill',
      source: 'unloading-radius-circle',
      paint: {
        'fill-color': '#8b5cf6',
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.05,
          10, 0.1,
          15, 0.15
        ]
      }
    });

    this.map.addLayer({
      id: 'unloading-radius-stroke',
      type: 'line',
      source: 'unloading-radius-circle',
      paint: {
        'line-color': '#8b5cf6',
        'line-width': 2,
        'line-opacity': 0.6,
        'line-dasharray': [4, 4]
      }
    });

    this.isLoaded = true;
  }

  private addUserLocationSourceAndLayer(): void {
    if (!this.map || this.userLocationMarkerAdded) return;

    // Add user location source
    this.map.addSource('user-location', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });

    // Add user location outer circle (accuracy indicator)
    this.map.addLayer({
      id: 'user-location-accuracy',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 20,
        'circle-color': '#4ade80',
        'circle-opacity': 0.1,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#4ade80',
        'circle-stroke-opacity': 0.3
      }
    });

    // Add user location main marker
    this.map.addLayer({
      id: 'user-location-marker',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 8,
        'circle-color': '#22c55e',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 1
      }
    });

    // Add user location pulse animation
    this.map.addLayer({
      id: 'user-location-pulse',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 15,
          15, 25
        ],
        'circle-color': '#22c55e',
        'circle-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          5, 0.3,
          15, 0.1
        ],
        'circle-stroke-width': 0
      }
    });

    this.userLocationMarkerAdded = true;
  }

  updateUserLocationMarker(coords: [number, number]): void {
    if (!this.map || !this.isLoaded) return;

    const userLocationData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          type: 'user-location'
        }
      }]
    };

    const source = this.map.getSource('user-location') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(userLocationData);
    }
  }

  clearUserLocationMarker(): void {
    if (!this.map || !this.isLoaded) return;

    const emptyData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const source = this.map.getSource('user-location') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(emptyData);
    }
  }

  clearRadiusCircles(): void {
    if (!this.map || !this.isLoaded) return;

    const emptyData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    };

    const loadingSource = this.map.getSource('loading-radius-circle') as mapboxgl.GeoJSONSource;
    if (loadingSource) {
      loadingSource.setData(emptyData);
    }

    const unloadingSource = this.map.getSource('unloading-radius-circle') as mapboxgl.GeoJSONSource;
    if (unloadingSource) {
      unloadingSource.setData(emptyData);
    }
  }

  private setupEventHandlers(onCargoClick: (cargoId: number, event: any) => void): void {
    if (!this.map) return;

    console.log('🔧 Setting up event handlers for cargo clicks');

    // Cluster click - zoom in
    this.map.on('click', 'clusters', (e) => {
      console.log('🎯 Cluster clicked');
      const features = this.map!.queryRenderedFeatures(e.point, {
        layers: ['clusters']
      });

      if (features.length > 0) {
        const clusterId = features[0].properties!.cluster_id;
        const source = this.map!.getSource('cargos') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          
          const center = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
          this.map!.easeTo({
            center,
            zoom: zoom || this.map!.getZoom() + 1
          });
        });
      }
    });

    // Individual cargo click
    this.map.on('click', 'unclustered-point', (e) => {
      console.log('🎯 Unclustered point clicked', e);
      const features = e.features;
      console.log('📦 Features found:', features);
      if (features && features.length > 0) {
        console.log('📋 Feature properties:', features[0].properties);
        const cargoId = Number(features[0].properties!.id);
        console.log('🆔 Cargo ID extracted:', cargoId, typeof cargoId);
        onCargoClick(cargoId, e);
      } else {
        console.log('❌ No features found in click event');
      }
    });

    // Cursor changes
    this.map.on('mouseenter', 'clusters', () => {
      if (this.map) {
        this.map.getCanvas().style.cursor = 'pointer';
      }
    });

    this.map.on('mouseleave', 'clusters', () => {
      if (this.map) {
        this.map.getCanvas().style.cursor = '';
      }
    });

    this.map.on('mouseenter', 'unclustered-point', () => {
      if (this.map) {
        this.map.getCanvas().style.cursor = 'pointer';
      }
    });

    this.map.on('mouseleave', 'unclustered-point', () => {
      if (this.map) {
        this.map.getCanvas().style.cursor = '';
      }
    });
  }

  updateCargoData(cargos: CargoMarkerData[]): void {
    if (!this.map || !this.isLoaded) return;

    console.log('📊 Updating cargo data with', cargos.length, 'cargos');
    console.log('🗺️ Map loaded status:', this.isLoaded);
    console.log('🎯 First cargo sample:', cargos[0]);

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: cargos.map(cargo => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [cargo.lng, cargo.lat]
        },
        properties: {
          id: cargo.id,
          title: cargo.title,
          price: cargo.price,
          urgent: cargo.urgent,
          type: cargo.type,
          city: cargo.city,
          weight: cargo.weight,
          distance: cargo.distance,
          profitabilityRate: cargo.profitabilityRate,
          profitabilityColor: ProfitabilityColorSystem.getProfitabilityColor(cargo.profitabilityRate),
          profitPerKm: cargo.profitPerKm,
          bodyType: cargo.bodyType,
          loadingType: cargo.loadingType,
          volume: cargo.volume,
          loadingDate: cargo.loadingDate
        }
      }))
    };

    console.log('📋 Generated GeoJSON features:', geojsonData.features.length);
    console.log('🔍 Sample feature properties:', geojsonData.features[0]?.properties);

    const source = this.map.getSource('cargos') as mapboxgl.GeoJSONSource;
    if (source) {
      console.log('✅ Cargo source found, updating data');
      source.setData(geojsonData);
    } else {
      console.log('❌ Cargo source not found!');
    }
  }

  updateRadiusCircles(center: [number, number], loadingRadiusKm: number, unloadingRadiusKm: number): void {
    if (!this.map || !this.isLoaded) return;

    // Create loading radius circle using Turf.js
    const loadingCircle = turf.circle(center, loadingRadiusKm, {
      steps: 64,
      units: 'kilometers'
    });

    const loadingCircleData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [loadingCircle]
    };

    const loadingSource = this.map.getSource('loading-radius-circle') as mapboxgl.GeoJSONSource;
    if (loadingSource) {
      loadingSource.setData(loadingCircleData);
    }

    // Create unloading radius circle using Turf.js
    const unloadingCircle = turf.circle(center, unloadingRadiusKm, {
      steps: 64,
      units: 'kilometers'
    });

    const unloadingCircleData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [unloadingCircle]
    };

    const unloadingSource = this.map.getSource('unloading-radius-circle') as mapboxgl.GeoJSONSource;
    if (unloadingSource) {
      unloadingSource.setData(unloadingCircleData);
    }
  }

  getMap(): mapboxgl.Map | null {
    return this.map;
  }

  isMapLoaded(): boolean {
    return this.isLoaded;
  }

  destroy(): void {
    if (this.map) {
      // Remove resize listener
      if (this.resizeHandler) {
        window.removeEventListener('resize', this.resizeHandler);
        this.resizeHandler = null;
      }
      
      // Clean up ResizeObserver
      if ((this.map as any)._resizeObserver) {
        (this.map as any)._resizeObserver.disconnect();
      }
      
      // If map already exists, just return it
      this.map.remove();
      this.map = null;
      this.isLoaded = false;
      this.eventHandlersSetup = false;
      this.userLocationMarkerAdded = false;
    }
  }
}

// Export singleton instance
export const mapboxService = MapboxService.getInstance();