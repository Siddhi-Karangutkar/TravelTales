import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Mail, Globe, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || "/";
    const pendingPlan = location.state?.plan;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (data.success) {
                login(data.user, data.token);
                // Redirect back to where the user came from
                navigate(from, { replace: true, state: { plan: pendingPlan } });
            } else {
                setError(data.message || 'Authentication failed');
            }
        } catch (err) {
            console.error(err);
            setError('Server error during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '20px'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '32px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                    maxWidth: '450px',
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    background: 'var(--primary)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Globe color="white" size={32} />
                </div>

                <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
                    {pendingPlan ? 'Save Your Trip' : 'Welcome Abroad'}
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
                    {pendingPlan
                        ? 'Enter your email to save your itinerary and access it anytime.'
                        : 'Sign in with your email to access your saved adventures.'}
                </p>

                {error && (
                    <div style={{
                        background: '#fef2f2',
                        color: '#dc2626',
                        padding: '12px',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}>
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            marginBottom: '0.5rem',
                            paddingLeft: '0.5rem'
                        }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: '1.25rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#94A3B8'
                                }}
                            />
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '1rem 1rem 1rem 3rem',
                                    borderRadius: '16px',
                                    border: '2px solid #E2E8F0',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '16px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Continue <ArrowRight size={20} /></>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        First time? We'll create an account for you automatically!
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
