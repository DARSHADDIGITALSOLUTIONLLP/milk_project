const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const bodyParser = require('body-parser');
const app = express();
require("dotenv").config();
require("./cron/paymentCron");
require("./cron/festivalGreetings"); // Festival greetings cron job

// const { syncModels } = require("./models/index.js");
// syncModels();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const superadmin = require("./routes/superadminRoutes.js");
const admin = require("./routes/adminRoutes.js");
const user = require("./routes/userRoutes.js");
const deliveryBoy = require("./routes/delivery_boy.js");
const farmer = require("./routes/farmerRoute.js");
const subscriptionPlan = require("./routes/subscriptionPlanRoutes.js");
const festival = require("./routes/festivalRoutes.js");

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.use("/api", superadmin);
app.use("/api/admin", admin);
app.use("/api/user", user);
app.use("/api/deliveryBoy", deliveryBoy);
app.use("/api/farmer", farmer);
app.use("/api/subscription-plans", subscriptionPlan);
app.use("/api/festivals", festival);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.listen(5001, () => {
    console.log('Server is running on port 5001');
    console.log('Health check: http://localhost:5001/api/health');
});