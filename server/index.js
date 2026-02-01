require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generateMockPlan, handleChatResponse } = require('./mockAI');

const app = express();
const PORT = 5005;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
    res.send('TravelTales API v2 is running!');
});

const geminiService = require('./geminiService');
const { generateRealPlan } = geminiService;

// Database Connection
require('./db');

// Auth & Itineraries Routes
const authRoutes = require('./auth');
const itineraryRoutes = require('./itineraries');

app.use('/api/auth', authRoutes);
app.use('/api/itineraries', itineraryRoutes);


// Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        console.log("Chat Request:", message);

        const reply = await handleChatResponse(message);
        res.json({ reply });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ success: false, message: "AI Assistant is resting..." });
    }
});

app.get('/api/geocode', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: "Query parameter 'q' is missing" });

        console.log("Geocoding Request for:", q);

        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
            headers: {
                'User-Agent': 'TravelTales/1.0 (contact: support@traveltales.ai)'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Geocoding Error:", error);
        res.status(500).json({ success: false, message: "Geocoding failed", details: error.message });
    }
});

app.post('/api/generate-plan', async (req, res) => {
    const formData = req.body;
    console.log("Received AI Plan Request for:", formData.destination);

    // 0. Fetch Coordinates & Real Weather Data
    let weatherData = null;
    let destinationCoords = null;

    try {
        // Find coordinates first for better context/fallback
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.destination)}&limit=1`, {
            headers: { 'User-Agent': 'TravelTales/1.0' }
        });
        const geoData = await geoResponse.json();
        if (geoData && geoData[0]) {
            destinationCoords = { lat: parseFloat(geoData[0].lat), lng: parseFloat(geoData[0].lon) };
            formData.destinationCoords = destinationCoords;
            console.log(`📍 Geocoded ${formData.destination} to:`, destinationCoords);
        }

        if (geminiService.fetchWeather) {
            weatherData = await geminiService.fetchWeather(formData.destination);
            if (weatherData) {
                console.log(`🌦️ Real-time weather fetched for ${formData.destination}: ${weatherData.description}, ${weatherData.temp}°C`);
                formData.weather = weatherData;
            }
        }
    } catch (err) {
        console.warn("Pre-fetch warning:", err.message);
    }

    try {
        // 1. Try Real AI Generation
        const plan = await generateRealPlan(formData);
        console.log("✅ Successfully generated REAL plan for:", formData.destination);
        res.json({ success: true, plan: { ...plan, source: 'live' } });

    } catch (realAiError) {
        console.warn("⚠️ Real AI failed or key missing, falling back to Mock AI:", realAiError.message);

        // 2. Fallback to Mock AI
        try {
            setTimeout(() => {
                try {
                    const plan = generateMockPlan(formData);
                    console.log("ℹ️ Generated MOCK plan for:", formData.destination);
                    res.json({ success: true, plan });
                } catch (mockError) {
                    console.error("❌ Mock generation error:", mockError);
                    res.status(500).json({ success: false, message: "Critical failure in plan generation" });
                }
            }, 1000);
        } catch (err) {
            res.status(500).json({ success: false, message: "System error" });
        }
    }
});

const feedbackStore = [];

app.post('/api/analyze-feedback', async (req, res) => {
    const { feedback, email } = req.body;
    if (!feedback) return res.status(400).json({ error: "Feedback text is required" });

    console.log("Analyzing feedback from:", email || "Anonymous");
    try {
        const analysis = await geminiService.analyzeFeedback(feedback);

        // Store the result
        const feedbackEntry = {
            id: Date.now(),
            text: feedback,
            email: email || 'Anonymous',
            analysis,
            timestamp: new Date().toISOString()
        };
        feedbackStore.unshift(feedbackEntry); // Add to beginning (newest first)

        // Keep store size manageable (e.g., last 50)
        if (feedbackStore.length > 50) feedbackStore.pop();

        res.json({ success: true, analysis, entry: feedbackEntry });
    } catch (error) {
        console.error("Feedback analysis error:", error);
        res.status(500).json({ success: false, message: "Analysis failed" });
    }
});

app.get('/api/feedbacks', (req, res) => {
    res.json({ success: true, feedbacks: feedbackStore });
});

app.delete('/api/feedbacks/:id', (req, res) => {
    const { id } = req.params;
    const index = feedbackStore.findIndex(f => f.id.toString() === id);
    if (index !== -1) {
        feedbackStore.splice(index, 1);
        res.json({ success: true, message: "Feedback removed" });
    } else {
        res.status(404).json({ success: false, message: "Feedback not found" });
    }
});

// Location Autocomplete using Nominatim (OpenStreetMap)
app.get('/api/location-autocomplete', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ error: "Query parameter is required" });

        // Use standard User-Agent as required by Nominatim usage policy
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TravelTales/1.0 (educational project)'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            const suggestions = data.map(item => ({
                name: item.name || item.display_name.split(',')[0],
                fullName: item.display_name,
                coordinates: {
                    lng: parseFloat(item.lon),
                    lat: parseFloat(item.lat)
                },
                type: item.type
            }));
            res.json({ success: true, suggestions });
        } else {
            res.json({ success: true, suggestions: [] });
        }
    } catch (error) {
        console.error("Location autocomplete error:", error);
        res.status(500).json({ success: false, error: "Failed to fetch location suggestions" });
    }
});

// Generate Activity Details for a specific location
app.post('/api/generate-activity-details', async (req, res) => {
    try {
        const { location, timeSlot, budget, preferences } = req.body;

        if (!location || !location.name) {
            return res.status(400).json({ error: "Location name is required" });
        }

        console.log(`Generating activity details for: ${location.fullName || location.name}`);

        // Use Groq to generate detailed activity information
        const activityDetails = await geminiService.generateActivityDetails({
            location: location.fullName || location.name,
            coordinates: location.coordinates,
            timeSlot: timeSlot || 'afternoon',
            budget: budget || 2,
            preferences: preferences || []
        });

        res.json({ success: true, activity: activityDetails });
    } catch (error) {
        console.error("Activity generation error:", error);

        // Fallback to basic activity structure if AI fails
        const fallbackActivity = {
            title: req.body.location.name,
            type: 'Experience',
            time: req.body.timeSlot || 'Afternoon',
            duration: '2h',
            cost: req.body.budget === 1 ? '$15' : req.body.budget === 3 ? '$80' : '$35',
            description: `Visit ${req.body.location.name}`,
            coords: req.body.location.coordinates,
            travelTime: '15 mins',
            opening: '9:00 AM',
            closing: '6:00 PM'
        };

        res.json({ success: true, activity: fallbackActivity, fallback: true });
    }
});

app.post('/api/restart', (req, res) => {
    res.json({ success: true, message: "Server restarting..." });
    console.log("♻️  Restart triggered via API. Exiting process...");
    setTimeout(() => {
        process.exit(0); // Auto-restart checks should pick this up or I will restart it manually
    }, 500);
});

if (process.env.NODE_ENV !== 'production') {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please kill the process or use a different port.`);
            process.exit(1);
        } else {
            console.error("Server error:", err);
        }
    });

    server.on('error', (err) => {
        console.error("SERVER ERROR:", err);
    });
}

module.exports = app;

server.on('error', (err) => {
    console.error("SERVER ERROR:", err);
});

// Keeping the process alive explicitly if needed (though listen should do it)
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
