// @ts-nocheck
import * as React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';



// Use require for marker icon imports for compatibility with CRA/Next/Webpack
const iconUrl = require('leaflet/dist/images/marker-icon.png');
const iconShadow = require('leaflet/dist/images/marker-shadow.png');

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface WebMapViewProps {
  center: { latitude: number; longitude: number };
  markers?: { latitude: number; longitude: number; title?: string; id?: string | number }[];
  zoom?: number;
  style?: React.CSSProperties;
}

export function WebMapView({ center, markers = [], zoom = 13, style }: WebMapViewProps) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((marker) => (
          <Marker
            key={marker.id || `${marker.latitude},${marker.longitude}`}
            position={[marker.latitude, marker.longitude]}
          >
            {marker.title && <Popup>{marker.title}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

// If you get TypeScript errors for image imports, add a custom typing file:
// declare module '*.png'; 