// scripts/seed.js
/* Seed Customers & Products for swagger_demo */
const mongoose = require('mongoose');
const path = require('path');

// load models
const Customer = require(path.join(__dirname, '..', 'models', 'customer.model'));
const Product  = require(path.join(__dirname, '..', 'models', 'product.model'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swaggerdemo';
const RESET = process.argv.includes('--reset'); // wipes collections before inserting

const customers = [
  { name: 'Jane Doe',  email: 'jane@example.com',  phone: '+61 412 345 678', address: '1 George St, Sydney NSW' },
  { name: 'John Smith',email: 'john@example.com',  phone: '+61 400 111 222', address: '200 Pitt St, Sydney NSW' },
  { name: 'Ayesha Mahveen', email: 'ayesha@example.com', phone: '+61 433 987 654', address: '5 King St, Sydney NSW' }
];

const products = [
  { name: 'Comfort Sneakers', price: 129.95, inStock: true,  description: 'Lightweight daily wear shoes' },
  { name: 'Trail Runner Pro', price: 189.00, inStock: true,  description: 'Grip and cushioning for trails' },
  { name: 'Office Loafers',   price: 149.50, inStock: false, description: 'Classic, comfy, formal-friendly' }
];

async function run() {
  await mongoose.connect(MONGODB_URI, { autoIndex: true });
  console.log(`Connected to ${MONGODB_URI}`);

  if (RESET) {
    await Promise.all([
      Customer.deleteMany({}),
      Product.deleteMany({})
    ]);
    console.log('🧹 Cleared customers & products collections.');
  }

  // Upsert customers by unique email
  const customerOps = customers.map(c => ({
    updateOne: { filter: { email: c.email }, update: { $set: c }, upsert: true }
  }));
  const custRes = await Customer.bulkWrite(customerOps);
  const custCount = await Customer.countDocuments();

  // Upsert products by unique name (assumed unique for demo)
  const productOps = products.map(p => ({
    updateOne: { filter: { name: p.name }, update: { $set: p }, upsert: true }
  }));
  const prodRes = await Product.bulkWrite(productOps);
  const prodCount = await Product.countDocuments();

  console.log(`👥 Customers upserted: ${custRes.upsertedCount}, matched/modified: ${custRes.modifiedCount}. Total now: ${custCount}`);
  console.log(`🛍  Products upserted: ${prodRes.upsertedCount}, matched/modified: ${prodRes.modifiedCount}. Total now: ${prodCount}`);

  await mongoose.disconnect();
  console.log('Seeding complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
