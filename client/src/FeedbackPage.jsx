import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, CheckCircle, AlertTriangle, Activity, ArrowLeft, Trash2, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const FeedbackPage = () => {
    const { user, isAuthenticated } = useAuth();
    const [feedback, setFeedback] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [feedbacks, setFeedbacks] = useState([]);
    const navigate = useNavigate();

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch('/api/feedbacks');
            const data = await res.json();
            if (data.success) {
                setFeedbacks(data.feedbacks);
            }
        } catch (e) {
            console.error("Failed to fetch feedbacks", e);
        }
    };

    const deleteFeedback = async (id) => {
        try {
            await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
            setFeedbacks(feedbacks.filter(f => f.id !== id));
        } catch (e) {
            console.error("Failed to delete feedback", e);
        }
    };

    React.useEffect(() => {
        fetchFeedbacks();
    }, []);

    const analyzeFeedback = async () => {
        if (!feedback.trim()) return;
        setLoading(true);
        setAnalysis(null);

        try {
            const response = await fetch('/api/analyze-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    feedback,
                    email: user?.email || 'Anonymous'
                })
            });
            const data = await response.json();
            if (data.success) {
                setAnalysis(data.analysis);
                setFeedback(''); // Clear input
                fetchFeedbacks(); // Refresh list
            }
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '2rem' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '2rem' }}
                >
                    <ArrowLeft size={20} /> Back to Home
                </button>

                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <MessageSquare size={40} color="#6366f1" /> Feedback Analysis
                </h1>
                <p style={{ color: 'var(--text-sub)', marginBottom: '3rem', fontSize: '1.1rem' }}>
                    Share your experience and let our AI analyze your feedback instantly.
                </p>

                {!isAuthenticated ? (
                    <div className="card" style={{ padding: '3rem', borderRadius: '24px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                        <User size={64} color="#6366f1" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>Login Required</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
                            Please log in to share your travel experiences and contribute to our community.
                        </p>
                        <button
                            onClick={() => navigate('/login', { state: { from: '/feedback' } })}
                            className="btn"
                            style={{
                                padding: '1rem 2rem',
                                background: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            Login to Continue
                        </button>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '2rem', borderRadius: '24px', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#F0F9FF', borderRadius: '12px', border: '1px solid #BAE6FD' }}>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#0369a1' }}>
                                ✉️ Posting as: <strong>{user?.email}</strong>
                            </p>
                        </div>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Tell us about your trip..."
                            style={{
                                width: '100%',
                                height: '150px',
                                padding: '1.5rem',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                fontSize: '1rem',
                                marginBottom: '1.5rem',
                                resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                        <button
                            onClick={analyzeFeedback}
                            disabled={loading || !feedback.trim()}
                            className="btn"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: loading ? '#cbd5e1' : '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {loading ? <Activity className="spin" /> : <Send size={20} />}
                            {loading ? 'Analyzing...' : 'Analyze Feedback'}
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card"
                            style={{
                                marginTop: '2rem',
                                padding: '2rem',
                                borderRadius: '24px',
                                background: analysis.sentiment === 'Positive' ? '#ecfdf5' : analysis.sentiment === 'Negative' ? '#fef2f2' : '#f8fafc',
                                border: `1px solid ${analysis.sentiment === 'Positive' ? '#6ee7b7' : analysis.sentiment === 'Negative' ? '#fca5a5' : '#cbd5e1'}`
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Analysis Result</h3>
                                <div style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '50px',
                                    background: analysis.sentiment === 'Positive' ? '#10b981' : analysis.sentiment === 'Negative' ? '#ef4444' : '#64748b',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}>
                                    {analysis.sentiment}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#475569' }}>SUMMARY</strong>
                                <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>{analysis.main_feedback}</p>
                            </div>

                            {analysis.action_needed ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: '#b91c1c' }}>
                                    <AlertTriangle size={24} />
                                    <strong>Action Needed: This usage requires attention.</strong>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: '#047857' }}>
                                    <CheckCircle size={24} />
                                    <strong>No immediate action required.</strong>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Community Feedback Section */}
                <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0' }}>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Community Insights <span style={{ fontSize: '0.9rem', background: '#e2e8f0', padding: '0.2rem 0.6rem', borderRadius: '50px', color: '#64748b' }}>Live</span>
                    </h2>

                    <div className="feedback-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {feedbacks.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>No community feedback yet. Be the first!</p>
                        ) : (
                            feedbacks.map(item => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="card"
                                    style={{
                                        padding: '1.5rem',
                                        borderRadius: '16px',
                                        background: 'white',
                                        border: '1px solid #f1f5f9',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                <User size={14} />
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                                                {item.email || 'Anonymous'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: '20px',
                                                background: item.analysis.sentiment === 'Positive' ? '#d1fae5' : item.analysis.sentiment === 'Negative' ? '#fee2e2' : '#f1f5f9',
                                                color: item.analysis.sentiment === 'Positive' ? '#059669' : item.analysis.sentiment === 'Negative' ? '#dc2626' : '#475569',
                                                fontWeight: 'bold'
                                            }}>
                                                {item.analysis.sentiment}
                                            </span>
                                            <button
                                                onClick={() => deleteFeedback(item.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#cbd5e1', display: 'flex' }}
                                                title="Remove feedback"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </div>
                                    <p style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '1rem', fontStyle: 'italic' }}>
                                        "{item.text.length > 80 ? item.text.substring(0, 80) + '...' : item.text}"
                                    </p>
                                    <div style={{ fontSize: '0.85rem', color: '#475569', borderTop: '1px solid #f8fafc', paddingTop: '0.5rem' }}>
                                        <strong>AI Summary:</strong> {item.analysis.main_feedback}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackPage;
