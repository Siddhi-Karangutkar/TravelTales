import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Trash2, ExternalLink, Loader2, Plane, Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const SavedItinerariesPage = () => {
    const { token, user, isAuthenticated } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: { pathname: '/saved-itineraries' } } });
            return;
        }

        fetchItineraries();
    }, [isAuthenticated, token]);

    const fetchItineraries = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/itineraries', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setItineraries(data.itineraries);
            } else {
                setError(data.message || 'Failed to fetch itineraries');
            }
        } catch (err) {
            setError('Server error while fetching itineraries');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this itinerary?')) return;

        try {
            const response = await fetch(`/api/itineraries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setItineraries(itineraries.filter(it => it.id !== id));
            }
        } catch (err) {
            alert('Failed to delete itinerary');
        }
    };

    const viewPlan = (planData) => {
        navigate('/trip', { state: { plan: planData } });
    };

    if (loading) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading your adventures...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '120px 20px 60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        My Saved Itineraries
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        All your dream trips stored in one place.
                    </p>
                </header>

                {error && (
                    <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>
                )}

                {itineraries.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ width: '80px', height: '80px', background: '#F1F5F9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Plane size={40} color="#94A3B8" />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>No saved trips yet</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Start planning your next adventure and save it to your account!</p>
                        <button onClick={() => navigate('/plan')} className="btn btn-primary">
                            Create New Plan
                        </button>
                    </motion.div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                        {itineraries.map((item, index) => {
                            const plan = typeof item.plan_data === 'string' ? JSON.parse(item.plan_data) : item.plan_data;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -8 }}
                                    onClick={() => viewPlan(plan)}
                                    style={{
                                        background: 'white',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        boxShadow: '0 15px 35px rgba(0,0,0,0.06)',
                                        cursor: 'pointer',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={plan.coverImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'}
                                            alt={item.destination}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                            <button
                                                onClick={(e) => handleDelete(item.id, e)}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.9)',
                                                    border: 'none',
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>{item.destination}</h3>
                                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: '#F1F5F9', borderRadius: '6px', fontWeight: '700', color: '#64748B' }}>
                                                {plan.vibe}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                            <Calendar size={14} />
                                            <span>Saved on {new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--primary)' }}>
                                                ${plan.budgetSummary?.total || 'N/A'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700' }}>
                                                View Plan <ExternalLink size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SavedItinerariesPage;
