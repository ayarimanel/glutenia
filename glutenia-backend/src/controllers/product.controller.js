const Product = require("../models/Product");
const CommunityProduct = require("../models/CommunityProduct");
const { recordScanEvent } = require("../services/scanService");

const allowedProductFields = [
  "name",
  "description",
  "price",
  "category",
  "imageUrl",
  "stock",
  "isGlutenFree",
  "barcode",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pickProductFields = (body) => {
  const fields = allowedProductFields.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      acc[key] = body[key];
    }

    return acc;
  }, {});

  // barcode has a sparse unique index (Product.js) so multiple products can
  // have "no barcode" — but that only works if the field is genuinely absent
  // from the stored document. A sparse index still indexes a field that is
  // present with a null/empty value, so two such products would collide on
  // the unique index. Dropping the key here means create() never writes the
  // path at all; updateProduct explicitly unsets it for the clearing case,
  // since Object.assign alone can't remove an already-set path.
  if (Object.prototype.hasOwnProperty.call(fields, "barcode") && !fields.barcode) {
    delete fields.barcode;
  }

  return fields;
};

const canManageProduct = (req, product) =>
  req.user.role === "admin" ||
  (product.createdBy && product.createdBy.toString() === req.user.id);

exports.getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code });

    if (product) {
      const { gamification } = await recordScanEvent(req.user.id, "barcode", {
        summary: product.name,
        product: product._id,
      });

      return res.json({
        success: true,
        data: { ...product.toObject(), gamification },
      });
    }

    // Not in the real shop catalog — check community-reported barcodes
    // before giving up. These aren't sellable listings, just a shared
    // "someone already confirmed this is/isn't gluten-free" flag.
    const communityEntry = await CommunityProduct.findOne({ barcode: req.params.code });
    if (communityEntry) {
      const { gamification } = await recordScanEvent(req.user.id, "barcode", {
        summary: communityEntry.name,
      });

      return res.json({
        success: true,
        data: {
          ...communityEntry.toObject(),
          isCommunityReport: true,
          gamification,
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: "Product not found",
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
    // pickProductFields drops "barcode" entirely when it's being cleared, so
    // Object.assign alone leaves the old value in place — unset it explicitly.
    if (Object.prototype.hasOwnProperty.call(req.body, "barcode") && !req.body.barcode) {
      product.barcode = undefined;
    }
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
