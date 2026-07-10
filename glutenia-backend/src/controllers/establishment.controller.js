const Establishment = require("../models/Establishment");

const allowedFields = [
  "name",
  "category",
  "description",
  "address",
  "phone",
  "hours",
  "coverImageUrl",
];

const pickFields = (body) =>
  allowedFields.reduce((fields, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }

    return fields;
  }, {});

exports.getEstablishments = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    const establishments = await Establishment.find(filter)
      .populate("owner", "name email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: establishments,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getEstablishmentById = async (req, res, next) => {
  try {
    const establishment = await Establishment.findById(req.params.id).populate(
      "owner",
      "name email"
    );

    if (!establishment) {
      return res.status(404).json({
        success: false,
        message: "Establishment not found",
      });
    }

    return res.json({
      success: true,
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getMyEstablishment = async (req, res, next) => {
  try {
    const establishment = await Establishment.findOne({ owner: req.user.id });

    return res.json({
      success: true,
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};

exports.upsertMyEstablishment = async (req, res, next) => {
  try {
    const updates = pickFields(req.body);
    const { latitude, longitude } = req.body;

    if (latitude !== undefined || longitude !== undefined) {
      updates.coordinates = {
        latitude: latitude ?? null,
        longitude: longitude ?? null,
      };
    }

    const establishment = await Establishment.findOneAndUpdate(
      { owner: req.user.id },
      { $set: updates, $setOnInsert: { owner: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};

exports.uploadEstablishmentImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image uploads are allowed",
      });
    }

    const coverImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const establishment = await Establishment.findOneAndUpdate(
      { owner: req.user.id },
      { coverImageUrl },
      { new: true }
    );

    if (!establishment) {
      return res.status(404).json({
        success: false,
        message: "Create your establishment profile before uploading a cover image",
      });
    }

    return res.json({
      success: true,
      data: establishment,
    });
  } catch (error) {
    return next(error);
  }
};
