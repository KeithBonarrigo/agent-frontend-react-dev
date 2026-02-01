import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LiveMap.css';

// Fix for default marker icons in webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon for users
const createUserMarkerIcon = (isOnline) => {
  return L.divIcon({
    className: `live-map-marker ${isOnline ? 'online' : 'offline'}`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12]
  });
};

// Component to auto-fit bounds
function FitBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;

    const bounds = L.latLngBounds(
      locations.map(loc => [loc.lat, loc.lng])
    );

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [locations, map]);

  return null;
}

export default function LiveMap({ sessions, activeSessions, onUserClick }) {
  const { t } = useTranslation('conversations');
  const mapRef = useRef(null);

  // Extract locations from sessions that have location data
  const locations = Object.entries(sessions || {})
    .filter(([_, session]) => session?.location?.lat && session?.location?.lng)
    .map(([key, session]) => {
      // Check if any active session matches this user - try multiple key formats
      const isOnline = Object.keys(activeSessions || {}).some(activeKey =>
        activeKey === session.userId ||
        key.includes(activeKey) ||
        (session.userId && activeKey.includes(session.userId))
      );

      return {
        key,
        lat: session.location.lat,
        lng: session.location.lng,
        name: session.name || 'Anonymous',
        email: session.email,
        phone: session.phone,
        city: session.location.city,
        region: session.location.regionName,
        country: session.location.countryName,
        countryCode: session.location.country,
        userId: session.userId,
        isOnline
      };
    });

  // Default center (world view)
  const defaultCenter = [20, 0];
  const defaultZoom = 2;

  if (locations.length === 0) {
    return (
      <div className="live-map-empty">
        <i className="fa-solid fa-map-location-dot"></i>
        <p>{t('liveMap.noData')}</p>
      </div>
    );
  }

  return (
    <div className="live-map-container">
      <MapContainer
        ref={mapRef}
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="live-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <FitBounds locations={locations} />

        {locations.map((loc) => (
          <Marker
            key={loc.key}
            position={[loc.lat, loc.lng]}
            icon={createUserMarkerIcon(loc.isOnline)}
          >
            <Popup className="live-map-popup">
              <div className="live-map-popup-content">
                <div className="live-map-popup-header">
                  {loc.isOnline && (
                    <span className="live-map-popup-status online">
                      <span className="status-dot"></span> {t('liveMap.online')}
                    </span>
                  )}
                  <span className="live-map-popup-name">{loc.name}</span>
                </div>

                <div className="live-map-popup-location">
                  <i className="fa-solid fa-location-dot"></i>
                  {loc.city}{loc.region ? `, ${loc.region}` : ''}{loc.country ? `, ${loc.country}` : ''}
                </div>

                {loc.email && (
                  <div className="live-map-popup-detail">
                    <i className="fa-solid fa-envelope"></i>
                    {loc.email}
                  </div>
                )}

                {loc.phone && (
                  <div className="live-map-popup-detail">
                    <i className="fa-solid fa-phone"></i>
                    {loc.phone}
                  </div>
                )}

                <div className="live-map-popup-id">
                  <i className="fa-solid fa-fingerprint"></i>
                  {loc.userId}
                </div>

                {onUserClick && (
                  <button
                    className="live-map-popup-btn"
                    onClick={() => onUserClick(loc.userId)}
                  >
                    <i className="fa-solid fa-comments"></i>
                    {t('liveMap.viewConversation')}
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="live-map-legend">
        <span className="legend-item">
          <span className="live-map-marker-sample online"></span> {t('liveMap.online')}
        </span>
        <span className="legend-item">
          <span className="live-map-marker-sample offline"></span> {t('liveMap.offline')}
        </span>
        <span className="legend-count">
          {locations.length} {locations.length === 1 ? t('liveMap.location') : t('liveMap.locations')}
        </span>
      </div>
    </div>
  );
}
