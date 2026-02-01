import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Mic, Send, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TravelChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm your AI Travel Buddy. Ask me anything about your trip!" }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(true); // Voice toggle
    const messagesEndRef = useRef(null);

    // --- Web Speech API: Recognition (Speech to Text) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript);
            handleSend(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
    }

    // --- Web Speech API: Synthesis (Text to Speech) ---
    const speak = (text) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // Stop current speech
        const utterance = new SpeechSynthesisUtterance(text);

        // Ensure voices are loaded (some browsers need this)
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices[0];
        }

        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    };

    const toggleSpeaking = () => {
        const nextSpeakingState = !isSpeaking;
        setIsSpeaking(nextSpeakingState);

        if (nextSpeakingState) {
            // If turning ON, read the last bot message
            const botMessages = messages.filter(m => m.role === 'bot');
            if (botMessages.length > 0) {
                const lastBotMsg = botMessages[botMessages.length - 1];
                speak(lastBotMsg.text);
            }
        } else {
            // If turning OFF, stop any current speech
            window.speechSynthesis.cancel();
        }
    };

    const toggleListening = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            setIsListening(true);
            recognition.start();
        }
    };

    const handleSend = async (overrideText) => {
        const text = overrideText || userInput;
        if (!text.trim()) return;

        const newMsg = { role: 'user', text };
        setMessages(prev => [...prev, newMsg]);
        setUserInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();

            const botMsg = { role: 'bot', text: data.reply };
            setMessages(prev => [...prev, botMsg]);
            if (isSpeaking) speak(data.reply);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg = { role: 'bot', text: "Sorry, I'm having trouble connecting to the travel hub." };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="chatbot-wrapper" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
            {/* 1. Chat Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    border: 'none',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </motion.button>

            {/* 2. Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: 0,
                            width: '350px',
                            height: '500px',
                            background: 'rgba(255, 255, 255, 0.85)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '1.2rem', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="flex items-center gap-2">
                                <Sparkles size={20} />
                                <span style={{ fontWeight: 'bold' }}>Travel AI Buddy</span>
                            </div>
                            <button onClick={toggleSpeaking} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', transition: 'transform 0.2s' }}>
                                <motion.div whileHover={{ scale: 1.2 }}>
                                    {isSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                </motion.div>
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === 'bot' ? -10 : 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    style={{
                                        alignSelf: m.role === 'bot' ? 'flex-start' : 'flex-end',
                                        maxWidth: '80%',
                                        padding: '0.8rem 1rem',
                                        borderRadius: m.role === 'bot' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                        background: m.role === 'bot' ? 'white' : 'var(--primary)',
                                        color: m.role === 'bot' ? 'var(--text-main' : 'white',
                                        fontSize: '0.9rem',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        lineHeight: '1.4'
                                    }}
                                >
                                    {m.text}
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div style={{ alignSelf: 'flex-start', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                                    Thinking...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={toggleListening}
                                    style={{
                                        background: isListening ? '#EF4444' : '#F3F4F6',
                                        color: isListening ? 'white' : '#6B7280',
                                        border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                                </button>
                                <input
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Type your question..."
                                    style={{
                                        flex: 1, border: 'none', background: '#F3F4F6', padding: '0.6rem 1rem',
                                        borderRadius: '20px', fontSize: '0.9rem', outline: 'none'
                                    }}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TravelChatbot;
