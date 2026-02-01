import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Users, Wallet, ArrowRight, Sparkles, Compass, Heart, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import Navbar from './components/Navbar';

const LandingPage = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [communityFeedbacks, setCommunityFeedbacks] = React.useState([]);

    React.useEffect(() => {
        const fetchCommunityFeedbacks = async () => {
            try {
                const res = await fetch('/api/feedbacks');
                const data = await res.json();
                if (data.success) {
                    setCommunityFeedbacks(data.feedbacks.slice(0, 3)); // Show top 3
                }
            } catch (e) {
                console.error("Failed to fetch community feedback", e);
            }
        };
        fetchCommunityFeedbacks();
    }, []);

    return (
        <div className="landing-page">
            <Navbar />

            {/* Hero Section */}
            <section className="hero-wrapper">
                <div className="container">
                    <div className="hero-grid">
                        <motion.div
                            className="hero-content"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="badge" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#EEF2FF', color: '#4F46E5', borderRadius: '50px', fontWeight: 'bold', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                ✨ {t('tagline')}
                            </span>
                            <h1>
                                {t('heroTitle').split(',')[0]}, <br />
                                <span className="text-gradient">{t('heroTitle').split(',')[1]}</span>
                            </h1>
                            <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '2rem' }}>
                                {t('heroSubtitle')}
                            </p>
                            <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/plan')}
                                >
                                    {t('startPlanning')} <ArrowRight size={20} />
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/discover')}
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        color: 'white',
                                        border: 'none'
                                    }}
                                >
                                    <Compass size={20} /> Not Sure Where to Go?
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            className="hero-image-container"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <img
                                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=2021&q=80"
                                alt="Travel"
                                className="hero-image"
                                style={{ width: '100%', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', transform: 'rotate(2deg)' }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section" style={{ background: '#F8FAFC' }}>
                <div className="container">
                    <div className="text-center" style={{ maxWidth: '700px', margin: '0 auto 4rem auto' }}>
                        <h2>{t('featureTitle')}</h2>
                        <p>{t('featureSub')}</p>
                    </div>

                    <div className="features-grid">
                        <FeatureCard
                            icon={<Sparkles size={24} />}
                            title={t('aiItineraries')}
                            desc={t('aiItinerariesDesc')}
                        />
                        <FeatureCard
                            icon={<Wallet size={24} />}
                            title={t('smartBudget')}
                            desc={t('smartBudgetDesc')}
                        />
                        <FeatureCard
                            icon={<Users size={24} />}
                            title={t('crowdRadar')}
                            desc={t('crowdRadarDesc')}
                        />
                        <FeatureCard
                            icon={<Compass size={24} />}
                            title={t('hiddenGems')}
                            desc={t('hiddenGemsDesc')}
                        />
                    </div>
                </div>
            </section>

            {/* Traveler Stories Section */}
            <section className="section" style={{ background: 'white', paddingBottom: '5rem' }}>
                <div className="container">
                    <div className="text-center" style={{ marginBottom: '3rem' }}>
                        <span style={{ color: '#4F46E5', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>Community Voice</span>
                        <h2 style={{ marginTop: '0.5rem' }}>Traveler Stories</h2>
                        <p style={{ color: 'var(--text-sub)' }}>Real experiences from our global community of adventurers.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {communityFeedbacks.length > 0 ? (
                            communityFeedbacks.map((fb, idx) => (
                                <motion.div
                                    key={fb.id}
                                    className="card"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    style={{
                                        padding: '2rem',
                                        borderRadius: '24px',
                                        background: '#F8FAFC',
                                        border: '1px solid currentColor',
                                        borderColor: fb.analysis.sentiment === 'Positive' ? '#86efac' : fb.analysis.sentiment === 'Negative' ? '#fca5a5' : '#e2e8f0',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                            {fb.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600' }}>{fb.email || 'Anonymous'}</h4>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{new Date(fb.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p style={{ fontStyle: 'italic', color: '#1E293B', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                        "{fb.text.length > 150 ? fb.text.substring(0, 150) + '...' : fb.text}"
                                    </p>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '50px',
                                        background: fb.analysis.sentiment === 'Positive' ? '#dcfce7' : fb.analysis.sentiment === 'Negative' ? '#fee2e2' : '#f1f5f9',
                                        color: fb.analysis.sentiment === 'Positive' ? '#15803d' : fb.analysis.sentiment === 'Negative' ? '#b91c1c' : '#475569',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        <Sparkles size={12} /> {fb.analysis.sentiment} Vibe
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '24px', border: '2px dashed #E2E8F0' }}>
                                <Globe size={48} color="#94A3B8" style={{ marginBottom: '1rem' }} />
                                <p style={{ color: '#94A3B8' }}>Be the first to share your story!</p>
                                <button onClick={() => navigate('/feedback')} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>Write a Review</button>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="section" style={{ padding: '4rem 0 2rem 0', background: 'linear-gradient(to bottom, #F8FAFC, white)', borderTop: '1px solid #E2E8F0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
                        {/* Brand Section */}
                        <div>
                            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                                <Plane size={28} color="#4F46E5" />
                                <span style={{ fontWeight: 800, fontSize: '1.3rem' }}>{t('appName')}</span>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                AI-powered travel planning that creates personalized itineraries in seconds. Explore the world smarter.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Quick Links</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                <button onClick={() => navigate('/plan')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', padding: 0 }}>Start Planning</button>
                                <button onClick={() => navigate('/discover')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', padding: 0 }}>Discover Destinations</button>
                                <button onClick={() => navigate('/saved-itineraries')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', padding: 0 }}>Saved Itineraries</button>
                                <button onClick={() => navigate('/feedback')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textAlign: 'left', padding: 0 }}>Share Feedback</button>
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Features</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>AI Itineraries</span>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Smart Budget Tracking</span>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Hidden Gems Discovery</span>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Real-time Weather</span>
                            </div>
                        </div>

                        {/* Connect */}
                        <div>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Connect</h4>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Globe size={18} color="#64748b" />
                                </div>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Heart size={18} color="#64748b" />
                                </div>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                                    <Users size={18} color="#64748b" />
                                </div>
                            </div>
                            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                Join our community of travelers
                            </p>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div style={{ paddingTop: '2rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                            &copy; {new Date().getFullYear()} {t('appName')}. Built with AI & <Heart size={12} style={{ display: 'inline', color: '#EF4444', marginBottom: '-2px' }} fill="currentColor" />.
                        </p>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>Privacy</span>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>Terms</span>
                            <span style={{ fontSize: '0.85rem', color: '#94a3b8', cursor: 'pointer' }}>Contact</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="card">
        <div className="feature-icon-box">
            {icon}
        </div>
        <h3>{title}</h3>
        <p style={{ fontSize: '0.95rem' }}>{desc}</p>
    </div>
);

export default LandingPage;

