const payment_details = require("./models/payment_details");
const sequelize = require("./config/db");

async function seedData() {
  await sequelize.sync(); // Ensure DB is synced before inserting

  const paymentRecords = [
    {
      start_date: "2025-03-01",
      userid: 1,
      received_payment: 0,
      pending_payment: 0,
      payment: 0,
      delivery_charges: 0,
      timestamp: "2025-04-02 09:03:43",
      month_year: "2025-03",
    },
    {
      start_date: "2024-12-01",
      userid: 4,
      received_payment: 200,
      pending_payment: 100,
      payment: 270,
      delivery_charges: 30,
      timestamp: "2025-04-02 18:42:00",
      month_year: "2024-12",
    },
    {
      start_date: "2024-12-01",
      userid: 4,
      received_payment: 200,
      pending_payment: 200,
      payment: 270,
      delivery_charges: 30,
      timestamp: "2025-04-02 19:02:54",
      month_year: "2025-01",
    },
    {
      start_date: "2024-12-01",
      userid: 4,
      received_payment: 0,
      pending_payment: 530,
      payment: 300,
      delivery_charges: 30,
      timestamp: "2025-04-02 19:10:01",
      month_year: "2025-02",
    },
    {
      start_date: "2024-12-05",
      userid: 3,
      received_payment: 200,
      pending_payment: 100,
      payment: 270,
      delivery_charges: 30,
      timestamp: "2025-04-04 12:14:22",
      month_year: "2024-12",
    },
    {
      start_date: "2025-12-01",
      userid: 4,
      received_payment: 500,
      pending_payment: 310,
      payment: 250,
      delivery_charges: 30,
      timestamp: "2025-04-04 14:58:08",
      month_year: "2025-03",
    },
    {
      start_date: "2024-12-05",
      userid: 3,
      received_payment: 200,
      pending_payment: 200,
      payment: 270,
      delivery_charges: 30,
      timestamp: "2025-04-04 14:58:18",
      month_year: "2025-01",
    },
    {
      start_date: "2024-12-05",
      userid: 3,
      received_payment: 0,
      pending_payment: 550,
      payment: 300,
      delivery_charges: 30,
      timestamp: "2025-04-04 14:58:25",
      month_year: "2025-02",
    },
    {
      start_date: "2024-12-05",
      userid: 3,
      received_payment: 500,
      pending_payment: 300,
      payment: 250,
      delivery_charges: 30,
      timestamp: "2025-04-04 15:50:09",
      month_year: "2025-03",
    },
    {
      start_date: "2025-04-06",
      userid: 7,
      received_payment: 0,
      pending_payment: 0,
      payment: 0,
      delivery_charges: 0,
      timestamp: "2025-04-05 07:23:01",
      month_year: "2025-04",
    },
    {
      start_date: "2025-04-05",
      userid: 4,
      received_payment: 410,
      pending_payment: 0,
      payment: 100,
      delivery_charges: 0,
      timestamp: "2025-04-05 16:00:57",
      month_year: "2025-04",
    },
    {
      start_date: "2025-04-04",
      userid: 2,
      received_payment: 0,
      pending_payment: 340,
      payment: 310,
      delivery_charges: 30,
      timestamp: "2025-04-05 17:04:08",
      month_year: "2025-04",
    },
  ];

  try {
    await payment_details.bulkCreate(paymentRecords);
    console.log("✅ Payment records inserted successfully!");
  } catch (error) {
    console.error("❌ Error inserting payment records:", error);
  }
}

seedData();

//node seedPaymentDetails.js
