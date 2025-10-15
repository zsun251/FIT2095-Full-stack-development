// ============================================
// CloudKitchen Pro - Assignment 2 MongoDB Integration
// Student: Zhan Sun
// Student ID: 
// Building on Assignment 1 structure
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// MongoDB connection
const connectDB = require('./config/database');

// Middleware
const { setCurrentUser } = require('./middleware/auth');

// Routes
const homeRoutes = require('./routes/home');
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
// VIEW ENGINE CONFIGURATION
// ============================================

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve Bootstrap from node_modules
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// User session middleware - sets current user globally
app.use(setCurrentUser);

// ============================================
// ROUTES CONFIGURATION
// ============================================

// Home routes (includes homepage and main API endpoints)
app.use('/', homeRoutes);

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

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((_req, res) => {
    res.status(404).render('error', {
        title: 'Page Not Found',
        statusCode: 404,
        message: 'The page you are looking for does not exist.',
        studentId: ''
    });
});

// Global error handler
app.use((error, _req, res, _next) => {
    console.error('Global Error:', error);
    res.status(500).render('error', {
        title: 'Server Error',
        statusCode: 500,
        message: 'Something went wrong on the server.',
        studentId: ''
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