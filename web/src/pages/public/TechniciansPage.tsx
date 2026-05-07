import React, { useState, useEffect, useRef } from 'react';
import { PageWrapper, Section, Spinner, EmptyState, IonIcon, Button } from '../../components/index';
import { authService } from '../../services/authService';
import '../../styles/technicians-page.css';

interface Technician {
    id: string;
    name: string;
    avatar: string;
    headline: string;
    bio: string;
    skills: string[];
    experienceYears: number;
    city: string;
    governorate: string;
    latitude?: number;
    longitude?: number;
    serviceCategories: string[];
    averageRating: number;
    completedJobs: number;
    joinedAt: string;
}

export const TechniciansPage: React.FC = () => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [filteredTechs, setFilteredTechs] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSkill, setSelectedSkill] = useState('All');
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const data = await authService.getPublicTechnicians();
                setTechnicians(data);
                setFilteredTechs(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load experts');
            } finally {
                setLoading(false);
            }
        };
        fetchTechnicians();
    }, []);

    useEffect(() => {
        // Initialize Leaflet Map
        if (!loading && !error && (window as any).L) {
            const L = (window as any).L;
            
            // Cleanup existing map if it exists
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            try {
                mapRef.current = L.map('map-container').setView([30.0444, 31.2357], 6); // Default to Egypt
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(mapRef.current);

                // Add markers
                filteredTechs.forEach(tech => {
                    if (tech.latitude && tech.longitude) {
                        const marker = L.marker([tech.latitude, tech.longitude])
                            .addTo(mapRef.current)
                            .bindPopup(`
                                <div class="map-popup">
                                    <strong style="color: var(--color-primary); font-size: 14px;">${tech.name}</strong><br/>
                                    <span style="font-weight: 600;">${tech.headline || 'Hardware Expert'}</span><br/>
                                    <small>${tech.city || 'Location Pending'}</small>
                                </div>
                            `);
                        markersRef.current.push(marker);
                    }
                });

                // Adjust view if markers exist
                if (markersRef.current.length > 0) {
                    const group = new L.featureGroup(markersRef.current);
                    mapRef.current.fitBounds(group.getBounds().pad(0.1));
                }
                
                // Fix for map not rendering correctly in dynamic containers
                setTimeout(() => {
                    if (mapRef.current) mapRef.current.invalidateSize();
                }, 200);

            } catch (initError) {
                console.error('Map initialization failed:', initError);
            }
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [loading, error, filteredTechs]);

    const handleFilter = () => {
        let filtered = [...technicians];
        if (selectedSkill !== 'All') {
            filtered = filtered.filter(t => t.skills?.includes(selectedSkill));
        }
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(t => t.serviceCategories?.includes(selectedCategory));
        }
        setFilteredTechs(filtered);
    };

    useEffect(() => {
        handleFilter();
    }, [selectedSkill, selectedCategory, technicians]);

    const allSkills = Array.from(new Set(technicians.flatMap(t => t.skills || [])));
    const allCategories = Array.from(new Set(technicians.flatMap(t => t.serviceCategories || [])));

    if (loading) return <PageWrapper><Spinner size="lg" /></PageWrapper>;
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
                            <label>Specialization</label>
                            <select value={selectedSkill} onChange={(e) => setSelectedSkill(e.target.value)}>
                                <option value="All">All Specializations</option>
                                {allSkills.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label>Service Category</label>
                            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                <option value="All">All Categories</option>
                                {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="tech-list">
                        {filteredTechs.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No technicians found matching your criteria.
                            </div>
                        ) : (
                            filteredTechs.map(tech => (
                                <div key={tech.id} className="tech-card glass">
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div className="tech-avatar-small">
                                            {tech.avatar ? <img src={tech.avatar} alt={tech.name} /> : tech.name[0]}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-strong)' }}>{tech.name}</h3>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{tech.headline}</div>
                                        </div>
                                    </div>
                                    <div className="tech-tags">
                                        {tech.skills.slice(0, 3).map(s => <span key={s} className="tech-tag">{s}</span>)}
                                        {tech.skills.length > 3 && <span className="tech-tag">+{tech.skills.length - 3} more</span>}
                                    </div>
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            <IonIcon name="location-outline" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            {tech.city}
                                        </span>
                                        <Button variant="ghost" size="sm">View Profile</Button>
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
