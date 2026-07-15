const mongoose = require("mongoose");
const { validationResult } = require("express-validator");


// Escapes regex metacharacters so user search input can't build unintended/unsafe patterns
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// // CREATE PRODUCT

exports.createProduct = async (req, res) => {
  try {
    const { Product } = req.models;
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("VALIDATION ERRORS:", errors.array());
      const errorMsg = errors.array().map(err => `${err.path || err.param}: ${err.msg}`).join(", ");
      return res.status(400).json({ 
        message: `Validation failed: ${errorMsg}`,
        errors: errors.array() 
      });
    }

    const product = await Product.create({
      ...req.body,
      seller: req.user._id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.log("MONGOOSE ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
};

/* =========================
   🔹 GET ALL PRODUCTS
========================= */
// Maps the frontend `sort` values to Mongo sort specs. `relevance` falls back
// to newest-first (a full relevance score would need a text index / scoring).
const SORT_MAP = {
  relevance: { createdAt: -1 },
  newest: { createdAt: -1 },
  popularity: { rating: -1, createdAt: -1 },
  rating: { rating: -1, createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

// Builds the Mongo filter shared by getProducts + facet counting.
const buildProductFilter = (query) => {
  const filter = {};

  // Availability: hide sold items unless explicitly requested.
  if (query.isSold !== undefined) {
    filter.isSold = query.isSold === "true";
  } else if (query.includeSold !== "true") {
    filter.isSold = false;
  }

  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.minRating) filter.rating = { $gte: Number(query.minRating) };

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  // Keyword search across every meaningful text field. Accepts `q` (results
  // page / search bar) and `search` (legacy Home input) as aliases.
  const term = (query.q || query.search || "").trim();
  if (term) {
    const rx = { $regex: escapeRegex(term), $options: "i" };
    filter.$or = [
      { name: rx },
      { description: rx },
      { category: rx },
      { brand: rx },
      { tags: rx },
      { condition: rx },
      { department: rx },
      { hostel: rx },
    ];
  }

  return filter;
};

/* =========================
   🔹 GET ALL PRODUCTS
========================= */
exports.getProducts = async (req, res) => {
  try {
    const { Product } = req.models;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter = buildProductFilter(req.query);
    const sort = SORT_MAP[req.query.sort] || SORT_MAP.relevance;

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .populate("seller", "name email")
        .skip(skip)
        .limit(limit)
        .sort(sort),
    ]);

    const data = {
      page,
      totalPages: Math.ceil(totalProducts / limit) || 1,
      totalProducts,
      products,
    };

    // Facets: category counts computed over the current filter MINUS the
    // category constraint, so the sidebar always shows the full picture and the
    // user can switch categories freely.
    if (req.query.facets === "true") {
      const facetFilter = { ...filter };
      delete facetFilter.category;
      const categoryCounts = await Product.aggregate([
        { $match: facetFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
      data.facets = {
        categories: categoryCounts
          .filter((c) => c._id)
          .map((c) => ({ value: c._id, count: c.count })),
      };
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 SEARCH SUGGESTIONS (autocomplete)
========================= */
exports.getSuggestions = async (req, res) => {
  try {
    const { Product } = req.models;
    const term = (req.query.q || "").trim();
    if (!term) return res.json({ suggestions: [], categories: [] });

    const rx = { $regex: escapeRegex(term), $options: "i" };
    const matches = await Product.find({
      isSold: false,
      $or: [{ name: rx }, { brand: rx }, { category: rx }, { tags: rx }],
    })
      .select("name category")
      .limit(24)
      .sort({ createdAt: -1 });

    // De-duplicate product-name suggestions and matching categories.
    const suggestions = [...new Set(matches.map((m) => m.name).filter(Boolean))].slice(0, 6);
    const categories = [...new Set(matches.map((m) => m.category).filter(Boolean))].slice(0, 4);

    res.json({ suggestions, categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 GET MY PRODUCTS (current seller's listings)
========================= */
exports.getMyProducts = async (req, res) => {
  try {
    const { Product } = req.models;
    const products = await Product.find({ seller: req.user._id })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 GET SINGLE PRODUCT
========================= */
exports.getSingleProduct = async (req, res) => {
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id)
      .populate("seller", "name email phone address");

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 UPDATE PRODUCT
========================= */
const EDITABLE_PRODUCT_FIELDS = [
  "name",
  "description",
  "price",
  "category",
  "condition",
  "department",
  "hostel",
  "image",
];

exports.updateProduct = async (req, res) => {
  try {
    const { Product } = req.models;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.seller.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    const updates = {};
    for (const field of EDITABLE_PRODUCT_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 DELETE PRODUCT
========================= */
exports.deleteProduct = async (req, res) => {
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.seller.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 MARK AS SOLD
========================= */
exports.markAsSold = async (req, res) => {
  try {
    const { Product } = req.models;
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.seller.toString() !== req.user._id.toString())
      return res.status(401).json({ message: "Not authorized" });

    product.isSold = !product.isSold;
    await product.save();

    res.json({ message: product.isSold ? "Product marked as sold" : "Product marked as available", isSold: product.isSold });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 GET FOR YOU PRODUCTS
========================= */
exports.getForYouProducts = async (req, res) => {
  try {
    const { Product } = req.models;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(2000, Math.max(1, Number(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const categoryList = req.query.categories ? req.query.categories.split(",") : [];
    const excludeList = req.query.exclude ? req.query.exclude.split(",") : [];
    const sort = req.query.sort || "relevance";

    const filter = { isSold: false };

    const term = (req.query.q || "").trim();
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: "i" };
      filter.$or = [
        { name: rx },
        { description: rx },
        { category: rx },
        { brand: rx },
        { tags: rx },
        { condition: rx },
        { department: rx },
        { hostel: rx },
      ];
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (excludeList.length > 0) {
      const validObjectIds = excludeList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      if (validObjectIds.length > 0) {
        filter._id = { $nin: validObjectIds };
      }
    }

    const sortObj = SORT_MAP[sort] || SORT_MAP.relevance;

    let totalProducts = 0;
    let products = [];
    const isPersonalized = categoryList.length > 0;

    if (sort === "relevance" && isPersonalized) {
      const pipeline = [
        { $match: filter },
        {
          $addFields: {
            categoryIndex: {
              $indexOfArray: [categoryList, "$category"],
            },
          },
        },
        {
          $addFields: {
            inCategories: {
              $cond: { if: { $eq: ["$categoryIndex", -1] }, then: 1, else: 0 },
            },
          },
        },
        {
          $sort: {
            inCategories: 1,
            categoryIndex: 1,
            createdAt: -1,
          },
        },
      ];

      totalProducts = await Product.countDocuments(filter);

      pipeline.push(
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller",
          },
        },
        {
          $unwind: {
            path: "$seller",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            "seller.password": 0,
            "seller.isAdmin": 0,
          },
        }
      );

      products = await Product.aggregate(pipeline);
    } else {
      [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .populate("seller", "name email")
          .skip(skip)
          .limit(limit)
          .sort(sortObj),
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        page,
        totalPages: Math.ceil(totalProducts / limit) || 1,
        totalProducts,
        products,
        personalized: isPersonalized,
      },
    });
  } catch (error) {
    console.error("Error in getForYouProducts:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* =========================
   🔹 GET ALL PRODUCT CATEGORIES WITH COUNTS
========================= */
exports.getCategories = async (req, res) => {
  try {
    const { Product } = req.models;

    const defaultCategories = [
      "Books",
      "Notes",
      "Electronics",
      "Gadgets",
      "Laptops",
      "Mobiles",
      "Cycles",
      "Bicycles",
      "Hostel Essentials",
      "Kitchen Items",
      "Study Table",
      "Chairs",
      "Furniture",
      "Sports",
      "Calculators",
      "Laboratory Equipment",
      "Fashion",
      "Bags",
      "Shoes",
      "Stationery",
      "Accessories",
      "Room Decor",
      "Musical Instruments",
      "Other"
    ];

    const categoryCounts = await Product.aggregate([
      { $match: { isSold: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    const countsMap = new Map();
    categoryCounts.forEach((c) => {
      if (c._id) {
        countsMap.set(c._id.toString(), c.count);
      }
    });

    const categoriesResult = defaultCategories.map((cat) => ({
      value: cat,
      count: countsMap.get(cat) || 0
    }));

    categoryCounts.forEach((c) => {
      if (c._id) {
        const catStr = c._id.toString();
        if (!defaultCategories.includes(catStr)) {
          categoriesResult.push({
            value: catStr,
            count: c.count
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      categories: categoriesResult
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


