const PatientResource = require("../models/PatientResource");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "body",
  "category",
  "readTimeMinutes",
  "featured",
];

const pickFields = (body) =>
  ALLOWED_FIELDS.reduce((fields, key) => {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
    return fields;
  }, {});

exports.getPatientResources = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) {
      filter.category = category;
    }

    const resources = await PatientResource.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: resources,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getPatientResourceById = async (req, res, next) => {
  try {
    const resource = await PatientResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Patient resource not found",
      });
    }

    return res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return next(error);
  }
};

exports.createPatientResource = async (req, res, next) => {
  try {
    const resource = await PatientResource.create({
      ...pickFields(req.body),
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updatePatientResource = async (req, res, next) => {
  try {
    const resource = await PatientResource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Patient resource not found",
      });
    }

    Object.assign(resource, pickFields(req.body));
    await resource.save();

    return res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deletePatientResource = async (req, res, next) => {
  try {
    const resource = await PatientResource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Patient resource not found",
      });
    }

    return res.json({
      success: true,
      data: { message: "Patient resource deleted" },
    });
  } catch (error) {
    return next(error);
  }
};
