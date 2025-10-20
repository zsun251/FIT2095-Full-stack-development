// ============================================
// CloudKitchen Pro - Assignment 2 MongoDB Integration
// Student: Zhan Sun
// Student ID: 
// Building on Assignment 1 structure
// ============================================

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// MongoDB connection
const connectDB = require('./config/database');

// Middleware
const { setCurrentUser } = require('./middleware/auth');

// Routes (JSON API only)
const recipeRoutes = require('./routes/recipes');
const inventoryRoutes = require('./routes/inventory');
const authRoutes = require('./routes/auth');
const translationRoutes = require('./routes/translation');

// Create Express application
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// ============================================
// MIDDLEWARE CONFIGURATION
// No EJS - Pure REST API for Angular frontend
// ============================================

// CORS Configuration - Allow Angular frontend access
app.use(cors({
    origin: ['http://localhost:4200', 'http://34.126.197.155:3000', 'http://34.126.197.155'],  // Angular dev server and VM
    credentials: true,                 // Allow cookies/sessions
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static audio files
app.use('/audio', express.static('public/audio'));

// Serve Angular frontend static files
const path = require('path');
app.use(express.static(path.join(__dirname, '../cloudkitchen/dist/cloudkitchen/browser')));

// User session middleware - sets current user globally
app.use(setCurrentUser);

// ============================================
// ROUTES CONFIGURATION
// JSON API only - No server-side rendering
// Student ID: 
// ============================================

// Recipe management routes
app.use('/api/recipes', recipeRoutes);

// Inventory management routes
app.use('/api/inventory', inventoryRoutes);

// Auth routes (login, register, logout)
app.use('/api/auth', authRoutes);

// Dashboard API routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// Translation routes (HD Task 2)
app.use('/api/translation', translationRoutes);

// ============================================
// ANGULAR FRONTEND FALLBACK
// All non-API routes serve Angular index.html
// ============================================

// Serve Angular app for all non-API routes
app.use((req, res) => {
    // If request is for API, return 404
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/reports') || req.originalUrl.startsWith('/inventory-insights') || req.originalUrl.startsWith('/recommendations')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            statusCode: 404
        });
    }

    // Otherwise serve Angular index.html
    res.sendFile(path.join(__dirname, '../cloudkitchen/dist/cloudkitchen/browser/index.html'));
});

// ============================================
// ERROR HANDLING
// JSON API error responses only
// ============================================

// Global error handler - Server errors
app.use((error, _req, res, _next) => {
    console.error('Global Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        statusCode: 500
    });
});

// ============================================
// START SERVER WITH SOCKET.IO
// ============================================

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:4200', 'http://34.126.197.155:3000', 'http://34.126.197.155'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO event handlers
const textToSpeechService = require('./services/textToSpeechService');
const Recipe = require('./models/Recipe');

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle text-to-speech request
    socket.on('generate-speech', async (data) => {
        try {
            const { recipeId } = data;

            // Fetch recipe
            const recipe = await Recipe.findOne({ recipeId });
            if (!recipe) {
                socket.emit('speech-error', { error: 'Recipe not found' });
                return;
            }

            // Generate speech
            socket.emit('speech-generating', { message: 'Generating audio...' });

            const result = await textToSpeechService.synthesizeRecipeInstructions(
                recipe.instructions,
                recipeId
            );

            if (result.success) {
                socket.emit('speech-ready', {
                    audioUrl: result.audioUrl,
                    recipeId
                });
            } else {
                socket.emit('speech-error', { error: result.error });
            }
        } catch (error) {
            console.error('Socket.IO error:', error);
            socket.emit('speech-error', { error: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Cleanup old audio files every hour
setInterval(() => {
    textToSpeechService.cleanupOldAudioFiles();
}, 60 * 60 * 1000);

server.listen(port, () => {
    console.log(`CloudKitchen Pro Server Started`);
    console.log(`Student: Zhan Sun ()`);
    console.log(`Server: http://localhost:${port}`);
    console.log(`Database: MongoDB`);
    console.log(`Socket.IO: Enabled`);
});

module.exports = app;