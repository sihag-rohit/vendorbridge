const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: './.env' });

const { sequelize, User, Vendor } = require('./models');

const seedUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to SQLite');
    
    // Sync to ensure tables exist
    await sequelize.sync({ alter: true });

    // Create Admin
    const adminExists = await User.findOne({ where: { email: 'admin@vendorbridge.com' } });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@vendorbridge.com',
        password: 'password123',
        role: 'admin',
      });
      console.log('Created admin@vendorbridge.com');
    } else {
      adminExists.password = 'password123';
      await adminExists.save();
      console.log('Updated admin password to password123');
    }

    // Create Officer
    const officerExists = await User.findOne({ where: { email: 'officer@vendorbridge.com' } });
    if (!officerExists) {
      await User.create({
        name: 'Procurement Officer',
        email: 'officer@vendorbridge.com',
        password: 'password123',
        role: 'officer',
      });
      console.log('Created officer@vendorbridge.com');
    } else {
      officerExists.password = 'password123';
      await officerExists.save();
      console.log('Updated officer password to password123');
    }

    // Create Vendor Profile and User
    let vendorProfile = await Vendor.findOne({ where: { email: 'vendor1@vendorbridge.com' } });
    if (!vendorProfile) {
      vendorProfile = await Vendor.create({
        name: 'TechCorp Solutions',
        category: 'IT & Software',
        contactPerson: 'John Smith',
        email: 'vendor1@vendorbridge.com',
        phone: '+1 234-567-8901',
        status: 'active'
      });
      console.log('Created Vendor Profile TechCorp Solutions');
    }

    const vendorExists = await User.findOne({ where: { email: 'vendor1@vendorbridge.com' } });
    if (!vendorExists) {
      await User.create({
        name: 'TechCorp Vendor',
        email: 'vendor1@vendorbridge.com',
        password: 'password123',
        role: 'vendor',
        vendorId: vendorProfile.id
      });
      console.log('Created vendor1@vendorbridge.com');
    } else {
      vendorExists.password = 'password123';
      if (!vendorExists.vendorId) {
        vendorExists.vendorId = vendorProfile.id;
      }
      await vendorExists.save();
      console.log('Updated vendor1 password to password123');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedUsers();
