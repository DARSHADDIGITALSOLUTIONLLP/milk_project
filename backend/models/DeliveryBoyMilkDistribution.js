const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const DeliveryBoy = require("./DeliveryBoy.js");

const DeliveryBoyMilkDistribution = sequelize.define(
  "DeliveryBoyMilkDistribution",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    delivery_boy_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: DeliveryBoy,
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    shift: {
      type: DataTypes.ENUM("morning", "evening"),
      allowNull: false,
      defaultValue: "morning",
      comment: "Shift: morning or evening",
    },
    pure_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Pure milk quantity in liters",
    },
    cow_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Cow milk quantity in liters",
    },
    buffalo_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: "Buffalo milk quantity in liters",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    tableName: "delivery_boy_milk_distribution",
    indexes: [
      {
        unique: true,
        fields: ["delivery_boy_id", "date", "shift"],
        name: "unique_delivery_boy_date_shift",
      },
    ],
  }
);

// Define association
DeliveryBoyMilkDistribution.belongsTo(DeliveryBoy, {
  foreignKey: "delivery_boy_id",
  as: "deliveryBoy",
});

module.exports = DeliveryBoyMilkDistribution;

