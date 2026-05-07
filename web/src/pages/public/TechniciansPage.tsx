import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, Spinner, EmptyState, IonIcon, Button, Badge } from '../../components/index';
import { authService } from '../../services/authService';
import '../../styles/technicians-page.css';

interface Technician {
    id: string;
    name: string;
    avatar: string;
    headline: string;
    bio: string;
    city: string;
    governorate: string;
    latitude?: number;
    longitude?: number;
    averageRating: number;
    completedJobs: number;
    joinedAt: string;
    topExpertBadge: boolean;
    verificationLevel: string;
    emergencyAvailable: boolean;
    distanceKm?: number;
    specializations: { name: string; skillLevel: string; yearsExperience: number }[];
    skills: string[]; // fallback
}

export const TechniciansPage: React.FC = () => {
    const navigate = useNavigate();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filters
    const [selectedSpec, setSelectedSpec] = useState('');
    const [minRating, setMinRating] = useState('0');
    const [emergencyOnly, setEmergencyOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    
    // User Location
    const [userLat, setUserLat] = useState<number | null>(null);
    const [userLng, setUserLng] = useState<number | null>(null);

    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    const fetchTechnicians = async () => {
        setLoading(true);
        try {
            const params: any = {
                specialization: selectedSpec,
                minRating,
                emergencyOnly,
                verifiedOnly
            };
            if (userLat && userLng) {
                params.lat = userLat;
                params.lng = userLng;
            }
            const data = await authService.getPublicTechnicians(params);
            setTechnicians(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load experts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLat(pos.coords.latitude);
                    setUserLng(pos.coords.longitude);
                },
                () => console.warn("Geolocation denied or unavailable")
            );
        }
    }, []);

    useEffect(() => {
        fetchTechnicians();
    }, [selectedSpec, minRating, emergencyOnly, verifiedOnly, userLat, userLng]);

    useEffect(() => {
        if (!loading && !error && (window as any).L) {
            const L = (window as any).L;
            if (mapRef.current) {
                mapRef.current.remove();
            }

            try {
                const center: [number, number] = userLat && userLng ? [userLat, userLng] : [30.0444, 31.2357];
                mapRef.current = L.map('map-container').setView(center, userLat ? 10 : 6);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(mapRef.current);

                if (userLat && userLng) {
                    L.circleMarker([userLat, userLng], { color: 'blue', radius: 8 }).addTo(mapRef.current).bindPopup('You are here');
                }

                technicians.forEach(tech => {
                    if (tech.latitude && tech.longitude) {
                        const markerColor = tech.topExpertBadge ? 'gold' : tech.verificationLevel !== 'Basic' ? 'blue' : 'gray';
                        const customIcon = L.divIcon({
                            className: 'custom-map-marker',
                            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                            iconSize: [24, 24]
                        });

                        const badgeHtml = tech.verificationLevel !== 'Basic' ? `<span style="color: blue; font-size: 12px; font-weight: bold;">✓ ${tech.verificationLevel}</span>` : '';
                        const topBadgeHtml = tech.topExpertBadge ? `<br/><span style="color: goldenrod; font-weight: bold;">⭐ Top Expert</span>` : '';

                        const marker = L.marker([tech.latitude, tech.longitude], { icon: customIcon })
                            .addTo(mapRef.current)
                            .bindPopup(`
                                <div class="map-popup">
                                    <strong style="font-size: 14px;">${tech.name}</strong> ${badgeHtml} ${topBadgeHtml}<br/>
                                    <span style="font-weight: 600;">${tech.headline || 'Hardware Expert'}</span><br/>
                                    <small>${tech.city}</small><br/>
                                    <button onclick="window.location.href='/experts/${tech.id}'" style="margin-top: 8px; width: 100%; padding: 4px; border-radius: 4px; background: #4f46e5; color: white; border: none; cursor: pointer;">View Profile</button>
                                </div>
                            `);
                        markersRef.current.push(marker);
                    }
                });

                if (markersRef.current.length > 0) {
                    const group = new L.featureGroup(markersRef.current);
                    mapRef.current.fitBounds(group.getBounds().pad(0.1));
                }
            } catch (initError) {
                console.error('Map initialization failed:', initError);
            }
        }
        return () => { if (mapRef.current) mapRef.current.remove(); mapRef.current = null; };
    }, [technicians, loading, error]);

    if (loading && technicians.length === 0) return <PageWrapper><Spinner size="lg" /></PageWrapper>;
    if (error) return <PageWrapper><EmptyState icon="alert-circle-outline" title="Error" description={error} /></PageWrapper>;

    return (
        <PageWrapper>
            <div className="tech-page-layout">
                <div className="tech-sidebar">
                    <div className="tech-header">
                        <h1 className="modern-h2">Hardware Experts</h1>
                        <p className="modern-subtitle">Find certified technicians in your area</p>
                    </div>

                    <div className="filters-container">
                        <div className="filter-group">
                            <label>Search Specialization</label>
                            <input type="text" className="input" placeholder="e.g. Smartphone Repair" value={selectedSpec} onChange={(e) => setSelectedSpec(e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <label>Minimum Rating</label>
                            <select className="input" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
                                <option value="0">Any Rating</option>
                                <option value="3">3+ Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="4.5">4.5+ Stars</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={emergencyOnly} onChange={(e) => setEmergencyOnly(e.target.checked)} />
                                <span style={{ fontWeight: 600, color: '#ef4444' }}>24/7 Emergency Services Only</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
                                <span style={{ fontWeight: 600, color: '#4f46e5' }}>Verified Professionals Only</span>
                            </label>
                        </div>
                    </div>

                    <div className="tech-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {technicians.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No experts found matching criteria.</div>
                        ) : (
                            technicians.map(tech => (
                                <div key={tech.id} className={`tech-card glass ${tech.topExpertBadge ? 'featured-tech' : ''}`} style={{ border: tech.topExpertBadge ? '2px solid gold' : '', cursor: 'pointer' }} onClick={() => navigate(`/experts/${tech.id}`)}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div className="tech-avatar-small">{tech.avatar ? <img src={tech.avatar} alt={tech.name} /> : tech.name[0]}</div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{tech.name}</h3>
                                                {tech.verificationLevel !== 'Basic' && <Badge tone="success">Verified {tech.verificationLevel}</Badge>}
                                                {tech.topExpertBadge && <Badge style={{ backgroundColor: 'gold', color: 'black' }}>⭐ Top Expert</Badge>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, marginTop: '4px' }}>{tech.headline}</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>★ {tech.averageRating.toFixed(1)}</span>
                                        <span style={{ color: 'var(--color-text-muted)' }}>({tech.completedJobs} jobs)</span>
                                        {tech.distanceKm !== undefined && <span style={{ color: 'var(--color-text-muted)' }}>• {tech.distanceKm.toFixed(1)} km away</span>}
                                        {tech.emergencyAvailable && <span style={{ color: '#ef4444', fontWeight: 'bold' }}>• 24/7</span>}
                                    </div>

                                    <div className="tech-tags">
                                        {(tech.specializations && tech.specializations.length > 0 ? tech.specializations.map(s => s.name) : tech.skills).slice(0, 3).map(s => <span key={s} className="tech-tag">{s}</span>)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="tech-map-container">
                    <div id="map-container" style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}></div>
                </div>
            </div>
        </PageWrapper>
    );
};
