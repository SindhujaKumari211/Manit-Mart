// One-off seed script for Fresh Listings demo data.
// Inserts 10 realistic products owned by the first user in the DB.
// Idempotent: it removes only products it previously seeded (matched by the exact
// names below owned by that same seller) before re-inserting — it never touches
// the user's own real listings.
//
// Run from the backend/ directory:  node scripts/seedProducts.js

const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const getModels = require("../models");
const { getDatabaseName } = require("../config/colleges");

const img = (id) => `https://images.unsplash.com/${id}?w=600&h=450&fit=crop`;

const SEED_PRODUCTS = [
  { name: "Redmi Note 12, 128GB (Boxed)", description: "Well-maintained phone with box and charger, no scratches.", price: 9500, category: "Electronics", condition: "Used", department: "ECE", hostel: "H4", image: img("photo-1511707171634-5f897ff02aa9") },
  { name: "Engineering Graphics & Design Textbook", description: "First-year drawing textbook, clean pages.", price: 280, category: "Books", condition: "Used", department: "ME", hostel: "H2", image: img("photo-1544716278-ca5e3f4abd8c") },
  { name: "Study Lamp with Flexible Neck", description: "LED study lamp, three brightness modes, works perfectly.", price: 450, category: "Home Decor", condition: "Used", department: "CSE", hostel: "H7", image: img("photo-1507473885765-e6ed057f782c") },
  { name: "Foldable Cycle, 6-Speed", description: "Compact foldable cycle, great for campus commute.", price: 5200, category: "Bicycles", condition: "Used", department: "CE", hostel: "H1", image: img("photo-1485965120184-e220f721d03e") },
  { name: "Casio Scientific Calculator FX-991EX", description: "Exam-approved calculator, barely used.", price: 850, category: "Stationery", condition: "New", department: "EE", hostel: "H5", image: img("photo-1587145820266-a5951ee6f620") },
  { name: "Cushioned Office Chair", description: "Comfortable rolling chair, adjustable height.", price: 2600, category: "Furniture", condition: "Used", department: "IT", hostel: "H3", image: img("photo-1580480055273-228ff5388ef8") },
  { name: "Wireless Keyboard & Mouse Combo", description: "Silent keys, long battery life, dongle included.", price: 1100, category: "Electronics", condition: "Used", department: "CSE", hostel: "H6", image: img("photo-1527864550417-7fd91fc51a46") },
  { name: "Trekking Backpack, 45L", description: "Sturdy backpack with rain cover, used twice.", price: 1400, category: "Bags", condition: "Used", department: "Chemical", hostel: "H2", image: img("photo-1553062407-98eeb64c6a62") },
  { name: "Induction Cooktop, 1200W", description: "Single-burner induction, ideal for hostel cooking.", price: 1250, category: "Kitchen & Appliances", condition: "Used", department: "ME", hostel: "H4", image: img("photo-1585515320310-259814833e62") },
  { name: "Acoustic Guitar with Bag", description: "Beginner-friendly acoustic guitar, soft bag included.", price: 4800, category: "Musical Instruments", condition: "Used", department: "ECE", hostel: "H8", image: img("photo-1510915361894-db8b60106cb1") },
];

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");
    await mongoose.connect(process.env.MONGO_URI);
    const college = process.env.COLLEGE || "manit";
    const databaseName = getDatabaseName(college);
    if (!databaseName) throw new Error(`Unsupported college: ${college}`);
    const { Product, User } = getModels(mongoose.connection.useDb(databaseName, { useCache: true }));

    const seller = await User.findOne().sort({ createdAt: 1 });
    if (!seller) throw new Error("No user found to own seeded products. Register a user first.");

    const names = SEED_PRODUCTS.map((p) => p.name);
    const removed = await Product.deleteMany({ seller: seller._id, name: { $in: names } });
    if (removed.deletedCount) {
      console.log(`Removed ${removed.deletedCount} previously-seeded product(s).`);
    }

    const docs = SEED_PRODUCTS.map((p) => ({ ...p, seller: seller._id }));
    const created = await Product.insertMany(docs);
    console.log(`Seeded ${created.length} products owned by "${seller.name}".`);
    console.log(`Total products now: ${await Product.countDocuments()}`);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
