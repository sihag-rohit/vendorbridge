const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Vendor extends Model {
  // Virtual getter for on-time delivery rate
  get onTimeDeliveryRate() {
    if (this.totalOrders === 0) return 0;
    return Math.round((this.onTimeDeliveries / this.totalOrders) * 100);
  }

  // Virtual getter for quote win rate
  get quoteWinRate() {
    if (this.totalQuotes === 0) return 0;
    return Math.round((this.quoteWins / this.totalQuotes) * 100);
  }

  toJSON() {
    const values = Object.assign({}, this.get());
    values.onTimeDeliveryRate = this.onTimeDeliveryRate;
    values.quoteWinRate = this.quoteWinRate;
    return values;
  }
}

Vendor.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('IT & Software', 'Office Supplies', 'Raw Materials', 'Logistics', 'Consulting', 'Manufacturing', 'Construction', 'Healthcare', 'Food & Beverage', 'Other'),
    allowNull: false
  },
  gstNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Flattening address for SQL
  addressStreet: { type: DataTypes.STRING },
  addressCity: { type: DataTypes.STRING },
  addressState: { type: DataTypes.STRING },
  addressPincode: { type: DataTypes.STRING },
  addressCountry: { type: DataTypes.STRING, defaultValue: 'India' },
  
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  onTimeDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quoteWins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalQuotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Vendor'
});

module.exports = Vendor;
