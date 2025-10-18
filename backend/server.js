const express = require('express');
const cors = require('cors');
const db = require('./config/db.js');
const bodyParser = require('body-parser');
const app = express();
require("dotenv").config();
require("./cron/paymentCron");

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

app.use("/api", superadmin);
app.use("/api/admin", admin);
app.use("/api/user", user);
app.use("/api/deliveryBoy", deliveryBoy);
app.use("/api/farmer", farmer);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
});

app.listen(8080, () => {
    console.log('Server is running on port 8080');
});