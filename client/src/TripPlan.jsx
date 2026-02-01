import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MapExploration from './MapExploration';
import LocalIntelligence from './LocalIntelligence';
import LiveContext from './LiveContext';
import { useLanguage } from './LanguageContext';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import SurpriseGemModal from './SurpriseGemModal';
import DayEditor from './components/DayEditor';
import { useEffect, useRef } from 'react';
import {
    ArrowLeft, Sun, Download, Share2, DollarSign, Clock, MapPin,
    Ticket, Frown, X, AlertTriangle, Calendar, Info, Wallet, ArrowRight, Home, Users, Zap, Youtube, Sparkles,
    ShieldCheck, Shirt, Camera, Gift, Globe, Wifi, Loader2, Edit
} from 'lucide-react';

const TripPlan = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { convertStringPrice, currencySymbol } = useCurrency();
    const { isAuthenticated, token } = useAuth();
    const { plan } = location.state || {};
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [magicResult, setMagicResult] = useState(null);
    const [showSurpriseModal, setShowSurpriseModal] = useState(false);
    const [surpriseGem, setSurpriseGem] = useState(null);
    const [showSwapOptions, setShowSwapOptions] = useState(false);
    const [modifiedPlan, setModifiedPlan] = useState(plan);
    const [surpriseUsed, setSurpriseUsed] = useState(false);
    const [editingDay, setEditingDay] = useState(null);

    const handleSaveDay = (updatedDay) => {
        const newItinerary = modifiedPlan.itinerary.map(day =>
            day.day === updatedDay.day ? updatedDay : day
        );
        setModifiedPlan({ ...modifiedPlan, itinerary: newItinerary });
        setEditingDay(null);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'zh', name: '中文' },
        { code: 'ar', name: 'العربية' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'de', name: 'Deutsch' },
        { code: 'pt', name: 'Português' },
        { code: 'ja', name: '日本語' },
        { code: 'ru', name: 'Русский' }
    ];

    const timers = useRef([]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            timers.current.forEach(t => clearTimeout(t));
        };
    }, []);

    const handleDownloadPdf = () => {
        setIsSaved(true);
        const timer = setTimeout(() => setIsSaved(false), 3000);
        timers.current.push(timer);
        window.print();
    };

    const handlePersistentSave = async () => {
        if (!isAuthenticated) {
            // Redirect to login with current plan and return path
            navigate('/login', {
                state: {
                    from: location,
                    plan: modifiedPlan || plan
                }
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch('/api/itineraries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: `Trip to ${plan.destination}`,
                    destination: plan.destination,
                    plan_data: modifiedPlan || plan
                })
            });

            const data = await response.json();
            if (data.success) {
                navigate('/saved-itineraries');
            } else {
                alert(data.message || 'Failed to save itinerary');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Server error while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleMagicClick = (type) => {
        console.log('🧠 AI Magic triggered:', type);
        console.log('Plan itinerary:', plan?.itinerary);

        if (!plan || !plan.itinerary || plan.itinerary.length === 0) {
            console.error('No itinerary data available');
            return;
        }

        const day = plan.itinerary[0];
        console.log('Day data:', day);

        // Try to find a slot with smartAlternatives
        let slot = null;
        if (day.morning?.smartAlternatives) {
            slot = day.morning;
        } else if (day.afternoon?.smartAlternatives) {
            slot = day.afternoon;
        } else if (day.evening?.smartAlternatives) {
            slot = day.evening;
        }

        console.log('Selected slot:', slot);

        // Enhanced fallback messages if data is missing
        const fallbackMessages = {
            late: "🌅 No worries! Shift your morning plans to late afternoon (3-5 PM) when crowds thin out. Grab brunch at a local café first, then head straight to your top priority spot. Pro tip: Skip souvenir shopping to save 30+ minutes!",
            skipped: "🎨 Try the neighborhood's hidden gem instead: the local artisan quarter! Just 15 mins away, you'll find authentic street food, live music, and handmade crafts. Locals say it's the real heart of the city - and it's free to explore!",
            overspent: "💰 Smart move! Switch to the free walking tour of the historic district (tips-based, starts every 2 hours). Pack a picnic from the corner market ($8 vs $40 restaurant), and you'll save money while experiencing authentic local life. Win-win!"
        };

        const alternative = slot?.smartAlternatives?.[type] || fallbackMessages[type] || "AI is analyzing your schedule...";

        setMagicResult({
            type,
            title: slot?.title || 'Your Schedule',
            alternative
        });

        const timer = setTimeout(() => setMagicResult(null), 8000);
        timers.current.push(timer);
    };

    const handleSurpriseMe = () => {
        if (!plan?.hiddenGems || plan.hiddenGems.length === 0) return;
        const randomGem = plan.hiddenGems[Math.floor(Math.random() * plan.hiddenGems.length)];
        setSurpriseGem(randomGem);
        setShowSurpriseModal(true);
        setShowSwapOptions(false);
    };

    const handleAddGem = () => {
        setShowSwapOptions(true);
    };

    const handleSwapActivity = (dayIndex, slotKey) => {
        const newPlan = { ...modifiedPlan };
        const day = newPlan.itinerary[dayIndex];

        // Replace the activity with the hidden gem
        day[slotKey] = {
            ...day[slotKey],
            title: surpriseGem.title,
            description: surpriseGem.description,
            type: 'Hidden Gem',
            safeToSkip: false,
            coords: surpriseGem.coords
        };

        setModifiedPlan(newPlan);
        setSurpriseUsed(true);
        setShowSurpriseModal(false);
        setShowSwapOptions(false);
    };

    if (!plan) {
        return (
            <div className="flex justify-center items-center" style={{ minHeight: '100vh', background: 'var(--bg-body)' }}>
                <div className="text-center">
                    <h2>{t('noPlanFound')}</h2>
                    <button onClick={() => navigate('/plan')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        {t('startPlanning')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '5rem', background: '#F8FAFC', paddingTop: '80px' }}>
            {/* Header Image */}
            <div className="trip-header" style={{
                height: '320px',
                background: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url(${plan.coverImage || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'}) center/cover`,
                position: 'relative',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                paddingBottom: '4rem'
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <button
                        onClick={() => navigate('/plan')}
                        style={{
                            position: 'absolute', top: '-110px', left: '0',
                            background: 'white',
                            border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: 'var(--secondary)',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ color: 'white', marginBottom: '0.75rem', fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{plan.destination}</h1>
                        <div className="flex gap-2 items-center" style={{ flexWrap: 'wrap' }}>
                            <span className="chip chip-white">
                                {plan.vibe}
                            </span>
                            <span className="chip chip-white">
                                {plan.dates}
                            </span>
                            <span className="chip chip-white" style={{ background: plan.source === 'live' ? '#DCFCE7' : '#FEF3C7', color: plan.source === 'live' ? '#166534' : '#92400E' }}>
                                {plan.source === 'live' ? <Globe size={12} /> : <Wifi size={12} />} {plan.source === 'live' ? 'Live AI' : 'Offline'}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '-4rem', position: 'relative', zIndex: 10 }}>
                {/* Summary Bar */}
                <div className="card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1.25rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>Budget</span>
                        <strong style={{ fontSize: '1.1rem' }}>${plan.budgetSummary.total}</strong>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--border-light)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>Travelers</span>
                        <strong style={{ fontSize: '1.1rem' }}>{plan.travelers}</strong>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--border-light)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: '700' }}>Safety Score</span>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>{plan.culturalScore}%</strong>
                    </div>
                </div>
                {/* 5️⃣ Map-Based Exploration */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ marginBottom: '2rem' }}
                >
                    <MapExploration plan={modifiedPlan} />
                </motion.div>

                <div className="trip-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '2.5rem' }}>

                    {/* Itinerary Column */}
                    <div className="itinerary-list">
                        {modifiedPlan.itinerary.map((day, index) => (
                            <motion.div
                                key={day.day}
                                className="day-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Day Header */}
                                <div className="day-header">
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0 }}>{t('day')} {day.day}</h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem' }}>{day.date}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <div className="chip" style={{ background: 'white', fontSize: '0.85rem' }}>
                                            <Sun size={16} style={{ color: '#F59E0B' }} /> {day.weather}
                                        </div>
                                        {day.weatherMood && (
                                            <span style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#666', maxWidth: '250px', textAlign: 'right' }}>
                                                {day.weatherMood}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Activities Horizontal Row */}
                                <div className="timeline-container">
                                    {(day.activities ?
                                        day.activities.map(act => ({
                                            label: act.time || (act.title.length > 15 ? act.title.slice(0, 15) + '...' : act.title),
                                            data: act
                                        }))
                                        :
                                        [
                                            { label: "🌅 Wake-up", data: day.wakeup },
                                            { label: "🍳 Breakfast", data: day.breakfast },
                                            { label: t('morning'), data: day.morning },
                                            { label: "🍽️ Lunch", data: day.lunch },
                                            { label: t('afternoon'), data: day.afternoon },
                                            { label: t('evening'), data: day.evening },
                                            { label: "🍷 Dinner", data: day.dinner }
                                        ]
                                    ).filter(slot => slot.data).map((slot, sIdx) => (
                                        <div key={sIdx} className="timeline-item">
                                            <ActivitySlot
                                                label={slot.label}
                                                data={slot.data}
                                                onSelect={setSelectedActivity}
                                                t={t}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                                    <button
                                        onClick={() => setEditingDay(day)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem 1rem',
                                            background: '#f1f5f9',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#475569',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <Edit size={14} /> Edit Plan
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        <AnimatePresence>
                            {editingDay && (
                                <DayEditor
                                    day={editingDay}
                                    dayNumber={editingDay.day}
                                    onSave={handleSaveDay}
                                    onClose={() => setEditingDay(null)}
                                    budget={plan.budget}
                                    preferences={plan.preferences}
                                />
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar */}
                    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* 🛠️ Dashboard Tools */}
                        <div className="sidebar-section">
                            <h4 className="section-label">
                                <Zap size={14} /> Power Tools
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* 💰 Budget Analysis Redirect */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: 'var(--primary-light)', padding: '8px', borderRadius: '8px', color: 'var(--primary)' }}>
                                            <Wallet size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('smartBudget')}</h3>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                        {t('smartBudgetDesc')}
                                    </p>
                                    <button
                                        onClick={() => navigate('/budget', { state: { details: plan.budgetDetails } })}
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        {t('viewDetailedBudget') || 'View Analysis & Currency'} <ArrowRight size={18} />
                                    </button>
                                </motion.div>

                                {/* 🎥 Travel Vlogs Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: '#FFF1F2', padding: '8px', borderRadius: '8px', color: '#E11D48' }}>
                                            <Youtube size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('travelVlogs')}</h3>
                                    </div>
                                    <button
                                        onClick={() => navigate('/vlogs', { state: { vlogs: plan.vlogs, destination: plan.destination } })}
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        {t('watchVlogs')} <ArrowRight size={18} />
                                    </button>
                                </motion.div>

                                {/* ✨ Hidden Gems Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.09 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: '#F5F3FF', padding: '8px', borderRadius: '8px', color: '#7C3AED' }}>
                                            <Sparkles size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('hiddenGemsCard')}</h3>
                                    </div>
                                    <button
                                        onClick={() => navigate('/hidden-gems', { state: { hiddenGems: plan.hiddenGems || [], destination: plan.destination } })}
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        {t('viewSecrets')} <ArrowRight size={18} />
                                    </button>
                                </motion.div>

                                {/* 🧠 AI Magic Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                                    className="card"
                                    style={{ border: '1px solid #FED7AA' }}
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: '#FFEDD5', padding: '8px', borderRadius: '8px', color: '#D97706' }}>
                                            <Zap size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('aiMagic')}</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleMagicClick('late')}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.75rem', padding: '0.5rem', gridColumn: 'span 2' }}
                                        >
                                            <Clock size={14} /> {t('wakeUpLate')}
                                        </button>
                                        <button
                                            onClick={() => handleMagicClick('skipped')}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                                        >
                                            <X size={14} /> {t('skippedPlace')}
                                        </button>
                                        <button
                                            onClick={() => handleMagicClick('overspent')}
                                            className="btn btn-secondary"
                                            style={{ fontSize: '0.75rem', padding: '0.5rem' }}
                                        >
                                            <DollarSign size={14} /> {t('overspent')}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* 🎁 Surprise Me Card */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: '#FCE7F3', padding: '8px', borderRadius: '8px', color: '#DB2777' }}>
                                            <Gift size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('surpriseMeCard')}</h3>
                                    </div>
                                    <button
                                        onClick={handleSurpriseMe}
                                        className="btn btn-primary"
                                        disabled={surpriseUsed}
                                        style={{
                                            width: '100%',
                                            background: surpriseUsed ? '#94a3b8' : '#DB2777',
                                            border: 'none',
                                            cursor: surpriseUsed ? 'not-allowed' : 'pointer',
                                            opacity: surpriseUsed ? 0.8 : 1
                                        }}
                                    >
                                        {surpriseUsed ? 'Surprise Used!' : t('surpriseMeButton')} <Sparkles size={16} />
                                    </button>
                                    {surpriseUsed && (
                                        <p style={{ margin: '8px 0 0', fontSize: '0.7rem', color: '#64748b', textAlign: 'center', fontWeight: '500' }}>
                                            Discovery limit reached for this trip
                                        </p>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* 🧭 Discovery Section */}
                        <div className="sidebar-section">
                            <h4 className="section-label">
                                <Globe size={14} /> Discovery
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Stays / Hotels */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
                                    className="card"
                                >
                                    <div className="flex items-center gap-3" style={{ marginBottom: '1rem' }}>
                                        <div style={{ background: '#DCFCE7', padding: '8px', borderRadius: '8px', color: '#166534' }}>
                                            <Home size={20} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>{t('staySuggestions')}</h3>
                                    </div>
                                    <button
                                        onClick={() => navigate('/hotels', { state: { hotels: plan.hotelSuggestions, destination: plan.destination } })}
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                    >
                                        {t('viewStays')} <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            </div>
                        </div>

                        {/* Local Highlights Card */}
                        <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} style={{ padding: '1.5rem' }}>
                            <h3>{t('highlights')}</h3>
                            <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                                {plan.highlights.map(h => (
                                    <span key={h} style={{ padding: '0.3rem 0.8rem', background: '#F3E8FF', color: '#7E22CE', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </motion.div>

                        {/* 6️⃣ Local Intelligence */}
                        {/* Live Updates (NEW) */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                            <LiveContext plan={plan} />
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <LocalIntelligence data={plan.localIntelligence} />
                        </motion.div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button
                                className="btn"
                                style={{
                                    flex: 1,
                                    background: isSaved ? 'var(--success)' : 'var(--secondary)',
                                    color: 'white'
                                }}
                                onClick={handleDownloadPdf}
                            >
                                <Download size={18} /> {isSaved ? t('saved') : t('savePdf')}
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    opacity: isSaving ? 0.7 : 1,
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                                onClick={handlePersistentSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <Sparkles size={18} />
                                )}
                                {t('saveItinerary') || 'Save to Account'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                <AnimatePresence>
                    {selectedActivity && (
                        <motion.div
                            className="modal-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedActivity(null)}
                        >
                            <motion.div
                                className="modal-content"
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className="modal-close" onClick={() => setSelectedActivity(null)}>
                                    <X size={24} />
                                </button>

                                <div className="flex items-center gap-3">
                                    <Info className="text-primary" size={24} />
                                    <h2 className="modal-title">{selectedActivity.title}</h2>
                                </div>

                                <div className="detail-grid">
                                    <DetailItem icon={<Clock size={16} />} label={t('hours')} value={`${selectedActivity.opening} - ${selectedActivity.closing}`} />
                                    <DetailItem icon={<Ticket size={16} />} label={t('entryCost')} value={convertStringPrice(selectedActivity.cost)} />
                                    <DetailItem icon={<Calendar size={16} />} label={t('holidays')} value={selectedActivity.holidays} />
                                    <DetailItem icon={<MapPin size={16} />} label={t('travelTime')} value={selectedActivity.travelTime} />
                                </div>

                                <div className="warning-box">
                                    <div className="flex items-center gap-2" style={{ marginBottom: '0.5rem' }}>
                                        <AlertTriangle size={18} color="var(--warning)" />
                                        <strong style={{ fontSize: '0.8rem', color: '#92400E', textTransform: 'uppercase' }}>{t('warningsTips')}</strong>
                                    </div>
                                    <p className="warning-text" style={{ marginBottom: selectedActivity.culturalWarnings ? '1rem' : 0 }}>{selectedActivity.warnings}</p>

                                    {selectedActivity.culturalWarnings && (Object.values(selectedActivity.culturalWarnings).some(v => v)) && (
                                        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#0369A1', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                                                <Info size={12} /> Cultural Guidelines
                                            </span>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                {selectedActivity.culturalWarnings.dress && (
                                                    <div style={{ fontSize: '0.75rem', color: '#0C4A6E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Shirt size={12} /> <strong>{t('dressNorms')}:</strong> {selectedActivity.culturalWarnings.dress}
                                                    </div>
                                                )}
                                                {selectedActivity.culturalWarnings.photography && (
                                                    <div style={{ fontSize: '0.75rem', color: '#0C4A6E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Camera size={12} /> <strong>{t('photoRules')}:</strong> {selectedActivity.culturalWarnings.photography}
                                                    </div>
                                                )}
                                                {selectedActivity.culturalWarnings.behavior && (
                                                    <div style={{ fontSize: '0.75rem', color: '#0C4A6E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Users size={12} /> <strong>{t('behaviorTaboos')}:</strong> {selectedActivity.culturalWarnings.behavior}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-4 gap-2">
                                    <a
                                        href={selectedActivity.coords
                                            ? `https://www.google.com/maps/search/?api=1&query=${selectedActivity.coords.lat},${selectedActivity.coords.lng}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedActivity.title + ' ' + plan.destination)}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <MapPin size={18} /> {t('viewLocation') || 'Location'}
                                    </a>
                                    <button className="btn btn-primary" onClick={() => setSelectedActivity(null)}>
                                        {t('gotIt')}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* AI Magic Notification */}
                    {
                        magicResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                                style={{
                                    position: 'fixed',
                                    bottom: '2rem',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 10000,
                                    width: '90%',
                                    maxWidth: '500px'
                                }}
                            >
                                <div className="card" style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid var(--primary)',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
                                    padding: '1.5rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start'
                                }}>
                                    <div style={{ background: 'var(--primary)', padding: '0.6rem', borderRadius: '12px', color: 'white' }}>
                                        <Zap size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <h4 style={{ margin: 0, color: 'var(--primary)' }}>{t('aiMagic')} - {t('smartReschedule')}</h4>
                                            <button onClick={() => setMagicResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.8rem', fontStyle: 'italic' }}>
                                            {t('rescheduleTip')}
                                        </p>
                                        <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                                            <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                {t('alternative')}
                                            </strong>
                                            <div style={{ color: 'var(--text-main)', fontWeight: '600' }}>
                                                {magicResult.alternative}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }

                    {/* Surprise Gem Modal */}
                    <SurpriseGemModal
                        showSurpriseModal={showSurpriseModal}
                        surpriseGem={surpriseGem}
                        showSwapOptions={showSwapOptions}
                        setShowSurpriseModal={setShowSurpriseModal}
                        handleAddGem={handleAddGem}
                        handleSwapActivity={handleSwapActivity}
                        modifiedPlan={modifiedPlan}
                    />
                </AnimatePresence>
            </div>
        </div>
    );
};

const ActivitySlot = ({ label, data, onSelect, t }) => {
    const { convertStringPrice } = useCurrency();
    return (
        <div className="time-slot" onClick={() => onSelect(data)}>
            <div className="slot-time-col">
                <span className="slot-label">{label}</span>
                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {data.time || data.duration}
                </div>
            </div>

            <div className="slot-content-col" style={{ paddingBottom: '0.75rem' }}>
                <div className="activity-title" style={{ fontSize: '0.95rem', marginBottom: '0.25rem' }}>{data.title}</div>

                <div className="meta-row" style={{ marginBottom: '0.5rem' }}>
                    <span className="meta-item"><Clock size={14} /> {data.duration}</span>
                    <span className="meta-item"><Ticket size={14} /> {convertStringPrice(data.cost)}</span>
                    <span className="meta-item"><MapPin size={14} /> {data.travelTime} {t('away')}</span>
                </div>

                {data.crowdDensity && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {t('crowdDensity') || 'Crowd Density'}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: parseInt(data.crowdDensity) > 70 ? 'var(--error)' : 'var(--text-main)' }}>
                                {data.crowdDensity}
                            </span>
                        </div>
                        <div style={{ height: '4px', width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: data.crowdDensity,
                                background: parseInt(data.crowdDensity) > 70 ? 'var(--error)' : parseInt(data.crowdDensity) > 40 ? '#F59E0B' : 'var(--success)',
                            }} />
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {data.safeToSkip ? (
                        <div style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #BBF7D0' }}>
                            <ShieldCheck size={14} /> {t('safeToSkip') || 'SAFE TO SKIP'}
                        </div>
                    ) : (
                        data.regretProb && (
                            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #FECACA' }}>
                                <Zap size={14} /> {t('fomoLevel') || 'FOMO ALERT'}: {data.regretProb}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value }) => (
    <div className="detail-item">
        <div className="flex items-center gap-1">
            {icon}
            <span className="detail-label">{label}</span>
        </div>
        <div className="detail-value">{value}</div>
    </div>
);

export default TripPlan;

