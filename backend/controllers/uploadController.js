exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  res.status(201).json({ url: `/uploads/products/${req.file.filename}` });
};
