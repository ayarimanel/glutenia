const Listing = require("../models/Listing");
const Product = require("../models/Product");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const canManageListing = (req, listing) =>
  req.user.role === "admin" || listing.professional.toString() === req.user.id;

const flattenListing = (listing) => {
  const plain = listing.toObject();
  const product = plain.product;

  return {
    _id: plain._id,
    product: product?._id ?? product,
    professional: plain.professional,
    price: plain.price,
    stock: plain.stock,
    isAvailable: plain.isAvailable,
    createdAt: plain.createdAt,
    name: product?.name,
    description: product?.description,
    category: product?.category,
    imageUrl: product?.imageUrl,
    isGlutenFree: product?.isGlutenFree,
    barcode: product?.barcode,
  };
};

exports.getListings = async (req, res, next) => {
  try {
    const { category, search, product } = req.query;
    const productFilter = {};

    if (category) {
      productFilter.category = category;
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      productFilter.$or = [{ name: regex }, { description: regex }];
    }

    let listingFilter = { isAvailable: true };

    if (product) {
      listingFilter.product = product;
    } else if (Object.keys(productFilter).length) {
      const productIds = await Product.find(productFilter).distinct("_id");
      listingFilter.product = { $in: productIds };
    }

    const listings = await Listing.find(listingFilter)
      .populate("product")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: listings.map(flattenListing),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate("product");

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    return res.json({
      success: true,
      data: flattenListing(listing),
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ professional: req.user.id })
      .populate("product")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: listings.map(flattenListing),
    });
  } catch (error) {
    return next(error);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const { productId, price, stock, isAvailable } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Catalog product not found",
      });
    }

    const existing = await Listing.findOne({
      product: productId,
      professional: req.user.id,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a listing for this product",
      });
    }

    const listing = await Listing.create({
      product: productId,
      professional: req.user.id,
      price,
      stock,
      isAvailable,
    });

    const populated = await listing.populate("product");

    return res.status(201).json({
      success: true,
      data: flattenListing(populated),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (!canManageListing(req, listing)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own listings",
      });
    }

    const { price, stock, isAvailable } = req.body;
    if (price !== undefined) listing.price = price;
    if (stock !== undefined) listing.stock = stock;
    if (isAvailable !== undefined) listing.isAvailable = isAvailable;

    await listing.save();
    const populated = await listing.populate("product");

    return res.json({
      success: true,
      data: flattenListing(populated),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found",
      });
    }

    if (!canManageListing(req, listing)) {
      return res.status(403).json({
        success: false,
        message: "You can only manage your own listings",
      });
    }

    await listing.deleteOne();

    return res.json({
      success: true,
      data: { _id: listing._id },
    });
  } catch (error) {
    return next(error);
  }
};
