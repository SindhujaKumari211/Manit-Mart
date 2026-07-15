const { body } = require("express-validator");
const express = require("express");
const {
  createProduct,
  getProducts,
  getSuggestions,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  markAsSold,
  getMyProducts,
  getForYouProducts,
  getCategories,
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .post(
    protect,
    [
      body("name").notEmpty().withMessage("Name required"),
      body("description").notEmpty().withMessage("Description required"),
      body("price").isNumeric().withMessage("Price must be number"),
      body("category").notEmpty().withMessage("Category required"),
      body("condition").optional().isIn(["New", "Used"]).withMessage("Condition must be New or Used"),
      body("department").notEmpty().withMessage("Department required"),
      body("hostel").notEmpty().withMessage("Hostel required"),
      body("image").notEmpty().withMessage("Image required"),
    ],
    createProduct
  )
  .get(getProducts);

// Must be registered before "/:id" so Express doesn't treat these as an :id param
router.get("/mine", protect, getMyProducts);
router.get("/suggestions", getSuggestions);
router.get("/for-you", getForYouProducts);
router.get("/categories", getCategories);



router.route("/:id")
  .get(getSingleProduct)
  .put(
    protect,
    [
      body("name").optional().notEmpty().withMessage("Name cannot be empty"),
      body("description").optional().notEmpty().withMessage("Description cannot be empty"),
      body("price").optional().isNumeric().withMessage("Price must be a number"),
      body("category").optional().notEmpty().withMessage("Category cannot be empty"),
      body("condition").optional().isIn(["New", "Used"]).withMessage("Condition must be New or Used"),
      body("department").optional().notEmpty().withMessage("Department cannot be empty"),
      body("hostel").optional().notEmpty().withMessage("Hostel cannot be empty"),
      body("image").optional().notEmpty().withMessage("Image cannot be empty"),
    ],
    updateProduct
  )
  .delete(protect, deleteProduct);

router.put("/:id/sold", protect, markAsSold);

module.exports = router;