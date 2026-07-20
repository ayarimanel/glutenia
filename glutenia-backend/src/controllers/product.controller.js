const Product = require("../models/Product");
const { recordScanEvent } = require("../services/scanService");

const allowedProductFields = [
  "name",
  "description",
  "price",
  "category",
  "imageUrl",
  "stock",
  "isGlutenFree",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pickProductFields = (body) => {
  return allowedProductFields.reduce((fields, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }

    return fields;
  }, {});
};

const canManageProduct = (req, product) =>
  req.user.role === "admin" ||
  (product.createdBy && product.createdBy.toString() === req.user.id);

exports.getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { gamification } = await recordScanEvent(req.user.id, "barcode", {
      summary: product.name,
      product: product._id,
    });

    return res.json({
      success: true,
      data: { ...product.toObject(), gamification },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { description: regex }];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...pickProductFields(req.body),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!canManageProduct(req, product)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own products",
      });
    }

    Object.assign(product, pickProductFields(req.body));
    await product.save();

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product image is required",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image uploads are allowed",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!canManageProduct(req, product)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own products",
      });
    }

    product.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    await product.save();

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!canManageProduct(req, product)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own products",
      });
    }

    await product.deleteOne();

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};
