// ============================================
// CloudKitchen Pro - Assignment 2 MongoDB Integration
// Student: Zhan Sun
// Student ID: 
// Building on Assignment 1 structure
// ============================================

const express = require('express');
const cors = require('cors');

// MongoDB connection
const connectDB = require('./config/database');

// Middleware
const { setCurrentUser } = require('./middleware/auth');

// Routes (JSON API only)
const recipeRoutes = require('./routes/recipes');
const inventoryRoutes = require('./routes/inventory');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');

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
    origin: 'http://localhost:4200',  // Angular dev server
    credentials: true,                 // Allow cookies/sessions
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// User session middleware - sets current user globally
app.use(setCurrentUser);

// ============================================
// ROUTES CONFIGURATION
// JSON API only - No server-side rendering
// ============================================

// Recipe management routes
app.use('/api/recipes', recipeRoutes);

// Inventory management routes
app.use('/api/inventory', inventoryRoutes);

// Report routes (admin only)
app.use('/reports', reportRoutes);

// Inventory insights routes (manager/admin only)
const inventoryInsightsRoutes = require('./routes/inventory-insights');
app.use('/inventory-insights', inventoryInsightsRoutes);

// Recipe recommendations routes (chef only)
const recommendationsRoutes = require('./routes/recommendations');
app.use('/recommendations', recommendationsRoutes);

// Auth routes (login, register, logout)
app.use('/', authRoutes);

// Dashboard API routes
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// ERROR HANDLING
// JSON API error responses only
// ============================================

// 404 handler - API endpoint not found
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        statusCode: 404
    });
});

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
// START SERVER
// ============================================

app.listen(port, () => {
    console.log(`CloudKitchen Pro Server Started`);
    console.log(`Student: Zhan Sun ()`);
    console.log(`Server: http://localhost:${port}`);
    console.log(`Database: MongoDB`);
});

module.exports = app;