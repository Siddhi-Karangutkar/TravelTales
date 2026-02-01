import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, MapPin, Globe, DollarSign, Calendar, Users, Zap, Youtube, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useCurrency } from './CurrencyContext';

const Onboarding = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language } = useLanguage();
    const { selectedCurrency, currencySymbol } = useCurrency();
    const [isLoading, setIsLoading] = useState(false);

    // Get prefilled data from location state (from Destination Discovery)
    const prefilledData = location.state?.prefilledData || {};

    const [formData, setFormData] = useState({
        destination: prefilledData.destination || '',
        startDate: prefilledData.startDate || '',
        endDate: prefilledData.endDate || '',
        partners: '',
        mood: '',
        budget: prefilledData.budget || '',
        budgetSplit: 'equal',
        preferences: [],
        constraints: [],
        safety: [],
        travelerCount: prefilledData.travelers || 1
    });

    const [predictions, setPredictions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLocationSelected, setIsLocationSelected] = useState(!!prefilledData.destination);

    const handleInputChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Date Validation Logic
            if (field === 'startDate') {
                if (!prev.endDate || prev.endDate < value) {
                    newData.endDate = value;
                }
            }

            // Solo Traveler Logic
            if (field === 'partners' && value === 'Solo') {
                newData.travelerCount = 1;
            }

            return newData;
        });
    };

    const toggleSelection = (field, item) => {
        setFormData(prev => {
            const current = prev[field];
            if (current.includes(item)) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...current, item] };
            }
        });
    };

    const fetchPredictions = async (query) => {
        if (query.length < 3) {
            setPredictions([]);
            setShowDropdown(false);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
            const data = await response.json();
            const formatted = data.map(item => ({
                id: item.place_id,
                display_name: item.display_name,
                name: item.name,
                address: item.address
            }));
            setPredictions(formatted);
            setShowDropdown(true);

            // Case-insensitive exact match check
            const exactMatch = formatted.find(loc =>
                loc.display_name.toLowerCase() === query.toLowerCase() ||
                loc.name.toLowerCase() === query.toLowerCase()
            );
            if (exactMatch) {
                setIsLocationSelected(true);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    // Simple debounce
    const debounceTimer = React.useRef(null);
    const handleDestinationSearch = (value) => {
        handleInputChange('destination', value);
        setIsLocationSelected(false);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            fetchPredictions(value);
        }, 500);
    };

    const handleSelectLocation = (loc) => {
        handleInputChange('destination', loc.display_name);
        setIsLocationSelected(true);
        setPredictions([]);
        setShowDropdown(false);
    };

    const handleGenerate = async () => {
        if (!formData.destination || !formData.startDate || !formData.endDate || !formData.budget || formData.budget <= 0) {
            alert(t('fillBasicsAlert') || "Please fill in all basic details including destination, dates, and budget.");
            return;
        }

        if (!isLocationSelected) {
            alert("Please select a valid location from the suggestions dropdown!");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/generate-plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, language })
            });

            const data = await response.json();

            if (data.success) {
                navigate('/trip', { state: { plan: data.plan } });
            } else {
                alert("Failed to generate plan. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Is the server running?");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="onboarding-container">
            <header className="text-center" style={{ marginBottom: '3rem' }}>
                <h2>{t('letPlanTrip')}</h2>
                <p>{t('onboardingSub')}</p>
            </header>

            <div className="input-container">

                {/* Card 1: Destination */}
                <InputCard number="1" title={t('whereTo')} subtitle={t('whereToSub')}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder={t('destPlaceholder')}
                            className={`input-field ${!isLocationSelected && formData.destination.length > 2 ? 'invalid' : ''}`}
                            value={formData.destination}
                            onChange={(e) => handleDestinationSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                            style={!isLocationSelected && formData.destination.length > 2 ? { borderColor: 'var(--danger)', boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)' } : {}}
                        />
                        {!isLocationSelected && formData.destination.length > 2 && (
                            <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.4rem', fontWeight: '600' }}>
                                ⚠️ Please select from the dropdown options
                            </div>
                        )}
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                                <Loader2 className="animate-spin text-primary" size={20} />
                            </div>
                        )}

                        {showDropdown && predictions.length > 0 && (
                            <div className="autocomplete-dropdown">
                                {predictions.map(loc => (
                                    <div
                                        key={loc.id}
                                        className="autocomplete-item"
                                        onClick={() => handleSelectLocation(loc)}
                                    >
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{loc.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {loc.display_name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </InputCard>

                {/* Card 2: Dates */}
                <InputCard number="2" title={t('whenGoing')} subtitle={t('whenGoingSub')}>
                    <div className="flex gap-4" style={{ flexDirection: 'column' }}>
                        <div className="w-full">
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', color: 'var(--text-light)' }}>{t('startDate')}</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.startDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleInputChange('startDate', e.target.value)}
                            />
                        </div>
                        <div className="w-full">
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', color: 'var(--text-light)' }}>{t('endDate')}</label>
                            <input
                                type="date"
                                className="input-field"
                                value={formData.endDate}
                                min={formData.startDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleInputChange('endDate', e.target.value)}
                            />
                        </div>
                    </div>
                </InputCard>

                {/* Card 3: Partners */}
                <InputCard number="3" title={t('whoComing')} subtitle={t('whoComingSub')}>
                    <div className="selection-grid" style={{ marginBottom: '1.5rem' }}>
                        {['Solo', 'Couple', 'Friends', 'Family', 'Seniors', 'Girls Trip'].map(type => (
                            <SelectableCard
                                key={type}
                                label={type}
                                selected={formData.partners === type}
                                onClick={() => handleInputChange('partners', type)}
                            />
                        ))}
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            {t('exactTravelerCount') || 'Or enter exact number of travelers'}
                        </label>
                        <input
                            type="number"
                            min="1"
                            className="input-field"
                            disabled={formData.partners === 'Solo'}
                            style={{
                                maxWidth: '120px',
                                opacity: formData.partners === 'Solo' ? 0.6 : 1,
                                cursor: formData.partners === 'Solo' ? 'not-allowed' : 'text'
                            }}
                            value={formData.travelerCount || 1}
                            onChange={(e) => handleInputChange('travelerCount', parseInt(e.target.value) || 1)}
                        />
                    </div>
                </InputCard>

                {/* Card 4: Mood */}
                <InputCard number="4" title={t('vibe')} subtitle={t('vibeSub')}>
                    <div className="selection-grid">
                        {[
                            { label: 'Chill 😌', value: 'chill' },
                            { label: 'Adventure 🏔️', value: 'adventure' },
                            { label: 'Party 🎉', value: 'party' },
                            { label: 'Romantic ❤️', value: 'romantic' },
                            { label: 'Exploration 🌍', value: 'exploration' }
                        ].map(mood => (
                            <SelectableCard
                                key={mood.value}
                                label={mood.label}
                                selected={formData.mood === mood.value}
                                onClick={() => handleInputChange('mood', mood.value)}
                            />
                        ))}
                    </div>
                </InputCard>

                {/* Card 5: Budget */}
                <InputCard number="5" title={t('budgetPref')} subtitle={t('budgetSub')}>
                    <div style={{ padding: '0 1rem' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{
                                position: 'absolute',
                                left: '1rem',
                                fontSize: '1.25rem',
                                fontWeight: '800',
                                color: 'var(--primary)',
                                pointerEvents: 'none'
                            }}>
                                {currencySymbol}
                            </span>
                            <input
                                type="number"
                                min="100"
                                className="input-field"
                                value={formData.budget}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '') {
                                        handleInputChange('budget', '');
                                    } else {
                                        const num = parseInt(val);
                                        if (num > 0) {
                                            handleInputChange('budget', num);
                                        } else if (num === 0) {
                                            // Do nothing or reset to empty if they try to type 0
                                            handleInputChange('budget', '');
                                        }
                                    }
                                }}
                                style={{
                                    paddingLeft: '3rem',
                                    fontSize: '1.25rem',
                                    fontWeight: '800',
                                    color: 'var(--primary)'
                                }}
                            />
                        </div>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-light)', fontWeight: '600' }}>
                            {t('totalBudgetIn') || 'Total trip budget in'} {selectedCurrency || 'USD'}
                        </p>
                    </div>
                </InputCard>

                {/* Card 6: Interests */}
                <InputCard number="6" title={t('interests')} subtitle={t('interestsSub')}>
                    <div className="flex" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['Foodie 🍜', 'Shopping 🛍️', 'Nature 🌿', 'History 🏛️', 'Nightlife 🌃', 'Photography 📸', 'Art 🎨', 'Hidden Gems 💎'].map(pref => (
                            <FilterChip
                                key={pref}
                                label={pref}
                                selected={formData.preferences.includes(pref)}
                                onClick={() => toggleSelection('preferences', pref)}
                            />
                        ))}
                    </div>
                </InputCard>

                {/* Card 8: Constraints */}
                <InputCard number="8" title={t('constraints')} subtitle={t('constraintsSub')}>
                    <div className="flex flex-col gap-2">
                        {['Limited Walking', 'No Early Mornings', 'Avoid Crowds', 'Dietary Restrictions'].map(item => (
                            <CheckboxItem
                                key={item}
                                label={item}
                                checked={formData.constraints.includes(item)}
                                onChange={() => toggleSelection('constraints', item)}
                            />
                        ))}
                    </div>
                </InputCard>

                {/* Card 9: Safety & Comfort */}
                <InputCard number="9" title={t('safetyComfort')} subtitle={t('safetyComfortSub')}>
                    <div className="flex flex-col gap-2">
                        {['Prefer safe areas only', 'Women-friendly places', 'Emergency contacts needed'].map(item => (
                            <CheckboxItem
                                key={item}
                                label={item}
                                checked={formData.safety.includes(item)}
                                onChange={() => toggleSelection('safety', item)}
                            />
                        ))}
                    </div>
                </InputCard>

                <div className="flex justify-center" style={{ marginTop: '3rem' }}>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}
                        onClick={handleGenerate}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} /> {t('generating')}
                            </>
                        ) : (
                            `✨ ${t('generatePlan')}`
                        )}
                    </button>
                </div>
            </div >
        </div >
    );
};

const InputCard = ({ number, title, subtitle, children }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        className="card"
        style={{ marginBottom: '2rem' }}
    >
        <div className="flex items-center gap-4" style={{ marginBottom: '1.5rem' }}>
            <div className="form-step-number">{number}</div>
            <div>
                <h3>{title}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{subtitle}</p>
            </div>
        </div>
        <div style={{ marginLeft: '3.5rem' }}>{children}</div>
    </motion.div>
);

const SelectableCard = ({ label, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`selection-card ${selected ? 'selected' : ''}`}
    >
        {label}
    </div>
);

const FilterChip = ({ label, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`chip ${selected ? 'selected' : ''}`}
    >
        {label}
    </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
    <div
        onClick={onChange}
        className={`checkbox-row ${checked ? 'checked' : ''}`}
    >
        <div className="custom-checkbox">
            {checked && <Check size={14} strokeWidth={4} />}
        </div>
        <span>{label}</span>
    </div>
);

export default Onboarding;

