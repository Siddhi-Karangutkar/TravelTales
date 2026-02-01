import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl, Polyline, ZoomControl } from 'react-leaflet';
import { Utensils, Bus, Car, Stethoscope, MapPin, Globe, Map, ExternalLink, Phone, Clock, Maximize2, Crosshair, Box } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapExploration = ({ plan }) => {
    const { t } = useLanguage();
    // Use coordinates from plan if available, otherwise default to Tokyo
    const initialCenter = plan?.coordinates || [35.6762, 139.6503];
    const [mapCenter, setMapCenter] = useState(initialCenter);
    const [isSearching, setIsSearching] = useState(false);

    const [activeLayers, setActiveLayers] = useState({
        places: true,
        food: true,
        transport: false,
        rental: false,
        emergency: false
    });

    const [mapStyle, setMapStyle] = useState('voyager'); // 'voyager' or 'satellite'
    const [show3D, setShow3D] = useState(false);

    const [markers, setMarkers] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [isLoadingPOIs, setIsLoadingPOIs] = useState(false);
    const [selectedDay, setSelectedDay] = useState('all');

    // Custom Icons Helper
    const createCustomIcon = (icon) => {
        return L.divIcon({
            html: `<div style="
                background: white; 
                border-radius: 50%; 
                width: 30px; 
                height: 30px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                border: 2px solid var(--primary);
                font-size: 1.2rem;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">${icon}</div>`,
            className: 'custom-map-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });
    };

    const icons = {
        places: createCustomIcon('📍'),
        food: createCustomIcon('🍜'),
        transport: createCustomIcon('🚇'),
        rental: createCustomIcon('🚗'),
        emergency: createCustomIcon('🏥')
    };

    // Geocoding Logic: Resolve destination to coordinates
    useEffect(() => {
        if (!plan?.destination) return;
        if (plan.destinationCoords) {
            setMapCenter([plan.destinationCoords.lat, plan.destinationCoords.lng]);
            return;
        }

        const geocode = async () => {
            // Only geocode if we DON'T have coordinates in the plan or if it's a different destination
            if (plan.coordinates) {
                setMapCenter(plan.coordinates);
                return;
            }
            setIsSearching(true);
            try {
                const response = await fetch(`/api/geocode?q=${encodeURIComponent(plan.destination)}`);
                const data = await response.json();
                if (data && data.length > 0) {
                    const { lat, lon } = data[0];
                    setMapCenter([parseFloat(lat), parseFloat(lon)]);
                }
            } catch (error) {
                console.error("Geocoding failed:", error);
            } finally {
                setIsSearching(false);
            }
        };

        geocode();
    }, [plan?.destination, plan?.destinationCoords]);

    // Component to handle map centering
    const RecenterMap = ({ center }) => {
        const map = useMap();
        useEffect(() => {
            map.setView(center, 14); // Deeper zoom for detail
        }, [center, map]);
        return null;
    };

    // --- REAL-TIME POI FETCHING (Overpass API) ---
    useEffect(() => {
        if (isSearching) return; // Wait for geocoding to settle

        const fetchPOIs = async (signal) => {
            setIsLoadingPOIs(true);
            const lat = mapCenter[0];
            const lon = mapCenter[1];
            const range = 0.02; // Roughly 2km radius

            // OSM Query for multiple categories
            // [out:json]; node(around:2000, lat, lon)[amenity~"restaurant|cafe|bus_station..."];
            const query = `
                [out:json][timeout:25];
                (
                  node["amenity"~"restaurant|cafe|fast_food|bar"](around:2000,${lat},${lon});
                  node["amenity"~"bus_station|railway_station|subway_station|tram_stop"](around:2000,${lat},${lon});
                  node["amenity"~"car_rental|bicycle_rental"](around:3000,${lat},${lon});
                  node["amenity"~"hospital|pharmacy|police"](around:4000,${lat},${lon});
                  node["tourism"~"attraction|museum|viewpoint|artwork"](around:3000,${lat},${lon});
                );
                out body;
            `;

            try {
                const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal });

                if (!response.ok) {
                    throw new Error(`Overpass API responded with status: ${response.status}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await response.text();
                    console.error("Overpass API returned non-JSON response:", text.substring(0, 200));
                    throw new Error("Overpass API returned non-JSON response");
                }

                const data = await response.json();

                if (!data || !data.elements) {
                    console.warn("Overpass API returned empty data");
                    setIsLoadingPOIs(false);
                    return;
                }

                const newMarkers = data.elements.map(el => {
                    let type = 'places';
                    if (el.tags.amenity) {
                        if (["restaurant", "cafe", "fast_food", "bar"].includes(el.tags.amenity)) type = 'food';
                        else if (["bus_station", "railway_station", "subway_station", "tram_stop"].includes(el.tags.amenity)) type = 'transport';
                        else if (["car_rental", "bicycle_rental"].includes(el.tags.amenity)) type = 'rental';
                        else if (["hospital", "pharmacy", "police"].includes(el.tags.amenity)) type = 'emergency';
                    } else if (el.tags.tourism) {
                        type = 'places';
                    }

                    return {
                        id: el.id ? `osm-${el.id}` : `osm-rand-${Math.random().toString(36).substr(2, 9)}`,
                        type: type,
                        position: [el.lat, el.lon],
                        title: el.tags.name || "Unnamed Spot",
                        desc: el.tags.cuisine ? `${el.tags.cuisine} Cuisine` : (el.tags.amenity || el.tags.tourism || ""),
                        website: el.tags.website,
                        phone: el.tags.phone || el.tags['contact:phone'],
                        hours: el.tags.opening_hours
                    };
                });

                // Add Itinerary Items from Plan
                const planMarkers = [];
                const planRoutes = [];

                if (plan && plan.itinerary) {
                    plan.itinerary.forEach((day, dIdx) => {
                        const dayActivities = day.activities || [day.morning, day.afternoon, day.evening].filter(Boolean);
                        const dayPath = [];

                        dayActivities.forEach((act, aIdx) => {
                            let pos;
                            if (act.coords) {
                                // If coordination is relative (offset from destination)
                                if (Math.abs(act.coords.lat) < 1 && Math.abs(act.coords.lng) < 1) {
                                    pos = [mapCenter[0] + act.coords.lat, mapCenter[1] + act.coords.lng];
                                } else {
                                    // Absolute coordinates
                                    pos = [act.coords.lat, act.coords.lng];
                                }
                            } else {
                                // Fallback to random cluster only if no coords exist
                                pos = [mapCenter[0] + (Math.random() - 0.5) * 0.01, mapCenter[1] + (Math.random() - 0.5) * 0.01];
                            }

                            dayPath.push(pos);
                            planMarkers.push({
                                id: `plan-${dIdx}-${aIdx}`,
                                day: day.day,
                                type: 'places',
                                position: pos,
                                title: `⭐ ${act.title}`,
                                desc: `${t('day')} ${day.day} • ${act.time}`
                            });
                        });

                        if (dayPath.length > 1) {
                            planRoutes.push({
                                day: day.day,
                                path: dayPath,
                                color: day.day % 2 === 0 ? 'var(--primary)' : '#3B82F6'
                            });
                        }
                    });
                }

                setMarkers([...planMarkers, ...newMarkers]);
                setRoutes(planRoutes);
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('POI fetch aborted');
                    return;
                }
                console.error("Overpass API error:", error);
            } finally {
                setIsLoadingPOIs(false);
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => fetchPOIs(controller.signal), 800); // Debounce
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [mapCenter, isSearching, plan]);

    const toggleLayer = (layer) => {
        setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const visibleMarkers = markers.filter(m => {
        if (!activeLayers[m.type]) return false;
        if (m.day && selectedDay !== 'all' && m.day !== parseInt(selectedDay)) return false;
        return true;
    });

    const visibleRoutes = routes.filter(r => selectedDay === 'all' || r.day === parseInt(selectedDay));

    return (
        <div className="map-exploration-container card" style={{ padding: 0, overflow: 'hidden', height: '500px', display: 'flex', flexDirection: 'column' }}>
            <div className="map-header" style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', zIndex: 10 }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={20} color="var(--primary)" /> {t('mapExploration')}
                </h3>
                <div className="layer-toggles" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <select
                        value={selectedDay}
                        onChange={(e) => setSelectedDay(e.target.value)}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '50px',
                            border: '1px solid var(--border-light)',
                            background: 'white',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            outline: 'none',
                            color: 'var(--primary)',
                            fontWeight: 'bold'
                        }}
                    >
                        <option value="all">All Days</option>
                        {plan?.itinerary?.map(d => (
                            <option key={d.day} value={d.day}>Day {d.day}</option>
                        ))}
                    </select>
                    <LayerToggle label={t('places')} icon={<MapPin size={14} />} active={activeLayers.places} onClick={() => toggleLayer('places')} />
                    <LayerToggle label={t('food')} icon={<Utensils size={14} />} active={activeLayers.food} onClick={() => toggleLayer('food')} />
                    <LayerToggle label={t('transport')} icon={<Bus size={14} />} active={activeLayers.transport} onClick={() => toggleLayer('transport')} />
                    <LayerToggle label={t('rental')} icon={<Car size={14} />} active={activeLayers.rental} onClick={() => toggleLayer('rental')} />
                    <LayerToggle label={t('emergency')} icon={<Stethoscope size={14} />} active={activeLayers.emergency} onClick={() => toggleLayer('emergency')} />
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer
                    center={mapCenter}
                    zoom={14}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <RecenterMap center={mapCenter} />
                    <ScaleControl position="bottomleft" />
                    <ZoomControl position="topright" />

                    {mapStyle === 'voyager' ? (
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                    ) : (
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        />
                    )}

                    {mapStyle === 'satellite' && (
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        />
                    )}

                    {show3D && (
                        <TileLayer
                            url="https://{s}.tile.osmbuildings.org/tile/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://osmbuildings.org/copyright">OSM Buildings</a>'
                            opacity={0.8}
                        />
                    )}

                    {visibleRoutes.map((route, idx) => (
                        <Polyline
                            key={`route-${idx}`}
                            positions={route.path}
                            color={route.color}
                            weight={5}
                            opacity={0.7}
                            dashArray="10, 10"
                            className="animated-polyline"
                        />
                    ))}
                    {visibleMarkers.map(marker => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            icon={icons[marker.type] || DefaultIcon}
                        >
                            <Popup>
                                <div style={{ minWidth: '180px' }}>
                                    <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>{marker.title}</strong>
                                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{marker.desc}</p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #eee', paddingTop: '0.5rem' }}>
                                        {marker.hours && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                                <Clock size={12} color="var(--primary)" />
                                                <span>{marker.hours}</span>
                                            </div>
                                        )}
                                        {marker.phone && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                                <Phone size={12} color="#10B981" />
                                                <a href={`tel:${marker.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>{marker.phone}</a>
                                            </div>
                                        )}
                                        {marker.website && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                                                <Globe size={12} color="#3B82F6" />
                                                <a href={marker.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#3B82F6', fontWeight: 'bold' }}>
                                                    Website <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Floating Map Controls */}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIdex: 1000, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button
                        onClick={() => setMapStyle(mapStyle === 'voyager' ? 'satellite' : 'voyager')}
                        style={controlButtonStyle}
                        title="Toggle Imagery"
                    >
                        {mapStyle === 'voyager' ? <Globe size={20} /> : <Map size={20} />}
                    </button>
                    <button
                        onClick={() => setShow3D(!show3D)}
                        style={{
                            ...controlButtonStyle,
                            color: show3D ? 'white' : 'var(--primary)',
                            background: show3D ? 'var(--primary)' : 'white'
                        }}
                        title="Toggle 3D Buildings"
                    >
                        <Box size={20} />
                    </button>
                    <button
                        onClick={() => {
                            const mapEl = document.querySelector('.map-exploration-container');
                            if (document.fullscreenElement) document.exitFullscreen();
                            else mapEl.requestFullscreen();
                        }}
                        style={controlButtonStyle}
                        title="Fullscreen"
                    >
                        <Maximize2 size={20} />
                    </button>
                    <button
                        onClick={() => setMapCenter(initialCenter)}
                        style={controlButtonStyle}
                        title="Locate Center"
                    >
                        <Crosshair size={20} />
                    </button>
                </div>

                {/* 3D Overlay Hint (Visual Touch) */}
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', zIndex: 1000, background: 'rgba(255,255,255,0.9)', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(4px)' }}>
                    {isLoadingPOIs ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>⏳</motion.div>
                    ) : (mapStyle === 'satellite' ? '🛰️' : show3D ? '🏢' : '🗺️')}
                    {isLoadingPOIs ? 'Loading Detailed POIs...' : (mapStyle === 'satellite' ? 'Satellite View' : show3D ? '3D Buildings' : t('interactiveMap'))}
                </div>
            </div>
            <style>{`
                .animated-polyline {
                    stroke-dasharray: 15, 15;
                    animation: dash 20s linear infinite;
                }
                @keyframes dash {
                    to {
                        stroke-dashoffset: -1000;
                    }
                }
                .control-btn:hover {
                    transform: scale(1.1);
                    background: #f8fafc;
                }
            `}</style>
        </div>
    );
};

const controlButtonStyle = {
    background: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--primary)',
    transition: 'all 0.2s',
    zIndex: 1000
};

const LayerToggle = ({ label, icon, active, onClick }) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '50px',
            border: active ? '1px solid var(--primary)' : '1px solid var(--border-light)',
            background: active ? 'var(--primary-light)' : 'white',
            color: active ? 'var(--primary)' : 'var(--text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: active ? 'bold' : 'normal',
            transition: 'all 0.2s'
        }}
    >
        {icon} {label}
    </button>
);

export default MapExploration;

