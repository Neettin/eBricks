import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon missing in React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  onClose?: () => void; // Added Close Callback
  searchQuery?: string;
  initialLocation?: { lat: number; lng: number };
  previewMode?: boolean;
  fullScreen?: boolean;
}

const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  onClose,
  searchQuery,
  initialLocation = { lat: 27.7172, lng: 85.3240 },
  previewMode = false,
  fullScreen = false
}) => {
  const [position, setPosition] = useState<[number, number]>([
    initialLocation.lat,
    initialLocation.lng
  ]);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch address from coordinates
  const fetchAddress = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data.display_name) {
        const address = formatAddress(data);
        setCurrentAddress(address);
        if (!previewMode) onLocationSelect(lat, lng, address);
      }
    } catch (error) {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setCurrentAddress(fallback);
      if (!previewMode) onLocationSelect(lat, lng, fallback);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const formatAddress = (data: any) => {
    const parts = [];
    if (data.address.road) parts.push(data.address.road);
    if (data.address.suburb) parts.push(data.address.suburb);
    if (data.address.city || data.address.municipality) parts.push(data.address.city || data.address.municipality);
    return parts.slice(0, 3).join(', ') || data.display_name;
  };

  // FIXED: Only centers the map once when position is set, not every drag frame
  function MapController() {
    const map = useMap();
    useEffect(() => {
      if (!mapRef.current) mapRef.current = map;
    }, [map]);
    return null;
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (!previewMode) {
          const { lat, lng } = e.latlng;
          setPosition([lat, lng]);
          fetchAddress(lat, lng);
          mapRef.current?.panTo(e.latlng); // Smooth move to click
        }
      },
    });

    return <Marker 
      position={position} 
      draggable={!previewMode} 
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
          fetchAddress(pos.lat, pos.lng);
        }
      }} 
    />;
  }

  useEffect(() => {
    fetchAddress(position[0], position[1]);
  }, []);

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        const newPos: [number, number] = [latitude, longitude];
        setPosition(newPos);
        fetchAddress(latitude, longitude);
        mapRef.current?.setView(newPos, 16);
      });
    }
  };

  return (
    <div className="relative h-full w-full bg-white flex flex-col">
      {/* HEADER WITH CLOSE BUTTON */}
      {!previewMode && (
        <div className="absolute top-0 left-0 right-0 z-[1001] p-4 flex justify-between items-start pointer-events-none">
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 flex-1 mr-4 pointer-events-auto max-w-md">
            <p className="text-[10px] font-black text-brick-600 uppercase mb-1">Confirm Delivery Point</p>
            {isLoadingAddress ? (
              <div className="animate-pulse flex space-x-2 items-center"><div className="h-2 w-2 bg-gray-300 rounded-full"></div><div className="h-4 bg-gray-200 rounded w-full"></div></div>
            ) : (
              <p className="text-sm font-bold text-gray-800 line-clamp-2">{currentAddress}</p>
            )}
          </div>

          <button 
            onClick={onClose}
            className="bg-white text-gray-800 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center pointer-events-auto hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
      )}

      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapController />
        <ClickHandler />
      </MapContainer>

      {/* FOOTER ACTIONS */}
      {!previewMode && (
        <div className="absolute bottom-6 left-6 right-6 z-[1001] flex flex-col gap-4">
          <div className="flex justify-end gap-2">
             <button onClick={handleMyLocation} className="bg-white text-brick-600 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center hover:bg-gray-50">
              <i className="fas fa-location-arrow"></i>
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full bg-brick-800 text-heritage-gold py-5 rounded-2xl font-black text-lg shadow-2xl hover:bg-brick-900 uppercase tracking-widest"
          >
            Confirm This Location
          </button>
        </div>
      )}
    </div>
  );
};

export default MapPicker;