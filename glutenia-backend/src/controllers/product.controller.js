const Product = require("../models/Product");
const CommunityProduct = require("../models/CommunityProduct");
const Listing = require("../models/Listing");
const MissingBarcode = require("../models/MissingBarcode");
const { recordScanEvent } = require("../services/scanService");
const { isValidBarcodeChecksum } = require("../utils/barcode");

const allowedProductFields = [
  "name",
  "description",
  "category",
  "imageUrl",
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

  if (Object.prototype.hasOwnProperty.call(fields, "barcode") && !fields.barcode) {
    delete fields.barcode;
  }

  return fields;
};

const cheapestAvailableListing = (productId) =>
  Listing.findOne({ product: productId, isAvailable: true, stock: { $gt: 0 } })
    .sort({ price: 1 })
    .populate("product");

exports.getProductByBarcode = async (req, res, next) => {
  try {
    const product = await Product.findOne({ barcode: req.params.code });

    if (product) {
      const listing = await cheapestAvailableListing(product._id);

      if (listing) {
        const { gamification } = await recordScanEvent(req.user.id, "barcode", {
          summary: listing.product.name,
          product: listing.product._id,
        });

        return res.json({
          success: true,
          data: {
            _id: listing._id,
            product: listing.product._id,
            name: listing.product.name,
            description: listing.product.description,
            category: listing.product.category,
            imageUrl: listing.product.imageUrl,
            isGlutenFree: listing.product.isGlutenFree,
            barcode: listing.product.barcode,
            price: listing.price,
            stock: listing.stock,
            gamification,
          },
        });
      }
    }

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

    if (!product && isValidBarcodeChecksum(req.params.code) && !/^0+$/.test(req.params.code)) {
      await MissingBarcode.updateOne(
        { barcode: req.params.code },
        {
          $inc: { scanCount: 1 },
          $addToSet: { scannedBy: req.user.id },
          $set: { lastScannedAt: new Date() },
        },
        { upsert: true }
      ).catch((error) => console.error(`Failed to record missing barcode: ${error.message}`));
    }

    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMissingBarcodes = async (req, res, next) => {
  try {
    const missing = await MissingBarcode.find().sort({ scanCount: -1, lastScannedAt: -1 });
    const barcodes = missing.map((entry) => entry.barcode);
    const [inCatalog, inCommunity] = await Promise.all([
      Product.find({ barcode: { $in: barcodes } }).distinct("barcode"),
      CommunityProduct.find({ barcode: { $in: barcodes } }).distinct("barcode"),
    ]);
    const known = new Set([...inCatalog, ...inCommunity]);

    const data = missing
      .filter((entry) => !known.has(entry.barcode))
      .map((entry) => ({
        _id: entry._id,
        barcode: entry.barcode,
        scanCount: entry.scanCount,
        userCount: entry.scannedBy.length,
        lastScannedAt: entry.lastScannedAt,
        createdAt: entry.createdAt,
      }));

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.deleteMissingBarcode = async (req, res, next) => {
  try {
    const entry = await MissingBarcode.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Missing barcode not found" });
    }

    return res.json({ success: true, data: { _id: entry._id } });
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

    Object.assign(product, pickProductFields(req.body));
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

    await product.deleteOne();

    return res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    return next(error);
  }
};
