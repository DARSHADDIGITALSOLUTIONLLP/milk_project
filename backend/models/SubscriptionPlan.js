const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");

const SubscriptionPlan = sequelize.define(
  "SubscriptionPlan",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    plan_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    plan_price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    plan_validity_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    plan_features: {
      type: DataTypes.TEXT, // JSON string array of features
      allowNull: true,
    },
    badge: {
      type: DataTypes.STRING(50), // Popular, Upcoming, Best Value, etc.
      allowNull: true,
    },
    show_gst: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    gst_percentage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 18,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "subscription_plans",
    timestamps: false,
  }
);

module.exports = SubscriptionPlan;
